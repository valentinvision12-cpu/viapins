"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Compass } from "lucide-react";
import { DestinationCard } from "@/components/public/destination-card";
import type { DestinationCard as DestinationCardData } from "@/actions/get-destinations";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  destinations: DestinationCardData[];
  searchQuery: string;
  seasonFilter: string | null;
}

export function DestinationsGrid({
  destinations,
  searchQuery,
  seasonFilter,
}: Props) {
  const t = useTranslations("home");
  const q = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = destinations;
    if (q) {
      list = list.filter(
        (d) =>
          d.city.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }
    if (seasonFilter) {
      list = list.filter((d) =>
        d.tags.map((tag: string) => tag.toLowerCase()).includes(seasonFilter)
      );
    }
    return list;
  }, [destinations, q, seasonFilter]);

  return (
    <section id="destinations" className="py-10 md:py-14 px-6" style={{ background: LUXURY.section }}>
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: LUXURY.text }}>
              {t("destinationsTitle")}
            </h2>
            <p className="text-sm mt-1" style={{ color: LUXURY.textMuted }}>
              {filtered.length} {t("destinationsCount")}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: LUXURY.textMuted }} />
            <p className="text-lg" style={{ color: LUXURY.textSecondary }}>
              {t("destinationsEmpty")}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal swipe */}
            <div className="sm:hidden swipe-scroll -mx-6 px-6">
              {filtered.map((dest, i) => (
                <div key={dest.id} className="w-[78vw] max-w-[280px]">
                  <DestinationCard destination={dest} index={i} priority={i < 2} />
                </div>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((dest, i) => (
                <DestinationCard key={dest.id} destination={dest} index={i} priority={i < 2} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
