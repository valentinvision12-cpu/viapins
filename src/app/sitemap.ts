import type { MetadataRoute } from "next";
import { getSiteUrl, SEO_LOCALES } from "@/lib/seo";
import { collectAllPathBatches } from "@/lib/sitemap-catalog";
import {
  getPathsPerSitemapChunk,
  listSitemapChunkIds,
  parseSitemapChunkId,
} from "@/lib/sitemap-chunks";

/** Always fetch live catalog — build-time SSG left empty/partial urlsets on Vercel. */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

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
 * Child sitemaps at /sitemap/{id}.xml.
 * Index is served by src/app/sitemap.xml/route.ts (Next does not expose /sitemap.xml
 * reliably when generateSitemaps() is used).
 */
export async function generateSitemaps() {
  return listSitemapChunkIds();
}

export default async function sitemap(props: {
  id: number | Promise<number | string>;
}): Promise<MetadataRoute.Sitemap> {
  const rawId = await props.id;
  const id = parseSitemapChunkId(
    typeof rawId === "number" || typeof rawId === "string" ? rawId : String(rawId)
  );
  if (id === null) return [];

  const batches = await collectAllPathBatches();
  const pathsPerChunk = getPathsPerSitemapChunk();
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
