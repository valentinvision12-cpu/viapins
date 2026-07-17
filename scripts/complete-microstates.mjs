#!/usr/bin/env node
/** Run dedupe → seeds → fix (×3) → dedupe → verify for 4 microstates */
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUGS = ["liechtenstein", "monaco", "north-macedonia", "san-marino"];
const COUNTRIES = ["Liechtenstein", "Monaco", "North Macedonia", "San Marino"];

function run(cmd, args, env = {}) {
  console.log(`\n>>> ${cmd} ${args.join(" ")}\n`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, WIKI_DELAY_MS: "1500", ...env },
  });
  return r.status === 0;
}

run("node", ["scripts/dedupe-all-countries.mjs"]);
run("node", ["scripts/finish-microstates.mjs", ...SLUGS]);

for (let pass = 1; pass <= 3; pass++) {
  console.log(`\n========== FIX PASS ${pass}/3 ==========\n`);
  for (const slug of SLUGS) {
    run("npx", ["tsx", "scripts/fix-country-places.ts", slug], {
      SEQUENTIAL_WIKI: "1",
      RELAX_MICROSTATE: "1",
    });
  }
  run("node", ["scripts/dedupe-all-countries.mjs"]);
}

run("npx", ["tsx", "scripts/count-places.ts", ...COUNTRIES]);
console.log("\n=== COMPLETE MICROSTATES DONE ===\n");
