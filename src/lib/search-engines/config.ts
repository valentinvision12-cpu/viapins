import type { IndexingPrefs } from "./types";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/seo";

export const DEFAULT_INDEXING_PREFS: IndexingPrefs = {
  auto_notify: true,
  indexnow: true,
  google: true,
  sitemap_ping: true,
};

/** IndexNow allows up to 10_000 URLs per request. */
export const INDEXNOW_BATCH_SIZE = 10_000;

/** Soft cap for Google Indexing API (~200/day quota). */
export const GOOGLE_DAILY_SOFT_CAP = 200;

/** When submitting the entire site, only push this many to Google. */
export const GOOGLE_FULL_SITE_CAP = 40;

/** Keep N recent runs in indexing_config.last_runs. */
export const MAX_LAST_RUNS = 25;

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export const SITEMAP_PING_TARGETS = [
  (sitemapUrl: string) =>
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  (sitemapUrl: string) =>
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
] as const;

/**
 * Public production origin for search-engine submits.
 * Local admin uses localhost for browsing, but IndexNow/Google must
 * always receive https://viapins.com URLs.
 */
export function getIndexingSiteUrl(): string {
  const explicit = process.env.INDEXING_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit && /^https?:\/\//i.test(explicit)) {
    try {
      const host = new URL(explicit).hostname;
      if (host && host !== "localhost" && !host.startsWith("127.")) {
        return explicit;
      }
    } catch {
      /* fall through */
    }
  }

  const site = getSiteUrl().replace(/\/$/, "");
  try {
    const host = new URL(site).hostname;
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      /\.vercel\.app$/i.test(host)
    ) {
      return SITE_DEFAULT_URL;
    }
  } catch {
    return SITE_DEFAULT_URL;
  }
  return site || SITE_DEFAULT_URL;
}

/** Rewrite any localhost / preview URLs to the indexing origin. */
export function toIndexingUrl(url: string): string {
  const origin = getIndexingSiteUrl().replace(/\/$/, "");
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return `${origin}${path === "/" ? "" : path}`;
  } catch {
    if (url.startsWith("/")) return `${origin}${url}`;
    return url;
  }
}
