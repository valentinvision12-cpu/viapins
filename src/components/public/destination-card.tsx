"use client";

import Image from "next/image";
import { useState } from "react";
import { MapPin, Layers } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DestinationCard as DestinationCardType } from "@/actions/get-destinations";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  destination: DestinationCardType;
  index: number;
}

const TAG_COLORS: Record<string, string> = {
  winter: "bg-sky-50 text-sky-600 border-sky-100",
  spring: "bg-pink-50 text-pink-600 border-pink-100",
  summer: "bg-amber-50 text-amber-600 border-amber-100",
  autumn: "bg-orange-50 text-orange-600 border-orange-100",
};

const GRADIENTS = [
  "from-[#1a2a4a] to-[#2d4a7a]",
  "from-[#1a3a2a] to-[#2a5a3a]",
  "from-[#3a1a2a] to-[#6a2a4a]",
  "from-[#2a2a1a] to-[#4a4a2a]",
  "from-[#1a1a3a] to-[#2a2a6a]",
  "from-[#3a2a1a] to-[#6a4a2a]",
];

function gradientForCity(city: string) {
  const idx =
    city.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;
  return GRADIENTS[idx];
}

export function DestinationCard({ destination, index }: Props) {
  const gradient = gradientForCity(destination.city);
  const [imgSrc, setImgSrc] = useState(destination.coverImage || "");
  const hasImage = !!imgSrc;

  const cardContent = (
    <div
      className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5"
      style={{
        background: LUXURY.creamCard,
        border: `1px solid ${LUXURY.bronzeBorder}`,
      }}
    >
      {/* Cover image */}
      <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {hasImage && (
          <Image
            src={imgSrc}
            alt={`${destination.city}, ${destination.country}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setImgSrc("")}
          />
        )}

        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold text-white/10 select-none">
              {destination.city.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Place count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium">
          <Layers className="w-3 h-3" />
          {destination.placeCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LUXURY.bronze }} />
          <span className="text-xs truncate" style={{ color: LUXURY.textMuted }}>{destination.country}</span>
        </div>

        <h3
          className="font-bold text-lg leading-tight mb-3 transition-colors group-hover:opacity-80"
          style={{ color: LUXURY.text }}
        >
          {destination.city}
        </h3>

        {destination.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {destination.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  TAG_COLORS[tag.toLowerCase()] ??
                  "bg-stone-50 text-stone-500 border-stone-100"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="group animate-fade-in opacity-0"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <Link href={`/explore/${destination.slug.country}/${destination.slug.city}`} className="group block">
        {cardContent}
      </Link>
    </div>
  );
}
