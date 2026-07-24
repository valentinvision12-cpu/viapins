import type { Metadata } from "next";
import { Radar } from "lucide-react";
import { IndexingPanel } from "@/components/admin/indexing-panel";
import {
  indexingStatusSnapshot,
  type IndexingStatusSnapshot,
} from "@/lib/search-engines";
import { DEFAULT_INDEXING_PREFS } from "@/lib/search-engines/config";

export const metadata: Metadata = {
  title: "Индексиране",
};
export const dynamic = "force-dynamic";

function fallbackState(): IndexingStatusSnapshot {
  return {
    siteUrl: "https://viapins.com",
    indexNowConfigured: false,
    googleConfigured: false,
    prefs: { ...DEFAULT_INDEXING_PREFS },
    lastRuns: [],
    estimatedUrlCount: 0,
  };
}

export default async function IndexingAdminPage() {
  let state: IndexingStatusSnapshot;
  try {
    state = await indexingStatusSnapshot({ skipUrlCount: true });
  } catch (err) {
    console.error("[admin/indexing] state load failed", err);
    state = fallbackState();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
          <Radar className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Индексиране</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            IndexNow + Google — автоматични сигнали при ново съдържание
          </p>
        </div>
      </div>

      <IndexingPanel initialState={state} />
    </div>
  );
}
