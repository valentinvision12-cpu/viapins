"use client";

import Image from "next/image";
import { MapPin, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { FavoritePlace } from "@/actions/favorites";
import { CollectionDownloadMenu } from "@/components/public/collection-download-menu";
import { ShareButton } from "@/components/public/share-button";
import { CountryFlag } from "@/components/public/country-flag";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import { slugify } from "@/lib/utils";

interface Props {
  country: string;
  places: FavoritePlace[];
  index: number;
  locale?: string;
}

export function CountryCollectionCard({ country, places, index, locale = "en" }: Props) {
  const coverImages = places.map((p) => p.image_url).filter(Boolean).slice(0, 3);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/explore/${slugify(country)}`
      : `${SITE_DEFAULT_URL}/${locale}/explore/${slugify(country)}`;

  const collection = {
    title: `My ${country} Collection`,
    subtitle: `${places.length} saved landmarks`,
    country,
    places: places.map((p) => ({
      name: p.name,
      city: p.city,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      image_url: p.image_url,
    })),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md hover:border-stone-200 transition-all"
    >
      <div className="relative h-36 flex overflow-hidden bg-stone-100">
        {coverImages.length > 0 ? (
          coverImages.map((src, i) => (
            <div key={i} className="relative flex-1 min-w-0">
              <Image src={src} alt="" fill className="object-cover" unoptimized sizes="120px" />
            </div>
          ))
        ) : (
          <div className="flex-1 bg-gradient-to-br from-stone-200 to-stone-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3">
          <CountryFlag country={country} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg drop-shadow-md">{country}</h3>
          <p className="text-white/80 text-xs flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {places.length} places in your collection
          </p>
        </div>
      </div>

      <ul className="px-4 py-3 space-y-1.5 max-h-32 overflow-y-auto border-b border-stone-50">
        {places.slice(0, 5).map((p) => (
          <li key={p.place_id} className="flex items-center gap-2 text-xs text-stone-600">
            <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="truncate font-medium">{p.name}</span>
            <span className="text-stone-300 truncate">{p.city}</span>
          </li>
        ))}
        {places.length > 5 && (
          <li className="text-[10px] text-stone-400 pl-5">+{places.length - 5} more</li>
        )}
      </ul>

      <div className="flex items-center gap-2 p-3">
        <CollectionDownloadMenu collection={collection} variant="menu" className="flex-1" />
        <ShareButton
          url={shareUrl}
          title={`My ${country} travel collection`}
          description={`${places.length} landmarks I want to visit`}
          variant="pill"
        />
      </div>
    </motion.div>
  );
}
