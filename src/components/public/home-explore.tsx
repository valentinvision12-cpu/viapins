"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeroMap } from "@/components/public/hero-map";
import { CountriesGrid } from "@/components/public/countries-grid";
import { SearchResultsGrid } from "@/components/public/search-results-grid";
import { ThemeFilterBar } from "@/components/public/theme-filter-bar";
import { getAvailableThemes, matchesTheme } from "@/lib/theme-filters";
import { LUXURY } from "@/lib/luxury-palette";
import type { CountryCard, DestinationCard, SearchResultItem } from "@/actions/get-destinations";

interface Props {
  countries: CountryCard[];
  searchIndex: SearchResultItem[];
  cities: DestinationCard[];
}

export function HomeExplore({ countries, searchIndex, cities }: Props) {
  const tHome = useTranslations("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [themesOpen, setThemesOpen] = useState(false);

  const scrollToDestinations = useCallback(() => {
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const cityTagsByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of cities) {
      map.set(`${c.slug.country}/${c.slug.city}`, c.tags);
    }
    return map;
  }, [cities]);

  const availableThemes = useMemo(
    () => getAvailableThemes(cities.map((c) => c.tags)),
    [cities]
  );

  useEffect(() => {
    if (theme && !availableThemes.includes(theme as (typeof availableThemes)[number])) {
      setTheme(null);
    }
  }, [theme, availableThemes]);

  const themedCountries = useMemo(() => {
    if (!theme) return countries;
    const matchingCountrySlugs = new Set(
      cities
        .filter((c) => matchesTheme(c.tags, theme))
        .map((c) => c.slug.country)
    );
    return countries.filter(
      (c) => matchingCountrySlugs.has(c.slug) || matchesTheme(c.tags, theme)
    );
  }, [countries, cities, theme]);

  const themedSearchIndex = useMemo(() => {
    if (!theme) return searchIndex;
    return searchIndex.filter((item) => {
      if (item.type === "country") {
        return themedCountries.some((c) => c.slug === item.slug.country);
      }
      if (!item.slug.city) return false;
      const key = `${item.slug.country}/${item.slug.city}` as `${string}/${string}`;
      return matchesTheme(cityTagsByKey.get(key), theme);
    });
  }, [searchIndex, theme, themedCountries, cityTagsByKey]);

  function handleThemeChange(next: string | null) {
    setTheme(next);
    if (next) {
      document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      <HeroMap
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToDestinations}
      />

      {isSearching ? (
        <SearchResultsGrid items={themedSearchIndex} query={searchQuery} />
      ) : (
        <>
          <div id="destinations">
            <CountriesGrid countries={themedCountries} />
          </div>

          {availableThemes.length > 0 && (
            <section
              className="border-t py-8 sm:py-10"
              style={{
                background: LUXURY.section,
                borderColor: LUXURY.bronzeBorder,
              }}
            >
              <div className="container max-w-4xl mx-auto px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setThemesOpen((open) => !open)}
                  className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    background: LUXURY.creamCard,
                    borderColor: LUXURY.bronzeBorder,
                    color: LUXURY.textSecondary,
                  }}
                >
                  {tHome("themesBrowse")}
                  {theme && (
                    <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      1
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${themesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {themesOpen && (
                  <div className="mt-6">
                    <ThemeFilterBar
                      active={theme}
                      onChange={handleThemeChange}
                      available={availableThemes}
                      compact
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
