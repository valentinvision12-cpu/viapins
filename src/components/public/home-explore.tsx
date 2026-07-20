"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);

  const scrollToDestinations = useCallback(() => {
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const cityTagsByKey = useMemo(
    () =>
      new Map(
        cities.map((c) => [`${c.slug.country}/${c.slug.city}`, c.tags] as const)
      ),
    [cities]
  );

  const availableThemes = useMemo(
    () => getAvailableThemes(cities.map((c) => c.tags)),
    [cities]
  );

  // Clear active theme if it no longer has matching destinations
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
      const key = `${item.slug.country}/${item.slug.city}`;
      return matchesTheme(cityTagsByKey.get(key), theme);
    });
  }, [searchIndex, theme, themedCountries, cityTagsByKey]);

  return (
    <>
      <HeroMap
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToDestinations}
      />

      <div className="pb-6 pt-2" style={{ background: LUXURY.section }}>
        <ThemeFilterBar
          active={theme}
          onChange={setTheme}
          available={availableThemes}
        />
      </div>

      {isSearching ? (
        <SearchResultsGrid items={themedSearchIndex} query={searchQuery} />
      ) : (
        <CountriesGrid countries={themedCountries} />
      )}
    </>
  );
}
