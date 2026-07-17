#!/usr/bin/env npx tsx
/**
 * Audit seeds + DB: every city place must be a top landmark in country/city/region.
 * Usage: npx tsx scripts/audit-top-places.ts [slug ...]
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isTopCityLandmark } from "../src/lib/precise-place-filter";
import { getCityCoords } from "../src/lib/wiki-landmark-search";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  process.env.SEQUENTIAL_WIKI = "1";

  const argSlugs = process.argv.slice(2);
  const seedDir = join(process.cwd(), "data", "seeds");
  const slugs = argSlugs.length
    ? argSlugs
    : readdirSync(seedDir)
        .filter((f) => f.endsWith(".json") && !f.includes("supplement"))
        .map((f) => f.replace(/\.json$/, ""));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let badSeed = 0;
  let badDb = 0;

  for (const slug of slugs) {
    const seedPath = join(seedDir, `${slug}.json`);
    if (!existsSync(seedPath)) continue;
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country;
    console.log(`\n=== ${country} (${slug}) ===`);

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city;
      const cityCoords = await getCityCoords(city, country);
      for (const p of citySeed.places ?? []) {
        const ok = isTopCityLandmark(
          p.name,
          country,
          p.lat ?? 0,
          p.lng ?? 0,
          cityCoords?.lat,
          cityCoords?.lng,
          p.description
        );
        if (!ok) {
          badSeed++;
          console.log(`  ✗ seed ${city}: ${p.name}`);
        }
      }

      const { data: dest } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();
      if (!dest) continue;

      const { data: dbPlaces } = await supabase
        .from("places")
        .select("name, lat, lng, translations")
        .eq("destination_id", dest.id);

      for (const p of dbPlaces ?? []) {
        const en = (p.translations as Record<string, { description?: string }>)?.en;
        const ok = isTopCityLandmark(
          p.name,
          country,
          p.lat ?? 0,
          p.lng ?? 0,
          cityCoords?.lat,
          cityCoords?.lng,
          en?.description
        );
        if (!ok) {
          badDb++;
          console.log(`  ✗ db ${city}: ${p.name}`);
        }
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\nAudit: ${badSeed} seed issues, ${badDb} DB issues\n`);
  if (badSeed + badDb > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
