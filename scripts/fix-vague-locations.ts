#!/usr/bin/env npx tsx
/**
 * Fix vague map pins — update wiki_title, lat/lng, maps_query in seeds + Supabase.
 * Usage: npx tsx scripts/fix-vague-locations.ts [--dry-run] [country-slug...]
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import type { TravelSeedFile, TravelSeedPlace } from "../src/lib/travel-seed";

const LOCALES = ["en", "es", "fr", "de", "it"] as const;

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

type FixEntry = {
  wiki_title?: string;
  lat?: number;
  lng?: number;
  maps_query?: string;
  name?: string;
};

function fixKey(country: string, city: string, name: string) {
  return `${country}|${city}|${name}`;
}

function isCityWiki(wiki: string, city: string) {
  const w = wiki.trim();
  const c = city.trim();
  return w === c || w.startsWith(`${c},`);
}

function applyFixToPlace(
  place: TravelSeedPlace,
  city: string,
  country: string,
  fixes: Record<string, FixEntry>
): boolean {
  const key = fixKey(country, city, place.name);
  const manual = fixes[key];
  let changed = false;

  if (manual?.name && manual.name !== place.name) {
    place.name = manual.name;
    changed = true;
  }
  if (manual?.wiki_title && manual.wiki_title !== place.wiki_title) {
    if (!isCityWiki(manual.wiki_title, city)) {
      place.wiki_title = manual.wiki_title;
      changed = true;
    }
  } else if (isCityWiki(place.wiki_title, city) && place.name !== city) {
    place.wiki_title = place.name;
    changed = true;
  }
  if (manual?.lat != null && manual.lat !== place.lat) {
    place.lat = manual.lat;
    changed = true;
  }
  if (manual?.lng != null && manual.lng !== place.lng) {
    place.lng = manual.lng;
    changed = true;
  }

  const defaultMapsQuery = `${place.name}, ${city}, ${country}`;
  const mapsQuery = mapsQueryFor(place, city, country, fixes);
  const forceMapsQuery = Boolean(manual?.maps_query);
  if (forceMapsQuery || mapsQuery !== defaultMapsQuery) {
    if (place.maps_query !== mapsQuery) {
      place.maps_query = mapsQuery;
      changed = true;
    }
  } else if (place.maps_query) {
    delete (place as { maps_query?: string }).maps_query;
    changed = true;
  }

  return changed;
}

function mapsQueryFor(
  place: TravelSeedPlace,
  city: string,
  country: string,
  fixes: Record<string, FixEntry>
): string {
  const manual = fixes[fixKey(country, city, place.name)];
  if (manual?.maps_query) return manual.maps_query;
  return `${place.name}, ${city}, ${country}`;
}

async function updateDbPlace(
  supabase: ReturnType<typeof createClient>,
  destinationId: string,
  placeName: string,
  patch: {
    lat: number;
    lng: number;
    mapsQuery: string;
    wikiTitle?: string;
  },
  dryRun: boolean
) {
  const { data: row } = await supabase
    .from("places")
    .select("id, translations")
    .eq("destination_id", destinationId)
    .ilike("name", placeName)
    .maybeSingle();

  if (!row) return { status: "missing" as const };

  const translations = (row.translations ?? {}) as Record<
    string,
    Record<string, string>
  >;

  for (const loc of LOCALES) {
    const entry = { ...(translations[loc] ?? {}) };
    entry.maps_query = patch.mapsQuery;
    if (patch.wikiTitle) entry.wiki_title = patch.wikiTitle;
    translations[loc] = entry;
  }

  if (dryRun) {
    return { status: "dry" as const, id: row.id };
  }

  const { error } = await supabase
    .from("places")
    .update({
      lat: patch.lat,
      lng: patch.lng,
      translations,
    })
    .eq("id", row.id);

  if (error) return { status: "error" as const, error: error.message };
  return { status: "updated" as const, id: row.id };
}

async function main() {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const seedOnly = args.includes("--seed-only");
  const dbOnly = args.includes("--db-only");
  const slugs = args.filter((a) => !a.startsWith("--"));

  const defaultSlugs = [
    "croatia",
    "cyprus",
    "czech-republic",
    "bosnia-and-herzegovina",
    "france",
    "estonia",
  ];
  const targetSlugs = slugs.length ? slugs : defaultSlugs;

  const fixesPath = join(process.cwd(), "data", "vague-location-fixes.json");
  const { fixes } = JSON.parse(readFileSync(fixesPath, "utf8")) as {
    fixes: Record<string, FixEntry>;
  };

  const supabase =
    seedOnly
      ? null
      : createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

  let totalSeedChanges = 0;
  let dbUpdated = 0;
  let dbMissing = 0;

  for (const slug of targetSlugs) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.warn(`Skip missing seed: ${slug}`);
      continue;
    }

    const seed = JSON.parse(readFileSync(seedPath, "utf8")) as TravelSeedFile;
    const country = seed.country;
    console.log(`\n=== ${country} (${slug}) ===`);
    let slugChanges = 0;

    for (const citySeed of seed.cities) {
      const city = citySeed.city;

      let destId: string | null = null;
      if (supabase) {
        const { data: dest } = await supabase
          .from("destinations")
          .select("id")
          .ilike("country", country)
          .ilike("city", city)
          .maybeSingle();
        destId = dest?.id ?? null;
      }

      for (const place of citySeed.places) {
        const before = JSON.stringify({
          n: place.name,
          w: place.wiki_title,
          lat: place.lat,
          lng: place.lng,
        });
        const changed = applyFixToPlace(place, city, country, fixes);
        const after = JSON.stringify({
          n: place.name,
          w: place.wiki_title,
          lat: place.lat,
          lng: place.lng,
        });

        const mapsQuery = place.maps_query ?? mapsQueryFor(place, city, country, fixes);
        const hasManual = Boolean(fixes[fixKey(country, city, place.name)]);

        if (dbOnly && !place.maps_query && !fixes[fixKey(country, city, place.name)]) {
          continue;
        }

        if (changed || hasManual || (dbOnly && place.maps_query)) {
          slugChanges++;
          totalSeedChanges++;
          if ((before !== after || hasManual) && !dbOnly) {
            console.log(`  ${city} / ${place.name}`);
            if (before !== after) console.log(`    seed: ${before} → ${after}`);
            console.log(`    maps_query: ${mapsQuery}`);
          }
        }

        if (supabase && destId && (changed || hasManual || (dbOnly && place.maps_query))) {
          const result = await updateDbPlace(
            supabase,
            destId,
            place.name,
            {
              lat: place.lat,
              lng: place.lng,
              mapsQuery,
              wikiTitle: place.wiki_title,
            },
            dryRun
          );
          if (result.status === "updated" || result.status === "dry") dbUpdated++;
          else if (result.status === "missing") dbMissing++;
          else console.warn(`    DB error: ${result.error}`);
        }
      }
    }

    if (!dryRun && !dbOnly && slugChanges > 0) {
      writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
      console.log(`  Saved ${slug}.json (${slugChanges} places)`);
    }
  }

  // Sync Estonia supplement from seed fixes
  if (targetSlugs.includes("estonia") && !dryRun && !dbOnly) {
    syncEstoniaSupplement(fixes);
  }

  console.log(`\nDone.${dryRun ? " (dry-run)" : ""}`);
  console.log(`  Seed place fixes: ${totalSeedChanges}`);
  console.log(`  DB updates: ${dbUpdated}`);
  if (dbMissing) console.log(`  DB missing rows: ${dbMissing}`);
}

function syncEstoniaSupplement(fixes: Record<string, FixEntry>) {
  const supPath = join(
    process.cwd(),
    "data",
    "seeds",
    "estonia-landmarks-supplement.json"
  );
  if (!existsSync(supPath)) return;

  const sup = JSON.parse(readFileSync(supPath, "utf8")) as Record<
    string,
    TravelSeedPlace[]
  >;
  const country = "Estonia";
  let n = 0;

  for (const [city, places] of Object.entries(sup)) {
    for (const place of places) {
      if (applyFixToPlace(place, city, country, fixes)) n++;
    }
  }

  if (n > 0) {
    writeFileSync(supPath, JSON.stringify(sup, null, 2) + "\n", "utf8");
    console.log(`\n  Updated estonia-landmarks-supplement.json (${n} fields)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
