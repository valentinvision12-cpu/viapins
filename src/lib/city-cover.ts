import { isBadImageUrl, isFragileWikimediaUrl } from "./wiki-image";
import { isValidMapLocation } from "./place-links";
import { isDeathRelatedPlace } from "./death-place-filter";
import { isNonChristianReligiousPlace } from "./non-christian-place-filter";
import { isMapOrNonLandmarkPlace } from "./map-place-filter";
import { isVaguePlace } from "./precise-place-filter";

export type PlaceCoverSource = {
  name: string;
  image_url: string;
  order_index: number;
};

/** Best cover from existing places — prefers Wikimedia thumbs, skips maps / empty URLs. */
/** Best cover from existing places - prefers Wikimedia thumbs, skips fragile non-thumb URLs unless no alternative. */
export function pickCityCoverFromPlaces(places: PlaceCoverSource[]): string {
  const sorted = [...places].sort((a, b) => a.order_index - b.order_index);
  const usable = sorted.filter(
    (p) => p.image_url?.trim() && !isBadImageUrl(p.image_url)
  );
  const nonFragile = usable.filter((p) => !isFragileWikimediaUrl(p.image_url));
  // Never pick fragile originals for covers — they frequently 404.
  const pool = nonFragile;
  const thumb = pool.find((p) => new RegExp("/thumb/", "i").test(p.image_url));
  if (thumb) return thumb.image_url;
  return pool[0]?.image_url ?? "";
}

export function resolveCityCoverFromDb(
  storedCover: string | undefined,
  places: PlaceCoverSource[] = []
): string {
  const trimmed = storedCover?.trim() ?? "";
  // Skip fragile non-thumb Commons originals — they often 404.
  if (
    trimmed &&
    !isBadImageUrl(trimmed) &&
    !isFragileWikimediaUrl(trimmed)
  ) {
    return trimmed;
  }
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
  country?: string;
};

/** Valid GPS pins only — also hide death sites, map-entities, vague zones, and non-Christian religious landmarks. */
export function filterPlacesForDisplay<T extends PlaceMapFilter>(
  places: T[],
  country?: string
): T[] {
  return places.filter(
    (p) =>
      isValidMapLocation(p.lat, p.lng, p.name) &&
      !isDeathRelatedPlace(p.name, p.description) &&
      !isMapOrNonLandmarkPlace(p.name) &&
      !isNonChristianReligiousPlace(p.name, p.description, p.image_url) &&
      !isVaguePlace(
        p.name,
        p.description,
        country ?? p.country,
        p.lat,
        p.lng
      )
  );
}

/** Map uses the same pins as the list — accuracy comes from Google Place ID + coords in DB. */
export function filterPlacesForMap<T extends PlaceMapFilter>(
  places: T[],
  country?: string
): T[] {
  return filterPlacesForDisplay(places, country);
}

/** Places with a usable photo (covers, galleries). */
export function filterPlacesWithPhoto<T extends PlaceMapFilter>(
  places: T[],
  country?: string
): T[] {
  return filterPlacesForDisplay(places, country).filter(
    (p) => !!p.image_url?.trim() && !isBadImageUrl(p.image_url)
  );
}

/**
 * Clear duplicate image_urls within a city so later healing can fetch unique photos.
 * Keeps the first occurrence (by order).
 */
export function blankDuplicatePlaceImages<T extends { image_url: string }>(
  places: T[]
): T[] {
  const seen = new Set<string>();
  return places.map((p) => {
    const url = p.image_url?.trim() ?? "";
    if (!url || isBadImageUrl(url)) return p;
    if (seen.has(url)) return { ...p, image_url: "" };
    seen.add(url);
    return p;
  });
}
