"use server";

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { slugify } from "@/lib/utils";
import {
  FEATURED_COUNTRY_ORDER,
  TOP_COUNTRIES_HOME,
} from "@/lib/featured-countries";
import {
  getCountryFlag,
  getCountryFlagUrl,
  getCountryDisplayName,
} from "@/lib/country-meta";
import { getCountryContinent, type Continent } from "@/lib/country-continents";
import {
  blankDuplicatePlaceImages,
  filterPlacesForDisplay,
  filterPlacesWithPhoto,
  pickCityCoverFromPlaces,
  pickCountryCoversFromCities,
} from "@/lib/city-cover";
import { isBadImageUrl } from "@/lib/wiki-image";
import type { DestinationSeo } from "@/lib/seo";

/**
 * Cookie-free client for public destination reads.
 * Required inside unstable_cache (cookies() is not allowed there).
 */
function createPublicReadClient() {
  const service = createServiceClient();
  if (service) return service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || url.includes("placeholder")) return null;
  return createSupabaseJs(url, key);
}

export interface CountryCard {
  country: string;
  slug: string;
  coverImage: string;
  coverImages: string[];
  flag: string;
  flagUrl?: string;
  cityCount: number;
  tags: string[];
  continent: Continent;
}

export interface SearchResultItem {
  type: "country" | "city";
  name: string;
  country: string;
  slug: { country: string; city?: string };
  coverImage: string;
  subtitle: string;
  flag?: string;
  flagUrl?: string;
}

export interface DestinationCard {
  id: string;
  city: string;
  country: string;
  tags: string[];
  coverImage: string;
  placeCount: number;
  slug: { country: string; city: string };
}

export interface DestinationDetail {
  id: string;
  city: string;
  country: string;
  tags: string[];
  coverImage: string;
  seo: Record<string, DestinationSeo> | DestinationSeo;
  places: {
    id: string;
    name: string;
    image_url: string;
    lat: number;
    lng: number;
    order_index: number;
    translations: Record<
      string,
      {
        description: string;
        wiki_text: string;
        wiki_title?: string;
        maps_query?: string;
        maps_url?: string;
        seo_keywords?: string[];
        seo_phrase?: string;
      }
    >;
  }[];
}

/** Light list: no nested places — uses cover_image + place_count when available. */
const DESTINATION_LIST_LIGHT = `
  id, city, country, tags, cover_image, place_count, country_slug, city_slug
`;

const DESTINATION_LIST_WITH_COVERS = `
  id, city, country, tags, cover_image, place_count, country_slug, city_slug,
  places(name, image_url, lat, lng, order_index)
`;

const DESTINATION_LIST_LIGHT_NO_SLUG = `
  id, city, country, tags, cover_image, place_count
`;

const DESTINATION_LIST_LEGACY_NESTED = `
  id, city, country, tags, cover_image,
  places(id, name, image_url, lat, lng, order_index)
`;

const DESTINATION_LIST_LEGACY_MIN = `
  id, city, country, tags,
  places(id, name, image_url, lat, lng, order_index)
`;

const DESTINATION_DETAIL_SELECT = `
  id, city, country, tags, cover_image, seo, country_slug, city_slug,
  places(id, name, image_url, lat, lng, order_index, translations)
`;

const DESTINATION_DETAIL_NO_SLUG = `
  id, city, country, tags, cover_image, seo,
  places(id, name, image_url, lat, lng, order_index, translations)
`;

const DESTINATION_DETAIL_LEGACY = `
  id, city, country, tags, cover_image,
  places(id, name, image_url, lat, lng, order_index, translations)
`;

