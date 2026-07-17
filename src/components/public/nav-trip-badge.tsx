"use client";

import { useRouteCart } from "@/lib/context/route-cart-context";
import { useFavorites } from "@/lib/context/favorites-context";

interface Props {
  dark?: boolean;
}

export function NavTripBadge({ dark = false }: Props) {
  const { totalItems } = useRouteCart();
  const { totalFavorites } = useFavorites();
  const count = totalItems + totalFavorites;

  if (count === 0) return null;

  return (
    <span
      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
        dark ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
