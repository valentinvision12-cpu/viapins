"use client";

import { useState, useCallback } from "react";
import { HeroMap } from "@/components/public/hero-map";
import { CountriesGrid } from "@/components/public/countries-grid";
import { SearchResultsGrid } from "@/components/public/search-results-grid";
import type { CountryCard, DestinationCard, SearchResultItem } from "@/actions/get-destinations";

interface Props {
  countries: CountryCard[];
  heroCountries: CountryCard[];
  searchIndex: SearchResultItem[];
  inspireCities: DestinationCard[];
}

export function HomeExplore({ countries, heroCountries, searchIndex, inspireCities }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToDestinations = useCallback(() => {
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleQuickPick = useCallback(
    (countryName: string) => {
      setSearchQuery(countryName);
      scrollToDestinations();
    },
    [scrollToDestinations]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <HeroMap
        featuredCountries={heroCountries}
        inspireCities={inspireCities}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickPick={handleQuickPick}
        onSearchSubmit={scrollToDestinations}
      />

      {isSearching ? (
        <SearchResultsGrid items={searchIndex} query={searchQuery} />
      ) : (
        <CountriesGrid countries={countries} />
      )}
    </>
  );
}
