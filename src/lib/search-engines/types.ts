/** Shared types for IndexNow + Google Indexing + sitemap ping. */

export type IndexingNotifyType = "URL_UPDATED" | "URL_DELETED";

export type IndexingPrefs = {
  /** Fire notify on publish / import / toggle */
  auto_notify: boolean;
  /** Submit via IndexNow (Bing, Yandex, …) */
  indexnow: boolean;
  /** Submit via Google Indexing API (quota-limited) */
  google: boolean;
  /** Ping Google/Bing sitemap endpoints */
  sitemap_ping: boolean;
};

export type IndexingRunChannel = "indexnow" | "google" | "sitemap_ping";

export type IndexingChannelResult = {
  ok: boolean;
  submitted?: number;
  error?: string;
};

export type IndexingRunEntry = {
  at: string;
  source: string;
  urlCount: number;
  type: IndexingNotifyType;
  channels: Partial<Record<IndexingRunChannel, IndexingChannelResult>>;
};

/** Stored in site_settings.indexing_config */
export type IndexingConfig = {
  prefs?: Partial<IndexingPrefs>;
  last_runs?: IndexingRunEntry[];
  /** Optional IndexNow key when env INDEXNOW_KEY is empty (safe — key is public). */
  indexnow_key?: string;
};

export type NotifyOptions = {
  type?: IndexingNotifyType;
  source?: string;
  /** Ignore auto_notify / channel prefs (manual admin submit) */
  force?: boolean;
  /** Cap Google Indexing API calls for this run */
  googleCap?: number;
};

export type NotifyResult = {
  skipped?: boolean;
  reason?: string;
  urlCount: number;
  type: IndexingNotifyType;
  indexnow?: IndexingChannelResult;
  google?: IndexingChannelResult;
  sitemapPing?: IndexingChannelResult;
};

export type IndexingStatusSnapshot = {
  siteUrl: string;
  indexNowConfigured: boolean;
  googleConfigured: boolean;
  prefs: IndexingPrefs;
  lastRuns: IndexingRunEntry[];
  estimatedUrlCount: number;
};
