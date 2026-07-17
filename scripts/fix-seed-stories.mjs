/**
 * Fix generic / misplaced descriptions in seed JSON files.
 * Run: node scripts/fix-seed-stories.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function isGenericDescription(text) {
  if (!text?.trim()) return true;
  const t = text.trim();
  if (t.length < 20) return true;
  if (/^[\w\s-]+$/i.test(t) && t.split(/\s+/).length <= 2) return true;
  return (
    /real-world travel stop with clear local appeal/i.test(t) ||
    /is a standout stop in .+, known for/i.test(t) ||
    /is one of the most distinctive stops in/i.test(t) ||
    /mixing local character with a strong visitor appeal/i.test(t) ||
    /is a standout open-air location for travelers/i.test(t) ||
    /^(heritage|shopping|museum|viewpoint|landmark|nature|church|historic_site)$/i.test(t)
  );
}

function looksLikeStory(text) {
  return text && text.length > 40 && /[.!?]/.test(text) && !text.includes("Special:FilePath");
}

function fixWikiTitle(title, name) {
  let t = (title || name).trim();
  t = t.replace(/\.(jpg|jpeg|png|webp)$/i, "").trim();
  if (!t || t.toLowerCase() === name.toLowerCase()) return name;
  return t;
}

function stripGenericDescriptions(seed) {
  let n = 0;
  for (const city of seed.cities || []) {
    for (const p of city.places || []) {
      if (p.description && isGenericDescription(p.description)) {
        delete p.description;
        n++;
      }
    }
  }
  if (seed.adventure?.places) {
    for (const p of seed.adventure.places) {
      if (p.description && isGenericDescription(p.description)) {
        delete p.description;
        n++;
      }
    }
  }
  return n;
}

function fixCyprus(seed) {
  let moved = 0;
  for (const city of seed.cities || []) {
    for (const p of city.places || []) {
      if (looksLikeStory(p.commons_file) && isGenericDescription(p.description)) {
        p.description = p.commons_file.trim();
        delete p.commons_file;
        moved++;
      }
      p.wiki_title = fixWikiTitle(p.wiki_title, p.name);
      if (p.image_url?.includes("Special:FilePath") && p.image_url.includes("?width=")) {
        delete p.image_url;
      }
    }
  }
  if (seed.adventure?.places) {
    for (const p of seed.adventure.places) {
      if (looksLikeStory(p.commons_file) && isGenericDescription(p.description)) {
        p.description = p.commons_file.trim();
        delete p.commons_file;
        moved++;
      }
      p.wiki_title = fixWikiTitle(p.wiki_title, p.name);
    }
  }
  return moved;
}

const files = [
  { path: "france.json", fn: stripGenericDescriptions },
  { path: "croatia.json", fn: stripGenericDescriptions },
  { path: "czech-republic.json", fn: stripGenericDescriptions },
  { path: "cyprus.json", fn: (s) => fixCyprus(s) + stripGenericDescriptions(s) },
  { path: "bosnia-and-herzegovina.json", fn: stripGenericDescriptions },
];

for (const { path, fn } of files) {
  const full = join(ROOT, "data", "seeds", path);
  const seed = JSON.parse(readFileSync(full, "utf8"));
  const changed = fn(seed);
  writeFileSync(full, JSON.stringify(seed, null, 2), "utf8");
  console.log(`✓ ${path}: ${changed} place descriptions fixed`);
}
