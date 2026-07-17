import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const transcriptPath =
  process.env.TURKEY_TRANSCRIPT ||
  join(
    process.env.USERPROFILE || "",
    ".cursor/projects/d-travel-magazine/agent-transcripts/167dcf52-4a97-4150-aaee-4de6aa04b22b/167dcf52-4a97-4150-aaee-4de6aa04b22b.jsonl"
  );

const outPath = join(ROOT, "data/seeds/turkey-phase1-input.json");

function extractJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

const lines = readFileSync(transcriptPath, "utf8").split("\n");
let raw = null;

for (const line of lines) {
  if (
    !line.includes("Basilica Cistern") ||
    !line.includes("Turkey") ||
    !line.includes("adventure_locations")
  ) {
    continue;
  }
  const row = JSON.parse(line);
  let jsonText = row.message?.content?.[0]?.text ?? "";
  const queryTag = "<user_query>";
  if (jsonText.startsWith(queryTag)) {
    jsonText = jsonText.slice(queryTag.length).trim();
  }
  const endTag = jsonText.indexOf("</user_query>");
  if (endTag !== -1) jsonText = jsonText.slice(0, endTag).trim();
  const jsonStart = jsonText.indexOf("{");
  if (jsonStart > 0) jsonText = jsonText.slice(jsonStart);
  const extracted = extractJsonObject(jsonText);
  if (!extracted) continue;
  raw = JSON.parse(extracted);
  break;
}

if (!raw) {
  console.error("Turkey JSON not found in transcript");
  process.exit(1);
}

function fixAttractions(arr) {
  for (const a of arr || []) {
    const name = a.name || "";
    if (name.includes("Atat") && name.includes("House Museum")) {
      a.wikipedia_url =
        "https://en.wikipedia.org/wiki/Atat%C3%BCrk%27s_House_Museum_(Antalya)";
    }
    if (name === "Kordon Promenade") {
      a.wikipedia_url = "https://en.wikipedia.org/wiki/Kordon_(%C4%B0zmir)";
    }
    if (name === "Asklepion of Pergamon") {
      a.wikipedia_url = "https://en.wikipedia.org/wiki/Asklepion_(Pergamon)";
    }
    if (name.includes("Rahmi") && name.includes("Ko") && name.includes("Ankara")) {
      a.latitude = 39.9392;
      a.google_maps_url = `https://www.google.com/maps?q=39.9392,${a.longitude ?? 32.8597}`;
    }
  }
}

for (const c of raw.cities || []) fixAttractions(c.attractions);
fixAttractions(raw.attractions);
fixAttractions(raw.adventure_locations);

writeFileSync(outPath, JSON.stringify(raw, null, 2) + "\n");

const cityCount = raw.cities?.length ?? 0;
const placeCount = (raw.cities || []).reduce(
  (n, c) => n + (c.attractions?.length || 0),
  0
);
const advCount = raw.adventure_locations?.length ?? 0;

JSON.parse(readFileSync(outPath, "utf8"));

console.log(`path: ${outPath}`);
console.log(`cities: ${cityCount}`);
console.log(`places: ${placeCount}`);
console.log(`adventures: ${advCount}`);
console.log("parse ok: true");