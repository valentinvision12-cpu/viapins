import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SEASON_MAP = { "\u041f\u0440\u043e\u043b\u0435\u0442": "spring", "\u041b\u044f\u0442\u043e": "summer", "\u0415\u0441\u0435\u043d": "autumn", "\u0417\u0438\u043c\u0430": "winter", "\u0412\u0441\u0438\u0447\u043a\u0438 \u0441\u0435\u0437\u043e\u043d\u0438": "all-seasons" };
const hasCyr = (s) => /[\u0400-\u04FF]/.test(s || "");
const seasons = (t) => (!t?.length ? ["spring", "summer", "autumn", "winter"] : t.map((x) => SEASON_MAP[x] || x));

function parseAttractions(raw) {
  const start = raw.indexOf('"attractions": [');
  if (start < 0) return [];
  let body = raw.slice(start).replace(/^"attractions":\s*\[/, "");
  const end = body.lastIndexOf("]");
  if (end > 0) body = body.slice(0, end);
  const parts = body.split(/\},\s*\{/);
  const items = [];
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i].trim();
    if (!part) continue;
    if (!part.startsWith("{")) part = "{" + part;
    if (!part.endsWith("}")) part = part + "}";
    try {
      items.push(JSON.parse(part));
    } catch {
      // skip truncated final object
    }
  }
  return items;
}

function en(a) {
  const o = { ...a, season_tags: seasons(a.season_tags) };
  if (!hasCyr(a.seo_title) && !hasCyr(a.description_short)) return o;
  return {
    ...o,
    seo_title: `${a.name} in ${a.city}, Japan - Travel Guide`,
    seo_description: `Visit ${a.name} in ${a.city}, Japan. History, photos, and practical tips for your itinerary.`,
    description_short: `${a.name} is one of the essential landmarks to visit in ${a.city}, Japan.`,
    description_long: `${a.name} in ${a.city} offers a memorable mix of culture, architecture, and local atmosphere. Plan enough time to explore the surrounding area on the same day.`,
    keywords: [a.name, a.city, "Japan", `${a.city} landmarks`],
    long_tail_keywords: [`how to visit ${a.name}`, `${a.name} ${a.city} guide`, `best time for ${a.name}`],
  };
}

const raw = readFileSync(join(ROOT, "data/phase1/japan.json"), "utf8");
const i = raw.indexOf('"attractions": [');
const header = JSON.parse(raw.slice(0, i) + '"attractions":[],"adventure_locations":[]}');
let attractions = parseAttractions(raw).map(en).filter((a) => a.name && a.latitude);
const extras = JSON.parse(readFileSync(join(ROOT, "data/phase1/japan-extras.json"), "utf8"));
const key = (a) => `${a.city}|${a.name}`;
const extraKeys = new Set(extras.attractions.map(key));
attractions = attractions.filter((a) => !extraKeys.has(key(a)));
attractions.push(...extras.attractions);
const seen = new Set();
attractions = attractions.filter((a) => { const k = key(a); if (seen.has(k)) return false; seen.add(k); return true; });
const cities = ["Tokyo","Kyoto","Osaka","Nara","Yokohama","Nagoya","Sapporo","Fukuoka","Kanazawa","Kobe"];
const out = { country: "Japan", phase: 1, country_image: header.country_image, cities, attractions, adventure_locations: extras.adventures };
writeFileSync(join(ROOT, "data/phase1/japan.json"), JSON.stringify(out, null, 2) + "\n");
const by = Object.fromEntries(cities.map((c) => [c, 0]));
for (const a of attractions) by[a.city]++;
console.log("total", attractions.length);
for (const c of cities) console.log(c, by[c]);
