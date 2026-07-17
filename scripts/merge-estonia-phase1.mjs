/**
 * Merge Wikidata-generated estonia.json with curated phase1 Tallinn + adventures.
 * Run after: node scripts/generate-country.mjs Q191 estonia
 *            node scripts/convert-phase1-to-seed.mjs estonia data/seeds/estonia-phase1-input.json
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const generated = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/estonia.json"), "utf8")
);
const phase1 = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/estonia-phase1-input.json"), "utf8")
);

function commonsFromImageUrl(url) {
  if (!url) return undefined;
  const m = url.match(/wikipedia\/commons\/[^/]+\/[^/]+\/(.+)$/);
  if (m) return decodeURIComponent(m[1].replace(/_/g, " "));
  return undefined;
}

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/(.+)$/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

function phase1ToPlace(p, idx, cityName) {
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: p.description_short,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, "Estonia"],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: p.image_url,
    seo_priority: p.seo_priority_score ?? 90 - idx,
    search_intent: Array.isArray(p.search_intent)
      ? p.search_intent
      : p.search_intent
        ? [p.search_intent, "travel_planning"]
        : ["informational", "travel_planning"],
    type: /museum|gallery/i.test(p.name)
      ? "museum"
      : /church|cathedral|basilica/i.test(p.name)
        ? "church"
        : /park|nature|bog|national/i.test(p.name)
          ? "nature"
          : "historic_site",
    best_season: ["spring", "summer", "autumn"],
    visit_duration_hours: /museum/i.test(p.name) ? 2 : 1,
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

// Tallinn: use curated phase1 list (filter death-related)
const tallinnCurated = (phase1.attractions || [])
  .filter((a) => a.city === "Tallinn" && !isDeathRelatedPlace(a.name, a.description_short))
  .slice(0, 10)
  .map((p, idx) => phase1ToPlace(p, idx, "Tallinn"));

const tallinnGen = generated.cities.find((c) => c.city === "Tallinn");
if (tallinnGen && tallinnCurated.length === 10) {
  tallinnGen.places = tallinnCurated;
}

// Adventures from phase1 (11 items → take 10)
const adv = (phase1.adventure_locations || [])
  .filter((p) => !isDeathRelatedPlace(p.name, p.description_short))
  .slice(0, 10)
  .map((p, idx) => ({
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    region: p.region || "Estonia",
    lat: p.latitude,
    lng: p.longitude,
    day: idx + 1,
    order_index: idx,
    requires_car: true,
    tags: ["nature", "hidden_gem", "adventure", "spring", "summer", "autumn"],
    description: p.description_short,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, "Estonia", "road trip"],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: p.image_url,
    seo_priority: p.seo_priority_score ?? 95 - idx,
    best_season: ["spring", "summer", "autumn"],
    visit_duration_hours: 4,
    type: "nature",
  }));

if (generated.adventure && adv.length) {
  generated.adventure.places = adv;
}

// Filter any death-related from generated cities
for (const city of generated.cities) {
  city.places = city.places.filter(
    (p) => !isDeathRelatedPlace(p.name, p.description)
  );
  for (const p of city.places) {
    if (p.nearby_places) {
      p.nearby_places = p.nearby_places.filter((n) => !isDeathRelatedPlace(n));
    }
  }
}

writeFileSync(
  join(ROOT, "data/seeds/estonia.json"),
  JSON.stringify(generated, null, 2) + "\n"
);

const total = generated.cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ Merged estonia.json: ${total} places, ${adv.length} adventures`);
for (const c of generated.cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
