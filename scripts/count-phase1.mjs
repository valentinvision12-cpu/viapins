import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const s of ["liechtenstein", "monaco", "san-marino", "north-macedonia"]) {
  const p = join(ROOT, `data/seeds/${s}-phase1-input.json`);
  const d = JSON.parse(readFileSync(p, "utf8"));
  const by = {};
  for (const a of d.attractions || []) {
    const c = a.city || "?";
    by[c] = (by[c] || 0) + 1;
  }
  console.log(`${s}: ${d.attractions?.length || 0} attractions, ${d.cities?.length || 0} cities`);
  console.log(" ", JSON.stringify(by));
}
