"use client";

import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { useState } from "react";
import { Layers, ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import type { DestinationCard as DestinationCardType } from "@/actions/get-destinations";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  destination: DestinationCardType;
  index: number;
  priority?: boolean;
  /** Show country line under the city (home/search). Hidden on country pages. */
  showCountry?: boolean;
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

export function DestinationCard({
  destination,
  index,
  priority = false,
  showCountry = false,
}: Props) {
  const gradient = gradientForCity(destination.city);
  const seed = `${destination.city}-${destination.country}`;
  const [imgSrc, setImgSrc] = useState(
    destination.coverImage || fallbackImageUrl(seed)
  );

  const cardContent = (
    <div className="rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-stone-200/60">
      <div className={`relative h-60 sm:h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
        <Image
          src={imgSrc}
          alt={destination.city}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
          referrerPolicy={IMAGE_REFERRER_POLICY}
          onError={() => setImgSrc(fallbackImageUrl(seed))}
              unoptimized={IMAGE_UNOPTIMIZED} />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-lg">
          <Layers className="w-3 h-3" />
          {destination.placeCount}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {showCountry && (
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-3 h-3 text-white/80 flex-shrink-0" />
              <span className="text-white/85 text-xs font-medium truncate drop-shadow-sm">
                {destination.country}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between gap-2">
            <h3
              className="font-bold text-2xl text-white leading-tight"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.65)" }}
            >
              {destination.city}
            </h3>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
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
