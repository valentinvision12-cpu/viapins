#!/usr/bin/env npx tsx
/** Remove a country from Supabase (destinations + places + adventure). */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

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
  const country = process.argv[2];
  if (!country) {
    console.error("Usage: npx tsx scripts/delete-country.ts Luxembourg");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data: dests } = await supabase
    .from("destinations")
    .select("id, city")
    .ilike("country", country);

  if (dests?.length) {
    for (const d of dests) {
      await supabase.from("places").delete().eq("destination_id", d.id);
    }
    await supabase.from("destinations").delete().ilike("country", country);
    console.log(`Deleted ${dests.length} destinations for ${country}`);
  }

  const slug = country.toLowerCase().replace(/\s+/g, "-");
  await supabase.from("adventure_collections").delete().eq("slug", slug);
  console.log(`Done: ${country}`);
}

main();
