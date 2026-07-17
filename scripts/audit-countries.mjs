/**
 * Quick audit: seeds vs DB vs source files
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const p = join(ROOT, ".env.local");
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

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const seedDir = join(ROOT, "data/seeds");
const mainSeeds = readdirSync(seedDir)
  .filter((f) => f.endsWith(".json") && !f.includes("phase1") && !f.includes("supplement") && !f.includes("partial") && !f.includes("user-patch"))
  .map((f) => f.replace(".json", ""))
  .sort();

const sourceDir = "d:/Държави";
const sourceFiles = existsSync(sourceDir)
  ? readdirSync(sourceDir).filter((f) => f.endsWith(".txt")).sort()
  : [];

const { data: dests } = await supabase.from("destinations").select("id, country, city");
const byCountry = new Map();
for (const d of dests ?? []) {
  if (!byCountry.has(d.country)) byCountry.set(d.country, { cities: 0, places: 0, ids: [] });
  const c = byCountry.get(d.country);
  c.cities++;
  c.ids.push(d.id);
}

for (const [, v] of byCountry) {
  let total = 0;
  for (const id of v.ids) {
    const { count } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", id);
    total += count ?? 0;
  }
  v.places = total;
}

console.log("=== SOURCE FILES (d:/Държави) ===");
console.log(`Count: ${sourceFiles.length}`);
sourceFiles.forEach((f) => console.log(`  ${f}`));

console.log("\n=== MAIN SEED JSON FILES ===");
console.log(`Count: ${mainSeeds.length}`);

const seedStats = [];
for (const slug of mainSeeds) {
  try {
    const seed = JSON.parse(readFileSync(join(seedDir, `${slug}.json`), "utf8"));
    const places = seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
    const cities = seed.cities?.length ?? 0;
    seedStats.push({ slug, country: seed.country, places, cities });
  } catch (e) {
    seedStats.push({ slug, country: "?", places: -1, cities: -1 });
  }
}

console.log("\n=== SEED vs DB ===");
console.log("Slug | Country | Seed places | Seed cities | DB cities | DB places | Status");
for (const s of seedStats.sort((a, b) => a.country.localeCompare(b.country))) {
  const db = [...byCountry.entries()].find(([k]) => k.toLowerCase() === s.country?.toLowerCase());
  const dbCities = db?.[1].cities ?? 0;
  const dbPlaces = db?.[1].places ?? 0;
  let status = "OK";
  if (dbPlaces === 0) status = "NOT IN DB";
  else if (dbPlaces < 100) status = `INCOMPLETE ${dbPlaces}/100`;
  else if (dbPlaces > 100) status = `OVER ${dbPlaces}`;
  else if (s.places < 100) status = `SEED ${s.places}/100`;
  console.log(`${s.slug} | ${s.country} | ${s.places} | ${s.cities} | ${dbCities} | ${dbPlaces} | ${status}`);
}

const dbCountries = [...byCountry.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log("\n=== DB ONLY (no main seed?) ===");
for (const [country, v] of dbCountries) {
  const hasSeed = seedStats.some((s) => s.country?.toLowerCase() === country.toLowerCase());
  if (!hasSeed) console.log(`  ${country}: ${v.cities} cities, ${v.places} places`);
}

console.log("\n=== TOTALS ===");
console.log(`Main seeds: ${mainSeeds.length}`);
console.log(`DB countries: ${dbCountries.length}`);
console.log(`DB cities: ${dests?.length ?? 0}`);
console.log(`DB places: ${dbCountries.reduce((n, [, v]) => n + v.places, 0)}`);
console.log(`Complete 100/100: ${dbCountries.filter(([, v]) => v.places === 100).length}`);
console.log(`Incomplete: ${dbCountries.filter(([, v]) => v.places > 0 && v.places !== 100).length}`);
console.log(`Empty (0 places): ${dbCountries.filter(([, v]) => v.places === 0).length}`);
