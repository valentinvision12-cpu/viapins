#!/usr/bin/env npx tsx
/**
 * Fix place images listed in data/content-audit.json
 * (no_image_url | non_photo_image | duplicate_image).
 *
 * Usage:
 *   npx tsx scripts/fix-audit-images.ts
 *   npx tsx scripts/fix-audit-images.ts Albania Latvia --limit 80
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";
import { verifyPlaceImage } from "../src/lib/place-image-verify";

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

type AuditRow = {
  country: string;
  city: string;
  name: string;
  id: string;
  problem: string[];
  image_url: string;
  wiki_title?: string;
};

const IMAGE_PROBLEMS = new Set([
  "no_image_url",
  "non_photo_image",
  "duplicate_image",
]);

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit =
    limitIdx >= 0 ? Number(args[limitIdx + 1]) || 200 : Number.POSITIVE_INFINITY;
  const countries = args.filter(
    (a, i) => !a.startsWith("--") && (limitIdx < 0 || i !== limitIdx + 1)
  );

  const auditPath = join(process.cwd(), "data", "content-audit.json");
  if (!existsSync(auditPath)) {
    console.error("Missing data/content-audit.json — run scripts/audit-places.ts first");
    process.exit(1);
  }

  const audit = JSON.parse(readFileSync(auditPath, "utf8")) as AuditRow[];
  let rows = audit.filter((r) => r.problem.some((p) => IMAGE_PROBLEMS.has(p)));
  if (countries.length) {
    const set = new Set(countries.map((c) => c.toLowerCase()));
    rows = rows.filter((r) => set.has(r.country.toLowerCase()));
  }
  rows = rows.slice(0, limit);

  console.log(`Fixing ${rows.length} image issues`);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cityUsed = new Map<string, Set<string>>();
  let fixed = 0;
  let failed = 0;
  let skipped = 0;
  const log: { id: string; name: string; ok: boolean; url?: string }[] = [];

  for (const row of rows) {
    const cityKey = `${row.country}::${row.city}`;
    if (!cityUsed.has(cityKey)) {
      const { data: siblings } = await supabase
        .from("places")
        .select("id, image_url, destinations!inner(city, country)")
        .eq("destinations.city", row.city)
        .eq("destinations.country", row.country);
      const used = new Set<string>();
      for (const s of siblings ?? []) {
        if (s.id === row.id) continue;
        const u = (s.image_url as string)?.trim();
        if (u && !isBadImageUrl(u)) used.add(u);
      }
      cityUsed.set(cityKey, used);
    }
    const avoidUrls = cityUsed.get(cityKey)!;

    const { data: place } = await supabase
      .from("places")
      .select("id, name, image_url, lat, lng, translations")
      .eq("id", row.id)
      .maybeSingle();

    if (!place) {
      console.warn("missing place", row.id, row.name);
      failed++;
      continue;
    }

    const en = (
      place.translations as Record<
        string,
        { wiki_title?: string; maps_query?: string }
      > | null
    )?.en;
    const wikiTitle = row.wiki_title || en?.wiki_title || place.name;
    const ctx = {
      placeName: place.name,
      wikiTitle,
      city: row.city,
      country: row.country,
      lat: place.lat ?? undefined,
      lng: place.lng ?? undefined,
      mapsQuery: en?.maps_query,
      avoidUrls,
      preferCommons: true,
    };

    const current = place.image_url?.trim() ?? "";
    if (
      current &&
      !isBadImageUrl(current) &&
      !avoidUrls.has(current) &&
      verifyPlaceImage(ctx, current).ok &&
      !row.problem.includes("duplicate_image")
    ) {
      avoidUrls.add(current);
      skipped++;
      continue;
    }

    let url = "";
    for (const preferCommons of [true, false]) {
      url = (await resolvePlaceImage({ ...ctx, preferCommons }, 960)) || "";
      if (
        url &&
        !isBadImageUrl(url) &&
        !avoidUrls.has(url) &&
        verifyPlaceImage(ctx, url).ok
      ) {
        break;
      }
      url = "";
    }

    if (!url) {
      console.log("FAIL", row.country, row.city, row.name);
      failed++;
      log.push({ id: row.id, name: row.name, ok: false });
      await sleep(5000);
      continue;
    }

    const { error } = await supabase
      .from("places")
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (error) {
      console.log("DB ERR", row.name, error.message);
      failed++;
      log.push({ id: row.id, name: row.name, ok: false });
      continue;
    }

    avoidUrls.add(url);
    fixed++;
    log.push({ id: row.id, name: row.name, ok: true, url });
    console.log("OK", row.country, "/", row.city, "/", row.name);
    await sleep(2500);
  }

  const out = join(process.cwd(), "data", "fix-audit-images-log.json");
  writeFileSync(out, JSON.stringify({ fixed, failed, skipped, log }, null, 2));
  console.log(`Done: ${fixed} fixed, ${failed} failed, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
