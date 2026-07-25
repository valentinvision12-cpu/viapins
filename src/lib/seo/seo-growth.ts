import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { placeSlug } from "@/lib/place-slug";
import { slugify } from "@/lib/utils";
import { isThinPlaceContent } from "@/lib/seo/content-quality";
import {
  countLinkOpportunities,
  getHubIndex,
} from "@/lib/seo/internal-linking";
import { loadIndexingConfig } from "@/lib/search-engines/prefs";
import type { IndexingConfig } from "@/lib/search-engines/types";

export type LinkingBatchStatus = "idle" | "running" | "done" | "error";

export type LinkingBatchState = {
  status: LinkingBatchStatus;
  /** Destination offset for next chunk. */
  offset: number;
  chunkSize: number;
  processedDestinations: number;
  processedPlaces: number;
  linksFound: number;
  totalDestinationsEstimate: number;
  startedAt?: string;
  finishedAt?: string;
  lastError?: string;
  lastMessage?: string;
};

export type ThinPlaceRow = {
  placeId: string;
  placeName: string;
  country: string;
  city: string;
  countrySlug: string;
  citySlug: string;
  placeSlug: string;
  path: string;
  wordHint: "thin";
};

export type SeoGrowthConfig = {
  linkingBatch?: LinkingBatchState;
};

const DEFAULT_BATCH: LinkingBatchState = {
  status: "idle",
  offset: 0,
  chunkSize: 25,
  processedDestinations: 0,
  processedPlaces: 0,
  linksFound: 0,
  totalDestinationsEstimate: 0,
};

function createPublicReadClient() {
  const service = createServiceClient();
  if (service) return service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || url.includes("placeholder")) return null;
  return createSupabaseJs(url, key);
}

export function getSeoGrowthFromConfig(cfg: IndexingConfig): SeoGrowthConfig {
  const raw = cfg.seo_growth;
  if (!raw || typeof raw !== "object") return {};
  return raw as SeoGrowthConfig;
}

export async function loadSeoGrowthConfig(): Promise<SeoGrowthConfig> {
  const cfg = await loadIndexingConfig();
  return getSeoGrowthFromConfig(cfg);
}

