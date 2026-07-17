"use client";

import { useTranslations } from "next-intl";
import { Car, Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Props {
  countrySlug: string;
  countryName: string;
  show?: boolean;
}

export function AdventureLinkBanner({ countrySlug, countryName, show = true }: Props) {
  const t = useTranslations("adventureBanner");

  if (!show) return null;

  return (
    <Link
      href={`/explore/${countrySlug}/adventure`}
      className="group flex items-center gap-4 p-4 mb-8 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-300 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
        <Compass className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-stone-900 font-semibold text-sm">
          {t("title", { country: countryName })}
        </p>
        <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
          {t("subtitle")}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex-shrink-0">
        <Car className="w-3 h-3" />
        {t("badge")}
      </div>
    </Link>
  );
}
