import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    process.env[m[1].trim()] = v;
  }
}

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from("destinations")
  .select("city, country, published, places(count)")
  .order("country")
  .order("city");

const groups = {};
for (const d of data ?? []) {
  if (!groups[d.country]) groups[d.country] = [];
  groups[d.country].push({
    city: d.city,
    published: d.published,
    places: d.places?.[0]?.count ?? 0,
  });
}

for (const [country, cities] of Object.entries(groups)) {
  const total = cities.reduce((n, c) => n + c.places, 0);
  console.log(`\n${country}: ${cities.length} града, ${total} места`);
  for (const c of cities) {
    console.log(`  ${c.published ? "✓" : "○"} ${c.city} — ${c.places}/10`);
  }
}
