/**
 * Heal far/missing GPS for places in live DB + seeds using Wikipedia coordinates.
 * Does NOT invent coords — only applies wiki/OSM hits near the city center.
 *
 * Usage: npx tsx scripts/heal-place-gps.ts luxembourg sweden ... [--dry-run] [--write-seed]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { getCityCoords } from "../src/lib/wiki-landmark-search";
import { haversineKm, getCityRadiusKm } from "../src/lib/precise-place-filter";

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatimCity(city: string, country: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    `${city}, ${country}`
  )}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ViaPins/1.0 (https://viapins.com; gps-heal)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function resolveCityCenter(city: string, country: string) {
  try {
    const c = await getCityCoords(city, country);
    if (c) return c;
  } catch {
    /* ignore */
  }
  await sleep(1100);
  return nominatimCity(city, country);
}

async function wikiCoords(title: string): Promise<{ lat: number; lng: number } | null> {
  if (!title?.trim()) return null;
  const p = new URLSearchParams({
    action: "query",
    prop: "coordinates",
    colimit: "1",
    format: "json",
    titles: title,
    redirects: "1",
  });
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${p}`, {
      headers: {
        "User-Agent": "ViaPins/1.0 (https://viapins.com; gps-heal)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { coordinates?: { lat: number; lon: number }[] }> };
    };
    const page = Object.values(data.query?.pages ?? {})[0];
    const c = page?.coordinates?.[0];
    if (!c || typeof c.lat !== "number" || typeof c.lon !== "number") return null;
    return { lat: c.lat, lng: c.lon };
  } catch {
    return null;
  }
}

async function nominatimPlace(
  query: string,
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=5`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ViaPins/1.0 (https://viapins.com; gps-heal)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    for (const h of data) {
      const lat = Number(h.lat);
      const lng = Number(h.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (haversineKm(center.lat, center.lng, lat, lng) <= radiusKm) {
        return { lat, lng };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function isBadGps(
  lat: number | null | undefined,
  lng: number | null | undefined,
  center: { lat: number; lng: number },
  radiusKm: number
): boolean {
  if (lat == null || lng == null) return true;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  if (lat === 0 && lng === 0) return true;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return true;
  return haversineKm(center.lat, center.lng, lat, lng) > radiusKm;
}

type Report = {
  country: string;
  cities: number;
  placesChecked: number;
  gpsFixed: number;
  gpsFailed: number;
  remaining: string[];
};

async function healSlug(slug: string, dryRun: boolean, writeSeed: boolean): Promise<Report> {
  const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
  if (!existsSync(seedPath)) throw new Error(`Missing seed ${seedPath}`);
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const country = seed.country as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const report: Report = {
    country,
    cities: 0,
    placesChecked: 0,
    gpsFixed: 0,
    gpsFailed: 0,
    remaining: [],
  };

  const radius = getCityRadiusKm(country);
  console.log(`\n=== Heal GPS: ${country} (radius ${radius} km) ===`);

  for (const citySeed of seed.cities ?? []) {
    const city = citySeed.city as string;
    report.cities++;
    const center = await resolveCityCenter(city, country);
    await sleep(400);
    if (!center) {
      console.log(`  skip (no city center): ${city}`);
      continue;
    }

    const { data: dest } = await supabase
      .from("destinations")
      .select("id")
      .ilike("country", country)
      .ilike("city", city)
      .maybeSingle();
    if (!dest) {
      console.log(`  skip (no dest): ${city}`);
      continue;
    }

    const { data: places } = await supabase
      .from("places")
      .select("id, name, lat, lng, translations, order_index")
      .eq("destination_id", dest.id)
      .order("order_index");

    const seedByName = new Map(
      (citySeed.places ?? []).map((sp: { name: string }) => [sp.name.toLowerCase(), sp])
    );

    console.log(`\n-- ${city} --`);

    for (const p of places ?? []) {
      report.placesChecked++;
      if (!isBadGps(p.lat, p.lng, center, radius)) {
        process.stdout.write(".");
        continue;
      }

      const seedPlace = seedByName.get(p.name.toLowerCase()) as
        | {
            name: string;
            wiki_title?: string;
            lat?: number;
            lng?: number;
            maps_query?: string;
          }
        | undefined;
      const en = (p.translations as Record<string, { wiki_title?: string; maps_query?: string }>)
        ?.en;
      const wikiTitle = seedPlace?.wiki_title || en?.wiki_title || p.name;
      const mapsQuery =
        seedPlace?.maps_query || en?.maps_query || `${p.name}, ${city}, ${country}`;

      console.log(
        `\n  [far/bad] ${p.name} (${p.lat ?? "?"}, ${p.lng ?? "?"})`
      );

      if (dryRun) {
        report.gpsFailed++;
        continue;
      }

      let next: { lat: number; lng: number } | null = null;
      await sleep(350);
      next = await wikiCoords(wikiTitle);
      if (next && haversineKm(center.lat, center.lng, next.lat, next.lng) > radius) {
        console.log(
          `    wiki coords too far (${haversineKm(center.lat, center.lng, next.lat, next.lng).toFixed(1)} km)`
        );
        next = null;
      }
      if (!next) {
        await sleep(1100);
        next = await nominatimPlace(mapsQuery, center, radius);
      }
      if (!next && wikiTitle !== p.name) {
        await sleep(1100);
        next = await nominatimPlace(`${p.name}, ${city}, ${country}`, center, radius);
      }

      if (!next) {
        console.log(`    -> no verified coords`);
        report.gpsFailed++;
        report.remaining.push(`${city}/${p.name}`);
        continue;
      }

      const { error } = await supabase
        .from("places")
        .update({
          lat: next.lat,
          lng: next.lng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      if (error) {
        console.log(`    -> DB error: ${error.message}`);
        report.gpsFailed++;
        report.remaining.push(`${city}/${p.name}`);
        continue;
      }

      if (seedPlace) {
        seedPlace.lat = next.lat;
        seedPlace.lng = next.lng;
      }
      console.log(`    -> ${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`);
      report.gpsFixed++;
    }
    console.log("");
  }

  if (writeSeed && !dryRun) {
    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
    console.log(`Wrote seed: ${seedPath}`);
  }

  console.log(
    `\n${country}: checked ${report.placesChecked}, gpsFixed ${report.gpsFixed}, gpsFailed ${report.gpsFailed}`
  );
  return report;
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const writeSeed = argv.includes("--write-seed");
  const slugs = argv.filter((a) => !a.startsWith("--"));
  if (!slugs.length) {
    console.error(
      "Usage: npx tsx scripts/heal-place-gps.ts luxembourg sweden ... [--dry-run] [--write-seed]"
    );
    process.exit(1);
  }

  const reports: Report[] = [];
  for (const slug of slugs) {
    reports.push(await healSlug(slug, dryRun, writeSeed));
  }

  const out = join(process.cwd(), "data", "heal-gps-report.json");
  writeFileSync(out, JSON.stringify(reports, null, 2) + "\n", "utf8");
  console.log(`\nReport: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});