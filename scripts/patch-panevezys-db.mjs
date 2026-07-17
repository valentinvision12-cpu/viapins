import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

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

const LOCALES = ["en", "es", "fr", "de", "it"];

async function main() {
  loadEnv();
  const seed = JSON.parse(readFileSync("data/seeds/lithuania.json", "utf8"));
  const citySeed = seed.cities.find((c) => c.city === "Panevėžys");
  if (!citySeed) throw new Error("Panevėžys not in seed");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", "Lithuania")
    .ilike("city", "Panevėžys")
    .maybeSingle();
  if (!dest) throw new Error("Panevėžys destination missing");

  const { data: rows } = await supabase
    .from("places")
    .select("id, name, lat, lng, order_index, translations")
    .eq("destination_id", dest.id)
    .order("order_index");

  const byName = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]));
  const byOrder = new Map((rows ?? []).map((r) => [r.order_index, r]));
  let updated = 0;

  for (const p of citySeed.places) {
    const row =
      byName.get(p.name.toLowerCase()) ??
      byOrder.get(p.order_index ?? citySeed.places.indexOf(p));
    if (!row) {
      console.warn("missing row:", p.name);
      continue;
    }
    const mapsQuery = p.maps_query || `${p.name}, Panevėžys, Lithuania`;
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
        translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) throw error;
    console.log(`  ok [${row.order_index}] ${row.name} -> ${p.name} @ ${p.lat}, ${p.lng}`);
    updated++;
  }
  console.log(`Done: ${updated} places`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
