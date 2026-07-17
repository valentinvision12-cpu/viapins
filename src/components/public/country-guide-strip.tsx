"use client";

import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

interface Props {
  cityCount: number;
}

export function CountryGuideStrip({ cityCount }: Props) {
  const t = useTranslations("countryPage");

  return (
    <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-5 h-5 text-stone-600" />
      </div>
      <div>
        <p className="text-stone-900 font-semibold text-sm">{t("pickCityTitle")}</p>
        <p className="text-stone-500 text-xs mt-1 leading-relaxed">{t("pickCityDesc")}</p>
        <p className="text-stone-400 text-[11px] mt-2">{t("citiesCount", { count: cityCount })}</p>
      </div>
    </div>
  );
}
