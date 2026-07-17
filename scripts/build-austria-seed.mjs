/**
 * Build austria.json from phase1 (curated SEO) + landmark supplements.
 * Images resolved on import via wiki-image.ts
 * Run: node scripts/build-austria-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/(.+)$/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

function commonsFromUrl(url) {
  if (!url) return undefined;
  let m = url.match(/Special:FilePath\/([^?]+)/);
  if (m) return decodeURIComponent(m[1].replace(/\+/g, " "));
  m = url.match(/wikipedia\/commons\/[^/]+\/[^/]+\/(.+)$/);
  if (m) return decodeURIComponent(m[1].replace(/_/g, " "));
  return undefined;
}

function inferType(name) {
  const n = name.toLowerCase();
  if (/museum|gallery/.test(n)) return "museum";
  if (/church|cathedral|abbey|chapel/.test(n)) return "church";
  if (/palace|fortress|castle|fort |tower/.test(n)) return "historic_site";
  if (/park|lake|village|mountain|alps|waterfall|valley/.test(n)) return "nature";
  return "landmark";
}

const WINTER = new Set(["Innsbruck", "Bregenz", "Zell am See", "Hallstatt", "Klagenfurt"]);
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];

function seasons(city) {
  return WINTER.has(city) ? SEASON_ALL : SEASON_WARM;
}

function citySeo(cityName, country) {
  return {
    title: `Top 10 Things to Do in ${cityName}, ${country}`,
    description: `Discover 10 must-see landmarks in ${cityName}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${cityName}? Explore the best places to visit in ${cityName}, ${country}.`,
    keywords: [
      `things to do in ${cityName}`,
      `${cityName} ${country} travel guide`,
      `best places to visit in ${cityName}`,
      `${cityName} landmarks`,
    ],
  };
}

function toPlace(raw, cityName, country, idx, curated = false) {
  const wiki =
    raw.wiki_title ||
    wikiTitleFromUrl(raw.wikipedia_url) ||
    raw.name;
  return {
    name: raw.name,
    wiki_title: wiki,
    lat: raw.latitude ?? raw.lat,
    lng: raw.longitude ?? raw.lng,
    order_index: idx,
    description: raw.description_short,
    seo_phrase: raw.seo_title || raw.name,
    seo_keywords: raw.keywords?.slice(0, 6) || [raw.name, cityName, country],
    commons_file: commonsFromUrl(raw.image_url),
    image_url: raw.image_url,
    seo_priority: raw.seo_priority_score ?? (curated ? 95 - idx : 80 - idx),
    search_intent: ["informational", "travel_planning"],
    type: inferType(raw.name),
    best_season: seasons(cityName),
    visit_duration_hours: inferType(raw.name) === "museum" ? 2 : 1,
    nearby_places: raw.nearby_attractions?.slice(0, 3) || [],
  };
}

const phase1 = JSON.parse(
  readFileSync(join(ROOT, "data", "seeds", "austria-phase1.json"), "utf8")
);
const landmarks = JSON.parse(
  readFileSync(join(ROOT, "data", "seeds", "austria-landmarks-supplement.json"), "utf8")
);
const advSupp = JSON.parse(
  readFileSync(join(ROOT, "data", "seeds", "austria-adventure-supplement.json"), "utf8")
);

const country = phase1.country;
const curatedByCity = new Map();
for (const a of phase1.attractions) {
  if (!curatedByCity.has(a.city)) curatedByCity.set(a.city, []);
  curatedByCity.get(a.city).push(a);
}

const seedCities = [];

for (const city of phase1.cities) {
  const cityName = city.name || city.city;
  const seen = new Set();
  const places = [];

  for (const p of curatedByCity.get(cityName) || []) {
    const key = (p.wikidata_id || p.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(toPlace(p, cityName, country, places.length, true));
  }

  for (const p of landmarks[cityName] || []) {
    if (places.length >= 10) break;
    const key = p.wiki_title.toLowerCase();
    if (seen.has(key) || seen.has(p.name.toLowerCase())) continue;
    seen.add(key);
    places.push(toPlace(p, cityName, country, places.length, false));
  }

  console.log(`${places.length === 10 ? "✓" : "⚠"} ${cityName}: ${places.length}/10`);
  seedCities.push({
    city: cityName,
    tags: seasons(cityName),
    wiki_title: city.wiki_title || cityName,
    seo: citySeo(cityName, country),
    places: places.slice(0, 10),
  });
}

const advSeen = new Set();
const uniqueAdv = [];

for (const p of phase1.adventure_locations || []) {
  if (uniqueAdv.length >= 10) break;
  if (advSeen.has(p.name)) continue;
  advSeen.add(p.name);
  uniqueAdv.push({
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url),
    region: p.region || country,
    lat: p.latitude,
    lng: p.longitude,
    day: uniqueAdv.length + 1,
    order_index: uniqueAdv.length,
    requires_car: true,
    tags: ["nature", "hidden_gem"],
    description: p.description_short,
    image_url: p.image_url,
    commons_file: commonsFromUrl(p.image_url),
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, country],
    seo_priority: p.seo_priority_score ?? 99,
    best_season: SEASON_ALL,
    visit_duration_hours: 4,
  });
}

for (const p of advSupp.adventures || []) {
  if (uniqueAdv.length >= 10) break;
  if (advSeen.has(p.name)) continue;
  advSeen.add(p.name);
  uniqueAdv.push({
    name: p.name,
    wiki_title: p.wiki_title,
    region: p.region || country,
    lat: p.lat,
    lng: p.lng,
    day: uniqueAdv.length + 1,
    order_index: uniqueAdv.length,
    requires_car: true,
    tags: ["nature", "hidden_gem"],
    seo_phrase: p.name,
    seo_keywords: [p.name, country, "road trip"],
    seo_priority: 90 - uniqueAdv.length,
    best_season: SEASON_ALL,
    visit_duration_hours: 4,
  });
}

console.log(`${uniqueAdv.length === 10 ? "✓" : "⚠"} Adventures: ${uniqueAdv.length}/10`);

const output = {
  version: 2,
  country,
  published: true,
  cities: seedCities,
  adventure: {
    title: "Austria Alps & Alpine Road Trip",
    subtitle: "10-day scenic drive through Austria's mountains, lakes, and alpine passes",
    wiki_title: "Austria",
    totalDays: 10,
    seo: {
      title: "10-Day Austria Road Trip — Alps, Lakes & Scenic Drives",
      description:
        "Plan a 10-day Austria road trip: Grossglockner, alpine lakes, national parks, and hidden mountain routes.",
      intro:
        "Explore Austria beyond the cities — high alpine roads, glacier valleys, and lake districts by car.",
      keywords: ["Austria road trip", "Austrian Alps drive", "Grossglockner", "Austria by car"],
    },
    places: uniqueAdv,
  },
};

const outPath = join(ROOT, "data", "seeds", "austria.json");
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
const total = seedCities.reduce((n, c) => n + c.places.length, 0);
console.log(`\n✓ ${outPath}`);
console.log(`  ${seedCities.length} cities, ${total} places, ${uniqueAdv.length} adventures`);
