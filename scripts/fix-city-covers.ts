#!/usr/bin/env npx tsx
/**
 * Backfill destinations.cover_image from places + Wikipedia.
 * Usage: npx tsx scripts/fix-city-covers.ts [slug...]
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  resolveCityCoverFromDb,
} from "../src/lib/city-cover";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filterCountries = process.argv.slice(2);
  let query = supabase
    .from("destinations")
    .select("id, city, country, cover_image, places(name, image_url, order_index)")
    .eq("published", true);

  const { data: dests, error } = await query;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let fixed = 0;
  let skipped = 0;
  let columnMissing = false;

  for (const dest of dests ?? []) {
    if (
      filterCountries.length &&
      !filterCountries.some(
        (f) =>
          f.toLowerCase() === dest.country.toLowerCase() ||
          f.toLowerCase() === dest.city.toLowerCase()
      )
    ) {
      continue;
    }

    const places = (dest.places ?? []) as {
      name: string;
      image_url: string;
      order_index: number;
    }[];

    const cover = resolveCityCoverFromDb(dest.cover_image ?? undefined, places);

    if (!cover) {
      console.warn(`  ✗ ${dest.city}, ${dest.country}: no cover`);
      skipped++;
      continue;
    }

    if (dest.cover_image === cover) {
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from("destinations")
      .update({ cover_image: cover, updated_at: new Date().toISOString() })
      .eq("id", dest.id);

    if (upErr?.code === "PGRST204") {
      if (!columnMissing) {
        console.warn(
          "\n  ⚠ cover_image column missing — run supabase/migrations/007_destination_cover_image.sql in Supabase SQL Editor\n"
        );
        columnMissing = true;
      }
      skipped++;
      continue;
    }
    if (upErr) {
      console.warn(`  ✗ ${dest.city}: ${upErr.message}`);
      continue;
    }

    fixed++;
    console.log(`  ✓ ${dest.city}, ${dest.country}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\nDone: ${fixed} updated, ${skipped} unchanged/skipped\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
