/**
 * Build kosovo.json from phase1 (6 cities × 10 curated) + landmark supplement (4 cities + Gjilan fill) + adventures.
 * Run: node scripts/extract-kosovo-from-transcript.mjs && node scripts/materialize-kosovo-phase1.mjs && node scripts/build-kosovo-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  inferPlaceType,
  visitDurationHours,
} from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const country = "Kosovo";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

/** Cities with full curated phase1 attractions (10 each) */
const PHASE1_ONLY_CITIES = new Set([
  "Pristina",
  "Prizren",
  "Peja",
  "Gjakova",
  "Mitrovica",
]);

/** Gjilan: first 6 from phase1, remaining 4 from supplement */
const GJILAN_PHASE1_COUNT = 6;

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
  url = cleanUrl(url);
  const fixes = {
    "Imperial_Mosque_(Pristina": "Imperial_Mosque_(Pristina)",
    "Sinan_Pasha_Mosque_(Prizren": "Sinan_Pasha_Mosque_(Prizren)",
    "Old_Stone_Bridge_(Prizren": "Old_Stone_Bridge_(Prizren)",
    "City_Hammami_(Mitrovica": "City_Hammami_(Mitrovica)",
  };
  for (const [broken, fixed] of Object.entries(fixes)) {
    if (url.includes(broken)) return url.replace(broken, fixed);
  }
  return url;
}

function normalizeSeasons(tags) {
  if (!tags?.length) return SEASON_ALL;
  if (tags.includes("all-seasons")) return SEASON_ALL;
  return tags;
}

function commonsFromImageUrl(url) {
  url = cleanUrl(url);
  if (!url) return undefined;
  const thumb = url.match(/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/(.+?)(?:\/\d+px-)?$/);
  if (thumb) return decodeURIComponent(thumb[1].replace(/_/g, " "));
  const direct = url.match(/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/(.+)$/i);
  if (direct) return decodeURIComponent(direct[1].replace(/_/g, " "));
  return undefined;
}

function wikiTitleFromUrl(url) {
  url = cleanUrl(url);
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

function toPlace(raw, cityName, idx) {
  const type = inferPlaceType(raw.name);
  return {
    name: raw.name,
    wiki_title: raw.wiki_title || raw.name,
    lat: raw.lat,
    lng: raw.lng,
    order_index: idx,
    description: raw.description || `${raw.name} in ${cityName}, ${country}.`,
    seo_phrase: `${raw.name} — ${cityName}, ${country}`,
    seo_keywords: [raw.name, cityName, country, "travel", "landmarks"],
    seo_priority: 95 - idx,
    search_intent: ["informational", "travel_planning"],
    type,
    best_season: SEASON_ALL,
    visit_duration_hours: visitDurationHours(type),
    ...(raw.image_url ? { image_url: raw.image_url } : {}),
    ...(raw.commons_file ? { commons_file: raw.commons_file } : {}),
  };
}

function phase1ToPlace(p, idx, cityName) {
  const wikiUrl = fixWikipediaUrl(p.wikipedia_url);
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
    best_season: normalizeSeasons(p.season_tags),
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
  }));
  const attractions = (raw.attractions || []).map((a) => ({
    ...a,
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
    image_url: cleanUrl(a.image_url),
  }));
  const adventure_locations = (raw.adventure_locations || []).map((a) => ({
    ...a,
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
    image_url: cleanUrl(a.image_url),
  }));
  const country_cover_image = raw.country_cover_image
    ? { ...raw.country_cover_image, image_url: cleanUrl(raw.country_cover_image.image_url) }
    : undefined;
  return { ...raw, cities, attractions, adventure_locations, country_cover_image };
}

const phase1 = normalizePhase1(
  JSON.parse(readFileSync(join(ROOT, "data/seeds/kosovo-phase1-input.json"), "utf8"))
);
const landmarks = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/kosovo-landmarks-supplement.json"), "utf8")
);

const cityOrder = phase1.cities.map((c) => c.name);

const cities = cityOrder.map((cityName) => {
  let places;
  if (PHASE1_ONLY_CITIES.has(cityName)) {
    places = (phase1.attractions || [])
      .filter(
        (a) =>
          a.city === cityName &&
          !isDeathRelatedPlace(a.name, a.description_short || a.description_long)
      )
      .slice(0, 10)
      .map((p, i) => phase1ToPlace(p, i, cityName));
  } else if (cityName === "Gjilan") {
    const phase1Places = (phase1.attractions || [])
      .filter(
        (a) =>
          a.city === cityName &&
          !isDeathRelatedPlace(a.name, a.description_short || a.description_long)
      )
      .slice(0, GJILAN_PHASE1_COUNT)
      .map((p, i) => phase1ToPlace(p, i, cityName));
    const supplementPlaces = (landmarks.Gjilan || [])
      .filter((p) => !isDeathRelatedPlace(p.name))
      .slice(0, 10 - phase1Places.length)
      .map((p, i) => toPlace(p, cityName, phase1Places.length + i));
    places = [...phase1Places, ...supplementPlaces];
  } else {
    places = (landmarks[cityName] || [])
      .filter((p) => !isDeathRelatedPlace(p.name))
      .slice(0, 10)
      .map((p, i) => toPlace(p, cityName, i));
  }

  return {
    city: cityName,
    tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
    wiki_title: cityName,
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
    commons_file: commonsFromImageUrl(cleanUrl(p.image_url)),
    image_url: cleanUrl(p.image_url),
    seo_priority: p.seo_priority_score ?? 95 - idx,
    best_season: normalizeSeasons(p.season_tags),
    visit_duration_hours: 4,
    type: "nature",
  }));

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Mountains & Canyon Road Trip`,
    subtitle: `Explore ${country} beyond the cities — Rugova Canyon, Sharr peaks, lakes, and alpine trails.`,
    wiki_title: country,
    hero_image: phase1.country_cover_image?.image_url,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Mountains, Canyons & Lakes Adventure`,
      description: `Plan a ${country} road trip with GPS stops, Rugova Canyon, Sharr Mountains, lakes, and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this nature and mountain adventure route.`,
      keywords: [`${country} road trip`, `${country} Rugova Canyon`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(join(ROOT, "data/seeds/kosovo.json"), JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ kosovo.json: ${total} places, ${advPlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
