export const CITY_GUIDE_SLUGS = [
  "things-to-do",
  "3-day-itinerary",
  "hidden-gems",
] as const;

export type CityGuideSlug = (typeof CITY_GUIDE_SLUGS)[number];

export function isCityGuideSlug(value: string): value is CityGuideSlug {
  return (CITY_GUIDE_SLUGS as readonly string[]).includes(value);
}
