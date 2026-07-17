/**
 * Merge partial phase1 + landmark/adventure supplements into kosovo-phase1-input.json
 * Run: node scripts/materialize-kosovo-phase1.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const partial = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/kosovo-phase1-partial.json"), "utf8")
);
const landmarks = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/kosovo-landmarks-supplement.json"), "utf8")
);
const adventures = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/kosovo-adventures-supplement.json"), "utf8")
);

function supplementToAttraction(cityName, entry, region) {
  return {
    name: entry.name,
    city: cityName,
    region,
    latitude: entry.lat,
    longitude: entry.lng,
    google_maps_url: `https://www.google.com/maps?q=${entry.lat},${entry.lng}`,
    wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.wiki_title.replace(/ /g, "_"))}`,
    description_short: `${entry.name} — a notable landmark in ${cityName}, Kosovo.`,
    keywords: [entry.name.split(" ")[0], cityName, "Kosovo"],
    search_intent: "travel_planning",
    season_tags: ["all-seasons"],
    seo_priority_score: 85,
  };
}

const regionByCity = Object.fromEntries(
  (partial.cities || []).map((c) => [c.name, c.region])
);

const supplementAttractions = [];
for (const [cityName, entries] of Object.entries(landmarks)) {
  for (const entry of entries) {
    supplementAttractions.push(
      supplementToAttraction(cityName, entry, regionByCity[cityName])
    );
  }
}

const merged = {
  ...partial,
  attractions: [...(partial.attractions || []), ...supplementAttractions],
  adventure_locations: adventures.map((a, i) => ({
    ...a,
    seo_title: `${a.name} — Kosovo Road Trip Stop ${i + 1}`,
    seo_priority_score: 95 - i,
    season_tags: ["spring", "summer", "autumn"],
    keywords: [a.name, "Kosovo", "road trip"],
    search_intent: "travel_planning",
  })),
  country_cover_image: {
    image_url:
      partial.attractions?.find((a) => a.name === "Prizren Fortress")?.image_url ||
      partial.attractions?.[0]?.image_url,
    image_source: "Wikimedia Commons",
    image_license: "CC BY-SA 4.0",
  },
};

writeFileSync(
  join(ROOT, "data/seeds/kosovo-phase1-input.json"),
  JSON.stringify(merged, null, 2) + "\n"
);

const byCity = {};
for (const a of merged.attractions) byCity[a.city] = (byCity[a.city] || 0) + 1;

console.log(
  `✓ kosovo-phase1-input.json: ${merged.cities.length} cities, ${merged.attractions.length} attractions, ${merged.adventure_locations.length} adventures`
);
for (const c of merged.cities) {
  const n = byCity[c.name] || 0;
  console.log(`  ${n === 10 ? "✓" : "⚠"} ${c.name}: ${n}/10`);
}
