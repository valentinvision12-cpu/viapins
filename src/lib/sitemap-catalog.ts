import type { MetadataRoute } from "next";
import { getAdventureCountrySlugs } from "@/lib/adventure-data";
import {
  getCachedSitemapCatalog,
  guidePathsForCities,
  placePaths,
  staysPathsForCities,
  type SitemapCity,
  type SitemapPlace,
} from "@/lib/sitemap-data";

export type SitemapPathBatch = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified: Date;
};

function pathLastModified(
  path: string,
  cities: SitemapCity[],
  places: SitemapPlace[],
  countryDates: Map<string, Date>,
  fallback: Date
): Date {
  const placeMatch = path.match(/^\/explore\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (placeMatch && placeMatch[3] !== "guide" && placeMatch[3] !== "stays") {
    const [, countrySlug, citySlug, placeSlug] = placeMatch;
    const hit = places.find(
      (p) =>
        p.countrySlug === countrySlug &&
        p.citySlug === citySlug &&
        p.placeSlug === placeSlug
    );
    if (hit) return hit.lastModified;
  }

  const guideOrStays = path.match(
    /^\/explore\/([^/]+)\/([^/]+)\/(?:guide\/[^/]+|stays)$/
  );
  if (guideOrStays) {
    const [, countrySlug, citySlug] = guideOrStays;
    const hit = cities.find(
      (c) => c.countrySlug === countrySlug && c.citySlug === citySlug
    );
    if (hit) return hit.lastModified;
  }

  const cityMatch = path.match(/^\/explore\/([^/]+)\/([^/]+)$/);
  if (cityMatch && cityMatch[2] !== "adventure") {
    const [, countrySlug, citySlug] = cityMatch;
    const hit = cities.find(
      (c) => c.countrySlug === countrySlug && c.citySlug === citySlug
    );
    if (hit) return hit.lastModified;
  }

  const adventureMatch = path.match(/^\/explore\/([^/]+)\/adventure$/);
  if (adventureMatch) {
    return countryDates.get(adventureMatch[1]) ?? fallback;
  }

  const countryMatch = path.match(/^\/explore\/([^/]+)$/);
  if (countryMatch) {
    return countryDates.get(countryMatch[1]) ?? fallback;
  }

  return fallback;
}

/**
 * Shared path catalog for sitemap.xml and IndexNow/Google URL collection.
 * Excludes /search and thin/empty destination pages.
 */
export async function collectAllPathBatches(): Promise<SitemapPathBatch[]> {
  const now = new Date();
  const batches: SitemapPathBatch[] = [];

  batches.push({
    path: "",
    changeFrequency: "daily",
    priority: 1.0,
    lastModified: now,
  });
  batches.push({
    path: "/adventures",
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: now,
  });
  batches.push({
    path: "/discover",
    changeFrequency: "daily",
    priority: 0.5,
    lastModified: now,
  });
  // /search intentionally omitted — low-value hub; query pages are noindex.
  batches.push({
    path: "/terms",
    changeFrequency: "monthly",
    priority: 0.2,
    lastModified: now,
  });
  batches.push({
    path: "/privacy",
    changeFrequency: "monthly",
    priority: 0.2,
    lastModified: now,
  });

  const { cities, places } = await getCachedSitemapCatalog();
  const indexableCities = cities.filter((c) => c.indexable);
  const indexablePlaces = places.filter((p) => p.indexable);

  const countryDates = new Map<string, Date>();
  for (const city of cities) {
    const prev = countryDates.get(city.countrySlug);
    if (!prev || city.lastModified.getTime() > prev.getTime()) {
      countryDates.set(city.countrySlug, city.lastModified);
    }
  }

  // Countries that still have at least one indexable city.
  const countrySet = new Set(indexableCities.map((c) => c.countrySlug));

  for (const countrySlug of countrySet) {
    batches.push({
      path: `/explore/${countrySlug}`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: countryDates.get(countrySlug) ?? now,
    });
  }

  for (const city of indexableCities) {
    batches.push({
      path: `/explore/${city.countrySlug}/${city.citySlug}`,
      changeFrequency: "weekly",
      priority: 0.85,
      lastModified: city.lastModified,
    });
  }

  for (const slug of await getAdventureCountrySlugs()) {
    batches.push({
      path: `/explore/${slug}/adventure`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: countryDates.get(slug) ?? now,
    });
  }

  for (const path of guidePathsForCities(indexableCities)) {
    batches.push({
      path,
      changeFrequency: "weekly",
      priority: 0.75,
      lastModified: pathLastModified(
        path,
        indexableCities,
        indexablePlaces,
        countryDates,
        now
      ),
    });
  }

  for (const path of staysPathsForCities(indexableCities)) {
    batches.push({
      path,
      changeFrequency: "weekly",
      priority: 0.65,
      lastModified: pathLastModified(
        path,
        indexableCities,
        indexablePlaces,
        countryDates,
        now
      ),
    });
  }

  for (const place of indexablePlaces) {
    batches.push({
      path: `/explore/${place.countrySlug}/${place.citySlug}/${place.placeSlug}`,
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: place.lastModified,
    });
  }

  // Freshest content first so early sitemap chunks prioritize recent updates.
  batches.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return batches;
}

/** Absolute-path list (no locale prefix) for indexing helpers. */
export async function collectAllCatalogPaths(): Promise<string[]> {
  const batches = await collectAllPathBatches();
  return batches.map((b) => b.path);
}
