/**
 * Parallel country ingest — spawns one process per country file.
 * Usage: node scripts/parallel-ingest-countries.mjs Moldova.txt Norway.txt Latvia.txt
 */
import { spawn } from "child_process";
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

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => f.replace(/^.*[\\/]/, ""))
  : ["Moldova.txt", "Norway.txt", "Latvia.txt", "Montenegro.txt", "Netherlands.txt"];

function runCountry(f) {
  const path = `d:/Държави/${f}`;
  const slug = FILE_TO_SLUG[f];
  if (!existsSync(path) || !slug) {
    console.warn(`Skip: ${f}`);
    return null;
  }
  const script = `
    cd "${ROOT.replace(/\\/g, "/")}" &&
    node scripts/ingest-phase1-file.mjs "${path}" ${slug} &&
    npx tsx scripts/fix-vague-places.ts ${slug} &&
    npm run import:country -- ${slug} &&
    npx tsx scripts/fix-country-places.ts ${slug} &&
    npx tsx scripts/count-places.ts "${f.replace(".txt", "") === "Valencia" ? "Spain" : f.replace(".txt", "")}"
  `;
  const child = spawn(script, { shell: true, stdio: "inherit" });
  child.on("close", (code) => {
    console.log(`\\n[${slug}] finished exit=${code}\\n`);
  });
  return child;
}

console.log(`Starting ${files.length} parallel ingest jobs…`);
for (const f of files) runCountry(f);
