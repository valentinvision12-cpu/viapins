#!/usr/bin/env npx tsx
/** Remove duplicate destinations and trim cities over 10 places. */
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Serbia: duplicate Belgrade
  const { data: belgrade } = await supabase
    .from("destinations")
    .select("id, city, created_at")
    .ilike("country", "Serbia")
    .ilike("city", "Belgrade")
    .order("created_at", { ascending: true });

  if (belgrade && belgrade.length > 1) {
    const keep = belgrade[0].id;
    for (const dup of belgrade.slice(1)) {
      await supabase.from("places").delete().eq("destination_id", dup.id);
      await supabase.from("destinations").delete().eq("id", dup.id);
      console.log(`  ✗ Removed duplicate Belgrade destination ${dup.id}`);
    }
    console.log(`  ✓ Serbia: kept Belgrade ${keep}`);
  }

  // Moldova: trim cities with >10 places
  const { data: moldovaDests } = await supabase
    .from("destinations")
    .select("id, city")
    .ilike("country", "Moldova");

  for (const dest of moldovaDests ?? []) {
    const { data: places } = await supabase
      .from("places")
      .select("id, order_index")
      .eq("destination_id", dest.id)
      .order("order_index", { ascending: true });

    if ((places?.length ?? 0) <= 10) continue;
    const excess = places!.slice(10);
    for (const p of excess) {
      await supabase.from("places").delete().eq("id", p.id);
    }
    console.log(`  ✓ Moldova ${dest.city}: trimmed to 10 (removed ${excess.length})`);
  }

  // Remove duplicate destinations (same country + city)
  const dedupeCountries = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["Liechtenstein"];

  for (const country of dedupeCountries) {
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city, created_at")
      .ilike("country", country)
      .order("created_at", { ascending: true });

    const byCity = new Map<string, typeof dests>();
    for (const d of dests ?? []) {
      const key = d.city.toLowerCase();
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(d);
    }

    for (const [cityKey, list] of byCity) {
      if (list.length <= 1) continue;
      const keep = list[0];
      for (const dup of list.slice(1)) {
        await supabase.from("places").delete().eq("destination_id", dup.id);
        await supabase.from("destinations").delete().eq("id", dup.id);
        console.log(`  ✗ ${country} duplicate ${list[0].city} removed ${dup.id}`);
      }
      console.log(`  ✓ ${country} ${list[0].city}: kept ${keep.id}`);
    }
  }

  // Trim any city with >10 places (Latvia, UK, etc.)
  const trimCountries = dedupeCountries;

  for (const country of trimCountries) {
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", country);

    for (const dest of dests ?? []) {
      const { data: places } = await supabase
        .from("places")
        .select("id, order_index")
        .eq("destination_id", dest.id)
        .order("order_index", { ascending: true });

      if ((places?.length ?? 0) <= 10) continue;
      const excess = places!.slice(10);
      for (const p of excess) {
        await supabase.from("places").delete().eq("id", p.id);
      }
      console.log(`  ✓ ${country} ${dest.city}: trimmed to 10 (removed ${excess.length})`);
    }
  }

  console.log("\n✓ DB cleanup done\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
