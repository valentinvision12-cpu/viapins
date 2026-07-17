#!/usr/bin/env node
/**
 * Sync lat/lng in seed files from English Wikipedia coordinates.
 * Run: node scripts/fix-seed-coordinates.mjs [bulgaria|greece|albania|all]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WP_API = "https://en.wikipedia.org/w/api.php";
const UA = "LuxuryTravelMagazine/1.0";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BOUNDS = {
  Bulgaria: { latMin: 41.0, latMax: 44.5, lngMin: 22.0, lngMax: 29.5 },
  Greece: { latMin: 34.0, latMax: 42.0, lngMin: 19.0, lngMax: 30.0 },
  Albania: { latMin: 39.0, latMax: 43.0, lngMin: 19.0, lngMax: 21.5 },
};

function inBounds(lat, lng, country) {
  const b = BOUNDS[country];
  if (!b) return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  return lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax;
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

async function fetchWikiCoords(wikiTitle) {
  const p = new URLSearchParams({
    action: "query",
    prop: "coordinates",
    colimit: "1",
    format: "json",
    titles: wikiTitle,
    redirects: "1",
  });
  const res = await fetch(`${WP_API}?${p}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (page.missing || page.invalid) return null;
  const c = page.coordinates?.[0];
  if (!c || typeof c.lat !== "number" || typeof c.lon !== "number") return null;
  return { lat: c.lat, lng: c.lon };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fixPlace(place, country, stats, wikiTitleCounts) {
  if (!place.wiki_title?.trim()) return;

  const title = place.wiki_title.trim();
  if ((wikiTitleCounts.get(title) ?? 0) > 1) {
    stats.skippedDuplicateWiki++;
    return;
  }

  const coords = await fetchWikiCoords(title);
  await sleep(250);
  if (!coords) {
    stats.noWiki++;
    return;
  }
  if (!inBounds(coords.lat, coords.lng, country)) {
    stats.outOfBounds++;
    console.warn(`  ⚠ ${place.name}: wiki coords out of bounds (${coords.lat}, ${coords.lng})`);
    return;
  }
  const oldLat = place.lat;
  const oldLng = place.lng;
  place.lat = round6(coords.lat);
  place.lng = round6(coords.lng);
  const moved =
    Math.abs(oldLat - place.lat) > 0.001 || Math.abs(oldLng - place.lng) > 0.001;
  if (moved) {
    stats.updated++;
    console.log(`  ✓ ${place.name}: ${oldLat},${oldLng} → ${place.lat},${place.lng}`);
  } else {
    stats.unchanged++;
  }
}

async function fixSeed(slug) {
  const path = join(__dirname, "..", "data", "seeds", `${slug}.json`);
  if (!existsSync(path)) {
    console.error(`Missing ${path}`);
    return;
  }

  const seed = JSON.parse(readFileSync(path, "utf8"));
  const country = seed.country;
  const stats = { updated: 0, unchanged: 0, noWiki: 0, outOfBounds: 0, skippedDuplicateWiki: 0 };

  const wikiTitleCounts = new Map();
  for (const city of seed.cities ?? []) {
    for (const place of city.places ?? []) {
      const t = place.wiki_title?.trim();
      if (t) wikiTitleCounts.set(t, (wikiTitleCounts.get(t) ?? 0) + 1);
    }
  }
  for (const place of seed.adventure?.places ?? []) {
    const t = place.wiki_title?.trim();
    if (t) wikiTitleCounts.set(t, (wikiTitleCounts.get(t) ?? 0) + 1);
  }

  console.log(`\n→ ${country} (${slug}.json)`);

  for (const city of seed.cities ?? []) {
    for (const place of city.places ?? []) {
      await fixPlace(place, country, stats, wikiTitleCounts);
    }
  }

  for (const place of seed.adventure?.places ?? []) {
    await fixPlace(place, country, stats, wikiTitleCounts);
  }

  writeFileSync(path, JSON.stringify(seed, null, 2), "utf8");
  console.log(
    `  Done: ${stats.updated} updated, ${stats.unchanged} ok, ${stats.noWiki} no wiki coords, ${stats.skippedDuplicateWiki} skipped (shared wiki title), ${stats.outOfBounds} out of bounds`
  );
}

const arg = (process.argv[2] ?? "all").toLowerCase();
const slugs =
  arg === "all" ? ["bulgaria", "greece", "albania"] : [arg.replace(/\.json$/, "")];

for (const slug of slugs) {
  await fixSeed(slug);
}

console.log("\n✓ Coordinates synced from Wikipedia. Run import:country for each slug.\n");
