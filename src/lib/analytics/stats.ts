import { createServiceClient } from "@/lib/supabase/service";
import { countryLabel } from "@/lib/analytics/geo";

/** Drop stale presence quickly; leave beacon clears on last-tab close. */
export const LIVE_WINDOW_MS = 45 * 1000;

export type LiveVisitor = {
  sessionId: string;
  path: string;
  locale: string | null;
  countryCode: string | null;
  country: string;
  city: string | null;
  referrer: string | null;
  lastSeen: string;
};

export type CountryCount = {
  code: string | null;
  label: string;
  count: number;
};

export type HistoryPoint = {
  bucket: string;
  label: string;
  views: number;
  visitors: number;
};

export type AnalyticsSnapshot = {
  liveCount: number;
  live: LiveVisitor[];
  byCountry: CountryCount[];
  topPages: { path: string; count: number }[];
  history24h: HistoryPoint[];
  history14d: HistoryPoint[];
  viewsToday: number;
  views7d: number;
  uniqueToday: number;
  fetchedAt: string;
};

function emptySnapshot(): AnalyticsSnapshot {
  return {
    liveCount: 0,
    live: [],
    byCountry: [],
    topPages: [],
    history24h: [],
    history14d: [],
    viewsToday: 0,
    views7d: 0,
    uniqueToday: 0,
    fetchedAt: new Date().toISOString(),
  };
}

function hourLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

function floorHour(d: Date): Date {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x;
}

function floorDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const supabase = createServiceClient();
  if (!supabase) return emptySnapshot();

  const now = new Date();
  const liveSince = new Date(now.getTime() - LIVE_WINDOW_MS).toISOString();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = floorDay(now).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [liveRes, views24Res, views14Res] = await Promise.all([
    supabase
      .from("visitor_presence")
      .select(
        "session_id, path, locale, country_code, city, referrer, last_seen, user_agent, net_key"
      )
      .gte("last_seen", liveSince)
      .order("last_seen", { ascending: false })
      .limit(200),
    supabase
      .from("page_views")
      .select("session_id, path, country_code, created_at")
      .gte("created_at", since24h)
      .limit(20000),
    supabase
      .from("page_views")
      .select("session_id, created_at")
      .gte("created_at", since14d)
      .limit(50000),
  ]);

  let liveRows = liveRes.data ?? [];
  // Column may not exist until migration 019 is applied.
  if (liveRes.error?.message?.includes("net_key")) {
    const fallback = await supabase
      .from("visitor_presence")
      .select(
        "session_id, path, locale, country_code, city, referrer, last_seen, user_agent"
      )
      .gte("last_seen", liveSince)
      .order("last_seen", { ascending: false })
      .limit(200);
    liveRows = (fallback.data ?? []).map((r) => ({ ...r, net_key: null }));
  }

  const views24 = views24Res.data ?? [];
  const views14 = views14Res.data ?? [];

  // One live person per network fingerprint (IP+UA) or UA+city fallback.
  const dedupedRows: typeof liveRows = [];
  const seen = new Set<string>();
  for (const r of liveRows) {
    const fp =
      (typeof r.net_key === "string" && r.net_key) ||
      `${r.country_code ?? ""}|${r.city ?? ""}|${(r.user_agent as string | null)?.slice(0, 80) ?? ""}` ||
      r.session_id;
    if (seen.has(fp)) continue;
    seen.add(fp);
    dedupedRows.push(r);
  }

  const live: LiveVisitor[] = dedupedRows.map((r) => ({
    sessionId: r.session_id,
    path: r.path || "/",
    locale: r.locale,
    countryCode: r.country_code,
    country: countryLabel(r.country_code),
    city: r.city,
    referrer: r.referrer,
    lastSeen: r.last_seen,
  }));

  const countryMap = new Map<string, number>();
  for (const v of live) {
    const key = v.countryCode ?? "";
    countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
  }
  const byCountry: CountryCount[] = [...countryMap.entries()]
    .map(([code, count]) => ({
      code: code || null,
      label: countryLabel(code || null),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const pageMap = new Map<string, number>();
  for (const v of live) {
    pageMap.set(v.path, (pageMap.get(v.path) ?? 0) + 1);
  }
  const topPages = [...pageMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 24h hourly buckets
  const hourBuckets = new Map<string, { views: number; sessions: Set<string> }>();
  const startHour = floorHour(new Date(now.getTime() - 23 * 60 * 60 * 1000));
  for (let i = 0; i < 24; i++) {
    const t = new Date(startHour.getTime() + i * 60 * 60 * 1000);
    const key = t.toISOString();
    hourBuckets.set(key, { views: 0, sessions: new Set() });
  }
  for (const row of views24) {
    const t = floorHour(new Date(row.created_at));
    const key = t.toISOString();
    const bucket = hourBuckets.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    if (row.session_id) bucket.sessions.add(row.session_id);
  }
  const history24h: HistoryPoint[] = [...hourBuckets.entries()].map(([key, b]) => {
    const d = new Date(key);
    return {
      bucket: key,
      label: hourLabel(d),
      views: b.views,
      visitors: b.sessions.size,
    };
  });

  // 14d daily buckets
  const dayBuckets = new Map<string, { views: number; sessions: Set<string> }>();
  const startDay = floorDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));
  for (let i = 0; i < 14; i++) {
    const t = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000);
    const key = t.toISOString().slice(0, 10);
    dayBuckets.set(key, { views: 0, sessions: new Set() });
  }
  for (const row of views14) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    if (row.session_id) bucket.sessions.add(row.session_id);
  }
  const history14d: HistoryPoint[] = [...dayBuckets.entries()].map(([key, b]) => {
    const d = new Date(`${key}T12:00:00Z`);
    return {
      bucket: key,
      label: dayLabel(d),
      views: b.views,
      visitors: b.sessions.size,
    };
  });

  const viewsToday = views24.filter((r) => r.created_at >= todayStart).length;
  const uniqueToday = new Set(
    views24.filter((r) => r.created_at >= todayStart).map((r) => r.session_id)
  ).size;
  const views7d = views14.filter((r) => r.created_at >= since7d).length;

  return {
    liveCount: live.length,
    live,
    byCountry,
    topPages,
    history24h,
    history14d,
    viewsToday,
    views7d,
    uniqueToday,
    fetchedAt: now.toISOString(),
  };
}
