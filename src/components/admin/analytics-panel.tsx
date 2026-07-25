"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Eye,
  Globe2,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import type { AnalyticsSnapshot, HistoryPoint } from "@/lib/analytics/stats";

const POLL_MS = 10_000;

function empty(): AnalyticsSnapshot {
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

function BarChart({
  data,
  valueKey,
}: {
  data: HistoryPoint[];
  valueKey: "views" | "visitors";
}) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));

  return (
    <div className="flex items-end gap-1 h-40 w-full">
      {data.map((d) => {
        const h = Math.round((d[valueKey] / max) * 100);
        return (
          <div
            key={d.bucket}
            className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1 group"
            title={`${d.label}: ${d[valueKey]}`}
          >
            <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
              {d[valueKey] || ""}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[2px] transition-all"
              style={{ height: `${Math.max(h, d[valueKey] > 0 ? 4 : 2)}%` }}
            />
            <span className="text-[9px] text-gray-400 truncate w-full text-center leading-none">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  pulse,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  pulse?: boolean;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-1.5 text-[11px] leading-snug text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function AnalyticsPanel({
  initial,
}: {
  initial: AnalyticsSnapshot;
}) {
  const [data, setData] = useState<AnalyticsSnapshot>(initial);
  const [range, setRange] = useState<"24h" | "14d">("24h");
  const [metric, setMetric] = useState<"views" | "visitors">("views");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AnalyticsSnapshot;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const history = range === "24h" ? data.history24h : data.history14d;
  const updated = new Date(data.fetchedAt).toLocaleTimeString("bg-BG");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Обновено {updated} · автоматично на всеки 10 сек
        </p>
        <button
          type="button"
          onClick={() => void refresh(false)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Обнови
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Неуспешно зареждане: {error}. Проверете дали migration{" "}
          <code className="text-xs">018_visitor_analytics</code> е пусната в Supabase.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="На живо сега"
          value={data.liveCount}
          icon={Activity}
          accent="bg-emerald-50 text-emerald-600"
          pulse={data.liveCount > 0}
          hint="1 браузър = 1 посетител (табовете не се броят отделно)"
        />
        <StatCard
          label="Прегледи днес"
          value={data.viewsToday}
          icon={Eye}
          accent="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="Уникални днес"
          value={data.uniqueToday}
          icon={Users}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Прегледи (7 дни)"
          value={data.views7d}
          icon={Globe2}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* History chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">История на трафика</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {range === "24h" ? "Последните 24 часа (по час)" : "Последните 14 дни"}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-50">
              {(
                [
                  ["24h", "24 ч"],
                  ["14d", "14 дни"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    range === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-50">
              {(
                [
                  ["views", "Прегледи"],
                  ["visitors", "Посетители"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    metric === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            Все още няма данни — отворете публичния сайт, за да започне записът.
          </p>
        ) : (
          <BarChart data={history} valueKey={metric} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By country */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Откъде са на живо</h2>
          </div>
          {data.byCountry.length === 0 ? (
            <p className="text-sm text-gray-400">Няма активни посетители.</p>
          ) : (
            <ul className="space-y-2">
              {data.byCountry.map((c) => (
                <li
                  key={c.code ?? "unknown"}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {c.code ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400 w-6">
                          {c.code}
                        </span>
                        {c.label}
                      </span>
                    ) : (
                      c.label
                    )}
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top pages live */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Страници сега</h2>
          {data.topPages.length === 0 ? (
            <p className="text-sm text-gray-400">Няма активни страници.</p>
          ) : (
            <ul className="space-y-2">
              {data.topPages.map((p) => (
                <li
                  key={p.path}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-gray-600 truncate font-mono text-xs">
                    {p.path}
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900 shrink-0">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4">
          Посетители на живо
        </h2>
        {data.live.length === 0 ? (
          <p className="text-sm text-gray-400">
            В момента няма никой онлайн (прозорец: последните 5 минути).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Държава</th>
                  <th className="pb-2 font-medium">Град</th>
                  <th className="pb-2 font-medium">Страница</th>
                  <th className="pb-2 font-medium">Език</th>
                  <th className="pb-2 font-medium text-right">Последно</th>
                </tr>
              </thead>
              <tbody>
                {data.live.map((v) => (
                  <tr
                    key={v.sessionId}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2.5 text-gray-800">
                      {v.country}
                      {v.countryCode ? (
                        <span className="ml-1.5 text-[10px] text-gray-400 font-mono">
                          {v.countryCode}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-gray-500">{v.city || "—"}</td>
                    <td className="py-2.5 text-gray-600 font-mono text-xs max-w-[220px] truncate">
                      {v.path}
                    </td>
                    <td className="py-2.5 text-gray-500">{v.locale || "—"}</td>
                    <td className="py-2.5 text-gray-400 text-right tabular-nums text-xs">
                      {new Date(v.lastSeen).toLocaleTimeString("bg-BG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { empty as emptyAnalyticsSnapshot };
