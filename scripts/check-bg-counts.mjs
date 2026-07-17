import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const citySeed of seed.cities) {
  const { data: dest } = await supabase.from("destinations").select("id").ilike("country", "Bulgaria").ilike("city", citySeed.city).maybeSingle();
  if (!dest) { console.log(citySeed.city, "NO DEST"); continue; }
  const { count } = await supabase.from("places").select("id", { count: "exact", head: true }).eq("destination_id", dest.id);
  const seedN = citySeed.places.length;
  if (count !== seedN) console.log(citySeed.city, "seed", seedN, "db", count);
}
