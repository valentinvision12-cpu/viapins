/**
 * Finish all Phase-1 countries from d:/Държави — 100/100 + fix gaps.
 * Usage: node scripts/finish-all-phase1.mjs
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PENDING_FIRST = [
  "United Kingdom.txt", "Turkey.txt", "Poland.txt", "Sweden.txt",
  "North Macedonia.txt", "San Marino.txt", "Malta.txt",
  "Liechtenstein.txt", "Monaco.txt",
];

const ALL_FILES = [
  ...PENDING_FIRST,
  "Latvia.txt", "Lithuania.txt",
  "Montenegro.txt", "Moldova.txt", "Netherlands.txt", "Norway.txt",
  "Portugal.txt", "Russia.txt", "Serbia.txt",
  "Slovakia.txt", "Slovenia.txt", "Switzerland.txt",
  "Ukraine.txt", "Valencia.txt",
].filter((f, i, a) => a.indexOf(f) === i);

const NAMES = {
  Latvia: "Latvia", Liechtenstein: "Liechtenstein", Lithuania: "Lithuania", Malta: "Malta",
  Monaco: "Monaco", Montenegro: "Montenegro", Moldova: "Moldova", Netherlands: "Netherlands",
  "North Macedonia": "North Macedonia", Norway: "Norway", Poland: "Poland", Portugal: "Portugal",
  Russia: "Russia", "San Marino": "San Marino", Serbia: "Serbia", Slovakia: "Slovakia",
  Slovenia: "Slovenia", Sweden: "Sweden", Switzerland: "Switzerland", Turkey: "Turkey",
  Ukraine: "Ukraine", "United Kingdom": "United Kingdom", Valencia: "Spain",
};

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

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1", ...env },
  });
  return r.status ?? 1;
}

async function dbTotal(supabase, country) {
  const { data } = await supabase.from("destinations").select("id").ilike("country", country);
  if (!data?.length) return 0;
  let n = 0;
  for (const d of data) {
    const { count } = await supabase.from("places").select("id", { count: "exact", head: true }).eq("destination_id", d.id);
    n += count ?? 0;
  }
  return n;
}

loadEnv();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("\n=== Phase 1: Build supplements ===\n");
run("node", ["scripts/build-poland-seed.mjs"]);
run("node", ["scripts/build-malta-seed.mjs"]);

console.log("\n=== Phase 2: Upload pending countries ===\n");
for (const file of ALL_FILES) {
  const country = NAMES[file.replace(".txt", "")];
  const db = await dbTotal(supabase, country);
  if (db >= 100 && country !== "Serbia" && country !== "Moldova") {
    console.log(`⏭ ${country} already ${db}/100`);
    continue;
  }
  console.log(`\n>>> ${country} (${db}/100)\n`);
  const seedPath = join(ROOT, `data/seeds/${file.replace(".txt", "").toLowerCase().replace(/ /g, "-")}.json`);
  // Slug from run-one-country MAP
  const slugMap = {
    "Valencia.txt": "spain", "United Kingdom.txt": "united-kingdom", "North Macedonia.txt": "north-macedonia",
    "San Marino.txt": "san-marino", "Liechtenstein.txt": "liechtenstein",
  };
  const slug = slugMap[file] || file.replace(".txt", "").toLowerCase();
  const seedFile = join(ROOT, `data/seeds/${slug}.json`);
  let seedTotal = 0;
  try {
    const seed = JSON.parse(readFileSync(seedFile, "utf8"));
    seedTotal = seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
  } catch {}
  const forceIngest = db < 100 && seedTotal < 100 ? "1" : "0";
  const status = run("node", ["scripts/run-one-country.mjs", file], { FORCE_INGEST: forceIngest });
  if (status !== 0) console.warn(`⚠ ${country} pipeline returned ${status}`);
  await new Promise((r) => setTimeout(r, 8000));
}

console.log("\n=== Phase 3: DB cleanup ===\n");
run("npx", ["tsx", "scripts/fix-db-cleanup.ts"]);

console.log("\n=== Phase 4: Re-fix all countries ===\n");
const slugs = [
  "latvia", "liechtenstein", "lithuania", "malta", "monaco", "montenegro", "moldova",
  "netherlands", "north-macedonia", "norway", "poland", "portugal", "russia", "san-marino",
  "serbia", "slovakia", "slovenia", "sweden", "switzerland", "turkey", "ukraine", "united-kingdom", "spain",
];
run("npx", ["tsx", "scripts/fix-country-places.ts", ...slugs]);

console.log("\n=== FINAL STATUS ===\n");
for (const file of ALL_FILES) {
  const country = NAMES[file.replace(".txt", "")];
  const total = await dbTotal(supabase, country);
  console.log(`${total >= 100 ? "✓" : "✗"} ${country}: ${total}/100`);
}
console.log("");
