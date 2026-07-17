/**
 * Retry failed Phase-1 uploads after script fixes.
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const RETRY = [
  "United Kingdom.txt", "Turkey.txt", "Poland.txt", "Sweden.txt",
  "North Macedonia.txt", "San Marino.txt", "Malta.txt",
  "Liechtenstein.txt", "Monaco.txt", "Moldova.txt", "Serbia.txt",
];

const NAMES = {
  "United Kingdom": "United Kingdom", Turkey: "Turkey", Poland: "Poland", Sweden: "Sweden",
  "North Macedonia": "North Macedonia", "San Marino": "San Marino", Malta: "Malta",
  Liechtenstein: "Liechtenstein", Monaco: "Monaco", Moldova: "Moldova", Serbia: "Serbia",
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

loadEnv();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("\n=== Build supplements ===\n");
run("node", ["scripts/build-poland-seed.mjs"]);
run("node", ["scripts/build-malta-seed.mjs"]);

console.log("\n=== Retry failed countries ===\n");
for (const file of RETRY) {
  const country = NAMES[file.replace(".txt", "")];
  console.log(`\n>>> ${country}\n`);
  run("node", ["scripts/run-one-country.mjs", file], { FORCE_INGEST: "0" });
}

console.log("\n=== DB cleanup ===\n");
run("npx", ["tsx", "scripts/fix-db-cleanup.ts"]);

console.log("\n=== Final counts ===\n");
for (const file of RETRY) {
  const country = NAMES[file.replace(".txt", "")];
  const { data } = await supabase.from("destinations").select("id").ilike("country", country);
  let n = 0;
  for (const d of data ?? []) {
    const { count } = await supabase.from("places").select("id", { count: "exact", head: true }).eq("destination_id", d.id);
    n += count ?? 0;
  }
  console.log(`${n >= 100 ? "✓" : "✗"} ${country}: ${n}/100`);
}
console.log("");
