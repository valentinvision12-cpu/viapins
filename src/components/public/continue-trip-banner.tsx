"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, RouteIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { slugify } from "@/lib/utils";
import { LUXURY } from "@/lib/luxury-palette";

export function ContinueTripBanner() {
  const t = useTranslations("continueTrip");
  const { items, scope, totalItems } = useRouteCart();

  const trip = useMemo(() => {
    if (totalItems === 0 || !scope || scope.mode !== "city") return null;
    const cityItems = items.filter((i) => (i.mode ?? "city") === "city" && i.city === scope.city);
    if (cityItems.length === 0) return null;
    return {
      city: scope.city,
      country: scope.country,
      count: cityItems.length,
      total: 10,
      href: `/explore/${slugify(scope.country)}/${slugify(scope.city)}`,
    };
  }, [items, scope, totalItems]);

  if (!trip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-2xl mx-auto px-4 -mt-2 mb-4 relative z-10"
    >
      <Link
        href={trip.href}
        className="flex items-center gap-3 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all group"
        style={{
          background: LUXURY.creamCard,
          borderColor: LUXURY.bronzeBorder,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${LUXURY.bronze}20`, color: LUXURY.bronze }}
        >
          <RouteIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: LUXURY.bronze }}>
            {t("title")}
          </p>
          <p className="text-sm font-medium truncate" style={{ color: LUXURY.text }}>
            {t("progress", { city: trip.city, count: trip.count, total: trip.total })}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold flex-shrink-0 group-hover:gap-2 transition-all"
          style={{ color: LUXURY.bronze }}
        >
          {t("cta")}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}
