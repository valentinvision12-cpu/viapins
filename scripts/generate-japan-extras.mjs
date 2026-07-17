import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function p(cfg) {
  const d = { season_tags: ["spring", "summer", "autumn"], search_intent: "informational", intent_cluster: "history_culture", user_journey_stage: "planning", seo_priority_score: 88, topical_depth_score: 8, nearby_attractions: [], related_attractions: [], internal_link_priority: "medium", image_source: "Wikimedia Commons", image_license: "CC BY-SA 4.0", ...cfg };
  return { ...d, latitude: d.lat, longitude: d.lng, google_maps_url: `https://www.google.com/maps?q=${d.lat},${d.lng}`, wikipedia_url: `https://en.wikipedia.org/wiki/${d.wiki}`, image_url: d.image };
}
const defs = JSON.parse(readFileSync(join(ROOT, "data/phase1/japan-extras-defs.json"), "utf8"));
const attractions = defs.attractions.map(p);
const adventures = defs.adventures.map((d) => p({ ...d, city: d.city || "Japan" }));
writeFileSync(join(ROOT, "data/phase1/japan-extras.json"), JSON.stringify({ attractions, adventures }, null, 2) + "\n");
console.log(attractions.length, adventures.length);