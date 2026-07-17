#!/usr/bin/env node
/** Fix one place in DB from seed by order_index. Usage: node scripts/patch-place-db.mjs bulgaria Nessebar 6 */
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
  const story = place.wiki_story?.trim() || place.wiki_text?.trim();
  const cardDesc = place.description?.trim();
  for (const loc of LOCALES) {
    translations[loc] = {
      ...(translations[loc] ?? {}),
      maps_query: formattedAddress,
      wiki_title: place.wiki_title,
      commons_file: place.commons_file,
      seo_phrase: place.seo_phrase,
      ...(story ? { wiki_text: story, description: cardDesc || story.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").trim() } : {}),
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

async function main() {
  loadEnv();
  const [slug, cityName, orderStr] = process.argv.slice(2);
  const order = Number(orderStr);
  if (!slug || !cityName || !Number.isFinite(order)) {
    console.error("Usage: node scripts/patch-place-db.mjs bulgaria Nessebar 6");
    process.exit(1);
  }

  const seed = JSON.parse(readFileSync(join(process.cwd(), "data", "seeds", `${slug}.json`), "utf8"));
  const citySeed = seed.cities.find((c) => c.city.toLowerCase() === cityName.toLowerCase());
  const place = citySeed?.places.find((p) => (p.order_index ?? citySeed.places.indexOf(p)) === order);
  if (!place) throw new Error(`No place order ${order} in ${cityName}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", seed.country)
    .ilike("city", cityName)
    .maybeSingle();
  if (!dest) throw new Error("destination missing");

  const { data: row } = await supabase
    .from("places")
    .select("id, translations")
    .eq("destination_id", dest.id)
    .eq("order_index", order)
    .maybeSingle();

  let target = row;
  if (!target && process.argv[4]) {
    const byName = process.argv[4];
    const { data: named } = await supabase
      .from("places")
      .select("id, translations")
      .eq("destination_id", dest.id)
      .ilike("name", byName)
      .maybeSingle();
    target = named;
  }
  if (!target) throw new Error(`place order ${order} missing in DB`);

  const translations = buildTranslationsFromSeed(place, cityName, seed.country, target.translations ?? {});

  const { error } = await supabase
    .from("places")
    .update({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      image_url: place.image_url,
      translations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", target.id);
  if (error) throw error;

  const en = translations.en ?? {};
  console.log(`Patched: ${place.name}`);
  console.log(`  image: ${place.image_url}`);
  console.log(`  maps:  ${en.maps_query}`);
  console.log(`  place: ${en.google_place_id ?? "(none)"}`);
  console.log(`  gps:   ${place.lat}, ${place.lng}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
