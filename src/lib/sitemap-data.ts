import { unstable_cache } from "next/cache";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { placeSlug } from "@/lib/place-slug";
import { slugify } from "@/lib/utils";
import { CITY_GUIDE_SLUGS } from "@/lib/city-guides";
import { isThinPlaceContent } from "@/lib/seo/content-quality";

export type SitemapCity = {
  countrySlug: string;
  citySlug: string;
  lastModified: Date;
  /** False when the city has no places (empty category). */
  indexable: boolean;
};

export type SitemapPlace = SitemapCity & {
  placeSlug: string;
};

function createPublicReadClient() {
  const service = createServiceClient();
  if (service) return service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || url.includes("placeholder")) return null;
  return createSupabaseJs(url, key);
}

function toDate(value: string | null | undefined, fallback = new Date()): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

function demoCities(): SitemapCity[] {
  const now = new Date();
  return DEMO_DESTINATIONS.map((d) => ({
    countrySlug: slugify(d.country),
    citySlug: slugify(d.city),
    lastModified: now,
    indexable: d.places.length > 0,
  }));
}

function demoPlaces(): SitemapPlace[] {
  const now = new Date();
  return DEMO_DESTINATIONS.flatMap((d) => {
    const countrySlug = slugify(d.country);
    const citySlug = slugify(d.city);
    return d.places
      .filter(
        (p) =>
          !isThinPlaceContent({
            translations: p.translations,
            locale: "en",
          })
      )
      .map((p) => ({
        countrySlug,
        citySlug,
        placeSlug: placeSlug(p.name, p.id),
        lastModified: now,
        indexable: true,
      }));
  });
}

type PlaceRow = {
  id: string;
  name: string;
  order_index?: number;
  updated_at?: string | null;
  translations?: Record<
    string,
    { description?: string; wiki_text?: string } | undefined
  > | null;
};

async function fetchSitemapCatalog(): Promise<{
  cities: SitemapCity[];
  places: SitemapPlace[];
}> {
  const supabase = createPublicReadClient();
  if (!supabase) {
    return { cities: demoCities(), places: demoPlaces() };
  }

  const { data, error } = await supabase
    .from("destinations")
    .select(
      "country, city, country_slug, city_slug, updated_at, places(id, name, order_index, updated_at, translations)"
    )
    .eq("published", true)
    .order("country")
    .order("city");

  if (error || !data?.length) {
    if (error) console.error("[sitemap-data]", error.message);
    return { cities: demoCities(), places: demoPlaces() };
  }

  const cities: SitemapCity[] = [];
  const places: SitemapPlace[] = [];
  const seenCities = new Set<string>();

  for (const row of data as Array<{
    country: string;
    city: string;
    country_slug?: string | null;
    city_slug?: string | null;
    updated_at?: string | null;
    places?: PlaceRow[] | null;
  }>) {
    const countrySlug = row.country_slug?.trim() || slugify(row.country);
    const citySlug = row.city_slug?.trim() || slugify(row.city);
    const cityKey = `${countrySlug}/${citySlug}`;
    const destUpdated = toDate(row.updated_at);
    const sorted = [...(row.places ?? [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    let cityLastMod = destUpdated;

    for (const p of sorted) {
      if (!p?.name) continue;
      const placeUpdated = toDate(p.updated_at, destUpdated);
      cityLastMod = maxDate(cityLastMod, placeUpdated);

      // Compute quality once; store only boolean in the cached catalog.
      const indexable = !isThinPlaceContent({
        translations: p.translations ?? undefined,
        locale: "en",
      });
      if (!indexable) continue;

      places.push({
        countrySlug,
        citySlug,
        placeSlug: placeSlug(p.name, p.id),
        lastModified: placeUpdated,
        indexable: true,
      });
    }

    if (!seenCities.has(cityKey)) {
      seenCities.add(cityKey);
      cities.push({
        countrySlug,
        citySlug,
        lastModified: cityLastMod,
        // Empty cities (no places) are not indexable / excluded from sitemap.
        // Thin places are excluded individually; the city shell remains if any places exist.
        indexable: sorted.length > 0,
      });
    }
  }

  if (cities.length === 0) {
    return { cities: demoCities(), places: demoPlaces() };
  }

  return { cities, places };
}

const getCachedSitemapCatalogRaw = unstable_cache(
  fetchSitemapCatalog,
  ["sitemap-catalog-v2"],
  { revalidate: 3600, tags: ["destinations"] }
);

/** Rehydrate Date fields — unstable_cache JSON round-trips Dates as strings. */
export async function getCachedSitemapCatalog(): Promise<{
  cities: SitemapCity[];
  places: SitemapPlace[];
}> {
  const raw = await getCachedSitemapCatalogRaw();
  return {
    cities: raw.cities.map((c) => ({
      ...c,
      lastModified: toDate(
        c.lastModified instanceof Date
          ? c.lastModified.toISOString()
          : (c.lastModified as unknown as string)
      ),
    })),
    places: raw.places.map((p) => ({
      ...p,
      lastModified: toDate(
        p.lastModified instanceof Date
          ? p.lastModified.toISOString()
          : (p.lastModified as unknown as string)
      ),
    })),
  };
}

export function guidePathsForCities(cities: SitemapCity[]): string[] {
  return cities
    .filter((c) => c.indexable)
    .flatMap((c) =>
      CITY_GUIDE_SLUGS.map(
        (guide) => `/explore/${c.countrySlug}/${c.citySlug}/guide/${guide}`
      )
    );
}

export function staysPathsForCities(cities: SitemapCity[]): string[] {
  return cities
    .filter((c) => c.indexable)
    .map((c) => `/explore/${c.countrySlug}/${c.citySlug}/stays`);
}

export function placePaths(places: SitemapPlace[]): string[] {
  return places
    .filter((p) => p.indexable)
    .map((p) => `/explore/${p.countrySlug}/${p.citySlug}/${p.placeSlug}`);
}