function missingColumn(error: { message?: string } | null, col: string): boolean {
  return !!error?.message?.includes(col);
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

type DestRow = {
  id: string;
  city: string;
  country: string;
  tags?: string[] | null;
  cover_image?: string | null;
  place_count?: number | null;
  country_slug?: string | null;
  city_slug?: string | null;
  seo?: Record<string, DestinationSeo> | DestinationSeo | null;
  places?: {
    id: string;
    name: string;
    image_url: string;
    order_index: number;
    lat?: number;
    lng?: number;
    translations?: DestinationDetail["places"][0]["translations"];
  }[];
};

function isWeakCoverUrl(url: string): boolean {
  if (!url?.trim() || isBadImageUrl(url)) return true;
  const u = url.toLowerCase();
  // Stock Unsplash/picsum used as "covers" look wrong for named cities
  if (u.includes("images.unsplash.com")) return true;
  if (u.includes("picsum.photos")) return true;
  return false;
}

function placeDescription(place: {
  translations?: Record<string, { description?: string }>;
}): string | undefined {
  return (
    place.translations?.en?.description ||
    place.translations?.bg?.description ||
    undefined
  );
}

function toDestinationCard(dest: DestRow): DestinationCard {
  const places = dest.places ?? [];
  const displayPlaces = filterPlacesForDisplay(
    places.map((p) => ({
      ...p,
      lat: p.lat ?? 0,
      lng: p.lng ?? 0,
      description: placeDescription(p),
    })),
    dest.country
  );
  const storedCover = dest.cover_image?.trim() ?? "";
  const fromPlaces = pickCityCoverFromPlaces(
    filterPlacesWithPhoto(displayPlaces, dest.country)
  );
  // Prefer a real landmark photo over destination.cover_image (often stale/404).
  const coverImage =
    fromPlaces ||
    (storedCover && !isWeakCoverUrl(storedCover) ? storedCover : "");
  const placeCount =
    displayPlaces.length > 0
      ? displayPlaces.length
      : typeof dest.place_count === "number" && dest.place_count > 0
        ? dest.place_count
        : places.length;

  return {
    id: dest.id,
    city: dest.city,
    country: dest.country,
    tags: dest.tags ?? [],
    coverImage,
    placeCount,
    slug: {
      country: dest.country_slug?.trim() || slugify(dest.country),
      city: dest.city_slug?.trim() || slugify(dest.city),
    },
  };
}

function toDestinationDetail(dest: DestRow): DestinationDetail {
  const rawPlaces = (dest.places ?? []) as DestinationDetail["places"];
  const places = blankDuplicatePlaceImages(
    filterPlacesForDisplay(
      rawPlaces.map((p) => ({
        ...p,
        description: placeDescription(p),
        country: dest.country,
      })),
      dest.country
    )
  ).sort((a, b) => a.order_index - b.order_index);
  const storedCover = dest.cover_image?.trim() ?? "";
  const fromPlaces = pickCityCoverFromPlaces(
    filterPlacesWithPhoto(places, dest.country)
  );
  const coverImage =
    fromPlaces ||
    (storedCover && !isWeakCoverUrl(storedCover) ? storedCover : "");
  return {
    id: dest.id,
    city: dest.city,
    country: dest.country,
    tags: dest.tags ?? [],
    coverImage,
    seo: dest.seo ?? {},
    places,
  };
}

async function fetchPublishedDestinationRows(): Promise<DestRow[]> {
  const supabase = createPublicReadClient();
  if (!supabase) return [];

  // Prefer light select (no nested places) — requires migration 007 + 010
  let { data, error } = await supabase
    .from("destinations")
    .select(DESTINATION_LIST_WITH_COVERS)
    .eq("published", true)
    .order("country")
    .order("city");

  if (missingColumn(error, "country_slug") || missingColumn(error, "city_slug")) {
    const mid = await supabase
      .from("destinations")
      .select(DESTINATION_LIST_LIGHT_NO_SLUG)
      .eq("published", true)
      .order("country")
      .order("city");
    data = mid.data as typeof data;
    error = mid.error;
  }

  if (missingColumn(error, "place_count") || missingColumn(error, "cover_image")) {
    const nested = await supabase
      .from("destinations")
      .select(
        missingColumn(error, "cover_image")
          ? DESTINATION_LIST_LEGACY_MIN
          : DESTINATION_LIST_LEGACY_NESTED
      )
      .eq("published", true)
      .order("country")
      .order("city");
    data = nested.data as typeof data;
    error = nested.error;
  }

  if (error || !data) {
    if (error) console.error("[fetchPublishedDestinationRows]", error.message);
    return [];
  }
  return data as DestRow[];
}

/** Fetch all published destinations (light cards — for home / sitemap). */
export async function getPublishedDestinations(): Promise<DestinationCard[]> {
  if (!supabaseConfigured()) return [];
  try {
    const rows = await fetchPublishedDestinationRows();
    return rows.map(toDestinationCard);
  } catch {
    return [];
  }
}

const getCachedPublishedDestinations = unstable_cache(
  async () => getPublishedDestinations(),
  ["published-destinations-v5"],
  { revalidate: 60, tags: ["destinations"] }
);

/** Cached home catalog (5 min). Invalidate via revalidateTag("destinations") on publish. */
export async function getCachedHomeDestinations(): Promise<DestinationCard[]> {
  if (!supabaseConfigured()) return [];
  try {
    return await getCachedPublishedDestinations();
  } catch {
    return getPublishedDestinations();
  }
}

/** Fetch a destination by SEO slugs — one city only, never the whole world. */
export async function getDestinationByCityCountry(
  countrySlug: string,
  citySlug: string
): Promise<DestinationDetail | null> {
  if (!supabaseConfigured()) return null;

  try {
    return await getCachedDestinationBySlugs(countrySlug, citySlug);
  } catch {
    return fetchDestinationByCityCountry(countrySlug, citySlug);
  }
}

const getCachedDestinationBySlugs = unstable_cache(
  async (countrySlug: string, citySlug: string) =>
    fetchDestinationByCityCountry(countrySlug, citySlug),
  ["destination-by-slugs-v6"],
  { revalidate: 60, tags: ["destinations"] }
);

async function fetchDestinationByCityCountry(
  countrySlug: string,
  citySlug: string
): Promise<DestinationDetail | null> {
  try {
    const supabase = createPublicReadClient();
    if (!supabase) return null;

    // Fast path: slug columns (migration 010)
    const { data: bySlug, error: slugErr } = await supabase
      .from("destinations")
      .select(DESTINATION_DETAIL_SELECT)
      .eq("published", true)
      .eq("country_slug", countrySlug)
      .eq("city_slug", citySlug)
      .maybeSingle();

    if (!slugErr && bySlug) {
      return toDestinationDetail(bySlug as DestRow);
    }

    // Missing columns OR empty/unbackfilled slugs → city hint (never full table)
    const cityHint = citySlug.replace(/-/g, " ").split(" ")[0] || citySlug;
    const detailSelect =
      missingColumn(slugErr, "seo") || missingColumn(slugErr, "cover_image")
        ? DESTINATION_DETAIL_LEGACY
        : missingColumn(slugErr, "country_slug")
          ? DESTINATION_DETAIL_NO_SLUG
          : DESTINATION_DETAIL_NO_SLUG;

    let { data: candidates, error } = await supabase
      .from("destinations")
      .select(detailSelect)
      .eq("published", true)
      .ilike("city", `%${cityHint}%`)
      .limit(40);

    if (missingColumn(error, "seo") || missingColumn(error, "cover_image")) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_DETAIL_LEGACY)
        .eq("published", true)
        .ilike("city", `%${cityHint}%`)
        .limit(40);
      candidates = legacy.data as typeof candidates;
      error = legacy.error;
    }

    if (error) {
      console.error("[getDestinationByCityCountry]", error.message);
      return null;
    }

    const match = (candidates as DestRow[] | null)?.find(
      (d) =>
        slugify(d.country) === countrySlug && slugify(d.city) === citySlug
    );
    return match ? toDestinationDetail(match) : null;
  } catch (err) {
    console.error("[getDestinationByCityCountry]", err);
    return null;
  }
}

