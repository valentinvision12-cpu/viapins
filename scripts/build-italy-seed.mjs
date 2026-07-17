/**
 * Build italy.json from phase1 input (10 cities × 10 attractions + adventures).
 * Run: node scripts/build-italy-seed.mjs
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
const country = "Italy";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

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
    "Mercato_Centrale_(Florence": "Mercato_Centrale_(Florence)",
    "Grand_Canal_(Venice": "Grand_Canal_(Venice)",
    "Santa_Maria_delle_Grazie_(Milan": "Santa_Maria_delle_Grazie,_Milan",
    "Borgo_Medievale_(Turin": "Borgo_Medievale_(Turin)",
    "Basilica)_di_San_Zeno": "Basilica_of_San_Zeno,_Verona",
    "Basilica)_di_San_Zeno,_Verona": "Basilica_of_San_Zeno,_Verona",
    "Roman_Theatre_(Verona": "Roman_Theatre_(Verona)",
    "Piazza_Santo_Stefano_(Bologna": "Piazza_Santo_Stefano_(Bologna)",
    "Mercato_delle_Erbe_(Bologna": "Mercato_delle_Erbe_(Bologna)",
    "Castelvecchio_(Verona": "Castelvecchio_(Verona)",
    "Via_Garibaldi_(Genoa": "Via_Garibaldi_(Genoa)",
    "Porto_Antico_(Genoa": "Porto_Antico_(Genoa)",
    "Christopher_Columbus_House_(Genoa": "Christopher_Columbus_House_(Genoa)",
    "Palazzo_Ducale_(Genoa": "Palazzo_Ducale_(Genoa)",
    "Ponte_di_Mezzo_(Pisa": "Ponte_di_Mezzo_(Pisa)",
  };
  for (const [broken, fixed] of Object.entries(fixes)) {
    if (url.includes(broken)) return url.replace(broken, fixed);
  }
  return url;
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

function phase1ToPlace(p, idx, cityName) {
  const wikiUrl = fixWikipediaUrl(p.wikipedia_url);
  const imageUrl = cleanUrl(p.image_url);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(wikiUrl) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: p.description_short?.trim() || p.description_long?.slice(0, 200)?.trim() || p.name,
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
    best_season: p.season_tags?.length ? p.season_tags : SEASON_ALL,
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
  JSON.parse(readFileSync(join(ROOT, "data/seeds/italy-phase1-input.json"), "utf8"))
);

const cityOrder = phase1.cities.map((c) => c.name);

const cities = cityOrder.map((cityName) => {
  const places = (phase1.attractions || [])
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

const advPlaces = (phase1.adventure_locations || [])
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
    best_season: p.season_tags?.length ? p.season_tags : SEASON_WARM,
    visit_duration_hours: 4,
    type: "nature",
  }));

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Alps & Coast Road Trip`,
    subtitle: `Explore ${country} beyond the cities — Dolomites, lakes, volcanoes, and coastal trails.`,
    wiki_title: country,
    hero_image: phase1.country_cover_image?.image_url,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Alps, Lakes & Coast Adventure`,
      description: `Plan an ${country} road trip with GPS stops, Dolomites, lakes, volcanoes, and scenic coastal routes.`,
      intro: `Explore ${country} beyond the cities with this nature and scenic adventure route.`,
      keywords: [`${country} road trip`, `${country} Dolomites`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(join(ROOT, "data/seeds/italy.json"), JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ italy.json: ${total} places, ${advPlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
