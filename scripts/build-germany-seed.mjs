/**
 * Build germany.json from phase1 (5 cities × 10) + landmark supplement (5 cities × 10) + adventures.
 * Run: node scripts/build-germany-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  inferPlaceType,
  inferPlaceSeasons,
  visitDurationHours,
} from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const country = "Germany";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

/** Phase1 cities with full curated attractions */
const PHASE1_CITIES = new Set([
  "Berlin",
  "Munich",
  "Hamburg",
  "Cologne",
  "Frankfurt",
]);

function seasons(city) {
  return /berlin|munich|hamburg|cologne|frankfurt|dresden|nuremberg|stuttgart|düsseldorf|leipzig/i.test(
    city
  )
    ? SEASON_ALL
    : SEASON_WARM;
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
    ...(raw.maps_query ? { maps_query: raw.maps_query } : {}),
  };
}

function commonsFromImageUrl(url) {
  if (!url) return undefined;
  const thumb = url.match(/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/(.+?)(?:\/\d+px-)?$/);
  if (thumb) return decodeURIComponent(thumb[1].replace(/_/g, " "));
  const direct = url.match(/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/(.+)$/i);
  if (direct) return decodeURIComponent(direct[1].replace(/_/g, " "));
  return undefined;
}

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/([^?#]+)/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

/** Fix known broken wikipedia URLs from phase1 export */
function fixWikipediaUrl(url) {
  if (!url) return url;
  const fixes = {
    "Tiergarten_(park": "Tiergarten_(park)",
    "St.Peter%27s_Church(Munich": "St._Peter's_Church,_Munich",
    "Rheingarten_(Köln": "Rheingarten_(Cologne)",
    "Lichtenstein_Castle_(Germany": "Lichtenstein_Castle_(Germany)",
  };
  for (const [broken, fixed] of Object.entries(fixes)) {
    if (url.includes(broken)) return url.replace(broken, fixed);
  }
  return url;
}

function phase1ToPlace(p, idx, cityName) {
  const wikiUrl = fixWikipediaUrl(p.wikipedia_url);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(wikiUrl) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: p.description_short,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: p.image_url,
    seo_priority: p.seo_priority_score ?? 90 - idx,
    search_intent: Array.isArray(p.search_intent)
      ? p.search_intent
      : p.search_intent
        ? [p.search_intent, "travel_planning"]
        : ["informational", "travel_planning"],
    type: inferPlaceType(p.name),
    best_season: SEASON_ALL,
    visit_duration_hours: visitDurationHours(inferPlaceType(p.name)),
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

function normalizePhase1(raw) {
  const cities = (raw.cities || []).map((c) => ({
    name: c.name || c.city_name,
    region: c.region,
    latitude: c.latitude,
    longitude: c.longitude,
    wikipedia_url: c.wikipedia_url,
  }));
  const attractions = (raw.attractions || []).map((a) => ({
    ...a,
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
  }));
  const adventure_locations = (raw.adventure_locations || []).map((a) => ({
    ...a,
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
  }));
  return { ...raw, cities, attractions, adventure_locations };
}

const phase1 = normalizePhase1(
  JSON.parse(readFileSync(join(ROOT, "data/seeds/germany-phase1-input.json"), "utf8"))
);
const landmarks = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/germany-landmarks-supplement.json"), "utf8")
);

const cityOrder = phase1.cities.map((c) => c.name);

const cities = cityOrder.map((cityName) => {
  let places;
  if (PHASE1_CITIES.has(cityName)) {
    places = (phase1.attractions || [])
      .filter(
        (a) =>
          a.city === cityName &&
          !isDeathRelatedPlace(a.name, a.description_short)
      )
      .slice(0, 10)
      .map((p, i) => phase1ToPlace(p, i, cityName));
  } else {
    places = (landmarks[cityName] || [])
      .filter((p) => !isDeathRelatedPlace(p.name))
      .slice(0, 10)
      .map((p, i) => toPlace(p, cityName, i));
  }
  const cityMeta = phase1.cities.find((c) => c.name === cityName);
  return {
    city: cityName,
    tags: [...seasons(cityName), "history", "culture"].slice(0, 6),
    wiki_title: wikiTitleFromUrl(cityMeta?.wikipedia_url) || cityName,
    seo: citySeo(cityName),
    places,
  };
});

const advPlaces = (phase1.adventure_locations || [])
  .filter((p) => !isDeathRelatedPlace(p.name, p.description_short))
  .slice(0, 10)
  .map((p, idx) => ({
    name: p.name,
    wiki_title: wikiTitleFromUrl(fixWikipediaUrl(p.wikipedia_url)) || p.name,
    region: p.region || country,
    lat: p.latitude,
    lng: p.longitude,
    day: idx + 1,
    order_index: idx,
    requires_car: true,
    tags: ["nature", "hidden_gem", "adventure", ...SEASON_WARM],
    description: p.description_short || p.description,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: p.image_url,
    seo_priority: p.seo_priority_score ?? 95 - idx,
    best_season: SEASON_WARM,
    visit_duration_hours: 4,
    type: "nature",
  }));

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Castles & Nature Road Trip`,
    subtitle: `Explore ${country} beyond the cities — fairy-tale castles, alpine lakes, and scenic routes.`,
    wiki_title: country,
    hero_image: phase1.hero_image?.image_url,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Castles & Nature Adventure`,
      description: `Plan a ${country} road trip with GPS stops, castles, national parks, and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this nature and castle adventure route.`,
      keywords: [`${country} road trip`, `${country} castles`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(join(ROOT, "data/seeds/germany.json"), JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ germany.json: ${total} places, ${advPlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
