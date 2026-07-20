"use client";

import { useTranslations } from "next-intl";
import type { ThemeFilter } from "@/lib/theme-filters";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  active: string | null;
  onChange: (theme: string | null) => void;
  available: ThemeFilter[];
}

export function ThemeFilterBar({ active, onChange, available }: Props) {
  const t = useTranslations("themes");
  const tHome = useTranslations("home");

  if (available.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4 px-4">
      <h2
        className="text-sm sm:text-base font-medium tracking-wide"
        style={{ color: LUXURY.textSecondary }}
      >
        {tHome("themesLookingFor")}
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((key) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(isActive ? null : key)}
              className="rounded-full px-3.5 py-2 text-xs font-semibold transition-all min-h-[36px]"
              style={
                isActive
                  ? {
                      background: LUXURY.bronze,
                      color: "#fff",
                      border: `1px solid ${LUXURY.bronze}`,
                    }
                  : {
                      background: LUXURY.creamCard,
                      color: LUXURY.textSecondary,
                      border: `1px solid ${LUXURY.bronzeBorder}`,
                    }
              }
            >
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
