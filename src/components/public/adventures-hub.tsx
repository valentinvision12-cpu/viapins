"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Compass, Car, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AdventureCardSummary } from "@/components/public/adventure-card-types";
import { CountryFlag } from "@/components/public/country-flag";

interface Props {
  adventures: AdventureCardSummary[];
}

export function AdventuresHub({ adventures }: Props) {
  const t = useTranslations("adventuresHub");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adventures;
    return adventures.filter(
      (a) =>
        a.country.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [adventures, query]);

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <section className="relative px-6 pt-28 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-[#F8F6F1]" />
        <div className="relative container max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-700 text-xs font-bold mb-4">
            <Car className="w-3.5 h-3.5" />
            {t("badge")}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-stone-600 text-base max-w-lg mx-auto mb-8">{t("subtitle")}</p>

          <div
            className="rounded-2xl p-2 shadow-lg max-w-xl mx-auto"
            style={{
              background: "#FDFBF7",
              border: "1px solid rgba(154,123,79,0.25)",
            }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl pl-12 pr-4 py-3.5 text-base outline-none bg-transparent text-stone-800"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl mx-auto px-6 pb-20">
        <p className="text-sm text-stone-500 mb-6">
          {filtered.length} {t("countriesCount")}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t("empty")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {filtered.map((adv) => (
              <Link
                key={adv.slug}
                href={`/explore/${adv.slug}/adventure`}
                className="group relative rounded-2xl overflow-hidden border-2 border-orange-200/80 bg-gradient-to-br from-white via-orange-50/50 to-amber-50 p-6 hover:border-orange-400 hover:shadow-xl transition-all"
              >
                <span className="absolute top-4 right-4">
                  <CountryFlag country={adv.country} size="md" />
                </span>

                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform">
                  <Compass className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-bold text-stone-900 group-hover:text-orange-800 transition-colors pr-14">
                  {adv.country}
                </h2>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed line-clamp-2">
                  {adv.subtitle}
                </p>
                <p className="text-orange-600 text-xs font-semibold mt-4 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {adv.stopCount} {t("stops")} · {adv.totalDays} {t("days")}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-800 underline"
          >
            {t("backToCities")}
          </Link>
        </div>
      </section>
    </div>
  );
}
