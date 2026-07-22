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
    <section className="container max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 border-t border-stone-200/70">
      <div className="text-center mb-10 sm:mb-12">
        <h2
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-8"
          style={{ color: LUXURY.text }}
        >
          {t("exploreModesTitle", { country: countryName })}
        </h2>

        <div
          className="inline-flex relative rounded-full p-1.5 border shadow-inner"
          role="tablist"
          aria-label={t("exploreModesTitle", { country: countryName })}
          style={{
            background: "#F3F0EA",
            borderColor: LUXURY.bronzeBorder,
          }}
        >
          <div
            aria-hidden
            className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out shadow-md"
            style={{
              background: LUXURY.text,
              width: "calc(50% - 6px)",
              left: activeTab === "cities" ? "6px" : "calc(50%)",
            }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cities"}
            onClick={() => setActiveTab("cities")}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-2 px-7 sm:px-10 py-3 rounded-full text-sm sm:text-base font-semibold transition-colors min-w-[10.5rem] sm:min-w-[13rem]",
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
              "relative z-10 inline-flex items-center justify-center gap-2 px-7 sm:px-10 py-3 rounded-full text-sm sm:text-base font-semibold transition-colors min-w-[10.5rem] sm:min-w-[13rem]",
              activeTab === "road-trip" ? "text-white" : "hover:opacity-80"
            )}
            style={activeTab === "road-trip" ? undefined : { color: LUXURY.textSecondary }}
          >
            <Car className="w-4 h-4" />
            {t("tabRoadTrip")}
          </button>
        </div>
      </div>

      <div className="min-h-[420px]">
        {activeTab === "cities" ? (
          <div className="animate-fade-in">
            <p
              className="text-center text-sm sm:text-base mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: LUXURY.textSecondary }}
            >
              {t("cityGuidesIntro")}
            </p>
            {citiesGrid}
          </div>
        ) : (
          <div className="animate-fade-in max-w-5xl mx-auto">
            <p
              className="text-center text-sm sm:text-base mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: LUXURY.textSecondary }}
            >
              {t("roadTripIntro")}
            </p>
            <div
              className="rounded-2xl border p-2 sm:p-3 shadow-sm"
              style={{
                background: LUXURY.creamCard,
                borderColor: LUXURY.bronzeBorder,
              }}
            >
              <AdventureRouteCard
                countrySlug={adventure.countrySlug}
                countryName={adventure.countryName}
                coverImage={adventure.coverImage}
                totalDays={adventure.totalDays}
                stopCount={adventure.stopCount}
                subtitle={adventure.subtitle}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}