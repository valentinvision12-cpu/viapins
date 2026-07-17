import { readFileSync, writeFileSync } from "fs";

const path = "scripts/resolve-osm-places.mjs";
let t = readFileSync(path, "utf8");

if (!t.includes("squareStreetQuery")) {
  t = t.replace(
    "function buildQueries(place, city, country) {",
    `function squareStreetQuery(name, city) {
  const m = name.match(/\\b([A-Z\u0104\u010C\u0118\u0116\u012E\u0160\u0172\u016A\u017D][a-z\u0105\u010D\u0119\u0117\u012F\u0161\u0173\u016B\u017E]+)\\s+Square\\b/i);
  if (!m) return null;
  return \`\${m[1]} a., \${city}\`;
}

function buildQueries(place, city, country) {`
  );
}

if (!t.includes("20\\d{2}")) {
  t = t.replace(
    `.replace(/_/g, " ")
    .trim();`,
    `.replace(/_/g, " ")
    .replace(/\\s+20\\d{2}\\s*$/i, "")
    .trim();`
  );
}

if (!t.includes("squareStreetQuery(place.name")) {
  t = t.replace(
    `  add(\`\${short} \${city}\`);

  return out;`,
    `  add(\`\${short} \${city}\`);
  const sq = squareStreetQuery(place.name, city);
  if (sq) {
    add(\`\${sq}, \${country}\`);
    add(sq);
  }

  return out;`
  );
}

writeFileSync(path, t, "utf8");
console.log("patched", path);
