#!/usr/bin/env npx tsx
/**
 * Качва държава от data/seeds/{slug}.json → Supabase
 *
 * Използва се от Cursor agent по команда на потребителя:
 *   npm run import:country -- albania
 *
 * Изисква .env.local с NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { importCountrySeed } from "../src/lib/import-country-core";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();

process.env.SEQUENTIAL_WIKI = "1";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const slug = process.argv[2]?.toLowerCase().replace(/\.json$/, "");
  if (!slug) {
    console.error("Употреба: npm run import:country -- albania");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || url.includes("placeholder")) {
    console.error("Липсва NEXT_PUBLIC_SUPABASE_URL в .env.local");
    process.exit(1);
  }
  if (!serviceKey || serviceKey.startsWith("placeholder")) {
    console.error("Липсва SUPABASE_SERVICE_ROLE_KEY в .env.local");
    process.exit(1);
  }

  const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
  if (!existsSync(seedPath)) {
    console.error(`Липсва файл: data/seeds/${slug}.json`);
    process.exit(1);
  }

  const raw = readFileSync(seedPath, "utf8");
  const supabase = createClient(url, serviceKey);

  console.log(`\n→ Качване: ${slug}…\n`);

  const result = await importCountrySeed(supabase, raw, (msg) =>
    console.log(`  ${msg}`)
  );

  if (!result.success) {
    console.error(`\n✗ ${result.error}\n`);
    process.exit(1);
  }

  console.log(
    `\n✓ ${result.country}: ${result.stats.placeCount} места + ${result.adventure?.placeCount ?? 0} adventure спирки\n`
  );
}

main();
