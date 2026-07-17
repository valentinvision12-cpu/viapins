"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search, Globe, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SearchResultItem } from "@/actions/get-destinations";
import { filterSearchResults } from "@/lib/search-index";
import { LUXURY } from "@/lib/luxury-palette";
import { CountryFlag } from "@/components/public/country-flag";

interface Props {
  items: SearchResultItem[];
  query: string;
}

export function SearchResultsGrid({ items, query }: Props) {
  const t = useTranslations("home");

  const results = useMemo(
    () => filterSearchResults(items, query),
    [items, query]
  );

  if (!query.trim()) return null;

  return (
    <section id="destinations" className="py-10 md:py-14 px-6" style={{ background: LUXURY.section }}>
      <div className="container max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: LUXURY.text }}>
            {t("searchResultsTitle")}
          </h2>
          <p className="text-sm mt-1" style={{ color: LUXURY.textMuted }}>
            {results.length} {t("searchResultsCount")}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: LUXURY.textMuted }} />
            <p className="text-lg" style={{ color: LUXURY.textSecondary }}>
              {t("searchEmpty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => {
              const href =
                item.type === "country"
                  ? `/explore/${item.slug.country}`
                  : `/explore/${item.slug.country}/${item.slug.city}`;

              return (
                <Link
                  key={`${item.type}-${item.slug.country}-${item.slug.city ?? ""}`}
                  href={href}
                  className="flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md"
                  style={{
                    background: LUXURY.creamCard,
                    borderColor: LUXURY.bronzeBorder,
                  }}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                    {item.type === "country" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <CountryFlag country={item.name} size="lg" />
                      </div>
                    ) : item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      {item.type === "country" ? t("searchTypeCountry") : t("searchTypeCity")}
                    </p>
                    <p className="font-bold truncate" style={{ color: LUXURY.text }}>
                      {item.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: LUXURY.textMuted }}>
                      {item.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
