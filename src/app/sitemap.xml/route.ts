import { getSiteUrl } from "@/lib/seo";
import { listSitemapChunkIds } from "@/lib/sitemap-chunks";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * Explicit sitemap index at /sitemap.xml.
 *
 * Next.js generateSitemaps() serves children at /sitemap/{id}.xml but does not
 * reliably expose a sitemapindex at /sitemap.xml (404 → [locale] HTML). robots.txt
 * and Google expect https://viapins.com/sitemap.xml.
 */
export async function GET() {
  const baseUrl = getSiteUrl();
  const chunks = await listSitemapChunkIds();
  const lastmod = new Date().toISOString();

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...chunks.map(
      ({ id }) =>
        `  <sitemap>\n    <loc>${baseUrl}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
    ),
    `</sitemapindex>`,
    ``,
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}