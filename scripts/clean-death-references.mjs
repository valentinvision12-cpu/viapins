#!/usr/bin/env npx tsx
/** Strip death-related names from nearby_places and seo_keywords in seed files. */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const dir = join(process.cwd(), "data", "seeds");
let total = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes("phase1"))) {
  const path = join(dir, file);
  const seed = JSON.parse(readFileSync(path, "utf8"));
  let n = 0;

  for (const city of seed.cities ?? []) {
    for (const place of city.places ?? []) {
      if (place.nearby_places) {
        const before = place.nearby_places.length;
        place.nearby_places = place.nearby_places.filter((x) => !isDeathRelatedPlace(x));
        if (place.nearby_places.length !== before) n++;
      }
      if (place.seo_keywords) {
        const before = place.seo_keywords.length;
        place.seo_keywords = place.seo_keywords.filter((x) => !isDeathRelatedPlace(x));
        if (place.seo_keywords.length !== before) n++;
      }
    }
  }

  if (n) {
    writeFileSync(path, JSON.stringify(seed, null, 2) + "\n");
    console.log(`✓ ${file}: ${n} fields cleaned`);
    total += n;
  }
}

console.log(`\nDone: ${total} field cleanups\n`);
