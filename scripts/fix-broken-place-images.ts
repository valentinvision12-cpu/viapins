/**
 * Re-resolve place images whose URLs return non-200 (404/400/etc).
 * Usage: npx tsx scripts/fix-broken-place-images.ts latvia
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";

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
  if (url.includes("commons.wikimedia.org/wiki/Special:FilePath")) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    // Prefer GET+Range: Wikimedia HEAD is unreliable and 404 HTML can confuse caches.
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
    if (!(res.ok || res.status === 206)) return false;
    if (!ct.startsWith("image/")) return false;
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";
  process.env.WIKI_DELAY_MS = process.env.WIKI_DELAY_MS || "400";

  const slug = process.argv[2]?.toLowerCase().replace(/\.json$/, "");
  const dryRun = process.argv.includes("--dry-run");
  const writeSeed = process.argv.includes("--write-seed");
  if (!slug) {
    console.error("Usage: npx tsx scripts/fix-broken-place-images.ts latvia [--dry-run] [--write-seed]");
    process.exit(1);
  }

  const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
  if (!existsSync(seedPath)) {
    console.error(`Missing seed: ${seedPath}`);
    process.exit(1);
  }

  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const country = seed.country as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let checked = 0;
  let broken = 0;
  let fixed = 0;
  let failed = 0;

  console.log(`\n=== Fix broken images: ${country} ===\n`);

  for (const citySeed of seed.cities ?? []) {
    const city = citySeed.city as string;
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
      .select("id, name, image_url, lat, lng, translations, order_index")
      .eq("destination_id", dest.id)
      .order("order_index");

    const seedByName = new Map(
      (citySeed.places ?? []).map((sp: { name: string }) => [sp.name.toLowerCase(), sp])
    );

    console.log(`\n-- ${city} --`);

    for (const p of places ?? []) {
      checked++;
      const current = p.image_url?.trim() ?? "";
      const alive = await urlAlive(current);
      if (alive) {
        process.stdout.write(".");
        continue;
      }
      broken++;
      console.log(`\n  [broken] ${p.name}`);
      console.log(`    was: ${current.slice(0, 100) || "(empty)"}`);

      const seedPlace = seedByName.get(p.name.toLowerCase()) as
        | { wiki_title?: string; commons_file?: string; image_url?: string }
        | undefined;
      const en = (p.translations as Record<string, { wiki_title?: string; maps_query?: string }>)?.en;

      if (dryRun) continue;

      await sleep(350);
      const newUrl = await resolvePlaceImage(
        {
          placeName: p.name,
          wikiTitle: seedPlace?.wiki_title || en?.wiki_title || p.name,
          city,
          country,
          lat: p.lat ?? undefined,
          lng: p.lng ?? undefined,
          mapsQuery: en?.maps_query,
          commonsFile: seedPlace?.commons_file,
          preferCommons: true,
        },
        960
      );

      if (!newUrl || !(await urlAlive(newUrl))) {
        console.log(`    -> no working replacement`);
        failed++;
        continue;
      }

      const { error } = await supabase
        .from("places")
        .update({ image_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) {
        console.log(`    -> DB error: ${error.message}`);
        failed++;
        continue;
      }

      if (seedPlace) seedPlace.image_url = newUrl;
      console.log(`    -> fixed: ${newUrl.slice(0, 100)}`);
      fixed++;
    }
    console.log("");
  }

  if (writeSeed && !dryRun) {
    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
    console.log(`\nWrote updated seed: ${seedPath}`);
  }

  console.log(
    `\nChecked: ${checked}, broken: ${broken}, fixed: ${fixed}, failed: ${failed}${dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
