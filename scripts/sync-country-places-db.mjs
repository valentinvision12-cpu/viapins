#!/usr/bin/env node
/** Sync all cities in a country seed -> Supabase. Usage: node scripts/sync-country-places-db.mjs bulgaria */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const LOCALES = ["en", "es", "fr", "de", "it"];

function googleMapsPlaceIdUrl(placeId, label) {
  const id = placeId.replace(/^places\//, "");
  const params = new URLSearchParams({ api: "1", query_place_id: id });
  if (label?.trim()) params.set("query", label.trim());
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function buildTranslationsFromSeed(place, cityName, country, existing = {}) {
  const mapsQuery = place.maps_query || `${place.name}, ${cityName}, ${country}`;
  const formattedAddress = place.formatted_address?.trim() || mapsQuery;
  const placeId = place.google_place_id?.trim();
  const mapsUrl =
    place.maps_url?.trim() ||
    (placeId ? googleMapsPlaceIdUrl(placeId, place.name) : undefined);

  const translations = { ...existing };
  for (const loc of LOCALES) {
    translations[loc] = {
      ...(translations[loc] ?? {}),
      maps_query: formattedAddress,
      wiki_title: place.wiki_title,
      ...(placeId ? { google_place_id: placeId } : {}),
      ...(formattedAddress ? { formatted_address: formattedAddress } : {}),
      ...(mapsUrl ? { maps_url: mapsUrl } : {}),
    };
  }
  return translations;
}

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

async function syncCity(supabase, country, citySeed) {
  const cityName = citySeed.city;
  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", country)
    .ilike("city", cityName)
    .maybeSingle();
  if (!dest) {
    console.warn(`  skip ${cityName}: no destination`);
    return 0;
  }

  const { data: rows } = await supabase
    .from("places")
    .select("id, name, order_index, translations")
    .eq("destination_id", dest.id)
    .order("order_index");

  const byName = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]));
  const byOrder = new Map((rows ?? []).map((r) => [r.order_index, r]));
  let updated = 0;

  for (let i = 0; i < citySeed.places.length; i++) {
    const p = citySeed.places[i];
    const row = byName.get(p.name.toLowerCase()) ?? byOrder.get(p.order_index ?? i);
    if (!row) continue;

    const translations = buildTranslationsFromSeed(p, cityName, country, row.translations ?? {});

    const { error } = await supabase
      .from("places")
      .update({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        image_url: p.image_url,
        order_index: p.order_index ?? i,
        translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) throw error;
    updated++;
  }
  return updated;
}

async function main() {
  loadEnv();
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: node scripts/sync-country-places-db.mjs bulgaria");
    process.exit(1);
  }

  const seed = JSON.parse(
    readFileSync(join(process.cwd(), "data", "seeds", `${slug}.json`), "utf8")
  );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log(`\n→ Sync ${seed.country} (${slug}) seed → DB\n`);
  let total = 0;
  for (const citySeed of seed.cities) {
    const n = await syncCity(supabase, seed.country, citySeed);
    console.log(`  ${citySeed.city}: ${n} places`);
    total += n;
  }
  console.log(`\nDone: ${total} places updated\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
