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
  const { data, error, count } = await supabase
    .from("adventure_collections")
    .select("slug, country", { count: "exact" });

  if (error) {
    console.log("Таблица adventure_collections: ЛИПСВА");
    console.log("Грешка:", error.code, error.message);
    console.log("\n→ Пусни supabase/migrations/006_adventure_collections.sql в Supabase SQL Editor");
    return;
  }

  console.log(`Таблица adventure_collections: OK (${count ?? data?.length ?? 0} записа)`);
  for (const row of data ?? []) {
    console.log(`  - ${row.country} (${row.slug})`);
  }
}

main().catch(console.error);