/** Fetch a single destination with all its places. */
export async function getDestinationById(
  id: string
): Promise<DestinationDetail | null> {
  if (!supabaseConfigured()) return null;

  try {
    const supabase = createPublicReadClient();
    if (!supabase) return null;
    let { data, error } = await supabase
      .from("destinations")
      .select(DESTINATION_DETAIL_NO_SLUG)
      .eq("id", id)
      .eq("published", true)
      .single();

    if (missingColumn(error, "seo") || missingColumn(error, "cover_image")) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_DETAIL_LEGACY)
        .eq("id", id)
        .eq("published", true)
        .single();
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data) return null;
    return toDestinationDetail(data as DestRow);
  } catch {
    return null;
  }
}

function groupDestinationsByCountry(
  destinations: DestinationCard[]
): Map<string, DestinationCard[]> {
  const map = new Map<string, DestinationCard[]>();
  for (const d of destinations) {
    const list = map.get(d.country) ?? [];
    list.push(d);
    map.set(d.country, list);
  }
  return map;
}

function featuredIndex(country: string): number {
  const display = getCountryDisplayName(country);
  const idx = FEATURED_COUNTRY_ORDER.indexOf(
    display as (typeof FEATURED_COUNTRY_ORDER)[number]
  );
  return idx === -1 ? 9999 : idx;
}

function sortCountriesFeatured(cards: CountryCard[]): CountryCard[] {
  return [...cards].sort((a, b) => {
    const ia = featuredIndex(a.country);
    const ib = featuredIndex(b.country);
    if (ia !== ib) return ia - ib;
    return a.country.localeCompare(b.country);
  });
}

