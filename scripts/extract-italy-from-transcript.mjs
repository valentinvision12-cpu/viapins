/**
 * Extract Italy phase1 JSON from agent transcript user message.
 * Run: node scripts/extract-italy-from-transcript.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function findItalyTranscript() {
  if (process.env.ITALY_TRANSCRIPT) return process.env.ITALY_TRANSCRIPT;
  const dir = join(
    process.env.USERPROFILE || "",
    ".cursor/projects/d-travel-magazine/agent-transcripts"
  );
  for (const f of readdirSync(dir)) {
    const p = join(dir, f, `${f}.jsonl`);
    try {
      const text = readFileSync(p, "utf8");
      if (text.includes("Colosseum") && text.includes("Italy")) return p;
    } catch {}
  }
  return null;
}

const transcriptPath = findItalyTranscript();
if (!transcriptPath) {
  console.error("Italy transcript not found");
  process.exit(1);
}

const lines = readFileSync(transcriptPath, "utf8").split("\n");
let raw = null;

for (const line of lines) {
  if (!line.includes("Italy") || !line.includes("Colosseum") || !line.includes("Leaning Tower of Pisa"))
    continue;
  if (!line.includes("adventure_locations")) continue;
  const row = JSON.parse(line);
  let jsonText = row.message?.content?.[0]?.text ?? "";
  jsonText = jsonText.replace(/^<user_query>\s*/i, "").trim();
  const endTag = jsonText.indexOf("</user_query>");
  if (endTag !== -1) jsonText = jsonText.slice(0, endTag).trim();
  const trailing = jsonText.search(/\}\s*[а-яА-ЯЪъ]/u);
  if (trailing > 0) jsonText = jsonText.slice(0, trailing + 1);
  raw = JSON.parse(jsonText);
  break;
}

if (!raw) {
  console.error("Italy JSON not found in transcript");
  process.exit(1);
}

writeFileSync(
  join(ROOT, "data/seeds/italy-phase1-input.json"),
  JSON.stringify(raw, null, 2) + "\n"
);

console.log(
  `✓ italy-phase1-input.json: ${raw.cities?.length ?? 0} cities, ${raw.attractions?.length ?? 0} attractions, ${raw.adventure_locations?.length ?? 0} adventures`
);
