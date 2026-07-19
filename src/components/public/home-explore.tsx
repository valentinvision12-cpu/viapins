"use client";

import { useState, useCallback } from "react";
import { HeroMap } from "@/components/public/hero-map";
import { CountriesGrid } from "@/components/public/countries-grid";
import { SearchResultsGrid } from "@/components/public/search-results-grid";
import type { CountryCard, SearchResultItem } from "@/actions/get-destinations";

interface Props {
  countries: CountryCard[];
  searchIndex: SearchResultItem[];
}

export function HomeExplore({ countries, searchIndex }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToDestinations = useCallback(() => {
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <HeroMap
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
