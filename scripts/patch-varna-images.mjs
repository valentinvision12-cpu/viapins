import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const LOCALES = ["en", "es", "fr", "de", "it"];
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const seed = JSON.parse(readFileSync("data/seeds/bulgaria.json", "utf8"));
const citySeed = seed.cities.find((c) => c.city === "Varna");
const names = ["Roman Thermae", "Varna Archaeological Museum", "Naval Museum Varna"];
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: dest } = await supabase.from("destinations").select("id").ilike("country", "Bulgaria").ilike("city", "Varna").single();

for (const n of names) {
  const place = citySeed.places.find((p) => p.name === n);
  const { data: row } = await supabase.from("places").select("id, translations").eq("destination_id", dest.id).ilike("name", `%${n}%`).maybeSingle();
  if (!row) { console.warn("missing", n); continue; }
  const mapsQuery = place.maps_query || `${place.name}, Varna, Bulgaria`;
  const translations = { ...row.translations };
  for (const loc of LOCALES) {
    translations[loc] = { ...(translations[loc] || {}), maps_query: mapsQuery, wiki_title: place.wiki_title, commons_file: place.commons_file };
  }
  await supabase.from("places").update({ name: place.name, lat: place.lat, lng: place.lng, image_url: place.image_url, translations, updated_at: new Date().toISOString() }).eq("id", row.id);
  console.log("ok", n);
}
