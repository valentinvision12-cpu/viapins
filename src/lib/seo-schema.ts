/**
 * Legacy SEO schema adapters - delegate to the enterprise schema engine.
 */

import { generateSchema } from "@/lib/schema";
import {
  buildAdventureFaqs,
  buildCityFaqs,
  buildCountryFaqs,
} from "@/lib/schema/faqs";
import type {
  AttractionEntity,
  CitySchemaData,
  CountrySchemaData,
  HomeSchemaData,
  ItineraryStop,
  JsonLdGraph,
  TripSchemaData,
} from "@/lib/schema/types";
import type { PlaceTranslation } from "./seo";

export interface SchemaPlace {
  id?: string;
  name: string;
  slug?: string;
  lat?: number | null;
  lng?: number | null;
  image_url?: string | null;
  translations?: Record<string, PlaceTranslation>;
  seo_keywords?: string[];
  seo_phrase?: string;
  category?: string;
  type?: string;
  tags?: string[];
}

export interface CitySchemaInput {
  city: string;
  country: string;
  locale: string;
  countrySlug: string;
  citySlug: string;
  heroImage?: string;
  description: string;
  intro: string;
  keywords: string[];
  places: SchemaPlace[];
  faqs?: CitySchemaData["faqs"];
}

function toAttractionEntity(place: SchemaPlace): AttractionEntity {
  return {
    id: place.id,
    name: place.name,
    slug: place.slug,
    lat: place.lat,
    lng: place.lng,
    image_url: place.image_url,
    translations: place.translations,
    seoKeywords: place.seo_keywords,
    category: place.category ?? place.type,
    type: place.type,
    tags: place.tags,
  };
}

export function buildCityJsonLd(input: CitySchemaInput): JsonLdGraph {
  const data: CitySchemaData = {
    locale: input.locale,
    country: input.country,
    city: input.city,
    countrySlug: input.countrySlug,
    citySlug: input.citySlug,
    description: input.description,
    intro: input.intro,
    keywords: input.keywords,
    heroImage: input.heroImage,
    places: input.places.map(toAttractionEntity),
    faqs: input.faqs ?? buildCityFaqs(input.city, input.country),
  };
  return generateSchema("city", data).jsonLd;
}

export function buildHomeJsonLd(locale: string): JsonLdGraph {
  const data: HomeSchemaData = { locale };
  return generateSchema("home", data).jsonLd;
}

export function buildCountryJsonLd(input: {
  country: string;
  locale: string;
  countrySlug: string;
  description: string;
  coverImage?: string;
  cities: {
    name: string;
    slug: string;
    coverImage?: string;
    placeCount: number;
  }[];
  faqs?: CountrySchemaData["faqs"];
}): JsonLdGraph {
  const data: CountrySchemaData = {
    locale: input.locale,
    country: input.country,
    countrySlug: input.countrySlug,
    description: input.description,
    coverImage: input.coverImage,
    cities: input.cities.map((c) => ({
      name: c.name,
      slug: c.slug,
      coverImage: c.coverImage,
      placeCount: c.placeCount,
    })),
    faqs: input.faqs ?? buildCountryFaqs(input.country),
  };
  return generateSchema("country", data).jsonLd;
}

export function buildAdventureJsonLd(input: {
  locale: string;
  country: string;
  countrySlug: string;
  title: string;
  description: string;
  heroImage?: string;
  totalDays?: number;
  stops: ItineraryStop[];
  faqs?: TripSchemaData["faqs"];
}): JsonLdGraph {
  const data: TripSchemaData = {
    locale: input.locale,
    country: input.country,
    countrySlug: input.countrySlug,
    title: input.title,
    description: input.description,
    heroImage: input.heroImage,
    totalDays: input.totalDays,
    stops: input.stops,
    faqs:
      input.faqs ??
      buildAdventureFaqs(
        input.country,
        input.totalDays ?? 1,
        input.stops.length
      ),
  };
  return generateSchema("trip", data).jsonLd;
}
