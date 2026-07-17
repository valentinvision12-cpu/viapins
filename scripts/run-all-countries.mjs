/**
 * Full pipeline for all Phase-1 country files (ingest → vague fix → import → fix → verify).
 * Skips Moldova (already 100/100). Runs sequentially to respect wiki rate limits.
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const JOBS = [
  ["Valencia.txt", "spain", "Spain"],
  ["Latvia.txt", "latvia", "Latvia"],
  ["Liechtenstein.txt", "liechtenstein", "Liechtenstein"],
  ["Lithuania.txt", "lithuania", "Lithuania"],
  ["Malta.txt", "malta", "Malta"],
  ["Monaco.txt", "monaco", "Monaco"],
  ["Montenegro.txt", "montenegro", "Montenegro"],
  ["Netherlands.txt", "netherlands", "Netherlands"],
  ["North Macedonia.txt", "north-macedonia", "North Macedonia"],
  ["Norway.txt", "norway", "Norway"],
  ["Poland.txt", "poland", "Poland"],
  ["Portugal.txt", "portugal", "Portugal"],
  ["Russia.txt", "russia", "Russia"],
  ["San Marino.txt", "san-marino", "San Marino"],
  ["Serbia.txt", "serbia", "Serbia"],
  ["Slovakia.txt", "slovakia", "Slovakia"],
  ["Slovenia.txt", "slovenia", "Slovenia"],
  ["Sweden.txt", "sweden", "Sweden"],
  ["Switzerland.txt", "switzerland", "Switzerland"],
  ["Turkey.txt", "turkey", "Turkey"],
  ["Ukraine.txt", "ukraine", "Ukraine"],
  ["United Kingdom.txt", "united-kingdom", "United Kingdom"],
];

const SKIP = new Set(process.argv.includes("--all") ? [] : ["moldova"]);

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
  return r.status ?? 1;
}

const argFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const jobs = argFiles.length
  ? JOBS.filter(([f]) => argFiles.includes(f))
  : JOBS;

const results = [];

for (const [file, slug, country] of jobs) {
  if (SKIP.has(slug)) {
    console.log(`\n⏭ Skip ${country} (${slug}) — already complete\n`);
    continue;
  }
  const path = `d:/Държави/${file}`;
  if (!existsSync(path)) {
    console.warn(`Skip missing: ${path}`);
    results.push({ country, status: "missing" });
    continue;
  }

  console.log(`\n${"=".repeat(50)}\n  ${country} (${slug})\n${"=".repeat(50)}\n`);

  if (run("node", [`scripts/ingest-phase1-file.mjs`, path, slug]) !== 0) {
    results.push({ country, status: "ingest-fail" });
    continue;
  }
  const seedPath = join(ROOT, "data", "seeds", `${slug}.json`);
  try {
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const total = seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
    if (total < 100) {
      console.warn(`  ⚠ ${country}: seed ${total}/100 — skip import until complete`);
      results.push({ country, status: `seed-${total}` });
      continue;
    }
  } catch {
    results.push({ country, status: "seed-read-fail" });
    continue;
  }
  run("npx", ["tsx", "scripts/fix-vague-places.ts", slug]);
  if (run("npm", ["run", "import:country", "--", slug]) !== 0) {
    results.push({ country, status: "import-fail" });
    continue;
  }
  run("npx", ["tsx", "scripts/fix-country-places.ts", slug]);
  run("npx", ["tsx", "scripts/count-places.ts", country]);
  results.push({ country, status: "done" });
}

console.log("\n\n=== SUMMARY ===");
for (const r of results) console.log(`  ${r.status === "done" ? "✓" : "✗"} ${r.country}: ${r.status}`);
console.log("\n✓ All countries processed\n");
