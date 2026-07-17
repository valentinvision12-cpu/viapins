#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function allSlugs() {
  return readdirSync(join(process.cwd(), "data", "seeds"))
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !/(phase1|supplement|input|patch|partial)/i.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const imagesOnly = argv.includes("--images-only");
const slugs = argv.filter((a) => !a.startsWith("--"));
loadEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const list = slugs.length ? slugs : allSlugs();
console.log("Countries:", list.length, dryRun ? "(dry-run)" : "", imagesOnly ? "(images only)" : "");
let ok = 0, fail = 0;
for (const slug of list) {
  console.log("\n>>>", slug);
  try {
    if (!imagesOnly) {
      execSync(`node scripts/resolve-osm-places.mjs ${dryRun ? "--dry-run " : ""}--seed-only ${slug}`, { stdio: "inherit" });
      if (!dryRun) execSync(`node scripts/sync-country-places-db.mjs ${slug}`, { stdio: "inherit" });
    }
    if (!dryRun) {
      execSync(`npx --yes tsx scripts/refresh-place-images.ts --bad-only ${slug}`, {
        stdio: "inherit",
        env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
      });
    }
    ok++;
  } catch { console.error("FAILED", slug); fail++; }
}
console.log(`\nFinished: ${ok} ok, ${fail} failed\n`);
