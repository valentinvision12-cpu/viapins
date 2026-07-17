/**
 * Poland: 6 cities from phase1 + 4 supplement cities → 100 places.
 * Run: node scripts/build-poland-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { inferPlaceType, visitDurationHours } from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const country = "Poland";
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];

function citySeo(name) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [`things to do in ${name}`, `${name} ${country} travel guide`, `best places to visit in ${name}`, `${name} landmarks`],
  };
}

function toPlace(raw, cityName, idx) {
  const type = inferPlaceType(raw.name);
  return {
    name: raw.name,
    wiki_title: raw.wiki_title || raw.name,
    lat: raw.lat,
    lng: raw.lng,
    order_index: idx,
    seo_phrase: `${raw.name} — ${cityName}, ${country}`,
    seo_keywords: [raw.name, cityName, country, "travel", "landmarks"],
    seo_priority: 95 - idx,
    search_intent: ["informational", "travel_planning"],
    type,
    best_season: SEASON_ALL,
    visit_duration_hours: visitDurationHours(type),
  };
}

const existing = JSON.parse(readFileSync(join(ROOT, "data/seeds/poland.json"), "utf8"));
const supplement = JSON.parse(readFileSync(join(ROOT, "data/seeds/poland-landmarks-supplement.json"), "utf8"));

const phase1Cities = new Set(existing.cities.map((c) => c.city));
const extraCities = Object.keys(supplement).filter((c) => !phase1Cities.has(c));

function cityFromSupplement(cityName) {
  return {
    city: cityName,
    tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
    wiki_title: cityName,
    seo: citySeo(cityName),
    places: supplement[cityName]
      .filter((p) => !isDeathRelatedPlace(p.name))
      .slice(0, 10)
      .map((p, i) => toPlace(p, cityName, i)),
  };
}

const supplementNames = new Set(Object.keys(supplement));
const cities = [
  ...existing.cities.filter((c) => !supplementNames.has(c.city)),
  ...Object.keys(supplement).map(cityFromSupplement),
];

const output = { ...existing, cities };
writeFileSync(join(ROOT, "data/seeds/poland.json"), JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ poland.json: ${total} places, ${cities.length} cities`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
