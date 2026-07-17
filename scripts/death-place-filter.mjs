/** Shared death-place detection for .mjs scripts */
const DEATH_NAME_PATTERNS = [
  /\bcemetery\b/i,
  /\bgraveyard\b/i,
  /\bburial\b/i,
  /\btomb(s)?\b/i,
  /\bturbe\b/i,
  /\bmausoleum\b/i,
  /\bcatacomb(s)?\b/i,
  /\bcrypt(s)?\b/i,
  /\bossuar(y|ies)\b/i,
  /\bnecropolis\b/i,
  /\bbone house\b/i,
  /\bbone chapel\b/i,
  /\bskeleton\b/i,
  /\bskull\b/i,
  /\bmumm(y|ies)\b/i,
  /\bmemorial cemetery\b/i,
  /\bwar cemetery\b/i,
  /\btombs of the kings\b/i,
  /\bgaravice memorial\b/i,
];

export function isDeathRelatedPlace(name, description) {
  const n = (name || "").trim();
  if (DEATH_NAME_PATTERNS.some((p) => p.test(n))) return true;
  if (description && /\bnecropolis\b|\bburial\b|\bbones?\b|\bossuary\b|\bcatacomb\b/i.test(description)) {
    return true;
  }
  return false;
}
