/**
 * Full pipeline for ONE country — ingest → vague fix → import → fix → verify.
 * Usage: node scripts/run-one-country.mjs Liechtenstein.txt
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MAP = {
  "Valencia.txt": ["spain", "Spain"],
  "Latvia.txt": ["latvia", "Latvia"],
  "Liechtenstein.txt": ["liechtenstein", "Liechtenstein"],
  "Lithuania.txt": ["lithuania", "Lithuania"],
  "Malta.txt": ["malta", "Malta"],
  "Monaco.txt": ["monaco", "Monaco"],
  "Montenegro.txt": ["montenegro", "Montenegro"],
  "Moldova.txt": ["moldova", "Moldova"],
  "Netherlands.txt": ["netherlands", "Netherlands"],
  "North Macedonia.txt": ["north-macedonia", "North Macedonia"],
  "Norway.txt": ["norway", "Norway"],
  "Poland.txt": ["poland", "Poland"],
  "Portugal.txt": ["portugal", "Portugal"],
  "Russia.txt": ["russia", "Russia"],
  "San Marino.txt": ["san-marino", "San Marino"],
  "Serbia.txt": ["serbia", "Serbia"],
  "Slovakia.txt": ["slovakia", "Slovakia"],
  "Slovenia.txt": ["slovenia", "Slovenia"],
  "Sweden.txt": ["sweden", "Sweden"],
  "Switzerland.txt": ["switzerland", "Switzerland"],
  "Turkey.txt": ["turkey", "Turkey"],
  "Ukraine.txt": ["ukraine", "Ukraine"],
  "United Kingdom.txt": ["united-kingdom", "United Kingdom"],
};

function resolveJob() {
  const raw = process.argv.slice(2).join(" ").trim().replace(/^.*[\\/]/, "");
  if (!raw) return null;
  if (MAP[raw]) return { file: raw, slug: MAP[raw][0], country: MAP[raw][1] };
  const lower = raw.toLowerCase();
  const bySlug = Object.entries(MAP).find(([, [s]]) => s === lower);
  if (bySlug) return { file: bySlug[0], slug: bySlug[1][0], country: bySlug[1][1] };
  const byName = Object.entries(MAP).find(([, [, c]]) => c.toLowerCase() === lower);
  if (byName) return { file: byName[0], slug: byName[1][0], country: byName[1][1] };
  return null;
}

const job = resolveJob();
if (!job) {
  console.error("Usage: node scripts/run-one-country.mjs Liechtenstein.txt | united-kingdom");
  process.exit(1);
}

const { file, slug, country } = job;
const path = `d:/Държави/${file}`;
const seedPath = join(ROOT, `data/seeds/${slug}.json`);

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
  return r.status ?? 1;
}

function seedTotal() {
  try {
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const total = seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
    return total;
  } catch {
    return 0;
  }
}

console.log(`\n=== ${country} (${slug}) ===\n`);
if (!existsSync(path)) {
  console.error(`Missing: ${path}`);
  process.exit(1);
}

let total = seedTotal();
const forceIngest = process.env.FORCE_INGEST === "1";

if (total >= 100 && !forceIngest) {
  console.log(`⏭ Seed ${total}/100 — skipping ingest\n`);
} else {
  if (run("node", [`scripts/ingest-phase1-file.mjs`, path, slug]) !== 0) process.exit(1);
  total = seedTotal();
  if (total < 10) {
    console.error(`\n✗ Seed ${total}/100 — too few places, ingest failed\n`);
    process.exit(1);
  }
  if (total < 100) {
    console.warn(`\n⚠ Seed ${total}/100 — importing + fix will fill gaps\n`);
  }
}

run("npx", ["tsx", "scripts/fix-vague-places.ts", slug]);
if (run("npx", ["tsx", "scripts/import-country.ts", slug]) !== 0) process.exit(1);
if (process.env.SKIP_FIX_PLACES !== "1") {
  run("npx", ["tsx", "scripts/fix-country-places.ts", slug]);
}
run("npx", ["tsx", "scripts/fix-city-covers.ts", country]);
run("npx", ["tsx", "scripts/count-places.ts", country]);
console.log(`\n✓ ${country} done\n`);
