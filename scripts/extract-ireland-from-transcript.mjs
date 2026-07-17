/**
 * Extract Ireland phase1 JSON from agent transcript user message.
 * Run: node scripts/extract-ireland-from-transcript.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const transcriptPath =
  process.env.IRELAND_TRANSCRIPT ||
  join(
    process.env.USERPROFILE || "",
    ".cursor/projects/d-travel-magazine/agent-transcripts/167dcf52-4a97-4150-aaee-4de6aa04b22b/167dcf52-4a97-4150-aaee-4de6aa04b22b.jsonl"
  );

const lines = readFileSync(transcriptPath, "utf8").split("\n");
let raw = null;

for (const line of lines) {
  if (!line.includes("Ireland") || !line.includes("Trinity College Library")) continue;
  const row = JSON.parse(line);
  const text = row.message?.content?.[0]?.text ?? "";
  let jsonText = text.replace(/^<user_query>\s*/i, "").trim();
  const endTag = jsonText.indexOf("</user_query>");
  if (endTag !== -1) jsonText = jsonText.slice(0, endTag).trim();
  raw = JSON.parse(jsonText);
  break;
}

if (!raw) {
  console.error("Ireland JSON not found in transcript");
  process.exit(1);
}

writeFileSync(
  join(ROOT, "data/seeds/ireland-phase1-input.json"),
  JSON.stringify(raw, null, 2) + "\n"
);

const cityCount = raw.cities?.length ?? 0;
const attrCount = raw.cities?.reduce((n, c) => n + (c.attractions?.length ?? 0), 0) ?? 0;
const advCount = raw.adventure_locations?.length ?? 0;
console.log(
  `✓ ireland-phase1-input.json: ${cityCount} cities, ${attrCount} attractions, ${advCount} adventures`
);
