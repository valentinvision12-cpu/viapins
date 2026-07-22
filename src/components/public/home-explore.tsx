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
import {
  HOME_FEATURED_COUNTRIES,
  TOP_COUNTRIES_HOME,
} from "@/lib/featured-countries";
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
  const [showAllCountries, setShowAllCountries] = useState(false);

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

  const featuredCountries = useMemo(() => {
    const byName = new Map(themedCountries.map((c) => [c.country, c]));
    const ordered = HOME_FEATURED_COUNTRIES.map((name) => byName.get(name)).filter(
      (c): c is CountryCard => Boolean(c)
    );
    if (ordered.length >= 4) return ordered.slice(0, TOP_COUNTRIES_HOME);

    // Fallback: fill from themed list if curated picks are missing
    const featuredSlugs = new Set(ordered.map((c) => c.slug));
    const fill = themedCountries.filter((c) => !featuredSlugs.has(c.slug));
    return [...ordered, ...fill].slice(0, TOP_COUNTRIES_HOME);
  }, [themedCountries]);

  const featuredSlugs = useMemo(
    () => new Set(featuredCountries.map((c) => c.slug)),
    [featuredCountries]
  );

  const remainingCountries = useMemo(
    () => themedCountries.filter((c) => !featuredSlugs.has(c.slug)),
    [themedCountries, featuredSlugs]
  );

  function handleThemeChange(next: string | null) {
    setTheme(next);
    if (next) {
      setShowAllCountries(true);
      document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const themeFilter =
    availableThemes.length > 0 ? (
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
    ) : null;

  return (
    <>
      <HeroMap
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToDestinations}
      />

      {isSearching ? (
        <SearchResultsGrid items={themedSearchIndex} query={searchQuery} />
      ) : theme ? (
        <div id="destinations">
          {themeFilter}
          <CountriesGrid
            countries={themedCountries}
            title={tHome("featuredDestinationsTitle")}
            subtitle={`${themedCountries.length} ${tHome("countriesCount")}`}
          />
        </div>
      ) : (
        <>
          <div id="destinations">
            <CountriesGrid
              countries={featuredCountries}
              title={tHome("featuredDestinationsTitle")}
              subtitle={tHome("featuredDestinationsHint")}
              showContinentSections={false}
            />
          </div>

          {themeFilter}

          {!showAllCountries ? (
            <section className="px-6 pb-14" style={{ background: LUXURY.section }}>
              <div className="container max-w-7xl mx-auto flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllCountries(true)}
                  className="px-8 py-3 rounded-full text-sm font-semibold transition-colors border hover:opacity-90"
                  style={{
                    background: LUXURY.creamCard,
                    borderColor: LUXURY.bronzeBorder,
                    color: LUXURY.text,
                  }}
                >
                  {tHome("browseAllCountries", { count: themedCountries.length })}
                </button>
              </div>
            </section>
          ) : (
            <div className="animate-fade-in">
              <CountriesGrid
                countries={remainingCountries}
                title={tHome("allDestinationsTitle")}
                subtitle={`${remainingCountries.length} ${tHome("countriesCount")}`}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
