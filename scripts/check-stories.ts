#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from "fs";
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
  let generic = 0;
  let total = 0;

  const byCountry: Record<string, number> = {};
  for (const country of countries) {
    byCountry[country] = 0;
    const { data: dests } = await sb.from("destinations").select("id,city").ilike("country", country);
    for (const d of dests ?? []) {
      const { data: places } = await sb.from("places").select("name,translations").eq("destination_id", d.id);
      for (const p of places ?? []) {
        total++;
        const en = (p.translations as { en?: { description?: string; wiki_text?: string } }).en;
        if (isGenericDescription(en?.description) || isGenericDescription(en?.wiki_text)) {
          generic++;
          byCountry[country]++;
        }
      }
    }
  }
  console.log(`\n${generic}/${total} generic remaining`);
  for (const [c, n] of Object.entries(byCountry)) console.log(`  ${c}: ${n}`);

  const { data: sib } = await sb
    .from("destinations")
    .select("id")
    .ilike("country", "Croatia")
    .eq("city", "Šibenik")
    .single();
  const { data: sample } = await sb
    .from("places")
    .select("name,translations")
    .eq("destination_id", sib!.id)
    .eq("name", "Šibenik City Museum")
    .single();
  const en = (sample!.translations as { en: { description: string; wiki_text: string } }).en;
  console.log("\nSample Šibenik City Museum:");
  console.log("desc:", en.description);
  console.log("wiki:", en.wiki_text.slice(0, 200));
}

main();
