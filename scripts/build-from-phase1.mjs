/**
 * Build complete seed from phase1-input JSON — redistribute attractions to 10×10.
 * No wiki autofill. Usage: node scripts/build-from-phase1.mjs liechtenstein
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { inferPlaceType, visitDurationHours } from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";
import { isVaguePlace } from "./precise-place-filter.mjs";
import { isBadImageUrl } from "./bad-image-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];

function normCity(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/([^#?]+)/);
  return m ? decodeURIComponent(m[1].replace(/_/g, " ")) : "";
}

function commonsFromImageUrl(url) {
  if (!url?.includes("upload.wikimedia.org")) return "";
  const m = url.match(/\/commons\/[^/]+\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1].replace(/_/g, " ")) : "";
}

function cleanUrl(u) {
  return typeof u === "string" ? u.trim() : "";
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
    ],
  };
}

function validAttraction(a, country) {
  if (!a?.name?.trim()) return false;
  if (/ Landmark \d+$/i.test(a.name)) return false;
  if (isDeathRelatedPlace(a.name, a.description_short || a.description_long)) return false;
  const lat = a.latitude ?? a.lat;
  const lng = a.longitude ?? a.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return false;
  if (isVaguePlace(a.name, a.description_short || a.description_long, country, lat, lng)) {
    if (!a.image_url || isBadImageUrl(a.image_url)) return false;
  }
  return true;
}

function toPlace(p, idx, cityName, country) {
  const imageUrl = cleanUrl(p.image_url);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    lat: p.latitude ?? p.lat,
    lng: p.longitude ?? p.lng,
    order_index: idx,
    description:
      p.description_short?.trim() ||
      p.description_long?.slice(0, 220)?.trim() ||
      p.description ||
      p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl && !isBadImageUrl(imageUrl) ? imageUrl : "",
    seo_priority: p.seo_priority_score ?? 92 - idx,
    search_intent: ["informational", "travel_planning"],
    type: inferPlaceType(p.name),
    best_season: SEASON_ALL,
    visit_duration_hours: visitDurationHours(inferPlaceType(p.name)),
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

function toAdventure(p, idx, country) {
  const imageUrl = cleanUrl(p.image_url);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    region: p.region || p.city || country,
    lat: p.latitude ?? p.lat,
    lng: p.longitude ?? p.lng,
    day: idx + 1,
    order_index: idx,
    requires_car: true,
    tags: ["nature", "hidden_gem", "adventure", ...SEASON_WARM],
    description: p.description_short || p.description || p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl && !isBadImageUrl(imageUrl) ? imageUrl : "",
    seo_priority: p.seo_priority_score ?? 95 - idx,
    best_season: SEASON_ALL,
    visit_duration_hours: 4,
    type: "nature",
  };
}

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/build-from-phase1.mjs <slug>");
  process.exit(1);
}

const inputPath = join(ROOT, `data/seeds/${slug}-phase1-input.json`);
if (!existsSync(inputPath)) {
  console.error(`Missing ${inputPath}`);
  process.exit(1);
}

const phase1 = JSON.parse(readFileSync(inputPath, "utf8"));
const country = phase1.country;
const cityNames = phase1.cities.map((c) => c.name).slice(0, 10);

const all = (phase1.attractions || []).filter((a) => validAttraction(a, country));
const used = new Set();
const byCity = new Map(cityNames.map((c) => [c, []]));

for (const city of cityNames) {
  const target = normCity(city);
  const pool = all
    .filter((a) => normCity(a.city) === target && !used.has(a.name))
    .sort((a, b) => (b.seo_priority_score ?? 0) - (a.seo_priority_score ?? 0));
  for (const a of pool.slice(0, 10)) {
    byCity.get(city).push(a);
    used.add(a.name);
  }
}

const spare = all
  .filter((a) => !used.has(a.name))
  .sort((a, b) => (b.seo_priority_score ?? 0) - (a.seo_priority_score ?? 0));

for (const city of cityNames) {
  const list = byCity.get(city);
  while (list.length < 10 && spare.length) {
    const a = spare.shift();
    a.city = city;
    list.push(a);
    used.add(a.name);
  }
}

const cities = cityNames.map((cityName) => ({
  city: cityName,
  tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
  wiki_title: cityName,
  seo: citySeo(cityName, country),
  places: byCity.get(cityName).map((p, i) => toPlace(p, i, cityName, country)),
}));

let advRaw = (phase1.adventure_locations || []).filter((a) => validAttraction(a, country));
if (advRaw.length < 10) {
  const extra = all.filter((a) => !advRaw.some((x) => x.name === a.name)).slice(0, 10 - advRaw.length);
  advRaw = [...advRaw, ...extra];
}
const advPlaces = advRaw.slice(0, 10).map((p, i) => toAdventure(p, i, country));

const existingPath = join(ROOT, `data/seeds/${slug}.json`);
let heroImage = "";
try {
  const existing = JSON.parse(readFileSync(existingPath, "utf8"));
  heroImage = existing.adventure?.hero_image || "";
} catch {}

const seed = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Scenic Road Trip`,
    subtitle: `Explore ${country} beyond the cities — nature, coastlines, and scenic routes.`,
    wiki_title: country,
    hero_image: heroImage || cleanUrl(phase1.country_cover_image?.image_url) || "",
    totalDays: 10,
    seo: {
      title: `${country} Road Trip Adventure`,
      description: `Plan a ${country} road trip with GPS stops and scenic routes.`,
      intro: `Explore ${country} beyond the cities with this adventure route.`,
      keywords: [`${country} road trip`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(join(ROOT, `data/seeds/${slug}.json`), JSON.stringify(seed, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ ${slug}.json: ${total}/100 places, ${advPlaces.length}/10 adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
