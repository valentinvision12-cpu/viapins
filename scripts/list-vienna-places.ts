#!/usr/bin/env npx tsx
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

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", "Austria")
    .ilike("city", "Vienna")
    .maybeSingle();

  if (!dest) {
    console.error("Vienna not found");
    process.exit(1);
  }

  const { data: places } = await supabase
    .from("places")
    .select("name, image_url, order_index")
    .eq("destination_id", dest.id)
    .order("order_index");

  for (const p of places ?? []) {
    const ok = p.image_url?.startsWith("https://upload.wikimedia.org/");
    console.log(
      `${p.order_index}. ${p.name}`,
      ok ? "✓ direct" : p.image_url ? "⚠ other" : "✗ MISSING"
    );
    if (p.image_url) console.log(`   ${p.image_url.slice(0, 100)}`);
  }
}

main();
