/** Shared passport identity options (mega-prompt interests + languages). */

export const PASSPORT_INTERESTS = [
  "beach",
  "nature",
  "history",
  "adventure",
  "family",
  "romantic",
  "photography",
  "free",
  "luxury",
] as const;

export type PassportInterest = (typeof PASSPORT_INTERESTS)[number];

export const PASSPORT_LANGUAGES = [
  "English",
  "Български",
  "Español",
  "Français",
  "Deutsch",
  "Italiano",
  "Português",
  "Русский",
  "中文",
  "日本語",
  "العربية",
] as const;

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}
