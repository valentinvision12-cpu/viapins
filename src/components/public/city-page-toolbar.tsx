"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useRouteCart, type RouteCartItem } from "@/lib/context/route-cart-context";
import { useFavorites } from "@/lib/context/favorites-context";

export interface CityPlaceItem {
  id: string;
  name: string;
  image_url: string;
  lat: number;
  lng: number;
  order_index: number;
}

interface Props {
  places: CityPlaceItem[];
  city: string;
  country: string;
}

export function CityPageToolbar({ places, city, country }: Props) {
  const t = useTranslations("cityPage");
  const { addManyItems, isInCart } = useRouteCart();
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();

  const cartItems: RouteCartItem[] = useMemo(
    () =>
      places.map((p) => ({
        id: p.id,
        name: p.name,
        city,
        country,
        lat: p.lat,
        lng: p.lng,
        image_url: p.image_url,
        order_index: p.order_index,
        mode: "city" as const,
      })),
    [places, city, country]
  );

  const inTripCount = places.filter((p) => isInCart(p.id)).length;
  const allInTrip = inTripCount >= places.length;

  function handleAddAll() {
    const missing = cartItems.filter((p) => !isInCart(p.id));
    if (addManyItems(missing) && isLoggedIn) {
      for (const p of places) {
        if (!isFavorite(p.id)) {
          toggleFavorite({
            place_id: p.id,
            name: p.name,
            city,
            country,
            image_url: p.image_url,
            lat: p.lat,
            lng: p.lng,
          });
        }
      }
    }
  }

  return (
    <div className="mb-6">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleAddAll}
        disabled={allInTrip}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
          allInTrip
            ? "bg-amber-50 text-amber-800 border border-amber-200 cursor-default"
            : "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
        }`}
      >
        {allInTrip ? (
          <>
            <Check className="w-4 h-4" />
            {t("allInRoute", { count: places.length })}
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            {t("addAllToRoute", { count: places.length })}
          </>
        )}
      </motion.button>
    </div>
  );
}
