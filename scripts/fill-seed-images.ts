#!/usr/bin/env npx tsx
/**
 * Fill empty/bad image_url fields in seed JSON files.
 * Usage: npx tsx scripts/fill-seed-images.ts [--limit=N] north-macedonia serbia ...
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 9999;
  const slugs = args.filter((a) => !a.startsWith("--"));
  if (!slugs.length) {
    console.error(
      "Usage: npx tsx scripts/fill-seed-images.ts north-macedonia serbia ..."
    );
    process.exit(1);
  }

  let filled = 0;
  let failed = 0;
  let processed = 0;

  for (const slug of slugs) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.warn("missing", slug);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    console.log(`\n=== ${country} (${slug}) ===`);
    let changed = false;

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city as string;
      const avoidUrls = new Set<string>();
      for (const p of citySeed.places ?? []) {
        const u = (p.image_url || "").trim();
        if (u && !isBadImageUrl(u)) avoidUrls.add(u);
      }

      for (const place of citySeed.places ?? []) {
        if (processed >= limit) break;
        const current = (place.image_url || "").trim();
        if (current && !isBadImageUrl(current)) {
          avoidUrls.add(current);
          continue;
        }

        processed++;
        const en = place.translations?.en;
        try {
          const url = await resolvePlaceImage(
            {
              placeName: place.name,
              wikiTitle: en?.wiki_title || place.wiki_title || place.name,
              city,
              country,
              lat: place.lat,
              lng: place.lng,
              mapsQuery: en?.maps_query,
              preferCommons: true,
              avoidUrls,
            },
            900
          );
          if (!url || isBadImageUrl(url) || avoidUrls.has(url)) {
            failed++;
            console.warn(`  x ${city} / ${place.name}`);
          } else {
            place.image_url = url;
            avoidUrls.add(url);
            filled++;
            changed = true;
            console.log(`  ok ${city} / ${place.name}`);
          }
        } catch {
          failed++;
          console.warn(`  x ${city} / ${place.name} (err)`);
        }
        await sleep(Number(process.env.WIKI_DELAY_MS || 450));
      }
      if (processed >= limit) break;
    }

    if (changed) {
      writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
      console.log("saved", slug);
    }
  }

  console.log(
    `\nDone. filled=${filled} failed=${failed} processed=${processed}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
