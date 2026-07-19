import type { MetadataRoute } from "next";
import { getCachedHomeDestinations } from "@/actions/get-destinations";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { getSiteUrl, SEO_LOCALES } from "@/lib/seo";

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function localeAlternates(path: string): Record<string, string> {
  const baseUrl = getSiteUrl();
  const bare = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {
    "x-default": `${baseUrl}/en${bare}`,
  };
  for (const locale of SEO_LOCALES) {
    languages[locale] = `${baseUrl}/${locale}${bare}`;
  }
  return languages;
}

function pushLocalized(
  entries: MetadataRoute.Sitemap,
  path: string,
  opts: {
    lastModified: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }
) {
  const languages = localeAlternates(path);
  for (const locale of SEO_LOCALES) {
    entries.push({
      url: languages[locale],
      lastModified: opts.lastModified,
      changeFrequency: opts.changeFrequency,
      priority: locale === "en" ? opts.priority : Math.max(0.1, opts.priority - 0.05),
      alternates: { languages },
    });
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  pushLocalized(entries, "", {
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
  });

  let destinations = await getCachedHomeDestinations();
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

  const countrySet = new Set(destinations.map((d) => d.slug.country));
  for (const countrySlug of countrySet) {
    pushLocalized(entries, `/explore/${countrySlug}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  for (const dest of destinations) {
    pushLocalized(
      entries,
      `/explore/${dest.slug.country}/${dest.slug.city}`,
      {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.85,
      }
    );
  }

  const { getAdventureCountrySlugs } = await import("@/lib/adventure-data");
  for (const slug of await getAdventureCountrySlugs()) {
    pushLocalized(entries, `/explore/${slug}/adventure`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  pushLocalized(entries, "/adventures", {
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  });
  pushLocalized(entries, "/terms", {
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.2,
  });
  pushLocalized(entries, "/privacy", {
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.2,
  });

  return entries;
}
