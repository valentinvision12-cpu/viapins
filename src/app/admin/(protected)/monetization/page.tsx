import type { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { getAdConfig } from "@/lib/ads";
import { getAffiliateConfig } from "@/lib/affiliates-data";
import { AdConfigForm } from "@/components/admin/ad-config-form";
import { AffiliateConfigForm } from "@/components/admin/affiliate-config-form";

export const metadata: Metadata = { title: "Монетизация" };

export default async function MonetizationPage() {
  const [adConfig, affiliateConfig] = await Promise.all([
    getAdConfig(),
    getAffiliateConfig(),
  ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Монетизация</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Affiliate партньори (hotels, flights, eSIM…) и рекламни позиции
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Trip Extras — affiliate</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Линковете се показват в маршрута <strong>след</strong> като потребителят добави места — collapsed секция „Plan your trip“.
          Без Booking branding на сайта; партньорският линк отваря в нов tab.
        </p>
        <AffiliateConfigForm initialConfig={affiliateConfig} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Display ads (optional)</h2>
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          AdSense / Media.net код. Позициите не са монтирани на публичните страници по подразбиране — активирайте когато имате traffic.
        </p>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 mb-6 text-sm">
          <p className="text-blue-700 leading-relaxed">
            Поставете HTML/JavaScript код в полетата по-долу. Празно поле = скрита позиция.
          </p>
        </div>
        <AdConfigForm initialConfig={adConfig} isConfigured={isConfigured} />
      </section>
    </div>
  );
}
