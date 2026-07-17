#!/usr/bin/env node
/**
 * Sync seed lat/lng + maps_query into Supabase for one city.
 * Usage: node scripts/sync-city-places-db.mjs bulgaria Nessebar
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const LOCALES = ["en", "es", "fr", "de", "it"];

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
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
  loadEnv();
  const slug = process.argv[2];
  const cityName = process.argv[3];
  if (!slug || !cityName) {
    console.error("Usage: node scripts/sync-city-places-db.mjs bulgaria Nessebar");
    process.exit(1);
  }

  const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const country = seed.country;
  const citySeed = seed.cities.find(
    (c) => c.city.toLowerCase() === cityName.toLowerCase()
  );
  if (!citySeed) throw new Error(`${cityName} not in ${slug}.json`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", country)
    .ilike("city", cityName)
    .maybeSingle();
  if (!dest) throw new Error(`${cityName} destination missing in DB`);

  const { data: rows } = await supabase
    .from("places")
    .select("id, name, lat, lng, order_index, translations")
    .eq("destination_id", dest.id)
    .order("order_index");

  const byName = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]));
  const byOrder = new Map((rows ?? []).map((r) => [r.order_index, r]));
  let updated = 0;

  for (let i = 0; i < citySeed.places.length; i++) {
    const p = citySeed.places[i];
    const row = byName.get(p.name.toLowerCase()) ?? byOrder.get(p.order_index ?? i);
    if (!row) {
      console.warn("  missing:", p.name);
      continue;
    }
    const mapsQuery = p.maps_query || `${p.name}, ${cityName}, ${country}`;
    const translations = { ...(row.translations ?? {}) };
    for (const loc of LOCALES) {
      translations[loc] = {
        ...(translations[loc] ?? {}),
        maps_query: mapsQuery,
        wiki_title: p.wiki_title,
      };
    }
    const { error } = await supabase
      .from("places")
      .update({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        order_index: p.order_index ?? i,
        translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) throw error;
    console.log(`  ok [${i}] ${p.name} @ ${p.lat}, ${p.lng}`);
    updated++;
  }
  console.log(`Done: ${updated}/${citySeed.places.length} places synced to DB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
