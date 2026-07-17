#!/usr/bin/env node
/**
 * Generate one country + convert to travel seed.
 * Usage: node scripts/generate-country.mjs Q225 bosnia-and-herzegovina
 *        node scripts/generate-country.mjs Q225   (slug auto from output)
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const countryId = process.argv[2] || "Q225";
let slug = process.argv[3];

console.log(`\n▶ Generating ${countryId}...\n`);

const gen = spawnSync(
  "node",
  ["run_all.js"],
  {
    cwd: join(ROOT, "data-generator"),
    env: {
      ...process.env,
      COUNTRY_IDS: countryId,
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
    },
    stdio: "inherit",
    shell: true,
  }
);

if (gen.status !== 0) process.exit(gen.status ?? 1);

const europePath = join(ROOT, "data-generator", "output", "europe.json");
if (!existsSync(europePath)) {
  console.error("Missing europe.json");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(europePath, "utf8"));
const country = raw.countries?.[0];
if (!country) {
  console.error("No country in output");
  process.exit(1);
}

if (!slug) slug = slugify(country.country);
console.log(`\n▶ Converting → data/seeds/${slug}.json\n`);

const conv = spawnSync(
  "node",
  ["scripts/convert-europe-to-seed.mjs", slug],
  { cwd: ROOT, stdio: "inherit", shell: true }
);

if (conv.status !== 0) process.exit(conv.status ?? 1);

console.log(`\n✓ Done: ${country.country} → data/seeds/${slug}.json`);
console.log(`  Import: npm run import:country -- ${slug}\n`);
