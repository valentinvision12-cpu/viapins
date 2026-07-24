export type {
  IndexingNotifyType,
  IndexingPrefs,
  IndexingConfig,
  IndexingRunEntry,
  IndexingStatusSnapshot,
  NotifyOptions,
  NotifyResult,
} from "./types";

export {
  DEFAULT_INDEXING_PREFS,
  GOOGLE_DAILY_SOFT_CAP,
  GOOGLE_FULL_SITE_CAP,
} from "./config";

export {
  urlsForDestination,
  urlsForCityPage,
  urlsForAdventure,
  urlsForCountry,
  collectAllSiteUrls,
  estimateSiteUrlCount,
} from "./collect-urls";

export { submitIndexNow, isIndexNowConfigured } from "./indexnow";
export {
  submitGoogleIndexing,
  isGoogleIndexingConfigured,
  getGoogleIndexingCredentials,
} from "./google-indexing";
export { pingSitemaps } from "./sitemap-ping";
export {
  getIndexingPrefs,
  saveIndexingPrefs,
  saveIndexNowKeyToDb,
  indexingStatusSnapshot,
  loadIndexingConfig,
  appendIndexingRun,
  resolveIndexNowKey,
} from "./prefs";
export {
  notifySearchEngines,
  notifySearchEnginesBackground,
  notifyEntireSite,
  notifyEntireSiteBackground,
} from "./notify";
