#!/usr/bin/env npx tsx
/** Count places per city in Supabase */
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const country of process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["Croatia", "Cyprus", "Czech Republic", "Bosnia and Herzegovina", "France"]) {
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", country)
      .order("city");

    let total = 0;
    console.log(`\n${country}:`);
    for (const d of dests ?? []) {
      const { count } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .eq("destination_id", d.id);
      total += count ?? 0;
      const mark = count === 10 ? "✓" : "⚠";
      console.log(`  ${mark} ${d.city}: ${count}/10`);
    }
    console.log(`  Total: ${total}/100`);
  }
}

main();
