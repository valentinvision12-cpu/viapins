"use client";

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

  const isComplete = count >= totalPlaces;
  const dotCount = Math.min(totalPlaces, 12);

  return (
    <div className="sticky top-[64px] z-20 border-b border-stone-100 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex max-w-4xl items-center gap-3 px-6 py-2.5">
        <div className="flex flex-1 items-center gap-1" aria-hidden="true">
          {Array.from({ length: dotCount }).map((_, i) => {
            const filled = i < count;
            return (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  filled
                    ? isComplete
                      ? "bg-[oklch(0.72_0.13_82)]"
                      : "bg-stone-700"
                    : "bg-stone-200"
                }`}
              />
            );
          })}
          {totalPlaces > dotCount && (
            <span className="ml-1 text-[10px] text-stone-400">+{totalPlaces - dotCount}</span>
          )}
        </div>

        <span
          className={`flex-shrink-0 whitespace-nowrap text-xs font-medium ${
            isComplete ? "text-amber-600" : "text-stone-500"
          }`}
        >
          {isComplete
            ? t("progressComplete", { count, total: totalPlaces })
            : t("progressCount", { count, total: totalPlaces })}
        </span>
      </div>
    </div>
  );
}
