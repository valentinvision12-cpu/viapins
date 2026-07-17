/**
 * Refresh bad/missing place images across all uploaded countries.
 * Usage: node scripts/fix-bad-images-all.mjs
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SLUGS = [
  "spain", "latvia", "lithuania", "netherlands", "norway", "montenegro",
  "moldova", "kosovo", "poland", "portugal", "russia", "serbia", "turkey",
  "united-kingdom", "north-macedonia", "slovakia", "slovenia", "sweden",
  "switzerland", "ukraine", "liechtenstein", "malta", "monaco", "san-marino",
  "germany", "france", "italy", "greece", "austria", "croatia", "cyprus",
  "czech-republic", "bosnia-and-herzegovina", "bulgaria", "albania", "belarus",
  "andorra", "estonia", "hungary", "ireland",
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

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pending = [];
for (const slug of SLUGS) {
  const seedPath = join(ROOT, `data/seeds/${slug}.json`);
  if (!existsSync(seedPath)) continue;
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const { count } = await supabase
    .from("destinations")
    .select("id", { count: "exact", head: true })
    .ilike("country", seed.country);
  if ((count ?? 0) > 0) pending.push(slug);
}

console.log(`\n=== Fix bad images: ${pending.length} countries ===\n`);
for (const slug of pending) {
  console.log(`>>> ${slug}`);
  spawnSync("npx", ["tsx", "scripts/fix-country-places.ts", slug], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
}

console.log("\n=== Image fix complete ===\n");
