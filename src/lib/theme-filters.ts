/** Theme discovery filters (mega-prompt) ? match destination.tags. */

export const THEME_FILTERS = [
  "beach",
  "nature",
  "history",
  "adventure",
  "romantic",
  "family",
  "food",
  "city",
] as const;

export type ThemeFilter = (typeof THEME_FILTERS)[number];

/** Tag aliases so sparse seed tags still match themes. */
const THEME_ALIASES: Record<ThemeFilter, string[]> = {
  beach: ["beach", "coast", "seaside", "island", "summer"],
  nature: ["nature", "park", "mountain", "hiking", "lake", "forest"],
  history: ["history", "historic", "heritage", "castle", "museum", "culture"],
  adventure: ["adventure", "roadtrip", "outdoor", "ski", "winter"],
  romantic: ["romantic", "honeymoon", "couple"],
  family: ["family", "kids", "family-friendly"],
  food: ["food", "cuisine", "culinary", "wine"],
  city: ["city", "urban", "nightlife", "capital"],
};

export function matchesTheme(
  tags: string[] | undefined | null,
  theme: string | null
): boolean {
  if (!theme) return true;
  const key = theme.toLowerCase() as ThemeFilter;
  const aliases = THEME_ALIASES[key] ?? [theme.toLowerCase()];
  const normalized = (tags ?? []).map((t) => t.toLowerCase());
  return aliases.some((a) => normalized.some((t) => t.includes(a)));
}
