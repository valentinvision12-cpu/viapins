"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MapsPlaceLink } from "@/components/public/maps-place-link";
import type { EnrichedPlace } from "@/actions/generate-destination";

type Locale = "en" | "es" | "fr" | "de" | "it";

const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  es: { flag: "🇪🇸", label: "ES" },
  fr: { flag: "🇫🇷", label: "FR" },
  de: { flag: "🇩🇪", label: "DE" },
  it: { flag: "🇮🇹", label: "IT" },
};

const LOCALES = Object.keys(LOCALE_META) as Locale[];

interface PlacePreviewCardProps {
  place: EnrichedPlace;
  rank: number;
  city: string;
  country: string;
}

export function PlacePreviewCard({ place, rank, city, country }: PlacePreviewCardProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [wikiOpen, setWikiOpen] = useState(false);

  const translation = place.translations[activeLocale];
  const hasWiki = !!translation.wiki_text;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={place.image_url}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />
        {/* Rank badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[oklch(0.22_0.07_250)] text-white flex items-center justify-center text-xs font-bold shadow-lg">
          {rank}
        </div>
        {/* Photo credit */}
        <a
          href={place.image_credit_link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full hover:text-white transition-colors"
        >
          © {place.image_credit}
        </a>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name + GPS */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{place.name}</h3>
          <MapsPlaceLink
            lat={place.lat}
            lng={place.lng}
            name={place.name}
            city={city}
            country={country}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5"
            showExternalIcon
          />
        </div>

        {/* Language tabs */}
        <div className="flex gap-1 mb-3 bg-gray-50 rounded-lg p-1">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveLocale(loc)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-all",
                activeLocale === loc
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <span>{LOCALE_META[loc].flag}</span>
              <span>{LOCALE_META[loc].label}</span>
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          {translation.description || (
            <span className="text-gray-300 italic">Без описание</span>
          )}
        </p>

        {/* Wikipedia accordion */}
        {hasWiki && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setWikiOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-800 transition-colors w-full"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📖 Wikipedia</span>
              <span className="ml-auto">
                {wikiOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
            {wikiOpen && (
              <p className="mt-2 text-[11px] text-gray-500 leading-relaxed line-clamp-5">
                {translation.wiki_text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
