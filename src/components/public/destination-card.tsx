"use client";

import Image from "next/image";
import { useState } from "react";
import { MapPin, Layers, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import type { DestinationCard as DestinationCardType } from "@/actions/get-destinations";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  destination: DestinationCardType;
  index: number;
  priority?: boolean;
}

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

export function DestinationCard({ destination, index, priority = false }: Props) {
  const gradient = gradientForCity(destination.city);
  const seed = `${destination.city}-${destination.country}`;
  const [imgSrc, setImgSrc] = useState(
    destination.coverImage || fallbackImageUrl(seed)
  );
  const hasImage = !!imgSrc;

  const cardContent = (
    <div className="rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-stone-200/60">
      {/* Cover image — full bleed, taller on mobile */}
      <div className={`relative h-60 sm:h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {hasImage && (
          <Image
            src={imgSrc}
            alt={`${destination.city}, ${destination.country}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
            priority={priority}
            referrerPolicy="no-referrer"
            onError={() => setImgSrc(fallbackImageUrl(seed))}
          />
        )}

        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold text-white/10 select-none">
              {destination.city.charAt(0)}
            </span>
          </div>
        )}

        {/* Rich gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Place count badge — glassmorphism pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
          <Layers className="w-3 h-3" />
          {destination.placeCount}
        </div>

        {/* City name overlaid on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
            <span className="text-white/60 text-xs truncate">{destination.country}</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <h3 className="font-bold text-2xl text-white leading-tight drop-shadow-sm">
              {destination.city}
            </h3>
            <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
          {destination.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {destination.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 backdrop-blur-sm border border-white/20 text-white/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtle bottom strip (hidden — content is now on image) */}
      <div className="hidden" />
    </div>
  );

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/explore/${destination.slug.country}/${destination.slug.city}`} className="group block">
        {cardContent}
      </Link>
    </motion.div>
  );
}
