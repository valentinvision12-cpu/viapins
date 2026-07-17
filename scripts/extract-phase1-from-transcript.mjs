/**
 * Extract phase1 JSON bundle from agent transcript jsonl (last large user message).
 * Usage: node scripts/extract-phase1-from-transcript.mjs [CountryName] [transcript.jsonl]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const defaultTranscript =
  process.env.TRANSCRIPT ||
  "C:/Users/Owner/.cursor/projects/d-travel-magazine/agent-transcripts/167dcf52-4a97-4150-aaee-4de6aa04b22b/167dcf52-4a97-4150-aaee-4de6aa04b22b.jsonl";

const countryFilter = process.argv[2]?.match(/^[A-Za-z]/) ? process.argv[2] : null;
const transcriptPath = countryFilter
  ? process.argv[3] || defaultTranscript
  : process.argv[2] || defaultTranscript;

function fixRomaniaJson(s) {
  return s.replace(/(\d),,/g, "$1,");
}

function splitBundle(raw) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) parts.push(raw.slice(start, i + 1));
    }
  }
  return parts;
}

function slugify(country) {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

console.log(`Reading ${transcriptPath}...`);
const lines = readFileSync(transcriptPath, "utf8").split(/\r?\n/);

const searchCountry = countryFilter || "Denmark";
let best = "";
for (const line of lines) {
  if (!line.includes(searchCountry)) continue;
  let content = line;
  try {
    const evt = JSON.parse(line);
    const msg = evt.message || evt;
    if (msg.content) {
      content =
        typeof msg.content === "string"
          ? msg.content
          : msg.content.map((c) => c.text || "").join("");
    }
  } catch {}

  const countryMarker = `{"country": "${searchCountry}"`;
  const markers = [
    countryMarker,
    `{\n"country": "${searchCountry}"`,
    `{\r\n"country": "${searchCountry}"`,
  ];
  let start = -1;
  for (const m of markers) {
    const i = content.indexOf(m);
    if (i >= 0 && (start < 0 || i < start)) start = i;
  }
  if (start < 0) continue;
  const slice = content
    .slice(start)
    .replace(/^<user_query>\s*/, "")
    .replace(/\s*<\/user_query>$/, "");
  if (slice.length > best.length) best = slice;
}

if (!best) {
  console.error(`No phase1 JSON found for ${searchCountry}`);
  process.exit(1);
}

console.log(`Found bundle: ${best.length} chars`);
const fixed = fixRomaniaJson(best);
const outDir = join(ROOT, "data/phase1");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

if (countryFilter) {
  const slug = slugify(countryFilter);
  const outPath = join(outDir, `${slug}.json`);
  writeFileSync(outPath, fixed + "\n");
  console.log(`  ok ${slug}.json (raw, ${fixed.length} chars)`);
  console.log(`Done. Files in ${outDir}`);
  process.exit(0);
}

const objects = splitBundle(fixed);
console.log(`Split into ${objects.length} JSON objects`);
writeFileSync(join(outDir, "bundle.raw.json"), fixed + "\n");

for (const objStr of objects) {
  let parsed;
  try {
    parsed = JSON.parse(objStr);
  } catch (e) {
    console.error("Parse failed:", e.message);
    process.exit(1);
  }
  const country = parsed.country;
  if (!country) continue;
  const slug = slugify(country);
  const outPath = join(outDir, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n");
  const cities = parsed.cities?.length ?? 0;
  const adv = parsed.adventure_locations?.length ?? 0;
  const places = (parsed.cities || []).reduce((n, c) => n + (c.attractions?.length || 0), 0);
  console.log(`  ok ${slug}.json - ${cities} cities, ${places} attractions, ${adv} adventures`);
}

console.log(`Done. Files in ${outDir}`);
