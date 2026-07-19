"use server";

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
import { pickCityCoverFromPlaces, pickCountryCoversFromCities } from "@/lib/city-cover";
import { isBadImageUrl } from "@/lib/wiki-image";
import type { DestinationSeo } from "@/lib/seo";

export interface CountryCard {
  /** Full display name (no abbreviations) */
  country: string;
  slug: string;
  /** Primary cover (first landmark) */
  coverImage: string;
  /** Up to 3 rotating landmark covers */
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
  /** SEO slug for the /explore/[country]/[city] route */
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

const DESTINATION_LIST_SELECT = `
  id, city, country, tags, cover_image,
  places(id, name, image_url, order_index)
`;

const DESTINATION_LIST_SELECT_LEGACY = `
  id, city, country, tags,
  places(id, name, image_url, order_index)
`;

const DESTINATION_DETAIL_SELECT = `
  id, city, country, tags, cover_image,
  places(id, name, image_url, lat, lng, order_index, translations)
`;

const DESTINATION_DETAIL_SELECT_LEGACY = `
  id, city, country, tags,
  places(id, name, image_url, lat, lng, order_index, translations)
`;

function missingCoverColumn(error: { message?: string } | null): boolean {
  return !!error?.message?.includes("cover_image");
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

/** Fetch all published destinations with their cover image (first place). */
export async function getPublishedDestinations(): Promise<DestinationCard[]> {
  if (!supabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("destinations")
      .select(DESTINATION_LIST_SELECT)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (missingCoverColumn(error)) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_LIST_SELECT_LEGACY)
        .eq("published", true)
        .order("created_at", { ascending: false });
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data) return [];

    return data.map((dest) => {
      const places = (dest.places ?? []) as {
        id: string;
        name: string;
        image_url: string;
        order_index: number;
      }[];
      const storedCover = (dest as { cover_image?: string }).cover_image?.trim() ?? "";
      const coverImage =
        storedCover && !isBadImageUrl(storedCover)
          ? storedCover
          : pickCityCoverFromPlaces(places);

      return {
        id: dest.id,
        city: dest.city,
        country: dest.country,
        tags: dest.tags ?? [],
        coverImage,
        placeCount: places.length,
        slug: {
          country: slugify(dest.country),
          city: slugify(dest.city),
        },
      };
    });
  } catch {
    return [];
  }
}

/** Fetch a destination by SEO slugs (country-slug / city-slug). */
export async function getDestinationByCityCountry(
  countrySlug: string,
  citySlug: string
): Promise<DestinationDetail | null> {
  if (!supabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    // Narrow by city first (indexed-friendly), then match slugs in memory.
    const cityHint = citySlug.replace(/-/g, " ");
    let { data: candidates, error } = await supabase
      .from("destinations")
      .select(DESTINATION_DETAIL_SELECT)
      .eq("published", true)
      .ilike("city", `%${cityHint.split(" ")[0]}%`)
      .limit(40);

    if (missingCoverColumn(error)) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_DETAIL_SELECT_LEGACY)
        .eq("published", true)
        .ilike("city", `%${cityHint.split(" ")[0]}%`)
        .limit(40);
      candidates = legacy.data as typeof candidates;
      error = legacy.error;
    }

    if (error) {
      console.error("[getDestinationByCityCountry]", error.message);
      return null;
    }

    let match = (candidates ?? []).find(
      (d) =>
        slugify(d.country) === countrySlug && slugify(d.city) === citySlug
    );

    // Fallback if city hint missed (diacritics / unusual names)
    if (!match) {
      let { data: all, error: allErr } = await supabase
        .from("destinations")
        .select(DESTINATION_DETAIL_SELECT)
        .eq("published", true);
      if (missingCoverColumn(allErr)) {
        const legacy = await supabase
          .from("destinations")
          .select(DESTINATION_DETAIL_SELECT_LEGACY)
          .eq("published", true);
        all = legacy.data as typeof all;
        allErr = legacy.error;
      }
      if (allErr || !all) return null;
      match = all.find(
        (d) =>
          slugify(d.country) === countrySlug && slugify(d.city) === citySlug
      );
    }

    if (!match) return null;

    const places = (match.places ?? []) as DestinationDetail["places"];
    const storedCover = (match as { cover_image?: string }).cover_image?.trim() ?? "";
    return {
      id: match.id,
      city: match.city,
      country: match.country,
      tags: match.tags ?? [],
      coverImage: storedCover && !isBadImageUrl(storedCover) ? storedCover : "",
      seo: {},
      places: [...places].sort((a, b) => a.order_index - b.order_index),
    };
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
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("destinations")
      .select(DESTINATION_DETAIL_SELECT)
      .eq("id", id)
      .eq("published", true)
      .single();

    if (missingCoverColumn(error)) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_DETAIL_SELECT_LEGACY)
        .eq("id", id)
        .eq("published", true)
        .single();
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data) return null;

    const places = (data.places ?? []) as DestinationDetail["places"];
    const storedCover = (data as { cover_image?: string }).cover_image?.trim() ?? "";
    return {
      id: data.id,
      city: data.city,
      country: data.country,
      tags: data.tags ?? [],
      coverImage: storedCover && !isBadImageUrl(storedCover) ? storedCover : "",
      seo: {},
      places: [...places].sort((a, b) => a.order_index - b.order_index),
    };
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

