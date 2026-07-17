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
    process.env[key] = val;
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: dests } = await supabase
    .from("destinations")
    .select("country, city, published, places(count)")
    .order("country")
    .order("city");

  const byCountry = new Map<string, { cities: number; places: number; published: number }>();

  for (const d of dests ?? []) {
    const c = d.country;
    if (!byCountry.has(c)) byCountry.set(c, { cities: 0, places: 0, published: 0 });
    const g = byCountry.get(c)!;
    g.cities++;
    g.places += (d.places as { count: number }[])?.[0]?.count ?? 0;
    if (d.published) g.published++;
  }

  console.log("=== SUPABASE — какво е качено ===\n");
  if (byCountry.size === 0) {
    console.log("ПРАЗНО — няма дестинации в базата.\n");
    return;
  }

  for (const [country, stats] of byCountry) {
    console.log(`${country}:`);
    console.log(`  ${stats.cities} града, ${stats.places} места общо, ${stats.published} публикувани`);
  }

  const { count: advCount, error: advError } = await supabase
    .from("adventure_collections")
    .select("id", { count: "exact", head: true });

  if (advError) {
    console.log("\nAdventure: таблица ЛИПСВА — пусни migration 006 в Supabase SQL Editor");
  } else {
    console.log(`\nAdventure маршрути: ${advCount ?? 0}`);
  }
}

main().catch(console.error);