function buildCountryCardsFromDestinations(
  destinations: DestinationCard[]
): CountryCard[] {
  const byCountry = groupDestinationsByCountry(destinations);
  const cards: CountryCard[] = [];

  for (const [rawCountry, cities] of byCountry) {
    const country = getCountryDisplayName(rawCountry);
    const sortedCities = [...cities].sort((a, b) => b.placeCount - a.placeCount);
    const { coverImage, coverImages } = pickCountryCoversFromCities(sortedCities);
    const tags = [...new Set(cities.flatMap((c) => c.tags))].slice(0, 4);
    cards.push({
      country,
      slug: slugify(country),
      coverImage,
      coverImages: coverImages.length ? coverImages : coverImage ? [coverImage] : [],
      flag: getCountryFlag(country),
      flagUrl: getCountryFlagUrl(country),
      cityCount: cities.length,
      tags,
      continent: getCountryContinent(country),
    });
  }

  return sortCountriesFeatured(cards);
}

export async function getPublishedCountries(): Promise<CountryCard[]> {
  const destinations = await getCachedHomeDestinations();
  return buildCountryCardsFromDestinations(destinations);
}

export async function getPublishedHomeData(): Promise<{
  destinations: DestinationCard[];
  countries: CountryCard[];
}> {
  const destinations = await getCachedHomeDestinations();
  return {
    destinations,
    countries: buildCountryCardsFromDestinations(destinations),
  };
}

export async function getFeaturedCountries(
  limit = TOP_COUNTRIES_HOME
): Promise<CountryCard[]> {
  const all = await getPublishedCountries();
  return all.slice(0, limit);
}

/**
 * Cities in a country for /explore/[country].
 * No hard cap of 10 — global-ready; UI can paginate later.
 */
export async function getCitiesByCountrySlug(
  countrySlug: string
): Promise<{ country: string; cities: DestinationCard[] } | null> {
  if (!supabaseConfigured()) return null;

  try {
    const supabase = createPublicReadClient();
    if (!supabase) return null;

    // Fast path: country_slug equality
    let { data, error } = await supabase
      .from("destinations")
      .select(DESTINATION_LIST_WITH_COVERS)
      .eq("published", true)
      .eq("country_slug", countrySlug)
      .order("place_count", { ascending: false });

    // Missing columns, query error, OR empty slugs (pre-backfill) → hint fallback
    const needFallback =
      missingColumn(error, "country_slug") ||
      missingColumn(error, "place_count") ||
      missingColumn(error, "cover_image") ||
      !!error ||
      !data?.length;

    if (needFallback) {
      const countryHint =
        countrySlug.replace(/-/g, " ").split(" ")[0] || countrySlug;
      const fallbackSelect =
        missingColumn(error, "cover_image") || missingColumn(error, "place_count")
          ? DESTINATION_LIST_LEGACY_MIN
          : DESTINATION_LIST_LEGACY_NESTED;
      const fallback = await supabase
        .from("destinations")
        .select(fallbackSelect)
        .eq("published", true)
        .ilike("country", `%${countryHint}%`);
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error || !data?.length) return null;

    const byCitySlug = new Map<string, DestinationCard>();
    for (const dest of data as DestRow[]) {
      const card = toDestinationCard(dest);
      if (card.slug.country !== countrySlug) continue;
      const existing = byCitySlug.get(card.slug.city);
      if (!existing || card.placeCount > existing.placeCount) {
        byCitySlug.set(card.slug.city, card);
      }
    }

    const cities = [...byCitySlug.values()].sort(
      (a, b) => b.placeCount - a.placeCount
    );
    if (cities.length === 0) return null;
    return {
      country: getCountryDisplayName(cities[0].country),
      cities,
    };
  } catch {
    return null;
  }
}

export async function getCountryBySlug(
  countrySlug: string
): Promise<CountryCard | null> {
  const data = await getCitiesByCountrySlug(countrySlug);
  if (!data) return null;
  const cards = buildCountryCardsFromDestinations(data.cities);
  return cards.find((c) => c.slug === countrySlug) ?? cards[0] ?? null;
}

export async function getAllDestinationsForAdmin(): Promise<
  Array<{
    id: string;
    city: string;
    country: string;
    tags: string[];
    published: boolean;
    created_at: string;
    places_count: number;
  }>
> {
  if (!supabaseConfigured()) return [];

  const supabase = createServiceClient() ?? (await createClient());

  const { data } = await supabase
    .from("destinations")
    .select(`
      id,
      city,
      country,
      tags,
      published,
      created_at,
      place_count,
      places(count)
    `)
    .order("country")
    .order("city");

  return (data ?? []).map((d) => ({
    id: d.id,
    city: d.city,
    country: d.country,
    tags: d.tags ?? [],
    published: d.published,
    created_at: d.created_at,
    places_count:
      (typeof d.place_count === "number" && d.place_count > 0
        ? d.place_count
        : null) ??
      (d.places as unknown as { count: number }[])?.[0]?.count ??
      0,
  }));
}
