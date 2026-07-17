/**
 * Extract Kosovo phase1 JSON from agent transcript (partial — truncated before adventures).
 * Run: node scripts/extract-kosovo-from-transcript.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function findKosovoTranscript() {
  if (process.env.KOSOVO_TRANSCRIPT) return process.env.KOSOVO_TRANSCRIPT;
  const dir = join(
    process.env.USERPROFILE || "",
    ".cursor/projects/d-travel-magazine/agent-transcripts"
  );
  for (const f of readdirSync(dir)) {
    const p = join(dir, f, `${f}.jsonl`);
    try {
      const text = readFileSync(p, "utf8");
      if (text.includes("Newborn Monument") && text.includes("Prizren Fortress")) return p;
    } catch {}
  }
  return null;
}

const transcriptPath = findKosovoTranscript();
if (!transcriptPath) {
  console.error("Kosovo transcript not found");
  process.exit(1);
}

const lines = readFileSync(transcriptPath, "utf8").split("\n");
let raw = null;

for (const line of lines) {
  if (!line.includes("Newborn Monument") || !line.includes("Prizren Fortress")) continue;
  const row = JSON.parse(line);
  let jsonText = row.message?.content?.[0]?.text ?? "";
  jsonText = jsonText.replace(/^<user_query>\s*/i, "").trim();
  const endTag = jsonText.indexOf("</user_query>");
  if (endTag !== -1) jsonText = jsonText.slice(0, endTag).trim();

  const lastComplete = jsonText.lastIndexOf("},");
  if (lastComplete === -1) {
    console.error("No complete attraction objects found");
    process.exit(1);
  }
  jsonText = jsonText.slice(0, lastComplete + 1) + "\n]\n}";
  raw = JSON.parse(jsonText);
  break;
}

if (!raw) {
  console.error("Kosovo JSON not found in transcript");
  process.exit(1);
}

writeFileSync(
  join(ROOT, "data/seeds/kosovo-phase1-partial.json"),
  JSON.stringify(raw, null, 2) + "\n"
);

console.log(
  `✓ kosovo-phase1-partial.json: ${raw.cities?.length ?? 0} cities, ${raw.attractions?.length ?? 0} attractions (truncated)`
);
