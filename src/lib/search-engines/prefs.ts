import { createServiceClient } from "@/lib/supabase/service";
import { getSiteUrl } from "@/lib/seo";
import { DEFAULT_INDEXING_PREFS, MAX_LAST_RUNS } from "./config";
import { estimateSiteUrlCount } from "./collect-urls";
import { isGoogleIndexingConfigured } from "./google-indexing";
import type {
  IndexingConfig,
  IndexingPrefs,
  IndexingRunEntry,
  IndexingStatusSnapshot,
} from "./types";

function mergePrefs(partial?: Partial<IndexingPrefs> | null): IndexingPrefs {
  return { ...DEFAULT_INDEXING_PREFS, ...(partial ?? {}) };
}

export async function loadIndexingConfig(): Promise<IndexingConfig> {
  const supabase = createServiceClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("site_settings")
    .select("indexing_config")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return {};
  const raw = (data as { indexing_config?: unknown }).indexing_config;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as IndexingConfig;
}

/** Env first, then DB-stored key (for Vercel admin saves). */
export async function resolveIndexNowKey(): Promise<string | null> {
  const fromEnv = process.env.INDEXNOW_KEY?.trim();
  if (fromEnv) return fromEnv;
  const cfg = await loadIndexingConfig();
  const fromDb = cfg.indexnow_key?.trim();
  return fromDb || null;
}

export async function getIndexingPrefs(): Promise<IndexingPrefs> {
  const cfg = await loadIndexingConfig();
  return mergePrefs(cfg.prefs);
}

export async function saveIndexingPrefs(
  prefs: Partial<IndexingPrefs>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Supabase service client недостъпен" };
  }

  const current = await loadIndexingConfig();
  const next: IndexingConfig = {
    ...current,
    prefs: { ...mergePrefs(current.prefs), ...prefs },
  };

  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    indexing_config: next,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("indexing_config")
        ? "Липсва колона indexing_config. Пусни migration 017_indexing_config.sql."
        : error.message,
    };
  }
  return { success: true };
}

export async function saveIndexNowKeyToDb(
  key: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Supabase service client недостъпен" };
  }
  const current = await loadIndexingConfig();
  const next: IndexingConfig = { ...current, indexnow_key: key };
  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    indexing_config: next,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return {
      success: false,
      error: error.message.includes("indexing_config")
        ? "Липсва колона indexing_config. Пусни migration 017_indexing_config.sql."
        : error.message,
    };
  }
  return { success: true };
}

export async function appendIndexingRun(
  entry: IndexingRunEntry
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  try {
    const current = await loadIndexingConfig();
    const last_runs = [entry, ...(current.last_runs ?? [])].slice(
      0,
      MAX_LAST_RUNS
    );
    const next: IndexingConfig = { ...current, last_runs };
    await supabase.from("site_settings").upsert({
      id: 1,
      indexing_config: next,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[indexing] appendIndexingRun", err);
  }
}

export async function indexingStatusSnapshot(opts?: {
  /** Skip expensive full-catalog scan (default true for admin page load). */
  skipUrlCount?: boolean;
}): Promise<IndexingStatusSnapshot> {
  const cfg = await loadIndexingConfig();
  const prefs = mergePrefs(cfg.prefs);
  let estimatedUrlCount = 0;
  if (opts?.skipUrlCount === false) {
    try {
      estimatedUrlCount = await estimateSiteUrlCount();
    } catch {
      estimatedUrlCount = 0;
    }
  }

  const indexNowConfigured = Boolean(
    process.env.INDEXNOW_KEY?.trim() || cfg.indexnow_key?.trim()
  );

  return {
    siteUrl: getSiteUrl(),
    indexNowConfigured,
    googleConfigured: isGoogleIndexingConfigured(),
    prefs,
    lastRuns: cfg.last_runs ?? [],
    estimatedUrlCount,
  };
}
