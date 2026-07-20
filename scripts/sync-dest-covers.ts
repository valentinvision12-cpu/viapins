/**
 * Sync destination.cover_image to first good unique place thumb for selected countries.
 * Usage: npx tsx scripts/sync-dest-covers.ts luxembourg sweden ... [--write-seed]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl } from "../src/lib/wiki-image";

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

async function urlAlive(url: string): Promise<boolean> {
  if (!url?.trim() || isBadImageUrl(url)) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "ViaPins/1.0 (https://viapins.com)",
        Range: "bytes=0-2047",
        Accept: "image/*,*/*",
      },
    });
    clearTimeout(t);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return (res.ok || res.status === 206) && ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const argv = process.argv.slice(2);
  const writeSeed = argv.includes("--write-seed");
  const slugs = argv.filter((a) => !a.startsWith("--"));
  if (!slugs.length) {
    console.error("Usage: npx tsx scripts/sync-dest-covers.ts luxembourg ... [--write-seed]");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.error(`Missing seed ${seedPath}`);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    console.log(`\n=== Sync covers: ${country} ===`);

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city as string;
      const { data: dest } = await supabase
        .from("destinations")
        .select("id, cover_image")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();
      if (!dest) {
        console.log(`  skip (no dest): ${city}`);
        skipped++;
        continue;
      }

      const { data: places } = await supabase
        .from("places")
        .select("id, name, image_url, order_index")
        .eq("destination_id", dest.id)
        .order("order_index");

      let cover: string | null = null;
      for (const p of places ?? []) {
        const url = p.image_url?.trim() ?? "";
        if (!url || isBadImageUrl(url)) continue;
        if (!(await urlAlive(url))) continue;
        cover = url;
        break;
      }

      if (!cover) {
        console.log(`  ${city}: no good place image`);
        failed++;
        continue;
      }

      if (dest.cover_image === cover) {
        console.log(`  ${city}: already ok`);
        skipped++;
        continue;
      }

      const { error } = await supabase
        .from("destinations")
        .update({ cover_image: cover, updated_at: new Date().toISOString() })
        .eq("id", dest.id);
      if (error) {
        console.log(`  ${city}: DB error ${error.message}`);
        failed++;
        continue;
      }

      if (citySeed && typeof citySeed === "object") {
        (citySeed as { cover_image?: string }).cover_image = cover;
      }
      console.log(`  ${city}: -> ${cover.slice(0, 90)}`);
      updated++;
    }

    if (writeSeed) {
      writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
      console.log(`Wrote seed: ${seedPath}`);
    }
  }

  console.log(`\nCovers: updated ${updated}, skipped ${skipped}, failed ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});