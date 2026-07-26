import type { Metadata } from "next";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
/**
 * SEO helpers — long-tail titles, descriptions, keywords.
 * Auto-generates defaults; seed files can override per city/place.
 */

/**
 * Search Console / Bing / Yandex verification tokens from env.
 * Unused vars are omitted from the metadata object.
 */
export function buildVerificationMetadata(): NonNullable<Metadata["verification"]> {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
  const yandex = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION?.trim();
  const other: Record<string, string | (string | number)[]> = {};
  if (bing) other["msvalidate.01"] = bing;
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
}

export type Locale = "en" | "bg" | "es" | "fr" | "de" | "it";

export interface PlaceTranslation {
  description: string;
  wiki_text: string;
  seo_keywords?: string[];
  seo_phrase?: string;
}

export interface DestinationSeo {
  title?: string;
  description?: string;
  intro?: string;
  h1_subtitle?: string;
  keywords?: string[];
}

export interface CitySeoInput {
  city: string;
  country: string;
  placeCount: number;
  locale?: string;
  seo?: Record<string, DestinationSeo> | DestinationSeo;
  topPlaceNames?: string[];
}

export interface PlaceSeoInput {
  name: string;
  city: string;
  country: string;
  locale?: string;
  translations?: Record<string, PlaceTranslation>;
  seo_keywords?: string[];
  seo_phrase?: string;
}

export interface CitySeoOutput {
  title: string;
  description: string;
  intro: string;
  h1Subtitle: string;
  keywords: string[];
}

export interface PlaceSeoOutput {
  seoPhrase: string;
  seoKeywords: string[];
  imageAlt: string;
  schemaDescription: string;
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]
    .map((u) => u?.replace(/\/$/, ""))
    .filter((u): u is string => Boolean(u));

  const isVercelAppHost = (url: string): boolean => {
    try {
      return /\.vercel\.app$/i.test(new URL(url).hostname);
    } catch {
      return /vercel\.app/i.test(url);
    }
  };

  for (const url of candidates) {
    // Never emit preview/deployment hosts in canonical schema or OG URLs.
    if (!isVercelAppHost(url)) return url;
  }

  return SITE_DEFAULT_URL;
}

function resolveLocaleSeo(
  seo: Record<string, DestinationSeo> | DestinationSeo | undefined,
  locale: string
): DestinationSeo | undefined {
  if (!seo) return undefined;
  if ("title" in seo || "description" in seo || "keywords" in seo) {
    return seo as DestinationSeo;
  }
  const map = seo as Record<string, DestinationSeo>;
  return map[locale] ?? map.en;
}

function getPlaceTranslation(
  translations: Record<string, PlaceTranslation> | undefined,
  locale: string
): PlaceTranslation | undefined {
  if (!translations) return undefined;
  return translations[locale] ?? translations.en ?? Object.values(translations)[0];
}

/** Long-tail SEO for a city page — auto-generated with optional overrides */
export function buildCitySeo(input: CitySeoInput): CitySeoOutput {
  const { city, country, placeCount } = input;
  const locale = input.locale ?? "en";
  const custom = resolveLocaleSeo(input.seo, locale);
  const topNames = input.topPlaceNames?.slice(0, 3).join(", ");

  const title =
    custom?.title ??
    `Top ${placeCount} Things to Do in ${city}, ${country} | Travel Guide`;

  const description =
    custom?.description ??
    `Discover ${placeCount} must-see landmarks in ${city}, ${country}. Free GPS travel guide with photos, history${topNames ? ` — including ${topNames}` : ""}. Plan your perfect itinerary in mi[...]

  const h1Subtitle =
    custom?.h1_subtitle ??
    `Top ${placeCount} Things to Do in ${city}, ${country}`;

  const intro =
    custom?.intro ??
    `Planning a trip to ${city}? This free guide covers the ${placeCount} best places to visit in ${city}, ${country} — from iconic landmarks to hidden gems. Save your favorites, build a GPS ro[...]

  const keywords = custom?.keywords ?? [
    `things to do in ${city}`,
    `${city} ${country} travel guide`,
    `best places to visit in ${city}`,
    `${city} landmarks and attractions`,
    `${city} itinerary`,
    `${city} gps route`,
    `what to see in ${city} ${country}`,
    `${city} tourist attractions`,
  ];

  return { title, description, intro, h1Subtitle, keywords };
}

/** SEO for individual landmarks — auto-generated with optional overrides */
export function buildPlaceSeo(input: PlaceSeoInput): PlaceSeoOutput {
  const { name, city, country } = input;
  const locale = input.locale ?? "en";
  const t = getPlaceTranslation(input.translations, locale);

  const seoPhrase =
    input.seo_phrase ??
    t?.seo_phrase ??
    `${name} — one of the top things to do in ${city}, ${country}`;

  const seoKeywords =
    input.seo_keywords ??
    t?.seo_keywords ??
    [
      `${name} ${city}`,
      `${name} ${country}`,
      `visit ${name}`,
      `${name} travel guide`,
      `things to do near ${name}`,
    ];

  const description = t?.description ?? name;

  return {
    seoPhrase,
    seoKeywords,
    imageAlt: `${name}, ${city}, ${country} — ${seoPhrase}`,
    schemaDescription: description,
  };
}

export function buildCityPageUrl(
  locale: string,
  countrySlug: string,
  citySlug: string
): string {
  return `${getSiteUrl()}/${locale}/explore/${countrySlug}/${citySlug}`;
}

export const SEO_LOCALES = ["en", "bg", "es", "fr", "de", "it"] as const;

/** Absolute path → hreflang map for all supported locales (+ x-default → en). */
export function buildLocaleAlternates(path: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const siteUrl = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Strip any supported locale prefix (including bg — previously missing).
  const bare =
    normalized.replace(/^\/(en|bg|es|fr|de|it)(?=\/|$)/, "") || "/";
  const suffix = bare === "/" ? "" : bare;
  const languages: Record<string, string> = {
    "x-default": `${siteUrl}/en${suffix}`,
  };
  for (const locale of SEO_LOCALES) {
    languages[locale] = `${siteUrl}/${locale}${suffix}`;
  }
  return {
    // Canonical defaults to English map entry; pages should override with
    // the current locale URL when emitting Metadata.alternates.canonical.
    canonical: languages.en,
    languages,
  };
}

/** Absolute canonical URL for the current locale + bare path. */
export function buildCanonicalUrl(locale: string, path: string): string {
  const siteUrl = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const bare =
    normalized.replace(/^\/(en|bg|es|fr|de|it)(?=\/|$)/, "") || "/";
  const safeLocale = (SEO_LOCALES as readonly string[]).includes(locale)
    ? locale
    : "en";
  return `${siteUrl}/${safeLocale}${bare === "/" ? "" : bare}`;
}

export function buildCountryPageUrl(locale: string, countrySlug: string): string {
  return `${getSiteUrl()}/${locale}/explore/${countrySlug}`;
}
