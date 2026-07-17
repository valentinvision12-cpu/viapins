/**
 * Converts data-generator/output/europe.json → data/seeds/{slug}.json (travel-seed v2)
 * Usage: node scripts/convert-europe-to-seed.mjs bosnia-and-herzegovina
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
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/(.+)$/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

function commonsFromImageUrl(url) {
  if (!url) return undefined;
  const m = url.match(/Special:FilePath\/([^?]+)/);
  if (!m) return undefined;
  return decodeURIComponent(m[1].replace(/\+/g, " "));
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function citySeo(name, country) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [
      `things to do in ${name}`,
      `${name} ${country} travel guide`,
      `best places to visit in ${name}`,
      `${name} landmarks`,
      `${name} itinerary`,
    ],
  };
}

function inferType(name) {
  return inferPlaceType(name);
}

function placeSeasons(name, type) {
  return inferPlaceSeasons(name, type);
}

const slug = process.argv[2]?.toLowerCase();
if (!slug) {
  console.error("Usage: node scripts/convert-europe-to-seed.mjs luxembourg");
  process.exit(1);
}

const europePath = join(ROOT, "data-generator", "output", "europe.json");
const raw = JSON.parse(readFileSync(europePath, "utf8"));
const countryData = raw.countries.find(
  (c) => slugify(c.country) === slug || c.wikidata_id === process.argv[2]
);

if (!countryData) {
  console.error(`Country not found in europe.json for slug: ${slug}`);
  process.exit(1);
}

const country = countryData.country;
const attractions = countryData.attractions ?? [];
const byCity = new Map();
for (const a of attractions) {
  if (isDeathRelatedPlace(a.name, a.description)) continue;
  const key = a.city;
  if (!byCity.has(key)) byCity.set(key, []);
  byCity.get(key).push(a);
}

const advPlaces = (countryData.adventure_locations ?? []).map((p, idx) => ({
  name: p.name,
  wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
  region: p.region || country,
  lat: p.latitude,
  lng: p.longitude,
  day: p.day ?? idx + 1,
  order_index: p.order_index ?? idx,
  requires_car: p.requires_car !== false,
  tags: p.tags?.length ? p.tags : ["nature", "hidden_gem", "adventure"],
  best_season: p.best_season?.length ? p.best_season : ["spring", "summer", "autumn"],
  image_url: p.image_url || undefined,
  commons_file: p.commons_file || commonsFromImageUrl(p.image_url),
  seo_phrase: p.seo_title || `${p.name} — ${country} road trip`,
  seo_keywords: [p.name, `${country} road trip`, `${country} nature`],
  visit_duration_hours: p.visit_duration_hours ?? 4,
  type: p.type || "nature",
}));

const seed = {
  version: 2,
  country,
  published: true,
  cities: countryData.cities.map((c) => {
    const rawPlaces = (byCity.get(c.name) || []).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    const cityPlaces = rawPlaces.map((p, idx) => {
      const type = p.type || inferType(p.name);
      const best_season =
        p.best_season?.length ? p.best_season : placeSeasons(p.name, type);
      return {
        name: p.name,
        wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
        lat: p.latitude,
        lng: p.longitude,
        order_index: p.order_index ?? idx,
        image_url: p.image_url || undefined,
        commons_file: p.commons_file || commonsFromImageUrl(p.image_url),
        seo_phrase: p.seo_title || `${p.name} — ${c.name}, ${country}`,
        seo_keywords: [p.name, c.name, country, "travel", "landmarks"],
        seo_priority: 95 - idx,
        search_intent: ["informational", "travel_planning"],
        type,
        best_season,
        visit_duration_hours: p.visit_duration_hours ?? visitDurationHours(type),
      };
    });

    return {
      city: c.name,
      tags: inferCityTags(c.name, cityPlaces),
      wiki_title: wikiTitleFromUrl(c.wikipedia_url) || c.name,
      seo: citySeo(c.name, country),
      places: cityPlaces,
    };
  }),
  adventure: {
    title: `${country} Nature & Road Trip Adventure`,
    subtitle: `Explore ${country} beyond the cities — parks, hills, and scenic drives.`,
    wiki_title: country,
    totalDays: Math.max(advPlaces.length, 10),
    seo: {
      title: `${country} Road Trip — Nature Adventure Guide`,
      description: `Plan a ${country} road trip with GPS stops, natural parks, and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this nature adventure route.`,
      keywords: [`${country} road trip`, `${country} nature`, `${country} by car`],
    },
    places: advPlaces,
  },
};

const placeCount = seed.cities.reduce((n, c) => n + c.places.length, 0);
const outPath = join(ROOT, "data", "seeds", `${slug}.json`);
writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");
console.log(`✓ ${outPath}`);
console.log(`  ${seed.cities.length} cities, ${placeCount} places, ${advPlaces.length} adventure stops`);
for (const c of seed.cities) {
  const n = c.places.length;
  const mark = n === 10 ? "✓" : "⚠";
  console.log(`  ${mark} ${c.city}: ${n}/10`);
}
