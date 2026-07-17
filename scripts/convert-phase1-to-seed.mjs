/**
 * Converts phase1 travel dataset → data/seeds/{slug}.json (travel-seed v2)
 * Usage: node scripts/convert-phase1-to-seed.mjs croatia "c:/path/to/file.json"
 */
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SITE_SEASONS = ["spring", "summer", "autumn", "winter"];

function isGenericDescription(text) {
  if (!text?.trim()) return true;
  const t = text.trim();
  if (t.length < 20) return true;
  if (/^[\w\s-]+$/i.test(t) && t.split(/\s+/).length <= 2) return true;
  return (
    /real-world travel stop with clear local appeal/i.test(t) ||
    /is a standout stop in .+, known for/i.test(t) ||
    /is one of the most distinctive stops in/i.test(t) ||
    /mixing local character with a strong visitor appeal/i.test(t) ||
    /is a standout open-air location for travelers/i.test(t) ||
    /^(heritage|shopping|museum|viewpoint|landmark|nature|church|historic_site)$/i.test(t)
  );
}

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/(.+)$/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

function commonsFromImageUrl(url) {
  if (!url) return undefined;
  let m = url.match(/Special:FilePath\/([^?]+)/);
  if (m) return decodeURIComponent(m[1].replace(/\+/g, " "));
  m = url.match(/wiki\/File:([^?#]+)/i);
  if (m) return decodeURIComponent(m[1].replace(/_/g, " "));
  m = url.match(/wikipedia\/commons\/[^/]+\/[^/]+\/(.+)$/);
  if (m) return decodeURIComponent(m[1].replace(/_/g, " "));
  return undefined;
}

function normalizeImageUrl(url) {
  // Let import resolve via Wikipedia — guessed Commons filenames are often wrong
  if (!url) return undefined;
  if (url.startsWith("https://upload.wikimedia.org/")) return url;
  return undefined;
}

function inferType(name) {
  const n = name.toLowerCase();
  if (/museum|gallery/.test(n)) return "museum";
  if (/church|cathedral|chapel|monastery|mosque|basilica|abbey/.test(n)) return "church";
  if (/castle|fortress|palace|tower|gate|walls|fort /.test(n)) return "historic_site";
  if (/park|lake|waterfall|mountain|forest|beach|nature|national/.test(n)) return "nature";
  if (/theatre|theater|square|bridge/.test(n)) return "landmark";
  return "landmark";
}

function normalizeSeasons(tags, fallback = ["spring", "summer", "autumn"]) {
  const raw = Array.isArray(tags) ? tags : tags ? [tags] : fallback;
  const out = SITE_SEASONS.filter((s) => raw.includes(s));
  return out.length ? out : fallback;
}

function citySeo(city, country) {
  const name = city.name || city.city;
  return {
    title: city.seo_title || `Top 10 Things to Do in ${name}, ${country}`,
    description:
      city.seo_description ||
      `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro:
      city.description_short ||
      `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: city.long_tail_keywords?.slice(0, 5) || [
      `things to do in ${name}`,
      `${name} ${country} travel guide`,
      `best places to visit in ${name}`,
      `${name} landmarks`,
    ],
  };
}

function cityTags(city, places) {
  const set = new Set(normalizeSeasons(city.season_tags));
  for (const p of places) {
    for (const s of p.best_season || []) set.add(s);
  }
  const seasons = SITE_SEASONS.filter((s) => set.has(s));
  const cats = new Set();
  for (const p of places) {
    const t = p.type;
    if (t === "museum") cats.add("culture");
    if (t === "church") cats.add("religious");
    if (t === "nature") cats.add("nature");
    if (t === "historic_site") cats.add("history");
  }
  return [...seasons, ...cats].slice(0, 6);
}

function adventureMeta(country) {
  return {
    title: `${country} Nature & Road Trip Adventure`,
    subtitle: `Explore ${country} beyond the cities — parks, coast, and scenic drives.`,
    wiki_title: country,
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Nature Adventure Guide`,
      description: `Plan a ${country} road trip with GPS stops, national parks, and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this nature adventure route.`,
      keywords: [`${country} road trip`, `${country} nature`, `${country} by car`],
    },
  };
}

const slug = process.argv[2];
const inputPath = process.argv[3];
if (!slug || !inputPath) {
  console.error("Usage: node scripts/convert-phase1-to-seed.mjs croatia path/to/phase1.json");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const country = raw.country;

const cityNameOf = (c) => (typeof c === "string" ? c : c.name || c.city);
const cityOrder = raw.cities.map(cityNameOf);
const placesByCity = new Map(cityOrder.map((n) => [n, []]));

for (const a of raw.attractions || []) {
  if (isDeathRelatedPlace(a.name, a.description_short)) continue;
  if (!placesByCity.has(a.city)) placesByCity.set(a.city, []);
  placesByCity.get(a.city).push(a);
}

const cities = raw.cities.map((city) => {
  const cityName = cityNameOf(city);
  const places = (placesByCity.get(cityName) || []).slice(0, 10).map((p, idx) => ({
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: isGenericDescription(p.description_short)
      ? undefined
      : p.description_short,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: normalizeImageUrl(p.image_url),
    seo_priority: p.seo_priority_score ?? 90 - idx,
    search_intent: Array.isArray(p.search_intent)
      ? p.search_intent
      : p.search_intent
        ? [p.search_intent, "travel_planning"]
        : ["informational", "travel_planning"],
    type: inferType(p.name),
    best_season: normalizeSeasons(p.season_tags, normalizeSeasons(city.season_tags)),
    visit_duration_hours: inferType(p.name) === "museum" ? 2 : 1,
    nearby_places: p.nearby_attractions?.slice(0, 3) || [],
  }));

  return {
    city: cityName,
    tags: cityTags(city, places),
    wiki_title: wikiTitleFromUrl(city.wikipedia_url) || cityName,
    seo: citySeo(city, country),
    places,
  };
});

const adventurePlaces = (raw.adventure_locations || []).slice(0, 10).map((p, idx) => ({
  name: p.name,
  wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
  region: p.region || country,
  lat: p.latitude,
  lng: p.longitude,
  day: p.day ?? idx + 1,
  order_index: idx,
  requires_car: p.requires_car !== false,
  tags: ["nature", "hidden_gem", "adventure", ...normalizeSeasons(p.season_tags)],
  description: isGenericDescription(p.description_short)
    ? undefined
    : p.description_short,
  seo_phrase: p.seo_title || p.name,
  seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
  commons_file: commonsFromImageUrl(p.image_url),
  image_url: normalizeImageUrl(p.image_url),
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
    ...adventureMeta(country),
    places: adventurePlaces,
  },
};

const seedsDir = join(ROOT, "data", "seeds");
const phase1Dest = join(seedsDir, `${slug}-phase1.json`);
copyFileSync(inputPath, phase1Dest);

const outPath = join(seedsDir, `${slug}.json`);
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ ${outPath}`);
console.log(`  ${cities.length} cities, ${total} places, ${adventurePlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
