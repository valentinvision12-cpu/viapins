import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import {
  getAnalyticsSnapshot,
  type AnalyticsSnapshot,
} from "@/lib/analytics/stats";

export const metadata: Metadata = {
  title: "Аналитика",
};
export const dynamic = "force-dynamic";

function fallback(): AnalyticsSnapshot {
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

export default async function AdminAnalyticsPage() {
  let initial: AnalyticsSnapshot;
  try {
    initial = await getAnalyticsSnapshot();
  } catch (err) {
    console.error("[admin/analytics]", err);
    initial = fallback();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Аналитика на живо</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Колко души са на сайта сега, откъде идват и история на трафика
          </p>
        </div>
      </div>

      <AnalyticsPanel initial={initial} />
    </div>
  );
}
