#!/usr/bin/env node
/**
 * Resolve precise Google Places coordinates for landmarks in Supabase.
 *
 * Usage:
 *   node scripts/resolve-google-places.mjs --dry-run finland
 *   node scripts/resolve-google-places.mjs romania
 *
 * Requires GOOGLE_MAPS_API_KEY in .env.local (Places API New enabled).
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const LOCALES = ["en", "es", "fr", "de", "it"];
const DELAY_MS = Number(process.env.GOOGLE_PLACES_DELAY_MS || 250);
const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

function googleMapsPlaceIdUrl(placeId, label) {
  const id = placeId.replace(/^places\//, "");
  const params = new URLSearchParams({ api: "1", query_place_id: id });
  if (label?.trim()) params.set("query", label.trim());
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

async function findGooglePlace(apiKey, opts) {
  const textQuery =
    opts.mapsQuery?.trim() ||
    `${opts.name}, ${opts.city}, ${opts.country}`;

  const body = {
    textQuery,
    languageCode: "en",
    maxResultCount: 1,
  };

  if (
    opts.biasLat != null &&
    opts.biasLng != null &&
    Number.isFinite(opts.biasLat) &&
    Number.isFinite(opts.biasLng)
  ) {
    body.locationBias = {
      circle: {
        center: { latitude: opts.biasLat, longitude: opts.biasLng },
        radius: 12000,
      },
    };
  }

  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Places HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place?.id || !place.location) return null;

  const lat = place.location.latitude;
  const lng = place.location.longitude;
  if (lat == null || lng == null) return null;

  const placeId = place.id.replace(/^places\//, "");
  const displayName = place.displayName?.text?.trim() || opts.name;
  const formattedAddress =
    place.formattedAddress?.trim() ||
    `${displayName}, ${opts.city}, ${opts.country}`;

  return {
    placeId,
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    displayName,
    formattedAddress,
    googleMapsUri:
      place.googleMapsUri?.trim() ||
      googleMapsPlaceIdUrl(placeId, displayName),
  };
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const cityIdx = argv.indexOf("--city");
  const cityFilter = cityIdx >= 0 ? argv[cityIdx + 1] : null;
  const slugs = argv.filter((a) => !a.startsWith("--") && a !== cityFilter);
  return { dryRun, cityFilter, slugs };
}

async function main() {
  loadEnv();
  const { dryRun, cityFilter, slugs } = parseArgs(process.argv.slice(2));

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY in .env.local");
    process.exit(1);
  }


  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let countryQuery = supabase
    .from("destinations")
    .select("id, city, country")
    .order("country")
    .order("city");

  if (slugs.length === 1) {
    const slug = slugs[0].replace(/-/g, " ");
    countryQuery = countryQuery.ilike("country", `%${slug}%`);
  } else if (slugs.length > 1) {
    console.error("Pass one country slug or omit for all countries.");
    process.exit(1);
  }

  const { data: dests, error: destErr } = await countryQuery;
  if (destErr) throw destErr;

  const filtered = (dests ?? []).filter(
    (d) => !cityFilter || d.city.toLowerCase() === cityFilter.toLowerCase()
  );

  console.log(`\n→ Google Places resolve: ${filtered.length} cities${dryRun ? " (dry-run)" : ""}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const dest of filtered) {
    const { data: places } = await supabase
      .from("places")
      .select("id, name, lat, lng, translations")
      .eq("destination_id", dest.id)
      .order("order_index");

    const cityCenter = places?.length
      ? {
          lat: places.reduce((s, p) => s + Number(p.lat), 0) / places.length,
          lng: places.reduce((s, p) => s + Number(p.lng), 0) / places.length,
        }
      : null;

    for (const place of places ?? []) {
      const trans = place.translations ?? {};
      const en = trans.en ?? {};
      if (en.google_place_id && en.formatted_address) {
        skipped++;
        continue;
      }

      const mapsQuery = en.maps_query?.trim() || `${place.name}, ${dest.city}, ${dest.country}`;

      try {
  const match = await findGooglePlace(apiKey, {
          name: place.name,
          city: dest.city,
          country: dest.country,
          mapsQuery,
          biasLat: cityCenter?.lat,
          biasLng: cityCenter?.lng,
        });

        if (!match) {
          console.warn(`  ⚠ no match: ${dest.city} / ${place.name}`);
          failed++;
          await sleep(DELAY_MS);
          continue;
        }

        const translations = { ...trans };
        for (const loc of LOCALES) {
          translations[loc] = {
            ...(translations[loc] ?? {}),
            google_place_id: match.placeId,
            formatted_address: match.formattedAddress,
            maps_query: match.formattedAddress,
            maps_url: match.googleMapsUri,
          };
        }

        console.log(
          `  ✓ ${dest.city} / ${place.name}\n    ${match.formattedAddress}\n    ${match.lat}, ${match.lng}`
        );

        if (!dryRun) {
          const { error } = await supabase
            .from("places")
            .update({
              lat: match.lat,
              lng: match.lng,
              translations,
            })
            .eq("id", place.id);
          if (error) throw error;
        }

        updated++;
      } catch (err) {
        console.warn(`  ✗ ${dest.city} / ${place.name}: ${err.message}`);
        failed++;
      }

      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already had place_id, ${failed} failed\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
