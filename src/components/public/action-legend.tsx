"use client";

import { Heart, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  className?: string;
  compact?: boolean;
}

export function ActionLegend({ className = "", compact = false }: Props) {
  const t = useTranslations("actionLegend");

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 text-xs ${className}`}
        role="note"
        aria-label={t("title")}
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
          <span className="font-semibold">{t("heartLabel")}</span>
          <span className="text-red-600/70 hidden sm:inline">· {t("heartDesc")}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
          <Plus className="w-3 h-3" />
          <span className="font-semibold">{t("plusLabel")}</span>
          <span className="text-amber-700/70 hidden sm:inline">· {t("plusDesc")}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm ${className}`}
      role="note"
      aria-label={t("title")}
    >
      <p className="text-stone-900 text-sm font-semibold mb-3">{t("title")}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/80 border border-red-100">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          </div>
          <div>
            <p className="text-stone-900 text-sm font-semibold">{t("heartLabel")}</p>
            <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{t("heartDesc")}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-100">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Plus className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-stone-900 text-sm font-semibold">{t("plusLabel")}</p>
            <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{t("plusDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
