import { isBadImageUrl } from "./wiki-image";
import { isValidMapLocation } from "./place-links";
import { isDeathRelatedPlace } from "./death-place-filter";
import { isNonChristianReligiousPlace } from "./non-christian-place-filter";

export type PlaceCoverSource = {
  name: string;
  image_url: string;
  order_index: number;
};

/** Best cover from existing places — prefers Wikimedia thumbs, skips maps / empty URLs. */
export function pickCityCoverFromPlaces(places: PlaceCoverSource[]): string {
  const sorted = [...places].sort((a, b) => a.order_index - b.order_index);
  const usable = sorted.filter(
    (p) => p.image_url?.trim() && !isBadImageUrl(p.image_url)
  );
  const thumb = usable.find((p) => /\/thumb\//i.test(p.image_url));
  if (thumb) return thumb.image_url;
  return usable[0]?.image_url ?? "";
}

/** Hero/cover from DB only — no live Wikipedia. */
export function resolveCityCoverFromDb(
  storedCover: string | undefined,
  places: PlaceCoverSource[] = []
): string {
  const trimmed = storedCover?.trim() ?? "";
  if (trimmed && !isBadImageUrl(trimmed)) return trimmed;
  return pickCityCoverFromPlaces(places);
}

/** Country covers from city cards already loaded from Supabase. */
export function pickCountryCoversFromCities(
  cities: { coverImage: string }[]
): { coverImage: string; coverImages: string[] } {
  const coverImages = [
    ...new Set(
      cities
        .map((c) => c.coverImage?.trim() ?? "")
        .filter((url) => url && !isBadImageUrl(url))
    ),
  ].slice(0, 3);
  return { coverImage: coverImages[0] ?? "", coverImages };
}

export type PlaceMapFilter = {
  image_url: string;
  lat: number;
  lng: number;
  name: string;
  description?: string;
};

/** Valid GPS pins only — also hide death sites and non-Christian religious landmarks. */
export function filterPlacesForDisplay<T extends PlaceMapFilter>(places: T[]): T[] {
  return places.filter(
    (p) =>
      isValidMapLocation(p.lat, p.lng, p.name) &&
      !isDeathRelatedPlace(p.name, p.description) &&
      !isNonChristianReligiousPlace(p.name, p.description)
  );
}

/** Map uses the same pins as the list — accuracy comes from Google Place ID + coords in DB. */
export function filterPlacesForMap<T extends PlaceMapFilter>(places: T[]): T[] {
  return filterPlacesForDisplay(places);
}

/** Places with a usable photo (covers, galleries). */
export function filterPlacesWithPhoto<T extends PlaceMapFilter>(places: T[]): T[] {
  return filterPlacesForDisplay(places).filter(
    (p) => !!p.image_url?.trim() && !isBadImageUrl(p.image_url)
  );
}
