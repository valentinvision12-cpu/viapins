import type { MetadataRoute } from "next";
import { getPublishedDestinations } from "@/actions/get-destinations";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { getSiteUrl } from "@/lib/seo";

const LOCALES = ["en", "es", "fr", "de", "it"] as const;

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

  for (const dest of destinations) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${baseUrl}/${locale}/explore/${dest.slug.country}/${dest.slug.city}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: locale === "en" ? 0.85 : 0.75,
      });
    }
  }

  const { getAdventureCountrySlugs } = await import("@/lib/adventure-data");
  for (const slug of await getAdventureCountrySlugs()) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${baseUrl}/${locale}/explore/${slug}/adventure`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: locale === "en" ? 0.8 : 0.7,
      });
    }
  }

  for (const locale of LOCALES) {
    entries.push(
      {
        url: `${baseUrl}/${locale}/terms`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/${locale}/privacy`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.3,
      }
    );
  }

  return entries;
}
