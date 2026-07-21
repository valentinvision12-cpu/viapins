import { createServiceClient } from "@/lib/supabase/service";
import { isBadImageUrl, resolvePlaceImage } from "@/lib/wiki-image";

type PlaceLike = {
  id: string;
  name: string;
  image_url: string;
  lat?: number;
  lng?: number;
  translations?: Record<string, { wiki_title?: string; maps_query?: string }>;
};

/**
 * Best-effort: fill empty OR bad image_urls before render (max ~1.2s).
 * Remaining gaps are healed by PlaceCard client fallback.
 */
export async function ensurePlacesHaveImages<T extends PlaceLike>(
  places: T[],
  city: string,
  country: string
): Promise<T[]> {
  const needs = places.filter(
    (p) => !p.image_url?.trim() || isBadImageUrl(p.image_url)
  );
  if (needs.length === 0) return places;

  const supabase = createServiceClient();
  const avoidUrls = new Set(
    places
      .map((p) => p.image_url?.trim())
      .filter((u): u is string => !!u && !isBadImageUrl(u))
  );

  const updates = new Map<string, string>();

  const work = needs.slice(0, 3).map(async (place) => {
    const en = place.translations?.en;
    try {
      const url = await resolvePlaceImage(
        {
          placeName: place.name,
          wikiTitle: en?.wiki_title || place.name,
          city,
          country,
          lat: place.lat,
          lng: place.lng,
          mapsQuery: en?.maps_query,
          avoidUrls,
          preferCommons: true,
        },
        900
      );
      if (!url || isBadImageUrl(url) || avoidUrls.has(url)) return;
      avoidUrls.add(url);
      updates.set(place.id, url);
      if (supabase) {
        await supabase
          .from("places")
          .update({ image_url: url, updated_at: new Date().toISOString() })
          .eq("id", place.id);
      }
    } catch {
      /* ignore — PlaceCard client fallback still runs */
    }
  });

  await Promise.race([
    Promise.all(work),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  if (updates.size === 0) return places;
  return places.map((p) =>
    updates.has(p.id) ? { ...p, image_url: updates.get(p.id)! } : p
  );
}
