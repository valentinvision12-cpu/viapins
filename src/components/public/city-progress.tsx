"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouteCart } from "@/lib/context/route-cart-context";

interface Props {
  city: string;
  totalPlaces: number;
}

export function CityProgress({ city, totalPlaces }: Props) {
  const t = useTranslations("route");
  const { items } = useRouteCart();
  const cityItems = items.filter(
    (i) => (i.mode ?? "city") === "city" && i.city === city
  );
  const count = cityItems.length;

  if (count === 0) return null;

  const pct = Math.min(100, Math.round((count / totalPlaces) * 100));
  const isComplete = count >= totalPlaces;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="sticky top-[64px] z-20 backdrop-blur-md border-b border-stone-100 bg-white/90"
      >
        <div className="container max-w-4xl mx-auto px-6 py-2.5 flex items-center gap-3">
          <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isComplete
                  ? "bg-[oklch(0.72_0.13_82)]"
                  : "bg-gradient-to-r from-[oklch(0.55_0.20_265)] to-[oklch(0.72_0.13_82)]"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          <motion.span
            key={count}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              isComplete ? "text-amber-600" : "text-stone-500"
            }`}
          >
            {isComplete
              ? t("progressComplete", { count, total: totalPlaces })
              : t("progressCount", { count, total: totalPlaces })}
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
