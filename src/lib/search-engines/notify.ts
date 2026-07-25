import {
  GOOGLE_DAILY_SOFT_CAP,
} from "./config";
import { collectAllSiteUrls } from "./collect-urls";
import { submitIndexNow } from "./indexnow";
import { submitGoogleIndexing } from "./google-indexing";
import { pingSitemaps } from "./sitemap-ping";
import {
  appendIndexingRun,
  getIndexingPrefs,
} from "./prefs";
import type {
  IndexingNotifyType,
  NotifyOptions,
  NotifyResult,
} from "./types";

/**
 * Notify search engines about URL changes.
 * Respects indexing prefs unless `force` is set (manual admin submit).
 */
export async function notifySearchEngines(
  urls: string[],
  options: NotifyOptions = {}
): Promise<NotifyResult> {
  const type: IndexingNotifyType = options.type ?? "URL_UPDATED";
  const source = options.source ?? "notify";
  const cleaned = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];

  if (cleaned.length === 0) {
    return { skipped: true, reason: "empty urls", urlCount: 0, type };
  }

  const prefs = await getIndexingPrefs();
  if (!options.force && !prefs.auto_notify) {
    return {
      skipped: true,
      reason: "auto_notify disabled",
      urlCount: cleaned.length,
      type,
    };
  }

  const runIndexNow = options.force ? true : prefs.indexnow;
  const runGoogle = options.force ? true : prefs.google;
  const runPing = options.force ? true : prefs.sitemap_ping;

  const result: NotifyResult = { urlCount: cleaned.length, type };

  if (runIndexNow) {
    result.indexnow = await submitIndexNow(cleaned);
  }

  if (runGoogle) {
    const cap = options.googleCap ?? GOOGLE_DAILY_SOFT_CAP;
    result.google = await submitGoogleIndexing(cleaned, type, cap);
  }

  if (runPing && type === "URL_UPDATED") {
    result.sitemapPing = await pingSitemaps();
  }

  await appendIndexingRun({
    at: new Date().toISOString(),
    source,
    urlCount: cleaned.length,
    type,
    channels: {
      ...(result.indexnow ? { indexnow: result.indexnow } : {}),
      ...(result.google ? { google: result.google } : {}),
      ...(result.sitemapPing ? { sitemap_ping: result.sitemapPing } : {}),
    },
  });

  return result;
}

/** Fire-and-forget wrapper — never throws to callers. */
export function notifySearchEnginesBackground(
  urls: string[],
  options: NotifyOptions = {}
): void {
  void notifySearchEngines(urls, options).catch((err) => {
    console.error("[indexing] background notify failed", err);
  });
}

/**
 * Full-site submit:
 * - IndexNow gets ALL urls (Bing/Yandex/… handle bulk)
 * - Sitemap ping tells Google/Bing to recrawl sitemap.xml
 * - Google Indexing API is NOT bulk-flooded here (quota ~200/day).
 *   New pages still get Google push via auto-notify on publish.
 */
export async function notifyEntireSite(
  options: NotifyOptions = {}
): Promise<NotifyResult> {
  const urls = await collectAllSiteUrls();
  const prefs = await getIndexingPrefs();

  // Force IndexNow + sitemap; keep Google off for bulk "entire site"
  // unless caller explicitly sets googleCap > 0.
  const googleCap =
    typeof options.googleCap === "number" ? options.googleCap : 0;

  const type = options.type ?? "URL_UPDATED";
  const source = options.source ?? "entire-site";
  const cleaned = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];

  const result: NotifyResult = { urlCount: cleaned.length, type };

  if (prefs.indexnow || options.force) {
    result.indexnow = await submitIndexNow(cleaned);
  }

  if (googleCap > 0 && (prefs.google || options.force)) {
    result.google = await submitGoogleIndexing(cleaned, type, googleCap);
  }

  if (prefs.sitemap_ping || options.force) {
    result.sitemapPing = await pingSitemaps();
  }

  await appendIndexingRun({
    at: new Date().toISOString(),
    source,
    urlCount: cleaned.length,
    type,
    channels: {
      ...(result.indexnow ? { indexnow: result.indexnow } : {}),
      ...(result.google ? { google: result.google } : {}),
      ...(result.sitemapPing ? { sitemap_ping: result.sitemapPing } : {}),
    },
  });

  return result;
}

export function notifyEntireSiteBackground(options: NotifyOptions = {}): void {
  void notifyEntireSite(options).catch((err) => {
    console.error("[indexing] entire-site background failed", err);
  });
}
