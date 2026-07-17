/**
 * One country at a time — no parallel wiki calls.
 * Skips countries already at 100/100 in DB.
 * Priority: almost-done → ready seed → rest → microstates last.
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const QUEUE = [
  "Montenegro.txt", "Portugal.txt", "Poland.txt", "Russia.txt",
  "North Macedonia.txt", "Serbia.txt", "Turkey.txt", "United Kingdom.txt",
  "San Marino.txt", "Slovakia.txt", "Slovenia.txt", "Sweden.txt",
  "Switzerland.txt", "Ukraine.txt",
  "Liechtenstein.txt", "Lithuania.txt", "Malta.txt", "Monaco.txt",
  "Netherlands.txt", "Norway.txt",
];

const NAMES = {
  Liechtenstein: "Liechtenstein", Lithuania: "Lithuania", Malta: "Malta",
  Monaco: "Monaco", Montenegro: "Montenegro", Netherlands: "Netherlands",
  "North Macedonia": "North Macedonia", Norway: "Norway", Poland: "Poland",
  Portugal: "Portugal", Russia: "Russia", "San Marino": "San Marino",
  Serbia: "Serbia", Slovakia: "Slovakia", Slovenia: "Slovenia",
  Sweden: "Sweden", Switzerland: "Switzerland", Turkey: "Turkey",
  Ukraine: "Ukraine", "United Kingdom": "United Kingdom",
};

const MICROSTATES = new Set(["Liechtenstein", "Malta", "Monaco", "San Marino"]);

const SLUG = {
  "Montenegro.txt": "montenegro", "Portugal.txt": "portugal", "Poland.txt": "poland",
  "Russia.txt": "russia", "North Macedonia.txt": "north-macedonia",
  "Serbia.txt": "serbia", "Turkey.txt": "turkey", "United Kingdom.txt": "united-kingdom",
  "San Marino.txt": "san-marino", "Slovakia.txt": "slovakia", "Slovenia.txt": "slovenia",
  "Sweden.txt": "sweden", "Switzerland.txt": "switzerland", "Ukraine.txt": "ukraine",
  "Liechtenstein.txt": "liechtenstein", "Lithuania.txt": "lithuania",
  "Malta.txt": "malta", "Monaco.txt": "monaco", "Netherlands.txt": "netherlands",
  "Norway.txt": "norway",
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

function seedTotal(file) {
  const slug = SLUG[file];
  if (!slug) return 0;
  const p = join(ROOT, `data/seeds/${slug}.json`);
  if (!existsSync(p)) return 0;
  try {
    const seed = JSON.parse(readFileSync(p, "utf8"));
    return seed.cities?.reduce((n, c) => n + (c.places?.length || 0), 0) ?? 0;
  } catch {
    return 0;
  }
}

function priority(db, seed, country) {
  if (db >= 100) return 1000;
  if (db > 0 && db < 100) return 0; // almost done first
  if (seed >= 100) return 10;
  if (seed >= 60) return 20;
  if (MICROSTATES.has(country)) return 90;
  return 40;
}

loadEnv();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const pending = [];
for (const file of QUEUE) {
  const country = NAMES[file.replace(".txt", "")];
  const db = await dbTotal(supabase, country);
  const seed = seedTotal(file);
  if (db >= 100) {
    console.log(`⏭ ${country} already ${db}/100`);
    continue;
  }
  pending.push({ file, country, db, seed, prio: priority(db, seed, country) });
}

pending.sort((a, b) => a.prio - b.prio || a.db - b.db || a.country.localeCompare(b.country));

console.log(`\n=== Sequential queue: ${pending.length} countries ===\n`);
for (const { country, db, seed, prio } of pending) {
  console.log(`  • ${country} (DB ${db}/100, seed ${seed}/100, prio ${prio})`);
}
console.log("");

function quoteArg(a) {
  return /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a;
}

for (const { file, country, db } of pending) {
  console.log(`\n>>> Next: ${country} (${db}/100 in DB)\n`);
  const cmd = ["node", "scripts/run-one-country.mjs", file].map(quoteArg).join(" ");
  const r = spawnSync(process.platform === "win32" ? "cmd.exe" : "sh", process.platform === "win32" ? ["/d", "/s", "/c", cmd] : ["-c", cmd], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  });
  if (r.status !== 0) {
    console.warn(`⚠ ${country} failed — continuing to next…\n`);
  }
  await new Promise((res) => setTimeout(res, 5000));
}

console.log("\n=== Sequential run complete ===\n");
