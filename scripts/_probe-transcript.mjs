import { readFileSync } from "fs";
const p = "C:/Users/Owner/.cursor/projects/d-travel-magazine/agent-transcripts/167dcf52-4a97-4150-aaee-4de6aa04b22b/167dcf52-4a97-4150-aaee-4de6aa04b22b.jsonl";
const lines = readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean);
for (const line of lines) {
  if (line.length !== 120939) continue;
  const e = JSON.parse(line);
  let content = (e.message.content||[]).map(c=>c.text||"").join("");
  content = content.replace(/^<user_query>\s*/i, "").replace(/\s*<\/user_query>$/i, "").trim();
  const start = content.indexOf('{\n"country": "Finland"');
  let slice = content.slice(start);
  console.log("slice len", slice.length);
  console.log("last 200", JSON.stringify(slice.slice(-200)));
  try { JSON.parse(slice); console.log("parses ok"); } catch(err) { console.log("parse err", err.message); }
}