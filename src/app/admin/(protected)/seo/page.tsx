import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { SeoGrowthPanel } from "@/components/admin/seo-growth-panel";
import { getLinkingBatchState } from "@/lib/seo/seo-growth";

export const metadata: Metadata = {
  title: "SEO 10x Growth",
};
export const dynamic = "force-dynamic";

export default async function SeoAdminPage() {
  let batch;
  try {
    batch = await getLinkingBatchState();
  } catch (err) {
    console.error("[admin/seo] batch load failed", err);
    batch = {
      status: "idle" as const,
      offset: 0,
      chunkSize: 25,
      processedDestinations: 0,
      processedPlaces: 0,
      linksFound: 0,
      totalDestinationsEstimate: 0,
    };
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <TrendingUp className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            SEO 10x Growth Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Internal linking batches · thin content triage · JSON-LD validation
          </p>
        </div>
      </div>

      <SeoGrowthPanel initialBatch={batch} />
    </div>
  );
}
