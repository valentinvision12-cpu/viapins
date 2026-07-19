"use client";

import { useTranslations } from "next-intl";
import { THEME_FILTERS } from "@/lib/theme-filters";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  active: string | null;
  onChange: (theme: string | null) => void;
}

export function ThemeFilterBar({ active, onChange }: Props) {
  const t = useTranslations("themes");

  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {THEME_FILTERS.map((key) => {
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
  );
}
