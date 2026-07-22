import type { AdventurePlace } from "@/lib/adventure-types";

const GENERIC_SUBTITLE_RE =
  /beyond the cities|nature, coastlines|parks, coast, and scenic|scenic routes\.?$/i;

export function isGenericAdventureSubtitle(subtitle: string): boolean {
  const s = subtitle.trim();
  if (!s) return true;
  return GENERIC_SUBTITLE_RE.test(s);
}

/** Unique regions from route stops, preserving visit order. */
export function uniqueAdventureRegions(places: AdventurePlace[]): string[] {
  const seen = new Set<string>();
  const regions: string[] = [];
  for (const p of places) {
    const region = p.region?.trim();
    if (!region) continue;
    const key = region.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    regions.push(region);
  }
  return regions;
}

export function buildAdventureSubtitle(
  country: string,
  subtitle: string,
  places: AdventurePlace[]
): string {
  if (!isGenericAdventureSubtitle(subtitle)) return subtitle.trim();

  const regions = uniqueAdventureRegions(places).slice(0, 3);
  if (regions.length >= 2) {
    const head = regions.slice(0, -1).join(", ");
    const last = regions[regions.length - 1];
    return `Through ${head}, and ${last}.`;
  }
  if (regions.length === 1) {
    return `A scenic drive through ${regions[0]} and beyond.`;
  }

  const stopNames = places
    .slice(0, 3)
    .map((p) => p.name?.trim())
    .filter(Boolean);
  if (stopNames.length >= 2) {
    return `Road trip highlights: ${stopNames.join(", ")}.`;
  }

  return `An in-depth road trip across ${country}.`;
}

export function resolveAdventureTotalDays(
  totalDays: number,
  places: AdventurePlace[]
): number {
  const maxDay = places.reduce((max, p) => Math.max(max, p.day || 0), 0);
  if (maxDay > 0) return maxDay;
  if (totalDays > 0) return totalDays;
  return places.length > 0 ? places.length : 0;
}

export function resolveAdventureCoverImage(
  heroImage: string | null | undefined,
  places: AdventurePlace[]
): string {
  const hero = heroImage?.trim();
  if (hero) return hero;
  const fromStop = places.find((p) => p.image_url?.trim())?.image_url?.trim();
  return fromStop || "";
}

/** Premium road-trip picks shown first on /adventures */
export const FEATURED_ADVENTURE_SLUGS = [
  "greece",
  "italy",
  "iceland",
  "norway",
  "croatia",
  "albania",
] as const;
