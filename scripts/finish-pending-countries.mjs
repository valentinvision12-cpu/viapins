/**
 * Retry until all Phase-1 countries are 100/100 in DB.
 * Usage: node scripts/finish-pending-countries.mjs
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

const DONE = new Set(["moldova", "kosovo"]);

function loadEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function run(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  }).status ?? 1;
}

async function dbTotal(supabase, country) {
  const { data: dests } = await supabase
    .from("destinations")
    .select("id, city")
    .ilike("country", country);
  if (!dests?.length) return { total: 0, cities: 0, detail: [] };
  let total = 0;
  const detail = [];
  for (const d of dests) {
    const { count } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", d.id);
    const c = count ?? 0;
    total += c;
    detail.push(`${d.city}:${c}`);
  }
  return { total, cities: dests.length, detail };
}

async function pipeline(file, slug, country) {
  const path = `d:/Държави/${file}`;
  if (!existsSync(path)) return false;
  console.log(`\n>>> ${country} (${slug})`);
  if (run("node", [`scripts/ingest-phase1-file.mjs`, path, slug]) !== 0) return false;
  const seedPath = join(ROOT, "data/seeds", `${slug}.json`);
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const seedTotal = seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
  if (seedTotal < 100) {
    console.warn(`  seed ${seedTotal}/100 — retry ingest later`);
    return false;
  }
  run("npx", ["tsx", "scripts/fix-vague-places.ts", slug]);
  if (run("npm", ["run", "import:country", "--", slug]) !== 0) return false;
  run("npx", ["tsx", "scripts/fix-country-places.ts", slug]);
  run("npx", ["tsx", "scripts/count-places.ts", country]);
  return true;
}

loadEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let round = 0;
while (round < 8) {
  round++;
  console.log(`\n========== ROUND ${round} ==========\n`);
  let pending = 0;

  for (const [file, slug, country] of JOBS) {
    if (DONE.has(slug)) continue;
    const { total, cities } = await dbTotal(supabase, country);
    if (total >= 100 && cities >= 10) {
      console.log(`✓ ${country}: ${total}/100`);
      continue;
    }
    pending++;
    console.log(`⏳ ${country}: ${total}/100 (${cities} cities)`);
    await pipeline(file, slug, country);
    await new Promise((r) => setTimeout(r, 5000));
  }

  if (pending === 0) {
    console.log("\n✓ ALL COUNTRIES 100/100\n");
    break;
  }
  console.log(`\n${pending} pending — wait 60s before retry round…\n`);
  await new Promise((r) => setTimeout(r, 60000));
}

console.log("\n=== FINAL COUNTS ===");
for (const [, slug, country] of JOBS) {
  if (DONE.has(slug)) continue;
  const { total } = await dbTotal(supabase, country);
  console.log(`  ${total >= 100 ? "✓" : "✗"} ${country}: ${total}/100`);
}
