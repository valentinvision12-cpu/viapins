"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Car, Compass, Check, Plus, RouteIcon } from "lucide-react";
import { useRouteCart } from "@/lib/context/route-cart-context";
import {
  adventurePlaceToCartItem,
  sortByRecommendedOrder,
} from "@/lib/adventure-itinerary";
import type { AdventurePlace } from "@/lib/adventure-types";

interface Props {
  places: AdventurePlace[];
  country: string;
  totalDays: number;
  locale?: string;
}

export function AdventureRoutePlanner({ places, totalDays }: Props) {
  const t = useTranslations("adventure");
  const { items, replaceCart, isInCart, cartMode } = useRouteCart();
  const [addedFlash, setAddedFlash] = useState(false);

  const sortedPlaces = useMemo(() => sortByRecommendedOrder(places), [places]);

  const allInCart = sortedPlaces.every((p) => isInCart(p.id));
  const isAdventureCart = cartMode === "adventure" || cartMode === null;

  function handleAddFullRoute() {
    if (!isAdventureCart && items.length > 0) return;
    replaceCart(sortedPlaces.map(adventurePlaceToCartItem));
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  return (
    <section className="container max-w-6xl mx-auto px-6 -mt-6 relative z-10 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-orange-200/70 bg-white shadow-lg shadow-orange-100/40 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <RouteIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-stone-900 font-bold text-base">{t("plannerTitle")}</h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                {t("plannerSubtitle", { days: totalDays })}
              </p>
            </div>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex-shrink-0">
              <Car className="w-3 h-3" />
              {totalDays} {t("days")}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={handleAddFullRoute}
            disabled={allInCart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 bg-orange-500 text-white hover:bg-orange-600"
          >
            {allInCart || addedFlash ? (
              <><Check className="w-4 h-4" />{t("fullRouteAdded")}</>
            ) : (
              <><Plus className="w-4 h-4" />{t("addFullRoute")}</>
            )}
          </button>

          <p className="text-[10px] text-stone-400 leading-relaxed flex items-start gap-1.5">
            <Compass className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {t("orderHint")}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
