#!/usr/bin/env npx tsx
/** Update a single place image in Supabase by city + place name */
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
  const [, , country, city, placeName, imageUrl] = process.argv;
  if (!country || !city || !placeName || !imageUrl) {
    console.error(
      "Usage: npx tsx scripts/update-place-image.ts Austria Vienna \"Hofburg Palace\" \"https://...\""
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", country)
    .ilike("city", city)
    .maybeSingle();

  if (!dest) {
    console.error(`Destination not found: ${city}, ${country}`);
    process.exit(1);
  }

  const { data: places, error } = await supabase
    .from("places")
    .select("id, name")
    .eq("destination_id", dest.id)
    .ilike("name", placeName);

  if (error || !places?.length) {
    console.error("Place not found:", placeName);
    process.exit(1);
  }

  const place = places.find((p) => p.name.toLowerCase() === placeName.toLowerCase()) ?? places[0];
  const { error: updErr } = await supabase
    .from("places")
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", place.id);

  if (updErr) throw updErr;
  console.log(`✓ Updated "${place.name}" → ${imageUrl.slice(0, 70)}…`);
}

main();
