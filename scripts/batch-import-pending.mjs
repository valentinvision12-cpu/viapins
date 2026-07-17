/**
 * Import all pending countries sequentially (avoids wiki 429 / spawn races).
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const JOBS = [
  ["poland", "Poland"],
  ["sweden", "Sweden"],
  ["malta", "Malta"],
  ["north-macedonia", "North Macedonia"],
  ["liechtenstein", "Liechtenstein"],
  ["monaco", "Monaco"],
  ["san-marino", "San Marino"],
  ["turkey", "Turkey"],
  ["united-kingdom", "United Kingdom"],
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
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
  return r.status ?? 1;
}

function seedTotal(slug) {
  try {
    const seed = JSON.parse(readFileSync(join(ROOT, `data/seeds/${slug}.json`), "utf8"));
    return seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
  } catch {
    return 0;
  }
}

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("\n=== Batch import pending countries ===\n");

for (const [slug, country] of JOBS) {
  const total = seedTotal(slug);
  if (total < 50) {
    console.log(`⏭ ${country}: seed ${total}/100 — skip\n`);
    continue;
  }

  const { data } = await supabase.from("destinations").select("id").ilike("country", country);
  let dbTotal = 0;
  for (const d of data ?? []) {
    const { count } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", d.id);
    dbTotal += count ?? 0;
  }
  if (dbTotal >= 100) {
    console.log(`✓ ${country}: already ${dbTotal}/100\n`);
    continue;
  }

  console.log(`\n>>> ${country} (seed ${total}, db ${dbTotal})\n`);
  run("npx", ["tsx", "scripts/fix-vague-places.ts", slug]);
  if (run("npx", ["tsx", "scripts/import-country.ts", slug]) !== 0) {
    console.error(`✗ import failed: ${country}\n`);
    continue;
  }
  run("npx", ["tsx", "scripts/fix-country-places.ts", slug]);
  run("npx", ["tsx", "scripts/fix-city-covers.ts", country]);
  run("npx", ["tsx", "scripts/count-places.ts", country]);
}

console.log("\n=== Final summary ===\n");
for (const [, country] of JOBS) {
  const { data } = await supabase.from("destinations").select("id").ilike("country", country);
  let n = 0;
  for (const d of data ?? []) {
    const { count } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", d.id);
    n += count ?? 0;
  }
  console.log(`${n >= 100 ? "✓" : "✗"} ${country}: ${n}/100`);
}
console.log("");
