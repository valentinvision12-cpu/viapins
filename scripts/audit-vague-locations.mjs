#!/usr/bin/env node
/**
 * Audit seeds for vague map pins.
 * Real issues: city-level wiki_title, duplicate coords, missing maps_query on area names.
 * Run: npm run audit:vague-locations
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "data", "seeds");
const published = [
  "croatia",
  "cyprus",
  "czech-republic",
  "bosnia-and-herzegovina",
  "france",
  "estonia",
];

const AREA_NAME =
  /^(Old Town|.*\bOld Town$|.*\bpromenade$|.*\bCentral Square$|.*\bCentral Park$|.*\bRiver promenade$|.*\bPikk Street$|.*\bBay$)/i;

function isCityWiki(wiki, city) {
  if (!wiki) return false;
  const w = wiki.trim();
  const c = city.trim();
  return w === c || w.startsWith(`${c},`);
}

const issues = [];

for (const slug of published) {
  const path = join(dir, `${slug}.json`);
  let seed;
  try {
    seed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }

  for (const c of seed.cities) {
    const byCoord = new Map();
    for (const p of c.places) {
      const key = `${Number(p.lat).toFixed(4)},${Number(p.lng).toFixed(4)}`;
      if (!byCoord.has(key)) byCoord.set(key, []);
      byCoord.get(key).push(p);
    }

    for (const p of c.places) {
      const problems = [];
      if (isCityWiki(p.wiki_title, c.city)) problems.push("wiki_title_is_city");
      const key = `${Number(p.lat).toFixed(4)},${Number(p.lng).toFixed(4)}`;
      const same = byCoord.get(key) ?? [];
      if (same.length >= 2) problems.push(`duplicate_coords_${same.length}`);
      if (AREA_NAME.test(p.name) && !p.maps_query?.trim()) {
        problems.push("area_name_no_maps_query");
      }

      if (problems.length) {
        issues.push({
          country: seed.country,
          city: c.city,
          name: p.name,
          wiki_title: p.wiki_title,
          maps_query: p.maps_query ?? null,
          lat: p.lat,
          lng: p.lng,
          problems,
          dup_with: same.filter((x) => x.name !== p.name).map((x) => x.name),
        });
      }
    }
  }
}

const out = join(process.cwd(), "data", "audit-vague-locations.json");
writeFileSync(out, JSON.stringify(issues, null, 2));

const byCountry = {};
for (const i of issues) {
  byCountry[i.country] = (byCountry[i.country] ?? 0) + 1;
}

console.log(`Real issues: ${issues.length}`);
console.log("By country:", byCountry);
console.log(`Saved: ${out}`);
for (const i of issues) {
  console.log(
    `${i.country} / ${i.city} / ${i.name} [${i.problems.join(", ")}] maps=${i.maps_query ?? "—"}`
  );
}
