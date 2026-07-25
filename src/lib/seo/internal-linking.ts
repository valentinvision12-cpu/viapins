import { unstable_cache } from "next/cache";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { CITY_GUIDE_SLUGS } from "@/lib/city-guides";
import { slugify } from "@/lib/utils";
import { escapeHtml } from "@/lib/seo/html-escape";

export type HubKind = "country" | "city" | "guide" | "adventure";

/** Compact hub entry — no page bodies; safe for 46k+ site scale. */
export type HubIndexEntry = {
  /** Phrase matched in page text (lowercase for lookup; original casing in title). */
  phrase: string;
  path: string;
  title: string;
  kind: HubKind;
  countrySlug: string;
  citySlug?: string;
  tags: string[];
};

export type ApplyInternalLinksOptions = {
  /** Locale-prefixed path without domain, e.g. /explore/france/paris/... */
  currentPath: string;
  /** Max auto-injected links (anti-spam). */
  maxLinks?: number;
  /** Optional locale prefix for hrefs (e.g. "en"). Empty = path-only. */
  locale?: string;
};

const DEFAULT_MAX_LINKS = 4;
const MAX_HUBS = 8_000;

function createPublicReadClient() {
  const service = createServiceClient();
  if (service) return service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || url.includes("placeholder")) return null;
  return createSupabaseJs(url, key);
}

function normalizePhrase(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function pushHub(
  list: HubIndexEntry[],
  seen: Set<string>,
  entry: Omit<HubIndexEntry, "phrase"> & { phrase: string }
) {
  const phrase = normalizePhrase(entry.phrase);
  if (phrase.length < 3) return;
  const key = `${phrase.toLowerCase()}|${entry.path}`;
  if (seen.has(key)) return;
  seen.add(key);
  list.push({ ...entry, phrase });
}

function demoHubIndex(): HubIndexEntry[] {
  const list: HubIndexEntry[] = [];
  const seen = new Set<string>();
  const countries = new Map<string, string>();

  for (const d of DEMO_DESTINATIONS) {
    const countrySlug = slugify(d.country);
    const citySlug = slugify(d.city);
    countries.set(countrySlug, d.country);

    pushHub(list, seen, {
      phrase: d.city,
      path: `/explore/${countrySlug}/${citySlug}`,
      title: `${d.city}, ${d.country}`,
      kind: "city",
      countrySlug,
      citySlug,
      tags: d.tags ?? [],
    });
    pushHub(list, seen, {
      phrase: `${d.city}, ${d.country}`,
      path: `/explore/${countrySlug}/${citySlug}`,
      title: `${d.city}, ${d.country}`,
      kind: "city",
      countrySlug,
      citySlug,
      tags: d.tags ?? [],
    });

    for (const guide of CITY_GUIDE_SLUGS) {
      const label =
        guide === "things-to-do"
          ? `things to do in ${d.city}`
          : guide === "3-day-itinerary"
            ? `3-day itinerary ${d.city}`
            : `hidden gems ${d.city}`;
      pushHub(list, seen, {
        phrase: label,
        path: `/explore/${countrySlug}/${citySlug}/guide/${guide}`,
        title: label,
        kind: "guide",
        countrySlug,
        citySlug,
        tags: d.tags ?? [],
      });
    }
  }

  for (const [countrySlug, country] of countries) {
    pushHub(list, seen, {
      phrase: country,
      path: `/explore/${countrySlug}`,
      title: `${country} travel guide`,
      kind: "country",
      countrySlug,
      tags: [],
    });
  }

  return list;
}

async function fetchHubIndex(): Promise<HubIndexEntry[]> {
  const supabase = createPublicReadClient();
  if (!supabase) return demoHubIndex();

  // Compact select: no nested places (memory-safe at catalog scale).
  const { data, error } = await supabase
    .from("destinations")
    .select("country, city, country_slug, city_slug, tags")
    .eq("published", true)
    .order("country")
    .order("city");

  if (error || !data?.length) {
    if (error) console.error("[seo/hub-index]", error.message);
    return demoHubIndex();
  }

  const list: HubIndexEntry[] = [];
  const seen = new Set<string>();
  const countries = new Map<string, string>();

  for (const row of data as Array<{
    country: string;
    city: string;
    country_slug?: string | null;
    city_slug?: string | null;
    tags?: string[] | null;
  }>) {
    if (list.length >= MAX_HUBS) break;
    const countrySlug = row.country_slug?.trim() || slugify(row.country);
    const citySlug = row.city_slug?.trim() || slugify(row.city);
    const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
    countries.set(countrySlug, row.country);

    pushHub(list, seen, {
      phrase: row.city,
      path: `/explore/${countrySlug}/${citySlug}`,
      title: `${row.city}, ${row.country}`,
      kind: "city",
      countrySlug,
      citySlug,
      tags,
    });
    pushHub(list, seen, {
      phrase: `${row.city}, ${row.country}`,
      path: `/explore/${countrySlug}/${citySlug}`,
      title: `${row.city}, ${row.country}`,
      kind: "city",
      countrySlug,
      citySlug,
      tags,
    });

    // One high-value guide phrase per city (things-to-do) — keeps index compact.
    pushHub(list, seen, {
      phrase: `things to do in ${row.city}`,
      path: `/explore/${countrySlug}/${citySlug}/guide/things-to-do`,
      title: `Things to do in ${row.city}`,
      kind: "guide",
      countrySlug,
      citySlug,
      tags,
    });
  }

  for (const [countrySlug, country] of countries) {
    pushHub(list, seen, {
      phrase: country,
      path: `/explore/${countrySlug}`,
      title: `${country} travel guide`,
      kind: "country",
      countrySlug,
      tags: [],
    });
  }

  try {
    // Use same public client (no cookies) — safe inside unstable_cache.
    const { data: adventures } = await supabase
      .from("adventure_collections")
      .select("slug, country")
      .eq("published", true);
    for (const row of adventures ?? []) {
      const slug = String((row as { slug?: string }).slug ?? "");
      if (!slug) continue;
      const country =
        String((row as { country?: string }).country ?? "") ||
        countries.get(slug) ||
        slug.replace(/-/g, " ");
      pushHub(list, seen, {
        phrase: `${country} adventure`,
        path: `/explore/${slug}/adventure`,
        title: `${country} adventure road trip`,
        kind: "adventure",
        countrySlug: slug,
        tags: ["adventure", "road-trip"],
      });
      pushHub(list, seen, {
        phrase: `${country} road trip`,
        path: `/explore/${slug}/adventure`,
        title: `${country} adventure road trip`,
        kind: "adventure",
        countrySlug: slug,
        tags: ["adventure", "road-trip"],
      });
    }
  } catch (err) {
    console.error("[seo/hub-index] adventures", err);
  }

  return list.length ? list : demoHubIndex();
}

const getCachedHubIndexRaw = unstable_cache(
  fetchHubIndex,
  ["seo-hub-index-v1"],
  { revalidate: 3600, tags: ["destinations"] }
);

export async function getHubIndex(): Promise<HubIndexEntry[]> {
  return getCachedHubIndexRaw();
}

/** Strip locale prefix for path comparison: /en/explore/... → /explore/... */
export function stripLocalePrefix(path: string, locale?: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale && (p === `/${locale}` || p.startsWith(`/${locale}/`))) {
    return p.slice(locale.length + 1) || "/";
  }
  return p;
}

