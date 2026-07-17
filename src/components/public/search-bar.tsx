"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { LUXURY } from "@/lib/luxury-palette";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSeasonFilter: (season: string | null) => void;
  activeSeasonFilter: string | null;
}

const SEASONS = [
  { key: "winter", emoji: "❄️" },
  { key: "spring", emoji: "🌸" },
  { key: "summer", emoji: "☀️" },
  { key: "autumn", emoji: "🍂" },
] as const;

export function SearchBar({
  onSearch,
  onSeasonFilter,
  activeSeasonFilter,
}: SearchBarProps) {
  const t = useTranslations("home");
  const tSeasons = useTranslations("seasons");
  const [value, setValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    onSearch(e.target.value);
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: LUXURY.textMuted }} />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-2xl pl-12 pr-5 py-4 text-base outline-none transition-all shadow-sm min-h-[48px]"
          style={{
            background: LUXURY.creamCard,
            border: `1px solid ${LUXURY.bronzeBorder}`,
            color: LUXURY.text,
          }}
        />
      </div>

      {/* Season filter pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {SEASONS.map(({ key, emoji }) => {
          const active = activeSeasonFilter === key;
          return (
            <button
              key={key}
              onClick={() => onSeasonFilter(active ? null : key)}
              className={`px-4 py-2 min-h-[40px] rounded-full text-sm font-medium border transition-all cursor-pointer ${
                active ? "text-white border-transparent shadow-sm" : ""
              }`}
              style={
                active
                  ? { background: LUXURY.bronze, borderColor: LUXURY.bronze }
                  : {
                      background: LUXURY.creamCard,
                      color: LUXURY.textSecondary,
                      borderColor: LUXURY.bronzeBorder,
                    }
              }
            >
              {emoji} {tSeasons(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
