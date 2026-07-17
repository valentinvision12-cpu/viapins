#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";
import { hasConflictingGeoSignals, verifyPlaceImage } from "../src/lib/place-image-verify";

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const slugs = args.filter((a) => !a.startsWith("--"));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let fixed = 0;
  let rejected = 0;

  for (const slug of slugs.length ? slugs : ["bulgaria"]) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.warn(`Skip ${slug}: no seed`);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    console.log(`\n=== ${country} (${slug}) ===`);

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city as string;
      const { data: dest } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();
      if (!dest) continue;

      const seedByName = new Map(
        (citySeed.places ?? []).map((sp: { name: string }) => [sp.name.toLowerCase(), sp])
      );

      const { data: places } = await supabase
        .from("places")
        .select("id, name, image_url, lat, lng, translations")
        .eq("destination_id", dest.id);

      for (const p of places ?? []) {
        const seedPlace = seedByName.get(p.name.toLowerCase()) as
          | { wiki_title?: string; commons_file?: string }
          | undefined;
        const en = (p.translations as Record<string, { wiki_title?: string; maps_query?: string }>)?.en;
        const ctx = {
          placeName: p.name,
          wikiTitle: seedPlace?.wiki_title || en?.wiki_title || p.name,
          city,
          country,
          lat: p.lat ?? undefined,
          lng: p.lng ?? undefined,
          mapsQuery: en?.maps_query,
          commonsFile: seedPlace?.commons_file,
        };

        const current = p.image_url?.trim() ?? "";
        const bad =
          !current ||
          isBadImageUrl(current) ||
          !verifyPlaceImage(ctx, current).ok ||
          hasConflictingGeoSignals(ctx, current);

        if (!bad) continue;
        rejected++;

        const reason = !current
          ? "missing"
          : hasConflictingGeoSignals(ctx, current)
            ? "wrong_location"
            : "failed_verify";

        console.log(`  [${reason}] ${city} / ${p.name}`);

        if (dryRun) continue;

        const newUrl = await resolvePlaceImage({ ...ctx, preferCommons: false }, 900);
        if (!newUrl) {
          console.log(`    -> no replacement found`);
          continue;
        }

        await supabase
          .from("places")
          .update({ image_url: newUrl, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        console.log(`    -> fixed`);
        fixed++;
      }
    }
  }

  console.log(`\nRejected/wrong: ${rejected}, fixed: ${fixed}${dryRun ? " (dry-run)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});