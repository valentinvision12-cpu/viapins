/**
 * Build bosnia-and-herzegovina.json from landmark + adventure supplements.
 * Run: node scripts/build-bosnia-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  inferPlaceType,
  inferPlaceSeasons,
  inferCityTags,
  visitDurationHours,
} from "../data-generator/src/seasons.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const country = "Bosnia and Herzegovina";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

function seasons(city) {
  return /sarajevo|bihac|jajce|travnik/i.test(city) ? SEASON_ALL : SEASON_WARM;
}

function citySeo(name) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [
      `things to do in ${name}`,
      `${name} ${country} travel guide`,
      `best places to visit in ${name}`,
      `${name} landmarks`,
    ],
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
    best_season: inferPlaceSeasons(raw.name, type),
    visit_duration_hours: visitDurationHours(type),
  };
}

const landmarks = JSON.parse(
  readFileSync(join(ROOT, "data", "seeds", "bosnia-landmarks-supplement.json"), "utf8")
);
const advSupp = JSON.parse(
  readFileSync(join(ROOT, "data", "seeds", "bosnia-adventure-supplement.json"), "utf8")
);

const cityNames = Object.keys(landmarks);
const cities = cityNames.map((cityName) => {
  const places = landmarks[cityName].slice(0, 10).map((p, i) => toPlace(p, cityName, i));
  return {
    city: cityName,
    tags: inferCityTags(cityName, places),
    wiki_title: cityName,
    seo: citySeo(cityName),
    places,
  };
});

const adventures = advSupp.adventures.slice(0, 10).map((p, idx) => ({
  name: p.name,
  wiki_title: p.wiki_title,
  region: p.region || country,
  lat: p.lat,
  lng: p.lng,
  day: idx + 1,
  order_index: idx,
  requires_car: true,
  tags: ["nature", "hidden_gem", "adventure", ...inferPlaceSeasons(p.name, "nature")],
  best_season: inferPlaceSeasons(p.name, "nature"),
  seo_phrase: `${p.name} — ${country} road trip`,
  seo_keywords: [p.name, `${country} road trip`, `${country} nature`],
  seo_priority: 90 - idx,
  visit_duration_hours: 4,
  type: "nature",
}));

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Nature & Road Trip Adventure`,
    subtitle: `Explore ${country} beyond the cities — national parks, rivers, and scenic drives.`,
    wiki_title: country,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Nature Adventure Guide`,
      description: `Plan a ${country} road trip with GPS stops, national parks, and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this nature adventure route.`,
      keywords: [`${country} road trip`, `${country} nature`, `${country} by car`],
    },
    places: adventures,
  },
};

const outPath = join(ROOT, "data", "seeds", "bosnia-and-herzegovina.json");
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ ${outPath}`);
console.log(`  ${cities.length} cities, ${total} places, ${adventures.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
