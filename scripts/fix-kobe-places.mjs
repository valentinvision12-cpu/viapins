import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveWikiExtract } from "../src/lib/wiki-image.ts";
import { shortPlaceDescription } from "../src/lib/place-description.ts";

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const LOCALES = ["en", "es", "fr", "de", "it"];

async function main() {
  loadEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const seed = JSON.parse(readFileSync("data/seeds/japan.json", "utf8"));
  const citySeed = seed.cities.find((c) => c.city === "Kobe");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: dest } = await supabase.from("destinations").select("id").ilike("country", "Japan").ilike("city", "Kobe").maybeSingle();
  if (!dest) throw new Error("Kobe destination missing");

  for (const order of [8, 9]) {
    const place = citySeed.places.find((p) => p.order_index === order);
    const { data: row } = await supabase.from("places").select("id, translations").eq("destination_id", dest.id).eq("order_index", order).maybeSingle();
    if (!place || !row) throw new Error(`missing order ${order}`);
    const { extract, wikiTitle } = await resolveWikiExtract(place.name, { wikiTitle: place.wiki_title, city: "Kobe", country: "Japan" });
    const wiki_text = extract?.trim() || place.description;
    const description = extract ? shortPlaceDescription(extract, place.name) : place.description;
    const mapsQuery = place.maps_query || `${place.name}, Kobe, Japan`;
    const translations = { ...(row.translations ?? {}) };
    for (const loc of LOCALES) {
      translations[loc] = { ...(translations[loc] ?? {}), description, wiki_text, wiki_title: wikiTitle, maps_query: mapsQuery, commons_file: place.commons_file, seo_phrase: place.seo_phrase };
    }
    const { error } = await supabase.from("places").update({ name: place.name, lat: place.lat, lng: place.lng, image_url: place.image_url, translations, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) throw error;
    console.log("Fixed:", place.name, "|", wikiTitle);
    console.log(" gps:", place.lat, place.lng);
    console.log(" desc:", description.slice(0, 100));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });