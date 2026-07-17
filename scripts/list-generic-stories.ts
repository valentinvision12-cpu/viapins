#!/usr/bin/env npx tsx
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isGenericDescription } from "../src/lib/place-description";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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

async function main() {
  loadEnvLocal();
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const countries = [
    "Croatia",
    "Cyprus",
    "Czech Republic",
    "Bosnia and Herzegovina",
    "France",
  ];
  const items: { country: string; city: string; name: string; desc: string }[] = [];

  for (const country of countries) {
    const { data: dests } = await sb.from("destinations").select("id,city").ilike("country", country);
    for (const d of dests ?? []) {
      const { data: places } = await sb.from("places").select("id,name,translations").eq("destination_id", d.id);
      for (const p of places ?? []) {
        const en = (p.translations as { en?: { description?: string; wiki_text?: string } }).en;
        if (isGenericDescription(en?.description) || isGenericDescription(en?.wiki_text)) {
          items.push({
            country,
            city: d.city,
            name: p.name,
            desc: (en?.description || en?.wiki_text || "").slice(0, 80),
          });
        }
      }
    }
  }

  console.log(`\n${items.length} generic places:\n`);
  for (const i of items) {
    console.log(`${i.country} / ${i.city} / ${i.name}`);
    console.log(`  -> ${i.desc}\n`);
  }

  writeFileSync(
    join(process.cwd(), "data", "generic-places.json"),
    JSON.stringify(items, null, 2),
    "utf8"
  );
}

main();
