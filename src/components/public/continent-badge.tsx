"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Continent } from "@/lib/country-continents";
import { LUXURY } from "@/lib/luxury-palette";

type Variant = "card" | "section" | "hero";

interface Props {
  continent: Continent;
  variant?: Variant;
  showCheck?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  card: "px-2 py-1 text-[10px] gap-1",
  section: "px-3 py-1.5 text-xs gap-1.5",
  hero: "px-3 py-1.5 text-sm gap-1.5",
};

export function ContinentBadge({
  continent,
  variant = "card",
  showCheck = continent === "europe",
}: Props) {
  const t = useTranslations("continents");

  const isEurope = continent === "europe";
  const label = isEurope ? t("europe") : t("asia");

  const base =
    variant === "hero"
      ? "bg-white/15 text-white border-white/25 backdrop-blur-sm"
      : isEurope
        ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
        : "bg-amber-50 text-amber-900 border-amber-200/80";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm ${VARIANT_STYLES[variant]} ${base}`}
      style={
        variant === "section" && isEurope
          ? { borderColor: LUXURY.bronzeBorderStrong }
          : undefined
      }
    >
      {showCheck && isEurope && (
        <Check className={variant === "card" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} />
      )}
      {label}
    </span>
  );
}