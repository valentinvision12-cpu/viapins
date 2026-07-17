/**
 * Converts data/seeds/belarus-phase1.json → data/seeds/belarus.json (travel-seed v2)
 * Run: node scripts/convert-belarus-phase1-to-seed.mjs
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

function commonsFromImageUrl(url) {
  if (!url) return undefined;
  const m = url.match(/Special:FilePath\/([^?]+)/);
  if (!m) return undefined;
  return decodeURIComponent(m[1].replace(/\+/g, " "));
}

function citySeo(city, country) {
  return {
    title: city.seo_title || `Top 10 Things to Do in ${city.name}, ${country}`,
    description:
      city.seo_description ||
      `Discover 10 must-see landmarks in ${city.name}, ${country}. Free GPS routes, photos, and history.`,
    intro:
      city.description_short ||
      `Planning a trip to ${city.name}? Explore the best places to visit in ${city.name}, ${country}.`,
    keywords: [
      `things to do in ${city.name}`,
      `${city.name} ${country} travel guide`,
      `best places to visit in ${city.name}`,
      `${city.name} landmarks`,
      `${city.name} itinerary`,
    ],
  };
}

const WINTER_CITIES = new Set(["Minsk", "Brest", "Grodno", "Polotsk", "Mogilev"]);
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];

function seasonsForCity(cityName) {
  return WINTER_CITIES.has(cityName) ? SEASON_ALL : SEASON_WARM;
}

function inferType(name) {
  const n = name.toLowerCase();
  if (/museum|gallery/.test(n)) return "museum";
  if (/church|cathedral|chapel|monastery|synagogue|yeshiva/.test(n)) return "church";
  if (/castle|fortress|tower|gate/.test(n)) return "historic_site";
  if (/park|garden|embankment|square|hill/.test(n)) return "park";
  if (/river|lake|dvina|dnieper|sozh/.test(n)) return "nature";
  if (/theatre|theater|amphitheatre|bazaar/.test(n)) return "culture";
  if (/memorial|monument/.test(n)) return "monument";
  if (/station|railway/.test(n)) return "landmark";
  if (/forest|pushcha|reserve|national park/.test(n)) return "nature";
  return "landmark";
}

const raw = JSON.parse(readFileSync(join(ROOT, "data", "seeds", "belarus-phase1.json"), "utf8"));
const country = raw.country;

const cityOrder = raw.cities.map((c) => c.name);
const placesByCity = new Map(cityOrder.map((n) => [n, []]));

for (const a of raw.attractions) {
  if (!placesByCity.has(a.city)) placesByCity.set(a.city, []);
  placesByCity.get(a.city).push(a);
}

const cities = raw.cities.map((city, cityIdx) => {
  const places = (placesByCity.get(city.name) || []).map((p, idx) => ({
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url),
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: p.description_short,
    seo_phrase: p.seo_title?.replace(` — ${city.name}, Belarus Travel Guide`, "") || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, city.name, country],
    commons_file: commonsFromImageUrl(p.image_url),
    image_url: p.image_url,
    seo_priority: p.seo_priority_score ?? 80,
    search_intent: p.search_intent || ["informational", "travel_planning"],
    type: inferType(p.name),
    best_season: [...seasonsForCity(city.name)],
    visit_duration_hours: inferType(p.name) === "museum" ? 2 : 1,
    nearby_places: p.nearby_attractions?.slice(0, 3) || [],
  }));

  return {
    city: city.name,
    tags: [...seasonsForCity(city.name)],
    wiki_title: wikiTitleFromUrl(city.wikipedia_url) || city.name,
    seo: citySeo(city, country),
    places,
  };
});

const adventurePlaces = (raw.adventure_locations || []).map((p, idx) => ({
  name: p.name,
  wiki_title: wikiTitleFromUrl(p.wikipedia_url),
  region: p.region,
  lat: p.latitude,
  lng: p.longitude,
  day: p.day ?? idx + 1,
  order_index: idx,
  requires_car: p.requires_car ?? true,
  tags: ["nature", "adventure"],
  description: p.description_short,
  seo_phrase: p.seo_title?.replace(" — Belarus Adventure & Nature Guide", "") || p.name,
  seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "nature"],
  commons_file: commonsFromImageUrl(p.image_url),
  image_url: p.image_url,
  seo_priority: p.seo_priority_score ?? 85,
  best_season: [...SEASON_ALL],
  visit_duration_hours: 4,
}));

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: "Belarus Nature & Forest Road Trip",
    subtitle: "10-day drive through national parks, lakes, and ancient woodlands",
    wiki_title: "Belarus",
    totalDays: 10,
    seo: {
      title: "10-Day Belarus Road Trip: Forests, Lakes & National Parks",
      description:
        "Drive through Belovezhskaya Pushcha, Braslaw Lakes, Pripyatsky marshes, and Belarus's wildest landscapes.",
      intro:
        "A car-based route linking Belarus's best nature reserves — bison forests, glacial lakes, and river floodplains.",
      keywords: [
        "Belarus road trip",
        "Belarus national parks",
        "Belovezhskaya Pushcha",
        "nature travel Belarus",
      ],
    },
    places: adventurePlaces,
  },
};

const outPath = join(ROOT, "data", "seeds", "belarus.json");
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
console.log(
  JSON.stringify({
    path: outPath,
    cities: cities.length,
    places: cities.reduce((n, c) => n + c.places.length, 0),
    adventure: adventurePlaces.length,
  })
);
