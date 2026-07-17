"use client";

import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { CountryCard } from "@/actions/get-destinations";
import { LUXURY } from "@/lib/luxury-palette";
import { CountryFlag } from "@/components/public/country-flag";
import { CountryCoverSlideshow } from "@/components/public/country-cover-slideshow";
import { ContinentBadge } from "@/components/public/continent-badge";

interface Props {
  country: CountryCard;
  index: number;
}

const GRADIENTS = [
  "from-[#1a2a4a] to-[#2d4a7a]",
  "from-[#1a3a2a] to-[#2a5a3a]",
  "from-[#3a1a2a] to-[#6a2a4a]",
  "from-[#2a2a1a] to-[#4a4a2a]",
];

export function CountryCard({ country, index }: Props) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const slides =
    country.coverImages.length > 0
      ? country.coverImages
      : country.coverImage
        ? [country.coverImage]
        : [];

  return (
    <div
      className="group animate-fade-in opacity-0"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <Link href={`/explore/${country.slug}`} className="group block">
        <div
          className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5"
          style={{
            background: LUXURY.creamCard,
            border: `1px solid ${LUXURY.bronzeBorder}`,
          }}
        >
          <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${gradient}`}>
            {slides.length > 0 && (
              <CountryCoverSlideshow
                images={slides}
                alt={country.country}
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

            <div className="absolute top-3.5 left-3.5 z-10">
              <CountryFlag country={country.country} size="md" />
            </div>

            <div className="absolute top-3.5 right-3.5 z-10">
              <ContinentBadge continent={country.continent} variant="card" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pt-14 z-10 pointer-events-none">
              <h3
                className="font-bold text-2xl sm:text-[1.65rem] leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.5)" }}
              >
                {country.country}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
                <span className="text-white/85 text-sm font-medium drop-shadow-md">
                  {country.cityCount} cities
                </span>
              </div>
            </div>
          </div>

          {country.tags.length > 0 && (
            <div className="px-4 py-3 flex flex-wrap gap-1.5">
              {country.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-stone-50 text-stone-500 border-stone-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
