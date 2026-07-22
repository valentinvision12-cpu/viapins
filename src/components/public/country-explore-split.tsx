"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Car, MapPin } from "lucide-react";
import { DestinationCard } from "@/components/public/destination-card";
import { AdventureRouteCard } from "@/components/public/adventure-route-card";
import type { DestinationCard as DestinationCardType } from "@/actions/get-destinations";
import { LUXURY } from "@/lib/luxury-palette";
import { cn } from "@/lib/utils";

export interface CountryAdventureSummary {
  countrySlug: string;
  countryName: string;
  coverImage: string;
  totalDays: number;
  stopCount: number;
  subtitle: string;
}

interface Props {
  countryName: string;
  cities: DestinationCardType[];
  adventure: CountryAdventureSummary | null;
}

export function CountryExploreSplit({ countryName, cities, adventure }: Props) {
  const t = useTranslations("CountryExplore");
  const [activeTab, setActiveTab] = useState<"cities" | "road-trip">("cities");

  const citiesGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {cities.map((city, i) => (
        <DestinationCard
          key={city.id}
          destination={city}
          index={i}
          priority={i < 3}
        />
      ))}
    </div>
  );

  if (!adventure) {
    return (
      <section className="container max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {citiesGrid}
      </section>
    );
  }

  return (
    <section className="container max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="text-center mb-8 sm:mb-10">
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-5"
          style={{ color: LUXURY.text }}
        >
          {t("exploreModesTitle", { country: countryName })}
        </h2>

        <div
          className="inline-flex relative rounded-full p-1 border"
          role="tablist"
          aria-label={t("exploreModesTitle", { country: countryName })}
          style={{
            background: LUXURY.creamCard,
            borderColor: LUXURY.bronzeBorder,
          }}
        >
          <div
            aria-hidden
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{
              background: LUXURY.text,
              width: "calc(50% - 4px)",
              left: activeTab === "cities" ? "4px" : "calc(50%)",
            }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cities"}
            onClick={() => setActiveTab("cities")}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 rounded-full text-sm sm:text-base font-semibold transition-colors min-w-[9.5rem] sm:min-w-[11rem]",
              activeTab === "cities" ? "text-white" : "hover:opacity-80"
            )}
            style={activeTab === "cities" ? undefined : { color: LUXURY.textSecondary }}
          >
            <MapPin className="w-4 h-4" />
            {t("tabCityGuides")}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "road-trip"}
            onClick={() => setActiveTab("road-trip")}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 rounded-full text-sm sm:text-base font-semibold transition-colors min-w-[9.5rem] sm:min-w-[11rem]",
              activeTab === "road-trip" ? "text-white" : "hover:opacity-80"
            )}
            style={activeTab === "road-trip" ? undefined : { color: LUXURY.textSecondary }}
          >
            <Car className="w-4 h-4" />
            {t("tabRoadTrip")}
          </button>
        </div>
      </div>

      <div className="min-h-[320px]">
        {activeTab === "cities" ? (
          <div className="animate-fade-in">
            <p
              className="text-center text-sm sm:text-base mb-8 max-w-2xl mx-auto"
              style={{ color: LUXURY.textSecondary }}
            >
              {t("cityGuidesIntro")}
            </p>
            {citiesGrid}
          </div>
        ) : (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <p
              className="text-center text-sm sm:text-base mb-8 max-w-2xl mx-auto"
              style={{ color: LUXURY.textSecondary }}
            >
              {t("roadTripIntro")}
            </p>
            <AdventureRouteCard
              countrySlug={adventure.countrySlug}
              countryName={adventure.countryName}
              coverImage={adventure.coverImage}
              totalDays={adventure.totalDays}
              stopCount={adventure.stopCount}
              subtitle={adventure.subtitle}
            />
          </div>
        )}
      </div>
    </section>
  );
}
