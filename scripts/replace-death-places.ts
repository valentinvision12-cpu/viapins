#!/usr/bin/env npx tsx
/**
 * Replace death-related places in seed JSON + Supabase.
 * Usage: npx tsx scripts/replace-death-places.ts
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  DEATH_PLACE_REPLACEMENTS,
  isDeathRelatedPlace,
} from "../src/lib/death-place-filter";
import { enrichPlace } from "../src/lib/travel-seed";

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

function slugFromCountry(country: string) {
  const map: Record<string, string> = {
    Croatia: "croatia",
    Cyprus: "cyprus",
    "Czech Republic": "czech-republic",
    "Bosnia and Herzegovina": "bosnia-and-herzegovina",
    France: "france",
  };
  return map[country] ?? country.toLowerCase().replace(/\s+/g, "-");
}

function cleanNearbyRefs(seed: { cities?: Array<{ places?: Array<{ nearby_places?: string[]; name: string }> }> }) {
  for (const city of seed.cities ?? []) {
    for (const place of city.places ?? []) {
      if (!place.nearby_places) continue;
      place.nearby_places = place.nearby_places.filter(
        (n) => !isDeathRelatedPlace(n)
      );
    }
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const bySlug = new Map<string, typeof DEATH_PLACE_REPLACEMENTS>();
  for (const r of DEATH_PLACE_REPLACEMENTS) {
    const slug = slugFromCountry(r.country);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(r);
  }

  const report: string[] = [];

  for (const [slug, replacements] of bySlug) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) continue;
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));

    for (const { country, city, oldName, replacement } of replacements) {
      const citySeed = seed.cities?.find(
        (c: { city: string }) => c.city.toLowerCase() === city.toLowerCase()
      );
      if (!citySeed) {
        console.warn(`  ⚠ city not in seed: ${city}`);
        continue;
      }

      const idx = citySeed.places.findIndex(
        (p: { name: string }) => p.name.toLowerCase() === oldName.toLowerCase()
      );
      const alreadyNew = citySeed.places.some(
        (p: { name: string }) => p.name.toLowerCase() === replacement.name.toLowerCase()
      );

      if (idx === -1) {
        if (!alreadyNew) {
          console.warn(`  ⚠ not in seed: ${city} / ${oldName}`);
        }
      } else {
        const old = citySeed.places[idx];
        citySeed.places[idx] = {
          ...old,
          name: replacement.name,
          wiki_title: replacement.wiki_title,
          lat: replacement.lat,
          lng: replacement.lng,
          description: replacement.description,
          seo_phrase: replacement.seo_phrase ?? `${replacement.name} in ${city}`,
          type: replacement.type ?? old.type,
          commons_file: undefined,
          image_url: undefined,
        };
        report.push(`${country} / ${city}: "${oldName}" → "${replacement.name}"`);
      }

      const { data: dest } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();

      if (!dest) {
        console.warn(`  ⚠ no DB destination: ${city}`);
        continue;
      }

      const { data: dbPlace } = await supabase
        .from("places")
        .select("id, order_index, image_url")
        .eq("destination_id", dest.id)
        .eq("name", oldName)
        .maybeSingle();

      if (!dbPlace) {
        console.warn(`  ⚠ not in DB: ${city} / ${oldName}`);
        continue;
      }

      const seedPlace =
        idx >= 0
          ? citySeed.places[idx]
          : citySeed.places.find(
              (p: { name: string }) =>
                p.name.toLowerCase() === replacement.name.toLowerCase()
            );

      if (!seedPlace) continue;

      let enriched;
      const usedImages = new Set<string>();
      try {
        enriched = await enrichPlace(
          seedPlace,
          dbPlace.order_index,
          city,
          country,
          usedImages
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  ✗ skip DB ${city}/${replacement.name}: ${msg.slice(0, 100)}`);
        continue;
      }

      await supabase
        .from("places")
        .update({
          name: enriched.name,
          image_url: enriched.image_url,
          lat: enriched.lat,
          lng: enriched.lng,
          translations: enriched.translations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbPlace.id);

      console.log(`  ✓ DB: ${city} — ${oldName} → ${replacement.name}`);
      await new Promise((r) => setTimeout(r, 400));
    }

    cleanNearbyRefs(seed);
    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
    console.log(`  ✓ seed updated: ${slug}.json`);
  }

  console.log("\n=== Replacement report ===\n");
  for (const line of report) console.log(`  • ${line}`);
  console.log(`\nTotal: ${report.length} places replaced\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
