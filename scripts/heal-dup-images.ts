/**
 * Deduplicate place images within each city for selected country seeds.
 * Re-resolves shared/empty/bad image_url via resolvePlaceImage with avoidUrls.
 *
 * Usage: npx tsx scripts/heal-dup-images.ts [--write-seed] [slug...]
 * Default slugs: luxembourg sweden slovakia montenegro denmark
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

function preferThumb(url: string): string {
  // Prefer Wikimedia thumb URLs when possible (already sized by resolvePlaceImage).
  return url?.trim() ?? "";
}

type Report = {
  country: string;
  checked: number;
  dupsFixed: number;
  failed: number;
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
    checked: 0,
    dupsFixed: 0,
    failed: 0,
    remaining: [],
  };

  console.log(`\n=== Dedup images: ${country} ===`);

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

    const usedUrls = new Set<string>();
    const needsFix = new Map<string, string>(); // id -> reason

    for (const p of places ?? []) {
      report.checked++;
      const current = preferThumb(p.image_url ?? "");
      if (!current || isBadImageUrl(current)) {
        needsFix.set(p.id, "empty/bad");
        continue;
      }
      const alive = await urlAlive(current);
      if (!alive) {
        needsFix.set(p.id, "dead");
        continue;
      }
      if (usedUrls.has(current)) {
        needsFix.set(p.id, "duplicate");
        continue;
      }
      usedUrls.add(current);
    }

    for (const p of places ?? []) {
      const reason = needsFix.get(p.id);
      if (!reason) {
        process.stdout.write(".");
        continue;
      }

      const current = p.image_url?.trim() ?? "";
      console.log(`\n  [${reason}] ${p.name}`);
      console.log(`    was: ${current.slice(0, 100) || "(empty)"}`);

      const seedPlace = seedByName.get(p.name.toLowerCase()) as
        | { wiki_title?: string; commons_file?: string; image_url?: string }
        | undefined;
      const en = (p.translations as Record<string, { wiki_title?: string; maps_query?: string }>)?.en;

      if (dryRun) {
        report.failed++;
        report.remaining.push(`${city}/${p.name}`);
        continue;
      }

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
          avoidUrls: usedUrls,
        },
        960
      );

      const candidate = preferThumb(newUrl ?? "");
      if (!candidate || usedUrls.has(candidate) || !(await urlAlive(candidate))) {
        if (reason === "duplicate" && current) {
          const { error } = await supabase
            .from("places")
            .update({ image_url: "", updated_at: new Date().toISOString() })
            .eq("id", p.id);
          if (!error) {
            if (seedPlace) seedPlace.image_url = "";
            console.log(`    -> cleared (no unique replacement)`);
          } else {
            console.log(`    -> DB error: ${error.message}`);
          }
        } else {
          console.log(`    -> no working unique replacement`);
        }
        report.failed++;
        report.remaining.push(`${city}/${p.name}`);
        continue;
      }

      const { error } = await supabase
        .from("places")
        .update({ image_url: candidate, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) {
        console.log(`    -> DB error: ${error.message}`);
        report.failed++;
        report.remaining.push(`${city}/${p.name}`);
        continue;
      }

      if (seedPlace) seedPlace.image_url = candidate;
      usedUrls.add(candidate);
      console.log(`    -> fixed: ${candidate.slice(0, 100)}`);
      report.dupsFixed++;
    }
    console.log("");
  }

  if (writeSeed && !dryRun) {
    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
    console.log(`Wrote seed: ${seedPath}`);
  }

  console.log(
    `\n${country}: checked ${report.checked}, dupsFixed ${report.dupsFixed}, failed ${report.failed}`
  );
  return report;
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";
  process.env.WIKI_DELAY_MS = process.env.WIKI_DELAY_MS || "400";

  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const writeSeed = argv.includes("--write-seed");
  const slugs = argv.filter((a) => !a.startsWith("--"));
  const targets =
    slugs.length > 0
      ? slugs
      : ["luxembourg", "sweden", "slovakia", "montenegro", "denmark"];

  const reports: Report[] = [];
  for (const slug of targets) {
    reports.push(await healSlug(slug, dryRun, writeSeed));
  }

  const out = join(process.cwd(), "data", "heal-dup-images-report.json");
  writeFileSync(out, JSON.stringify(reports, null, 2) + "\n", "utf8");
  console.log(`\nReport: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});