"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Car, Compass, Check, Plus, RouteIcon, MapPin } from "lucide-react";
import { useRouteCart } from "@/lib/context/route-cart-context";
import {
  groupAdventureByDay,
  adventurePlaceToCartItem,
  sortByRecommendedOrder,
} from "@/lib/adventure-itinerary";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import type { AdventurePlace } from "@/lib/adventure-types";

interface Props {
  places: AdventurePlace[];
  country: string;
  totalDays: number;
  locale?: string;
}

export function AdventureRoutePlanner({ places, country, totalDays, locale = "en" }: Props) {
  const t = useTranslations("adventure");
  const { items, addItem, replaceCart, isInCart, cartMode } = useRouteCart();
  const [addedFlash, setAddedFlash] = useState(false);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);

  const sortedPlaces = useMemo(() => sortByRecommendedOrder(places), [places]);
  const dayGroups = useMemo(() => groupAdventureByDay(sortedPlaces), [sortedPlaces]);

  const cartAdventureIds = useMemo(
    () => new Set(items.filter((i) => i.mode === "adventure").map((i) => i.id)),
    [items]
  );

  const allInCart = sortedPlaces.every((p) => isInCart(p.id));
  const isAdventureCart = cartMode === "adventure" || cartMode === null;

  function addPlaces(placeList: AdventurePlace[]) {
    if (!isAdventureCart && items.length > 0) return;
    for (const p of sortByRecommendedOrder(placeList)) {
      if (!isInCart(p.id)) addItem(adventurePlaceToCartItem(p));
    }
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  function handleAddFullRoute() {
    replaceCart(sortedPlaces.map(adventurePlaceToCartItem));
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  function handleAddDay(day: number) {
    const dayPlaces = dayGroups.find((g) => g.day === day)?.places ?? [];
    addPlaces(dayPlaces);
  }

  return (
    <section className="container max-w-4xl mx-auto px-6 -mt-6 relative z-10 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-orange-200/70 bg-white shadow-lg shadow-orange-100/40 overflow-hidden"
      >
        {/* Header */}
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

        <div className="p-5">
          <div className="space-y-3">
            {/* Add full route button */}
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

            {/* Day groups */}
            {dayGroups.map((group) => {
              const dayAllIn = group.places.every((p) => isInCart(p.id));
              return (
                <div
                  key={group.day}
                  className="rounded-xl border border-stone-100 bg-stone-50/50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-stone-700">
                      {t("dayLabel", { day: group.day })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddDay(group.day)}
                      disabled={dayAllIn}
                      className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-40"
                    >
                      {dayAllIn ? "✓" : `+ ${t("addDay")}`}
                    </button>
                  </div>

                  <ol className="px-3 py-2 space-y-1">
                    {group.places.map((p) => {
                      const inCart = isInCart(p.id);
                      const stopNum = p.order_index + 1;
                      return (
                        <li
                          key={p.id}
                          className={`flex items-center gap-2 py-1 text-xs cursor-pointer ${
                            focusedStopId === p.id
                              ? "text-orange-700 font-medium"
                              : inCart
                                ? "text-orange-700"
                                : "text-stone-500"
                          }`}
                          onClick={() => setFocusedStopId(p.id)}
                        >
                          {/* Stop number */}
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              inCart
                                ? "bg-orange-500 text-white"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            {stopNum}
                          </span>

                          {/* Name */}
                          <span className={`truncate flex-1 ${inCart ? "font-medium" : ""}`}>
                            {p.name}
                          </span>

                          {/* Open location in Maps */}
                          {(() => {
                            const pin = mapsPinLinkProps(
                              p.lat,
                              p.lng,
                              p.name,
                              p.region,
                              p.country
                            );
                            if (!pin) return null;
                            return (
                          <a
                            href={pin.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={pin.title}
                            className="p-1 rounded-md text-stone-300 hover:text-orange-500 transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="w-3 h-3" />
                          </a>
                            );
                          })()}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}

            <p className="text-[10px] text-stone-400 leading-relaxed flex items-start gap-1.5 pt-1">
              <Compass className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {t("orderHint")}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