function buildCountryCardsFromDestinations(destinations: DestinationCard[]): CountryCard[] {
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

/** Aggregate published cities into country cards with cover images. */
export async function getPublishedCountries(): Promise<CountryCard[]> {
  const destinations = await getPublishedDestinations();
  return buildCountryCardsFromDestinations(destinations);
}

/** Single DB round-trip for the home page (destinations + country cards). */
export async function getPublishedHomeData(): Promise<{
  destinations: DestinationCard[];
  countries: CountryCard[];
}> {
  const destinations = await getPublishedDestinations();
  return {
    destinations,
    countries: buildCountryCardsFromDestinations(destinations),
  };
}

/** First N countries for hero quick-picks. */
export async function getFeaturedCountries(
  limit = TOP_COUNTRIES_HOME
): Promise<CountryCard[]> {
  const all = await getPublishedCountries();
  return all.slice(0, limit);
}

/** Cities in a country (up to 10), for /explore/[country]. */
export async function getCitiesByCountrySlug(
  countrySlug: string
): Promise<{ country: string; cities: DestinationCard[] } | null> {
  if (!supabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const countryHint = countrySlug.replace(/-/g, " ");
    let { data, error } = await supabase
      .from("destinations")
      .select(DESTINATION_LIST_SELECT)
      .eq("published", true)
      .ilike("country", `%${countryHint.split(" ")[0]}%`);

    if (missingCoverColumn(error)) {
      const legacy = await supabase
        .from("destinations")
        .select(DESTINATION_LIST_SELECT_LEGACY)
        .eq("published", true)
        .ilike("country", `%${countryHint.split(" ")[0]}%`);
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data?.length) {
      const destinations = await getPublishedDestinations();
      const cities = destinations.filter((d) => d.slug.country === countrySlug);
      if (cities.length === 0) return null;
      return {
        country: getCountryDisplayName(cities[0].country),
        cities: cities.slice(0, 10),
      };
    }

    const cities = data
      .filter((d) => slugify(d.country) === countrySlug)
      .map((dest) => {
        const places = (dest.places ?? []) as {
          id: string;
          name: string;
          image_url: string;
          order_index: number;
        }[];
        const storedCover =
          (dest as { cover_image?: string }).cover_image?.trim() ?? "";
        const coverImage =
          storedCover && !isBadImageUrl(storedCover)
            ? storedCover
            : pickCityCoverFromPlaces(places);
        return {
          id: dest.id,
          city: dest.city,
          country: dest.country,
          tags: dest.tags ?? [],
          coverImage,
          placeCount: places.length,
          slug: {
            country: slugify(dest.country),
            city: slugify(dest.city),
          },
        } satisfies DestinationCard;
      })
      .sort((a, b) => b.placeCount - a.placeCount)
      .slice(0, 10);

    if (cities.length === 0) return null;
    return {
      country: getCountryDisplayName(cities[0].country),
      cities,
    };
  } catch {
    return null;
  }
}

/** Country card by slug (for country page hero). */
export async function getCountryBySlug(
  countrySlug: string
): Promise<CountryCard | null> {
  const data = await getCitiesByCountrySlug(countrySlug);
  if (!data) return null;
  const cards = buildCountryCardsFromDestinations(data.cities);
  return cards.find((c) => c.slug === countrySlug) ?? cards[0] ?? null;
}

/** Admin: all destinations with place counts (service role when available). */
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
      places(count)
    `)
    .order("country")
    .order("city");

  return (data ?? []).map((d) => ({
    ...d,
    places_count:
      (d.places as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}
