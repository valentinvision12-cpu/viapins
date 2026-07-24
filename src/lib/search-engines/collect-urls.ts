import { getSiteUrl, SEO_LOCALES } from "@/lib/seo";
import { placeSlug } from "@/lib/place-slug";
import {
  getCachedSitemapCatalog,
  guidePathsForCities,
  placePaths,
  staysPathsForCities,
} from "@/lib/sitemap-data";
import { getAdventureCountrySlugs } from "@/lib/adventure-data";

function absoluteLocalized(path: string): string[] {
  const site = getSiteUrl().replace(/\/$/, "");
  const bare = path.startsWith("/") ? path : `/${path}`;
  return SEO_LOCALES.map((locale) => `${site}/${locale}${bare === "/" ? "" : bare}`);
}

function unique(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

/** All locale URLs for a published city + optional place pages. */
export function urlsForDestination(opts: {
  countrySlug: string;
  citySlug: string;
  placeNames?: string[];
  placeIds?: string[];
  includeGuides?: boolean;
  includeStays?: boolean;
}): string[] {
  const { countrySlug, citySlug } = opts;
  const urls: string[] = [];

  urls.push(...absoluteLocalized(`/explore/${countrySlug}`));
  urls.push(...absoluteLocalized(`/explore/${countrySlug}/${citySlug}`));

  if (opts.includeGuides !== false) {
    for (const path of guidePathsForCities([{ countrySlug, citySlug }])) {
      urls.push(...absoluteLocalized(path));
    }
  }
  if (opts.includeStays !== false) {
    urls.push(
      ...absoluteLocalized(`/explore/${countrySlug}/${citySlug}/stays`)
    );
  }

  const names = opts.placeNames ?? [];
  const ids = opts.placeIds ?? [];
  for (let i = 0; i < names.length; i++) {
    const slug = placeSlug(names[i], ids[i]);
    if (!slug) continue;
    urls.push(
      ...absoluteLocalized(`/explore/${countrySlug}/${citySlug}/${slug}`)
    );
  }

  return unique(urls);
}

/** City page URLs only (useful for URL_DELETED on unpublish). */
export function urlsForCityPage(countrySlug: string, citySlug: string): string[] {
  return unique(absoluteLocalized(`/explore/${countrySlug}/${citySlug}`));
}

/** Adventure hub URLs for a country. */
export function urlsForAdventure(countrySlug: string): string[] {
  return unique([
    ...absoluteLocalized(`/explore/${countrySlug}/adventure`),
    ...absoluteLocalized(`/explore/${countrySlug}`),
    ...absoluteLocalized("/adventures"),
  ]);
}

/** Rough URL set for one country (cities + places already in catalog). */
export async function urlsForCountry(countrySlug: string): Promise<string[]> {
  const { cities, places } = await getCachedSitemapCatalog();
  const countryCities = cities.filter((c) => c.countrySlug === countrySlug);
  const countryPlaces = places.filter((p) => p.countrySlug === countrySlug);
  const urls: string[] = [
    ...absoluteLocalized(`/explore/${countrySlug}`),
    ...absoluteLocalized(`/explore/${countrySlug}/adventure`),
  ];
  for (const city of countryCities) {
    urls.push(
      ...absoluteLocalized(`/explore/${city.countrySlug}/${city.citySlug}`)
    );
  }
  for (const path of guidePathsForCities(countryCities)) {
    urls.push(...absoluteLocalized(path));
  }
  for (const path of staysPathsForCities(countryCities)) {
    urls.push(...absoluteLocalized(path));
  }
  for (const path of placePaths(countryPlaces)) {
    urls.push(...absoluteLocalized(path));
  }
  return unique(urls);
}

/**
 * Collect (almost) all public indexable URLs — mirrors sitemap.ts path set.
 */
export async function collectAllSiteUrls(): Promise<string[]> {
  const urls: string[] = [
    ...absoluteLocalized(""),
    ...absoluteLocalized("/adventures"),
    ...absoluteLocalized("/discover"),
    ...absoluteLocalized("/search"),
    ...absoluteLocalized("/terms"),
    ...absoluteLocalized("/privacy"),
  ];

  const { cities, places } = await getCachedSitemapCatalog();
  const countrySet = new Set(cities.map((c) => c.countrySlug));

  for (const countrySlug of countrySet) {
    urls.push(...absoluteLocalized(`/explore/${countrySlug}`));
  }
  for (const city of cities) {
    urls.push(
      ...absoluteLocalized(`/explore/${city.countrySlug}/${city.citySlug}`)
    );
  }
  for (const slug of await getAdventureCountrySlugs()) {
    urls.push(...absoluteLocalized(`/explore/${slug}/adventure`));
  }
  for (const path of guidePathsForCities(cities)) {
    urls.push(...absoluteLocalized(path));
  }
  for (const path of staysPathsForCities(cities)) {
    urls.push(...absoluteLocalized(path));
  }
  for (const path of placePaths(places)) {
    urls.push(...absoluteLocalized(path));
  }

  return unique(urls);
}

export async function estimateSiteUrlCount(): Promise<number> {
  try {
    const urls = await collectAllSiteUrls();
    return urls.length;
  } catch {
    return 0;
  }
}
