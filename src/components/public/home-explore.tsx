"use client";

import { useState, useCallback, useMemo } from "react";
import { HeroMap } from "@/components/public/hero-map";
import { CountriesGrid } from "@/components/public/countries-grid";
import { SearchResultsGrid } from "@/components/public/search-results-grid";
import { ThemeFilterBar } from "@/components/public/theme-filter-bar";
import { matchesTheme } from "@/lib/theme-filters";
import { LUXURY } from "@/lib/luxury-palette";
import type { CountryCard, DestinationCard, SearchResultItem } from "@/actions/get-destinations";

interface Props {
  countries: CountryCard[];
  searchIndex: SearchResultItem[];
  inspireCities: DestinationCard[];
}

export function HomeExplore({ countries, searchIndex, inspireCities }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);

  const scrollToDestinations = useCallback(() => {
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const themedCountries = useMemo(() => {
    if (!theme) return countries;
    return countries.filter((c) => matchesTheme(c.tags, theme));
  }, [countries, theme]);

  const themedSearchIndex = useMemo(() => {
    if (!theme) return searchIndex;
    // City rows carry tags via inspireCities lookup; countries via tags.
    const cityTags = new Map<string, string[] | undefined>(
      inspireCities.map((c) => [`${c.slug.country}/${c.slug.city}`, c.tags])
    );
    return searchIndex.filter((item) => {
      if (item.type === "country") {
        const country = countries.find((c) => c.slug === item.slug.country);
        return matchesTheme(country?.tags, theme);
      }
      if (!item.slug.city) return false;
      const key = `${item.slug.country}/${item.slug.city}`;
      return matchesTheme(cityTags.get(key), theme);
    });
  }, [searchIndex, theme, countries, inspireCities]);

  return (
    <>
      <HeroMap
        inspireCities={inspireCities}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToDestinations}
      />

      <div
        className="pb-6 pt-1"
        style={{ background: LUXURY.section }}
      >
        <ThemeFilterBar active={theme} onChange={setTheme} />
      </div>

      {isSearching ? (
        <SearchResultsGrid items={themedSearchIndex} query={searchQuery} />
      ) : (
        <CountriesGrid countries={themedCountries} />
      )}
    </>
  );
}
