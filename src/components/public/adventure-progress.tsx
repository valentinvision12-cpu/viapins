"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Car } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouteCart } from "@/lib/context/route-cart-context";

interface Props {
  country: string;
  totalPlaces: number;
}

export function AdventureProgress({ country, totalPlaces }: Props) {
  const t = useTranslations("adventure");
  const { items } = useRouteCart();
  const advItems = items.filter(
    (i) => i.mode === "adventure" && i.country === country
  );
  const count = advItems.length;

  if (count === 0) return null;

  const pct = Math.min(100, Math.round((count / totalPlaces) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="sticky top-[64px] z-20 backdrop-blur-md border-b border-orange-100 bg-orange-50/90"
      >
        <div className="container max-w-4xl mx-auto px-6 py-2.5 flex items-center gap-3">
          <Car className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <div className="flex-1 h-1 bg-orange-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <span className="text-xs font-medium text-orange-700 whitespace-nowrap flex-shrink-0">
            {t("roadTripProgress", { count, total: totalPlaces })}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
