/**
 * Export exact existing place names per city for incomplete countries.
 * Usage: node scripts/export-existing-places-gap-list.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "data", "existing-places-gap-list.json");
const OUT_TEXT_PATH = join(ROOT, "data", "existing-places-gap-list.txt");

const TARGET_COUNTRIES = [
  "Andorra",
  "Austria",
  "Liechtenstein",
  "Monaco",
  "North Macedonia",
  "San Marino",
];

function loadEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  for (const line of readFileSync(p, "utf8").split("\n")) {
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

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function placesForDestination(destinationId) {
  const { data, error } = await supabase
    .from("places")
    .select("name, order_index")
    .eq("destination_id", destinationId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(`places query failed: ${error.message}`);
  return (data ?? []).map((p) => p.name);
}

async function exportCountry(country) {
  const { data: dests, error } = await supabase
    .from("destinations")
    .select("id, city, country")
    .eq("country", country)
    .order("city");

  if (error) throw new Error(`destinations for ${country}: ${error.message}`);

  const rows = [];
  for (const d of dests ?? []) {
    const existing_names = await placesForDestination(d.id);
    const current = existing_names.length;
    rows.push({
      country: d.country,
      city: d.city,
      current,
      need: Math.max(0, 10 - current),
      existing_names,
    });
  }
  return rows;
}

function formatTextBlock(rows) {
  const lines = [];
  let lastCountry = null;
  for (const r of rows) {
    if (r.country !== lastCountry) {
      if (lastCountry !== null) lines.push("");
      lines.push(`## ${r.country}`);
      lastCountry = r.country;
    }
    lines.push(`### ${r.city} (${r.current}/10, need ${r.need})`);
    if (r.existing_names.length === 0) {
      lines.push("- (no places yet)");
    } else {
      for (const name of r.existing_names) {
        lines.push(`- ${name}`);
      }
    }
    lines.push(
      JSON.stringify(
        {
          country: r.country,
          city: r.city,
          current: r.current,
          need: r.need,
          existing_names: r.existing_names,
        },
        null,
        2
      )
    );
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

const allRows = [];
for (const country of TARGET_COUNTRIES) {
  const rows = await exportCountry(country);
  if (rows.length === 0) {
    console.warn(`Warning: no destinations found for country "${country}"`);
  }
  allRows.push(...rows);
}

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(allRows, null, 2) + "\n", "utf8");
const textOut = "=== EXISTING PLACES GAP LIST (paste into prompt) ===\n\n" + formatTextBlock(allRows) + "\n";
writeFileSync(OUT_TEXT_PATH, textOut, "utf8");

console.log(`Saved ${allRows.length} cities to ${OUT_PATH}`);
console.log(`Saved prompt text to ${OUT_TEXT_PATH}\n`);
console.log("=== EXISTING PLACES GAP LIST (paste into prompt) ===\n");
console.log(formatTextBlock(allRows));

