import type { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { getAdConfig } from "@/lib/ads";
import { AdConfigForm } from "@/components/admin/ad-config-form";

export const metadata: Metadata = { title: "Монетизация" };

export default async function MonetizationPage() {
  const adConfig = await getAdConfig();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Монетизация</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Управлявайте рекламните позиции на сайта
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 mb-8 text-sm">
        <p className="text-blue-700 leading-relaxed">
          Поставете HTML/JavaScript код от Google AdSense, Media.net, Ezoic или друга рекламна мрежа
          в съответните полета. Кодът ще се зареди автоматично на публичния сайт.
          Оставете поле празно, за да скриете тази рекламна позиция.
        </p>
      </div>

      <AdConfigForm initialConfig={adConfig} isConfigured={isConfigured} />
    </div>
  );
}
