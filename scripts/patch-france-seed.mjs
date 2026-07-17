/**
 * Apply curated descriptions/images from france-phase1-user-patch.json → france.json
 * Run: node scripts/patch-france-seed.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

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

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/(.+)$/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

const patch = JSON.parse(
  readFileSync(join(ROOT, "data/seeds/france-phase1-user-patch.json"), "utf8")
);
const seed = JSON.parse(readFileSync(join(ROOT, "data/seeds/france.json"), "utf8"));

const byCityName = new Map();
for (const a of patch.attractions) {
  const keys = [a.name, ...(a.match_names || [])].map((n) => `${a.city}::${n}`.toLowerCase());
  for (const k of keys) byCityName.set(k, a);
}
const advByName = new Map();
for (const a of patch.adventure_locations) {
  const keys = [a.name, ...(a.match_names || [])].map((n) => n.toLowerCase());
  for (const k of keys) advByName.set(k, a);
}

let placeUpdates = 0;
for (const city of seed.cities) {
  for (const place of city.places) {
    const p = byCityName.get(`${city.city}::${place.name}`.toLowerCase());
    if (!p) continue;
    place.description = p.description_short;
    if (p.wikipedia_url) place.wiki_title = wikiTitleFromUrl(p.wikipedia_url) || place.wiki_title;
    const commons = commonsFromImageUrl(p.image_url);
    if (commons) {
      place.commons_file = commons;
      place.image_url = p.image_url;
    }
    placeUpdates++;
  }
}

let advUpdates = 0;
for (const place of seed.adventure?.places ?? []) {
  const p = advByName.get(place.name.toLowerCase());
  if (!p) continue;
  place.description = p.description_short;
  if (p.wikipedia_url) place.wiki_title = wikiTitleFromUrl(p.wikipedia_url) || place.wiki_title;
  const commons = commonsFromImageUrl(p.image_url);
  if (commons) {
    place.commons_file = commons;
    place.image_url = p.image_url;
  }
  advUpdates++;
}

writeFileSync(join(ROOT, "data/seeds/france.json"), JSON.stringify(seed, null, 2) + "\n");
console.log(`Patched france.json: ${placeUpdates} city places, ${advUpdates} adventure stops`);
