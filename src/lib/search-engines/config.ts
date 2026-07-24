import type { IndexingPrefs } from "./types";

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
