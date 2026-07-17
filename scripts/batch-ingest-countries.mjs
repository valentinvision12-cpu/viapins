/**
 * Batch: ingest → import → fix → verify for country txt files.
 * Usage: node scripts/batch-ingest-countries.mjs Latvia.txt ...
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FILE_TO_SLUG = {
  "Valencia.txt": "spain",
  "Latvia.txt": "latvia",
  "Liechtenstein.txt": "liechtenstein",
  "Lithuania.txt": "lithuania",
  "Malta.txt": "malta",
  "Moldova.txt": "moldova",
  "Monaco.txt": "monaco",
  "Montenegro.txt": "montenegro",
  "Netherlands.txt": "netherlands",
  "North Macedonia.txt": "north-macedonia",
  "Norway.txt": "norway",
  "Poland.txt": "poland",
  "Portugal.txt": "portugal",
  "Russia.txt": "russia",
  "San Marino.txt": "san-marino",
  "Serbia.txt": "serbia",
  "Slovakia.txt": "slovakia",
  "Slovenia.txt": "slovenia",
  "Sweden.txt": "sweden",
  "Switzerland.txt": "switzerland",
  "Turkey.txt": "turkey",
  "Ukraine.txt": "ukraine",
  "United Kingdom.txt": "united-kingdom",
};

const FILE_TO_COUNTRY = {
  "Valencia.txt": "Spain",
  "Latvia.txt": "Latvia",
  "Liechtenstein.txt": "Liechtenstein",
  "Lithuania.txt": "Lithuania",
  "Malta.txt": "Malta",
  "Moldova.txt": "Moldova",
  "Monaco.txt": "Monaco",
  "Montenegro.txt": "Montenegro",
  "Netherlands.txt": "Netherlands",
  "North Macedonia.txt": "North Macedonia",
  "Norway.txt": "Norway",
  "Poland.txt": "Poland",
  "Portugal.txt": "Portugal",
  "Russia.txt": "Russia",
  "San Marino.txt": "San Marino",
  "Serbia.txt": "Serbia",
  "Slovakia.txt": "Slovakia",
  "Slovenia.txt": "Slovenia",
  "Sweden.txt": "Sweden",
  "Switzerland.txt": "Switzerland",
  "Turkey.txt": "Turkey",
  "Ukraine.txt": "Ukraine",
  "United Kingdom.txt": "United Kingdom",
};

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => f.replace(/^.*[\\/]/, ""))
  : Object.keys(FILE_TO_SLUG);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true });
  return r.status ?? 1;
}

for (const f of files) {
  const path = `d:/Държави/${f}`;
  if (!existsSync(path)) {
    console.warn(`Skip missing: ${path}`);
    continue;
  }
  const slug = FILE_TO_SLUG[f];
  const country = FILE_TO_COUNTRY[f];
  if (!slug) {
    console.warn(`Skip unknown file: ${f}`);
    continue;
  }
  console.log(`\n========== ${country} (${slug}) ==========\n`);
  if (run("node", [`scripts/ingest-phase1-file.mjs`, path, slug]) !== 0) continue;
  run("npx", ["tsx", "scripts/fix-vague-places.ts", slug]);
  if (run("npm", ["run", "import:country", "--", slug]) !== 0) continue;
  run("npx", ["tsx", "scripts/fix-country-places.ts", slug]);
  run("npx", ["tsx", "scripts/count-places.ts", country]);
}

console.log("\n✓ Batch complete");
