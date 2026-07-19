"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { CountryCard } from "@/actions/get-destinations";
import { LUXURY } from "@/lib/luxury-palette";
import { CountryFlag } from "@/components/public/country-flag";
import { CountryCoverSlideshow } from "@/components/public/country-cover-slideshow";
import { ContinentBadge } from "@/components/public/continent-badge";
import { fallbackImageUrl } from "@/lib/fallback-image";

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
  const primaryImage =
    country.coverImage ||
    country.coverImages.find(Boolean) ||
    fallbackImageUrl(`${country.country}-travel`, 1000, 720);

  return (
    <div
      className="group animate-fade-in opacity-0"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <Link href={`/explore/${country.slug}`} className="group block">
        <div
          className="rounded-[1.4rem] overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
          style={{
            background: LUXURY.creamCard,
            border: `1px solid ${LUXURY.bronzeBorder}`,
          }}
        >
          <div className={`relative h-60 overflow-hidden bg-gradient-to-br ${gradient}`}>
            <CountryCoverSlideshow
              images={[primaryImage]}
              alt={`${country.country} travel guide`}
              className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]"
              intervalMs={0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/5 pointer-events-none" />

            <div className="absolute top-3.5 left-3.5 z-10">
              <CountryFlag country={country.country} size="md" />
            </div>

            <div className="absolute top-3.5 right-3.5 z-10">
              <ContinentBadge continent={country.continent} variant="card" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 z-10 pointer-events-none">
              <h3
                className="font-black text-[1.8rem] leading-tight text-white tracking-[-0.03em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.5)" }}
              >
                {country.country}
              </h3>
              <div className="flex items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF9A6B] flex-shrink-0" />
                  <span className="text-white/90 text-sm font-semibold drop-shadow-md">
                    {country.cityCount} cities
                  </span>
                </div>
                <span className="w-9 h-9 rounded-full bg-white/18 border border-white/25 backdrop-blur-md flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </span>
              </div>
            </div>
          </div>

          {/* Tags removed — keep card minimal and image-first */}
        </div>
      </Link>
    </div>
  );
}