function normalizePath(path: string): string {
  if (!path) return "/";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * Escape text and inject up to maxLinks internal `<a>` tags for hub phrases.
 * Never links to self; prefers longest phrase matches; skips overlapping spans.
 */
export function applyInternalLinks(
  text: string | null | undefined,
  hubs: HubIndexEntry[],
  options: ApplyInternalLinksOptions
): string {
  const raw = (text ?? "").trim();
  if (!raw || hubs.length === 0) return escapeHtml(raw);

  const maxLinks = Math.min(Math.max(options.maxLinks ?? DEFAULT_MAX_LINKS, 1), 5);
  const current = normalizePath(
    stripLocalePrefix(options.currentPath, options.locale)
  );
  const localePrefix = options.locale ? `/${options.locale}` : "";

  const candidates = hubs
    .filter((h) => normalizePath(h.path) !== current)
    .map((h) => ({ ...h, phrase: normalizePhrase(h.phrase) }))
    .filter((h) => h.phrase.length >= 3)
    .sort((a, b) => b.phrase.length - a.phrase.length);

  type Match = {
    start: number;
    end: number;
    hub: HubIndexEntry;
  };
  const matches: Match[] = [];
  const usedPaths = new Set<string>();
  const lower = raw.toLowerCase();

  for (const hub of candidates) {
    if (matches.length >= maxLinks) break;
    const pathKey = normalizePath(hub.path);
    if (usedPaths.has(pathKey)) continue;

    const needle = hub.phrase.toLowerCase();
    let from = 0;
    while (from <= lower.length - needle.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;

      const end = idx + needle.length;
      const before = idx === 0 ? "" : raw[idx - 1];
      const after = end >= raw.length ? "" : raw[end];
      const boundaryBefore = !before || /[^\p{L}\p{N}]/u.test(before);
      const boundaryAfter = !after || /[^\p{L}\p{N}]/u.test(after);
      if (!boundaryBefore || !boundaryAfter) {
        from = idx + 1;
        continue;
      }

      const overlaps = matches.some((m) => idx < m.end && end > m.start);
      if (overlaps) {
        from = idx + 1;
        continue;
      }

      matches.push({ start: idx, end, hub });
      usedPaths.add(pathKey);
      break;
    }
  }

  if (matches.length === 0) return escapeHtml(raw);

  matches.sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const m of matches) {
    out += escapeHtml(raw.slice(cursor, m.start));
    const href = `${localePrefix}${normalizePath(m.hub.path)}`;
    const title = escapeHtml(m.hub.title);
    const label = escapeHtml(raw.slice(m.start, m.end));
    out += `<a href="${escapeHtml(href)}" title="${title}" class="text-amber-800 underline decoration-amber-300/80 underline-offset-2 hover:text-amber-950">${label}</a>`;
    cursor = m.end;
  }
  out += escapeHtml(raw.slice(cursor));
  return out;
}

/** Count how many hub phrases would link in a text blob (batch diagnostics). */
export function countLinkOpportunities(
  text: string | null | undefined,
  hubs: HubIndexEntry[],
  currentPath: string,
  maxLinks = DEFAULT_MAX_LINKS
): number {
  const html = applyInternalLinks(text, hubs, {
    currentPath,
    maxLinks,
  });
  const matches = html.match(/<a\s/g);
  return matches?.length ?? 0;
}
