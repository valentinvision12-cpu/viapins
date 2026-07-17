"use client";

import { useTranslations } from "next-intl";
import { MapPin, Car, X } from "lucide-react";
import { useRouteCart } from "@/lib/context/route-cart-context";

export function RouteCartAlert() {
  const t = useTranslations("route");
  const { blockNotice, dismissBlock, startNewRouteForBlocked } = useRouteCart();

  if (!blockNotice) return null;

  const isModeMismatch = blockNotice.reason === "mode_mismatch";
  const isAdventure = blockNotice.attemptedMode === "adventure";
  const title = isModeMismatch
    ? t("modeMismatchTitle")
    : isAdventure
      ? t("differentCountryTitle")
      : t("differentCityTitle");

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
      className="fixed top-[calc(var(--site-header-height,4.75rem)+var(--smart-ad-height,0px)+0.75rem)] left-1/2 -translate-x-1/2 z-[45] w-full max-w-md px-4"
      role="alert"
    >
      <div
        className="rounded-2xl border shadow-lg p-4"
        style={{
          background: "#FDFBF7",
          borderColor: "rgba(154,123,79,0.35)",
          boxShadow: "0 8px 32px rgba(44,36,22,0.12)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(154,123,79,0.12)" }}
          >
            {isAdventure || blockNotice.attemptedMode === "adventure" ? (
              <Car className="w-4 h-4" style={{ color: "#9A7B4F" }} />
            ) : (
              <MapPin className="w-4 h-4" style={{ color: "#9A7B4F" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900">{title}</p>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{message}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={startNewRouteForBlocked}
                className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                style={{ background: "#9A7B4F" }}
              >
                {startLabel}
              </button>
              <button
                type="button"
                onClick={dismissBlock}
                className="text-xs font-medium px-3 py-1.5 rounded-full border text-stone-600"
                style={{ borderColor: "rgba(154,123,79,0.25)" }}
              >
                {t("keepCurrentRoute")}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissBlock}
            className="p-1 text-stone-400 hover:text-stone-600"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
