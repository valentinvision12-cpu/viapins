import { unstable_cache } from "next/cache";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { placeSlug } from "@/lib/place-slug";
import { slugify } from "@/lib/utils";
import { CITY_GUIDE_SLUGS } from "@/lib/city-guides";

export type SitemapCity = {
  countrySlug: string;
  citySlug: string;
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

function demoCities(): SitemapCity[] {
  return DEMO_DESTINATIONS.map((d) => ({
    countrySlug: slugify(d.country),
    citySlug: slugify(d.city),
  }));
}

function demoPlaces(): SitemapPlace[] {
  return DEMO_DESTINATIONS.flatMap((d) => {
    const countrySlug = slugify(d.country);
    const citySlug = slugify(d.city);
    return d.places.map((p) => ({
      countrySlug,
      citySlug,
      placeSlug: placeSlug(p.name, p.id),
    }));
  });
}

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
      "country, city, country_slug, city_slug, places(id, name, order_index)"
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
    places?: Array<{ id: string; name: string; order_index?: number }> | null;
  }>) {
    const countrySlug = row.country_slug?.trim() || slugify(row.country);
    const citySlug = row.city_slug?.trim() || slugify(row.city);
    const cityKey = `${countrySlug}/${citySlug}`;
    if (!seenCities.has(cityKey)) {
      seenCities.add(cityKey);
      cities.push({ countrySlug, citySlug });
    }

    const sorted = [...(row.places ?? [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    for (const p of sorted) {
      if (!p?.name) continue;
      places.push({
        countrySlug,
        citySlug,
        placeSlug: placeSlug(p.name, p.id),
      });
    }
  }

  if (cities.length === 0) {
    return { cities: demoCities(), places: demoPlaces() };
  }

  return { cities, places };
}

export const getCachedSitemapCatalog = unstable_cache(
  fetchSitemapCatalog,
  ["sitemap-catalog-v1"],
  { revalidate: 3600, tags: ["destinations"] }
);

export function guidePathsForCities(cities: SitemapCity[]): string[] {
  return cities.flatMap((c) =>
    CITY_GUIDE_SLUGS.map(
      (guide) => `/explore/${c.countrySlug}/${c.citySlug}/guide/${guide}`
    )
  );
}

export function staysPathsForCities(cities: SitemapCity[]): string[] {
  return cities.map(
    (c) => `/explore/${c.countrySlug}/${c.citySlug}/stays`
  );
}

export function placePaths(places: SitemapPlace[]): string[] {
  return places.map(
    (p) => `/explore/${p.countrySlug}/${p.citySlug}/${p.placeSlug}`
  );
}
