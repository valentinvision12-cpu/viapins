import { slugify } from "@/lib/utils";

export function placeSlug(name: string, id?: string): string {
  const base = slugify(name);
  if (base) return base;
  return id ? `place-${id.slice(0, 8)}` : "place";
}

export function findPlaceBySlug<T extends { id: string; name: string }>(
  places: T[],
  slug: string
): T | undefined {
  const target = slugify(slug);
  return (
    places.find((p) => placeSlug(p.name, p.id) === target) ||
    places.find((p) => p.id === slug)
  );
}
