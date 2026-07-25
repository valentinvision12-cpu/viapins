import { SEO_LOCALES } from "@/lib/seo";
import { collectAllPathBatches } from "@/lib/sitemap-catalog";

/** Soft cap per child sitemap (well under Google's 50k URL limit). */
export const URLS_PER_SITEMAP = 10_000;

/** Paths per chunk so expanded URL count (paths × locales) stays under the soft cap. */
export function getPathsPerSitemapChunk(): number {
  return Math.max(1, Math.floor(URLS_PER_SITEMAP / SEO_LOCALES.length));
}

/**
 * Chunk ids for generateSitemaps() / sitemap index.
 * Count from path slices (not raw URL math) so index and children stay aligned.
 */
export async function listSitemapChunkIds(): Promise<{ id: number }[]> {
  const batches = await collectAllPathBatches();
  const pathsPerChunk = getPathsPerSitemapChunk();
  const count = Math.max(1, Math.ceil(batches.length / pathsPerChunk));
  return Array.from({ length: count }, (_, id) => ({ id }));
}

/** Parse sitemap chunk id; reject non-numeric ids like "index". */
export function parseSitemapChunkId(raw: number | string): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return null;
}