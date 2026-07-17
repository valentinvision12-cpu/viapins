/**
 * Build ireland.json from nested phase1 input (10 cities × 10 attractions + adventures).
 * Run: node scripts/build-ireland-seed.mjs
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
const country = "Ireland";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

const CITY_COORDS = {
  Dublin: { lat: 53.3498, lng: -6.2603 },
  Cork: { lat: 51.8985, lng: -8.4756 },
  Galway: { lat: 53.2707, lng: -9.0568 },
  Limerick: { lat: 52.6638, lng: -8.6267 },
  Waterford: { lat: 52.2593, lng: -7.1101 },
  Kilkenny: { lat: 52.6541, lng: -7.2448 },
  Killarney: { lat: 52.0599, lng: -9.5044 },
  Westport: { lat: 53.8019, lng: -9.5218 },
  Cobh: { lat: 51.8503, lng: -8.2944 },
  Sligo: { lat: 54.2766, lng: -8.4761 },
};

function cleanUrl(s) {
  if (!s || typeof s !== "string") return "";
  const md = s.match(/\[(https?:\/\/[^\]]+)\]/);
  if (md) return md[1];
  const plain = s.match(/^(https?:\/\/[^\s\])]+)/);
  if (plain) return plain[1];
  return s.trim();
}

function fixWikipediaUrl(url) {
  if (!url) return url;
  const fixes = {
    "King_John%27s_Castle_(Limerick": "King_John's_Castle_(Limerick)",
    "King_John%27s_Castle_(Limerick)": "King_John's_Castle_(Limerick)",
    "Trinity_College_Library": "Old_Library,_Trinity_College_Dublin",
    "Shandon_Bells": "St._Anne's_Church,_Shandon",
    "Sligo_Abbey_(Church_Area)": "Sligo_Abbey",
  };
  for (const [broken, fixed] of Object.entries(fixes)) {
    if (url.includes(broken)) return url.replace(broken, fixed);
  }
  return url;
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

function phase1ToPlace(p, idx, cityName) {
  const wikiUrl = fixWikipediaUrl(cleanUrl(p.wikipedia_url));
  const imageUrl = cleanUrl(p.image_url);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(wikiUrl) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description:
      p.description_short?.trim() ||
      p.description_long?.slice(0, 200)?.trim() ||
      p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl,
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

function flattenPhase1(raw) {
  const cities = [];
  const attractions = [];

  for (const c of raw.cities || []) {
    const cityName = c.name || c.city_name;
    const coords = CITY_COORDS[cityName] || {};
    cities.push({
      name: cityName,
      region: c.region,
      latitude: coords.lat ?? c.latitude,
      longitude: coords.lng ?? c.longitude,
    });
    for (const a of c.attractions || []) {
      attractions.push({ ...a, city: cityName });
    }
  }

  const adventure_locations = (raw.adventure_locations || []).map((a) => ({
    ...a,
    wikipedia_url: cleanUrl(a.wikipedia_url),
    image_url: cleanUrl(a.image_url),
    google_maps_url: cleanUrl(a.google_maps_url),
  }));

  return { ...raw, cities, attractions, adventure_locations };
}

const raw = flattenPhase1(
  JSON.parse(
    readFileSync(join(ROOT, "data/seeds/ireland-phase1-input.json"), "utf8")
  )
);

const cityOrder = raw.cities.map((c) => c.name);

const cities = cityOrder.map((cityName) => {
  const places = (raw.attractions || [])
    .filter(
      (a) =>
        a.city === cityName &&
        !isDeathRelatedPlace(a.name, a.description_short || a.description_long)
    )
    .slice(0, 10)
    .map((p, i) => phase1ToPlace(p, i, cityName));

  return {
    city: cityName,
    tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
    wiki_title: cityName,
    seo: citySeo(cityName),
    places,
  };
});

const advPlaces = (raw.adventure_locations || [])
  .filter((p) => !isDeathRelatedPlace(p.name, p.description_short || p.description_long))
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
    commons_file: commonsFromImageUrl(cleanUrl(p.image_url)),
    image_url: cleanUrl(p.image_url),
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
    title: `${country} Wild Atlantic & Scenic Road Trip`,
    subtitle: `Explore ${country} beyond the cities — cliffs, national parks, and iconic coastal routes.`,
    wiki_title: country,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Wild Atlantic Adventure`,
      description: `Plan an ${country} road trip with GPS stops, cliffs, national parks, and scenic peninsulas.`,
      intro: `Explore ${country} beyond the cities with this nature and coastal adventure route.`,
      keywords: [`${country} road trip`, `${country} Wild Atlantic Way`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(join(ROOT, "data/seeds/ireland.json"), JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ ireland.json: ${total} places, ${advPlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
