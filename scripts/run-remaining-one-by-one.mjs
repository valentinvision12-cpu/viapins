/**
 * Run remaining countries ONE AT A TIME (no parallel wiki calls).
 * Usage: node scripts/run-remaining-one-by-one.mjs
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const JOBS = [
  "Turkey.txt",
  "North Macedonia.txt",
  "Liechtenstein.txt",
  "Monaco.txt",
  "San Marino.txt",
  "United Kingdom.txt",
  "Latvia.txt",
];

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
  console.log(`\n$ ${cmd} ${args.join(" ")}\n`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
  return r.status ?? 1;
}

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NAMES = {
  Turkey: "Turkey",
  "North Macedonia": "North Macedonia",
  Liechtenstein: "Liechtenstein",
  Monaco: "Monaco",
  "San Marino": "San Marino",
  "United Kingdom": "United Kingdom",
  Latvia: "Latvia",
};

console.log("\n=== One-by-one remaining countries ===\n");

for (const file of JOBS) {
  const country = NAMES[file.replace(".txt", "")] || file.replace(".txt", "");
  console.log(`\n########## ${country} ##########\n`);

  if (file === "Turkey.txt") {
    if (run("node", ["scripts/ingest-phase1-file.mjs", "data/seeds/turkey-phase1-input.json", "turkey"]) !== 0) {
      console.error("Turkey ingest failed");
      continue;
    }
    if (run("npx", ["tsx", "scripts/import-country.ts", "turkey"]) !== 0) {
      console.error("Turkey import failed");
      continue;
    }
    run("npx", ["tsx", "scripts/fix-country-places.ts", "turkey"]);
    run("npx", ["tsx", "scripts/fix-city-covers.ts", "Turkey"]);
    run("npx", ["tsx", "scripts/count-places.ts", "Turkey"]);
    continue;
  }

  if (file === "United Kingdom.txt") {
    run("npx", ["tsx", "scripts/import-country.ts", "united-kingdom"]);
    run("npx", ["tsx", "scripts/fix-db-cleanup.ts"]);
    continue;
  }

  if (file === "Latvia.txt") {
    run("npx", ["tsx", "scripts/fix-db-cleanup.ts"]);
    run("npx", ["tsx", "scripts/count-places.ts", "Latvia"]);
    continue;
  }

  if (run("node", ["scripts/run-one-country.mjs", file]) !== 0) {
    console.error(`✗ ${country} failed — continuing\n`);
  }
}

console.log("\n=== Final counts ===\n");
for (const country of Object.values(NAMES)) {
  const { data } = await supabase.from("destinations").select("id").ilike("country", country);
  let n = 0;
  for (const d of data ?? []) {
    const { count } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", d.id);
    n += count ?? 0;
  }
  if (n > 0) console.log(`${n >= 100 && n <= 100 ? "✓" : "⚠"} ${country}: ${n}/100`);
}
console.log("");
