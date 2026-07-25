import type { MetadataRoute } from "next";
import { getSiteUrl, SEO_LOCALES } from "@/lib/seo";
import { collectAllPathBatches } from "@/lib/sitemap-catalog";

/** Soft cap per child sitemap (well under Google's 50k limit). */
const URLS_PER_SITEMAP = 10_000;

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

/**
 * Split into multiple sitemaps — Next.js serves an index at /sitemap.xml
 * and children at /sitemap/{id}.xml.
 */
export async function generateSitemaps() {
  const batches = await collectAllPathBatches();
  // Each path expands to SEO_LOCALES.length URLs.
  const totalUrls = batches.length * SEO_LOCALES.length;
  const count = Math.max(1, Math.ceil(totalUrls / URLS_PER_SITEMAP));
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: number | Promise<number | string>;
}): Promise<MetadataRoute.Sitemap> {
  const rawId = await props.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId) || 0;
  const batches = await collectAllPathBatches();

  // Slice by expanded URL budget (paths × locales).
  const pathsPerChunk = Math.max(1, Math.floor(URLS_PER_SITEMAP / SEO_LOCALES.length));
  const slice = batches.slice(id * pathsPerChunk, (id + 1) * pathsPerChunk);

  const entries: MetadataRoute.Sitemap = [];
  for (const batch of slice) {
    pushLocalized(entries, batch.path, {
      lastModified: batch.lastModified,
      changeFrequency: batch.changeFrequency,
      priority: batch.priority,
    });
  }
  return entries;
}
