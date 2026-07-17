import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function parseObjects(chunk) {
  const items = [];
  let depth = 0, buf = "", inStr = false, esc = false;
  for (let i = 0; i < chunk.length; i++) {
    const ch = chunk[i];
    if (inStr) { buf += ch; if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; buf += ch; continue; }
    if (ch === "{") { depth++; buf += ch; continue; }
    if (ch === "}") { depth--; buf += ch; if (depth === 0 && buf.trim().startsWith("{")) { try { items.push(JSON.parse(buf)); } catch {} buf = ""; } continue; }
    if (depth > 0) buf += ch;
  }
  return items;
}
const raw = readFileSync(join(ROOT, "data/phase1/japan.json"), "utf8");
const i = raw.indexOf('"attractions": [');
console.log("attractions index", i, "file length", raw.length);
const items = parseObjects(raw.slice(i));
console.log("parsed items", items.length);
if (items[0]) console.log("first", items[0].name);
const by = {};
for (const a of items) {
  if (!a.name) continue;
  (by[a.city] ||= []).push(a.name);
}
for (const c of Object.keys(by).sort()) console.log(c, by[c].length);
console.log("total", items.filter((x) => x.name).length);
