import { getHubIndex, type HubIndexEntry, type HubKind } from "@/lib/seo/internal-linking";
import { CITY_GUIDE_SLUGS } from "@/lib/city-guides";
import { placeSlug } from "@/lib/place-slug";

export type RelatedContentItem = {
  path: string;
  title: string;
  subtitle?: string;
  kind: HubKind | "place";
};

export type RelatedContentContext = {
  currentPath: string;
  countrySlug: string;
  citySlug?: string;
  countryName?: string;
  cityName?: string;
  tags?: string[];
  keywords?: string[];
  /** Same-city places for place pages (id + name). */
  nearbyPlaces?: Array<{ id: string; name: string }>;
  /** Exclude place ids already shown elsewhere (e.g. nearby block). */
  excludePlaceIds?: string[];
  limit?: number;
};

function normalizePath(path: string): string {
  if (!path) return "/";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function tagScore(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(a.map((t) => t.toLowerCase()));
  let score = 0;
  for (const t of b) {
    if (set.has(t.toLowerCase())) score += 3;
  }
  return score;
}

function keywordScore(title: string, keywords: string[] | undefined): number {
  if (!keywords?.length) return 0;
  const lower = title.toLowerCase();
  let score = 0;
  for (const k of keywords) {
    const key = k.trim().toLowerCase();
    if (key.length >= 3 && lower.includes(key)) score += 2;
  }
  return score;
}

function scoreHub(hub: HubIndexEntry, ctx: RelatedContentContext): number {
  let score = 0;
  if (hub.countrySlug === ctx.countrySlug) score += 4;
  if (ctx.citySlug && hub.citySlug === ctx.citySlug) score += 6;
  score += tagScore(ctx.tags, hub.tags);
  score += keywordScore(hub.title, ctx.keywords);
  if (hub.kind === "guide" && hub.citySlug === ctx.citySlug) score += 5;
  if (hub.kind === "adventure" && hub.countrySlug === ctx.countrySlug) score += 5;
  if (hub.kind === "city" && hub.countrySlug === ctx.countrySlug) score += 2;
  return score;
}

/**
 * Pick 4–6 related hub/place pages by country/city/tag/keyword similarity.
 * Dedupes by path; never includes current page.
 */
export async function pickRelatedContent(
  ctx: RelatedContentContext
): Promise<RelatedContentItem[]> {
  const limit = Math.min(Math.max(ctx.limit ?? 5, 4), 6);
  const current = normalizePath(ctx.currentPath);
  const hubs = await getHubIndex();
  const excludeIds = new Set(ctx.excludePlaceIds ?? []);

  const scored: Array<{ item: RelatedContentItem; score: number }> = [];
  const seenPaths = new Set<string>([current]);

  // Same-city places first (high relevance for place pages).
  if (ctx.citySlug && ctx.nearbyPlaces?.length) {
    for (const p of ctx.nearbyPlaces) {
      if (excludeIds.has(p.id)) continue;
      const path = `/explore/${ctx.countrySlug}/${ctx.citySlug}/${placeSlug(p.name, p.id)}`;
      const n = normalizePath(path);
      if (seenPaths.has(n)) continue;
      seenPaths.add(n);
      scored.push({
        score: 12,
        item: {
          path: n,
          title: p.name,
          subtitle: ctx.cityName
            ? `${ctx.cityName}${ctx.countryName ? `, ${ctx.countryName}` : ""}`
            : undefined,
          kind: "place",
        },
      });
    }
  }

  // Deduped hubs (one entry per path — prefer city over phrase variants).
  const bestByPath = new Map<string, HubIndexEntry>();
  for (const hub of hubs) {
    const path = normalizePath(hub.path);
    if (seenPaths.has(path)) continue;
    const prev = bestByPath.get(path);
    if (!prev || hub.phrase.length > prev.phrase.length) {
      bestByPath.set(path, hub);
    }
  }

  for (const hub of bestByPath.values()) {
    const score = scoreHub(hub, ctx);
    if (score < 4) continue;
    // Prefer same-country / same-city / shared tags; skip weak cross-continent noise.
    scored.push({
      score,
      item: {
        path: normalizePath(hub.path),
        title: hub.title,
        subtitle:
          hub.kind === "guide"
            ? "Guide"
            : hub.kind === "adventure"
              ? "Adventure"
              : hub.kind === "country"
                ? "Country"
                : undefined,
        kind: hub.kind,
      },
    });
  }

  // Ensure city guide siblings appear on guide/city pages.
  if (ctx.citySlug) {
    for (const guide of CITY_GUIDE_SLUGS) {
      const path = `/explore/${ctx.countrySlug}/${ctx.citySlug}/guide/${guide}`;
      const n = normalizePath(path);
      if (seenPaths.has(n)) continue;
      if (scored.some((s) => s.item.path === n)) continue;
      scored.push({
        score: 8,
        item: {
          path: n,
          title:
            guide === "things-to-do"
              ? `Things to do in ${ctx.cityName ?? ctx.citySlug}`
              : guide === "3-day-itinerary"
                ? `3-day itinerary: ${ctx.cityName ?? ctx.citySlug}`
                : `Hidden gems in ${ctx.cityName ?? ctx.citySlug}`,
          subtitle: "Guide",
          kind: "guide",
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const out: RelatedContentItem[] = [];
  for (const row of scored) {
    if (out.length >= limit) break;
    if (seenPaths.has(row.item.path)) continue;
    seenPaths.add(row.item.path);
    out.push(row.item);
  }

  return out;
}
