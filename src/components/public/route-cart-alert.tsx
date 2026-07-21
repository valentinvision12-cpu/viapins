"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useRouteCart } from "@/lib/context/route-cart-context";

export function RouteCartAlert() {
  const t = useTranslations("route");
  const { blockNotice, dismissBlock, startNewRouteForBlocked } = useRouteCart();

  if (!blockNotice) return null;

  const isModeMismatch = blockNotice.reason === "mode_mismatch";
  const isAdventure = blockNotice.attemptedMode === "adventure";

  const message = isModeMismatch
    ? t(
        blockNotice.attemptedMode === "adventure"
          ? "modeMismatchToAdventure"
          : "modeMismatchToCity",
        {
          country: blockNotice.attemptedCountry,
          currentCity: blockNotice.currentCity,
        }
      )
    : isAdventure
      ? t("differentCountryMessage", {
          country: blockNotice.attemptedCountry,
          currentCountry: blockNotice.currentCountry,
        })
      : t("differentCityMessage", {
          city: blockNotice.attemptedCity,
          country: blockNotice.attemptedCountry,
          currentCity: blockNotice.currentCity,
        });

  const startLabel = isModeMismatch
    ? blockNotice.attemptedMode === "adventure"
      ? t("startAdventureRoute", { country: blockNotice.attemptedCountry })
      : t("startNewRoute", { city: blockNotice.attemptedCity })
    : isAdventure
      ? t("startAdventureRoute", { country: blockNotice.attemptedCountry })
      : t("startNewRoute", { city: blockNotice.attemptedCity });

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-[45] px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm md:px-0"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-2.5">
          <p className="flex-1 text-xs leading-relaxed text-stone-600">{message}</p>
          <button
            type="button"
            onClick={dismissBlock}
            className="p-0.5 text-stone-400 hover:text-stone-600"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={startNewRouteForBlocked}
            className="rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            {startLabel}
          </button>
          <button
            type="button"
            onClick={dismissBlock}
            className="rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600"
          >
            {t("keepCurrentRoute")}
          </button>
        </div>
      </div>
    </div>
  );
}
