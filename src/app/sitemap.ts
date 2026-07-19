import type { MetadataRoute } from "next";
import { getPublishedDestinations } from "@/actions/get-destinations";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { getSiteUrl } from "@/lib/seo";

const LOCALES = ["en"] as const;

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: locale === "en" ? 1.0 : 0.9,
    });
  }

  let destinations = await getPublishedDestinations();
  if (destinations.length === 0) {
    destinations = DEMO_DESTINATIONS.map((d) => ({
      id: d.id,
      city: d.city,
      country: d.country,
      tags: d.tags,
      coverImage: d.cityImage || d.places[0]?.image_url || "",
      placeCount: d.places.length,
      slug: { country: slugify(d.country), city: slugify(d.city) },
    }));
  }

  // Country pages
  const countrySet = new Set(destinations.map((d) => d.slug.country));
  for (const countrySlug of countrySet) {
    entries.push({
      url: `${baseUrl}/en/explore/${countrySlug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // City pages
  for (const dest of destinations) {
    entries.push({
      url: `${baseUrl}/en/explore/${dest.slug.country}/${dest.slug.city}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  const { getAdventureCountrySlugs } = await import("@/lib/adventure-data");
  for (const slug of await getAdventureCountrySlugs()) {
    entries.push({
      url: `${baseUrl}/en/explore/${slug}/adventure`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  entries.push(
    { url: `${baseUrl}/en/adventures`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/en/terms`,   lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/en/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.2 }
  );

  return entries;
}
