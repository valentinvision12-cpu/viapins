/**
 * Sitewide repair of fragile Wikimedia upload URLs to live Commons thumbs.
 *
 * Usage:
 *   npx tsx scripts/repair-wikimedia-urls-sitewide.ts --dry-run --limit=30
 *   npx tsx scripts/repair-wikimedia-urls-sitewide.ts --write
 *   npx tsx scripts/repair-wikimedia-urls-sitewide.ts --all-wikimedia
 *
 * Default: write to DB (unless --dry-run).
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  isFragileWikimediaUrl,
  repairWikimediaUrl,
} from "../src/lib/wiki-image";

const ROOT = process.cwd();
const SUMMARY_PATH = join(ROOT, "data", "repair-wikimedia-summary.json");
const CONCURRENCY = 4;
const BURST_DELAY_MS = 200;
const PAGE_SIZE = 200;

function loadEnvLocal() {
  const envPath = join(ROOT, ".env.local");
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

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const write = argv.includes("--write") || !dryRun;
  const allWikimedia = argv.includes("--all-wikimedia");
  let limit: number | null = null;
  for (const a of argv) {
    if (a.startsWith("--limit=")) {
      const n = Number(a.slice("--limit=".length));
      if (Number.isFinite(n) && n > 0) limit = Math.floor(n);
    }
  }
  return { dryRun, write: dryRun ? false : write, allWikimedia, limit };
}

type Row = { id: string; url: string; kind: "place" | "destination" };

async function pagePlaces(
  supabase: ReturnType<typeof createClient>,
  limit: number | null
): Promise<Row[]> {
  const out: Row[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("places")
      .select("id, image_url")
      .ilike("image_url", "%upload.wikimedia.org%")
      .range(from, to);
    if (error) throw new Error(`places page ${from}: ${error.message}`);
    const rows = data ?? [];
    for (const r of rows) {
      const url = (r.image_url as string) || "";
      if (!url) continue;
      out.push({ id: r.id as string, url, kind: "place" });
      if (limit != null && out.length >= limit) return out;
    }
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

async function pageDestinations(
  supabase: ReturnType<typeof createClient>,
  limit: number | null,
  already: number
): Promise<Row[]> {
  const out: Row[] = [];
  let from = 0;
  while (true) {
    if (limit != null && already + out.length >= limit) break;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("destinations")
      .select("id, cover_image")
      .ilike("cover_image", "%upload.wikimedia.org%")
      .range(from, to);
    if (error) throw new Error(`destinations page ${from}: ${error.message}`);
    const rows = data ?? [];
    for (const r of rows) {
      const url = (r.cover_image as string) || "";
      if (!url) continue;
      out.push({ id: r.id as string, url, kind: "destination" });
      if (limit != null && already + out.length >= limit) return out;
    }
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const args = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log(
    `\n=== Repair Wikimedia URLs sitewide ===` +
      `\n  dryRun=${args.dryRun} write=${args.write} allWikimedia=${args.allWikimedia} limit=${args.limit ?? "none"}\n`
  );

  // Collect candidates. When limit is set, fill places first then destinations.
  let places = await pagePlaces(supabase, args.limit);
  let destinations: Row[] = [];
  if (args.limit == null || places.length < args.limit) {
    destinations = await pageDestinations(
      supabase,
      args.limit,
      places.length
    );
  }
  const candidates = [...places, ...destinations];

  const summary = {
    startedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    write: args.write,
    allWikimedia: args.allWikimedia,
    limit: args.limit,
    checked: 0,
    repaired: 0,
    failed: 0,
    unchanged: 0,
    skippedNonFragile: 0,
    placesChecked: 0,
    destinationsChecked: 0,
    samples: [] as Array<{
      kind: string;
      id: string;
      from: string;
      to: string;
      status: string;
    }>,
  };

  // Process in bursts of CONCURRENCY with delay between bursts
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    await mapPool(batch, CONCURRENCY, async (row) => {
      summary.checked++;
      if (row.kind === "place") summary.placesChecked++;
      else summary.destinationsChecked++;

      const shouldRepair =
        args.allWikimedia || isFragileWikimediaUrl(row.url);
      if (!shouldRepair) {
        summary.skippedNonFragile++;
        summary.unchanged++;
        return;
      }

      let repaired = "";
      try {
        repaired = await repairWikimediaUrl(row.url, 1280);
      } catch (err) {
        summary.failed++;
        if (summary.samples.length < 40) {
          summary.samples.push({
            kind: row.kind,
            id: row.id,
            from: row.url,
            to: "",
            status: `error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
        return;
      }

      if (!repaired) {
        // Dead Commons original — clear so UI never serves a 404 cover.
        if (args.write) {
          if (row.kind === "place") {
            const { error } = await supabase
              .from("places")
              .update({ image_url: "" })
              .eq("id", row.id);
            if (error) {
              summary.failed++;
              if (summary.samples.length < 40) {
                summary.samples.push({
                  kind: row.kind,
                  id: row.id,
                  from: row.url,
                  to: "",
                  status: `clear_db_error: ${error.message}`,
                });
              }
              return;
            }
          } else {
            const { error } = await supabase
              .from("destinations")
              .update({ cover_image: "" })
              .eq("id", row.id);
            if (error) {
              summary.failed++;
              if (summary.samples.length < 40) {
                summary.samples.push({
                  kind: row.kind,
                  id: row.id,
                  from: row.url,
                  to: "",
                  status: `clear_db_error: ${error.message}`,
                });
              }
              return;
            }
          }
          summary.repaired++;
          if (summary.samples.length < 40) {
            summary.samples.push({
              kind: row.kind,
              id: row.id,
              from: row.url,
              to: "",
              status: "cleared_dead",
            });
          }
          return;
        }
        summary.failed++;
        if (summary.samples.length < 40) {
          summary.samples.push({
            kind: row.kind,
            id: row.id,
            from: row.url,
            to: "",
            status: "failed_empty",
          });
        }
        return;
      }

      if (repaired === row.url) {
        summary.unchanged++;
        return;
      }

      if (args.write) {
        if (row.kind === "place") {
          const { error } = await supabase
            .from("places")
            .update({ image_url: repaired })
            .eq("id", row.id);
          if (error) {
            summary.failed++;
            if (summary.samples.length < 40) {
              summary.samples.push({
                kind: row.kind,
                id: row.id,
                from: row.url,
                to: repaired,
                status: `db_error: ${error.message}`,
              });
            }
            return;
          }
        } else {
          const { error } = await supabase
            .from("destinations")
            .update({ cover_image: repaired })
            .eq("id", row.id);
          if (error) {
            summary.failed++;
            if (summary.samples.length < 40) {
              summary.samples.push({
                kind: row.kind,
                id: row.id,
                from: row.url,
                to: repaired,
                status: `db_error: ${error.message}`,
              });
            }
            return;
          }
        }
      }

      summary.repaired++;
      if (summary.samples.length < 40) {
        summary.samples.push({
          kind: row.kind,
          id: row.id,
          from: row.url,
          to: repaired,
          status: args.write ? "repaired" : "would_repair",
        });
      }
      console.log(
        `  [${row.kind}] ${row.id.slice(0, 8)}… ${args.write ? "FIXED" : "DRY"}`
      );
    });
    if (i + CONCURRENCY < candidates.length) {
      await sleep(BURST_DELAY_MS);
    }
  }

  const finished = {
    ...summary,
    finishedAt: new Date().toISOString(),
    candidates: candidates.length,
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(finished, null, 2), "utf8");

  console.log(`\n=== Summary ===`);
  console.log(`  candidates: ${candidates.length}`);
  console.log(`  checked: ${summary.checked}`);
  console.log(`  repaired: ${summary.repaired}`);
  console.log(`  failed: ${summary.failed}`);
  console.log(`  unchanged: ${summary.unchanged}`);
  console.log(`  skippedNonFragile: ${summary.skippedNonFragile}`);
  console.log(`  wrote: ${SUMMARY_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});