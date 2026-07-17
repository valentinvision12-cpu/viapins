/**
 * Fix Belarus seed: replace skipped Lida place + align city/place seasons.
 * Run: node scripts/fix-belarus-seasons.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const path = join(ROOT, "data", "seeds", "belarus.json");

/** Cities good for winter travel (museums, fortresses, culture — like Sofia in Bulgaria) */
const WINTER_CITIES = new Set(["Minsk", "Brest", "Grodno", "Polotsk", "Mogilev"]);

/** Warm-season cities (parks, lakes, summer festivals, castle gardens) */
const SUMMER_CITIES = new Set(["Vitebsk", "Gomel", "Nesvizh", "Mir", "Lida"]);

const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];

function seasonsForCity(cityName) {
  if (WINTER_CITIES.has(cityName)) return SEASON_ALL;
  if (SUMMER_CITIES.has(cityName)) return SEASON_WARM;
  return SEASON_WARM;
}

const LIDA_REPLACEMENT = {
  name: "Lida Castle Historical Museum",
  wiki_title: "Lida Castle",
  lat: 53.8871,
  lng: 25.3031,
  order_index: 8,
  description:
    "The museum inside Lida Castle presents medieval Grodno Region history, armour, and archaeological finds from the brick fortress.",
  seo_phrase: "Lida Castle Historical Museum — medieval fortress museum",
  seo_keywords: [
    "Lida Castle museum",
    "Lida Castle Belarus",
    "medieval castle Lida",
    "Grodno Region history",
  ],
  commons_file: "Ліда._Лідскі_замак._2015_(15).jpg",
  image_url:
    "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%9B%D1%96%D0%B4%D0%B0._%D0%9B%D1%96%D0%B4%D1%81%D0%BA%D1%96_%D0%B7%D0%B0%D0%BC%D0%B0%D0%BA._2015_(15).jpg?width=900",
  seo_priority: 78,
  search_intent: ["informational", "travel_planning"],
  type: "museum",
  visit_duration_hours: 1.5,
  nearby_places: ["Lida Castle", "Castle Gate Tower, Lida", "St. Joseph Church, Lida"],
};

const seed = JSON.parse(readFileSync(path, "utf8"));

for (const city of seed.cities) {
  const seasons = seasonsForCity(city.city);
  city.tags = [...seasons];

  for (const place of city.places) {
    place.best_season = [...seasons];

    if (city.city === "Lida" && place.name === "Old Town, Lida") {
      Object.assign(place, LIDA_REPLACEMENT);
    }
  }
}

if (seed.adventure?.places) {
  for (const p of seed.adventure.places) {
    p.best_season = [...SEASON_ALL];
  }
}

writeFileSync(path, JSON.stringify(seed, null, 2), "utf8");

const summary = seed.cities.map((c) => ({
  city: c.city,
  tags: c.tags,
  places: c.places.length,
  sampleSeason: c.places[0]?.best_season,
}));

console.log(JSON.stringify({ fixed: path, cities: summary, lidaReplaced: true }, null, 2));