export async function saveSeoGrowthConfig(
  partial: SeoGrowthConfig
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Supabase service client недостъпен" };
  }

  const current = await loadIndexingConfig();
  const prev = getSeoGrowthFromConfig(current);
  const nextGrowth: SeoGrowthConfig = {
    ...prev,
    ...partial,
    linkingBatch: partial.linkingBatch
      ? { ...DEFAULT_BATCH, ...prev.linkingBatch, ...partial.linkingBatch }
      : prev.linkingBatch,
  };

  const next: IndexingConfig = {
    ...current,
    seo_growth: nextGrowth,
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

export async function getLinkingBatchState(): Promise<LinkingBatchState> {
  const cfg = await loadSeoGrowthConfig();
  return { ...DEFAULT_BATCH, ...(cfg.linkingBatch ?? {}) };
}

/**
 * Process one chunk of destinations: count internal-link opportunities.
 * Linking itself is applied at render time; the batch warms diagnostics + hub cache.
 */
export async function runInternalLinkingChunk(opts?: {
  chunkSize?: number;
  reset?: boolean;
}): Promise<LinkingBatchState> {
  const chunkSize = Math.min(Math.max(opts?.chunkSize ?? 25, 5), 100);
  let state = await getLinkingBatchState();

  if (opts?.reset || state.status === "done" || state.status === "error") {
    state = {
      ...DEFAULT_BATCH,
      chunkSize,
      status: "running",
      startedAt: new Date().toISOString(),
    };
  } else {
    state = {
      ...state,
      chunkSize,
      status: "running",
      startedAt: state.startedAt ?? new Date().toISOString(),
      lastError: undefined,
    };
  }

  const supabase = createPublicReadClient();
  if (!supabase) {
    state.status = "error";
    state.lastError = "Няма DB връзка";
    state.finishedAt = new Date().toISOString();
    await saveSeoGrowthConfig({ linkingBatch: state });
    return state;
  }

  try {
    // Warm hub index (unstable_cache).
    const hubs = await getHubIndex();

    if (!state.totalDestinationsEstimate) {
      const { count } = await supabase
        .from("destinations")
        .select("id", { count: "exact", head: true })
        .eq("published", true);
      state.totalDestinationsEstimate = count ?? 0;
    }

    const { data, error } = await supabase
      .from("destinations")
      .select(
        "country, city, country_slug, city_slug, places(id, name, translations)"
      )
      .eq("published", true)
      .order("country")
      .order("city")
      .range(state.offset, state.offset + chunkSize - 1);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{
      country: string;
      city: string;
      country_slug?: string | null;
      city_slug?: string | null;
      places?: Array<{
        id: string;
        name: string;
        translations?: Record<
          string,
          { description?: string; wiki_text?: string } | undefined
        > | null;
      }> | null;
    }>;

    let placeCount = 0;
    let links = 0;

    for (const row of rows) {
      const countrySlug = row.country_slug?.trim() || slugify(row.country);
      const citySlug = row.city_slug?.trim() || slugify(row.city);
      for (const p of row.places ?? []) {
        placeCount += 1;
        const tr = p.translations?.en ?? p.translations?.bg ?? {};
        const text = [tr.description, tr.wiki_text].filter(Boolean).join(" ");
        const path = `/explore/${countrySlug}/${citySlug}/${placeSlug(p.name, p.id)}`;
        links += countLinkOpportunities(text, hubs, path, 4);
      }
    }

    state.processedDestinations += rows.length;
    state.processedPlaces += placeCount;
    state.linksFound += links;
    state.offset += rows.length;
    state.lastMessage = `Chunk: ${rows.length} destinations, ${placeCount} places, ~${links} link opportunities (hubs=${hubs.length})`;

    if (rows.length < chunkSize) {
      state.status = "done";
      state.finishedAt = new Date().toISOString();
      state.lastMessage = `Готово: ${state.processedDestinations} destinations, ${state.processedPlaces} places, ~${state.linksFound} link opportunities. Auto-links apply at page render.`;
    }

    await saveSeoGrowthConfig({ linkingBatch: state });
    return state;
  } catch (err) {
    state.status = "error";
    state.lastError = err instanceof Error ? err.message : String(err);
    state.finishedAt = new Date().toISOString();
    await saveSeoGrowthConfig({ linkingBatch: state });
    return state;
  }
}

/**
 * List thin places in pages (memory-conscious: one destination page at a time).
 */
export async function listThinPlaces(opts?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: ThinPlaceRow[]; hasMore: boolean; offset: number }> {
  const limit = Math.min(Math.max(opts?.limit ?? 40, 10), 100);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const supabase = createPublicReadClient();
  if (!supabase) return { items: [], hasMore: false, offset };

  const items: ThinPlaceRow[] = [];
  let destOffset = offset;
  let scanned = 0;
  const maxScan = 200; // destinations scanned this request

  while (items.length < limit && scanned < maxScan) {
    const { data, error } = await supabase
      .from("destinations")
      .select(
        "country, city, country_slug, city_slug, places(id, name, translations)"
      )
      .eq("published", true)
      .order("country")
      .order("city")
      .range(destOffset, destOffset);

    if (error) {
      console.error("[seo/thin]", error.message);
      break;
    }
    if (!data?.length) break;

    scanned += 1;
    destOffset += 1;
    const row = data[0] as {
      country: string;
      city: string;
      country_slug?: string | null;
      city_slug?: string | null;
      places?: Array<{
        id: string;
        name: string;
        translations?: Record<
          string,
          { description?: string; wiki_text?: string } | undefined
        > | null;
      }> | null;
    };

    const countrySlug = row.country_slug?.trim() || slugify(row.country);
    const citySlug = row.city_slug?.trim() || slugify(row.city);

    for (const p of row.places ?? []) {
      if (
        !isThinPlaceContent({
          translations: p.translations ?? undefined,
          locale: "en",
        })
      ) {
        continue;
      }
      const ps = placeSlug(p.name, p.id);
      items.push({
        placeId: p.id,
        placeName: p.name,
        country: row.country,
        city: row.city,
        countrySlug,
        citySlug,
        placeSlug: ps,
        path: `/explore/${countrySlug}/${citySlug}/${ps}`,
        wordHint: "thin",
      });
      if (items.length >= limit) break;
    }
  }

  return {
    items,
    hasMore: scanned >= 1 && Boolean(
      // more destinations likely exist if we filled limit or scanned a dest
      items.length >= limit || scanned === maxScan
    ),
    offset: destOffset,
  };
}
