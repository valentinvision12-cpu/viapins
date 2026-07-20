"use client";

import { useState } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, BookOpen, ChevronDown, Plus } from "lucide-react";
import { getPlaceContent } from "@/lib/content-locale";

interface Place {
  id: string;
  name: string;
  image_url: string;
  lat: number;
  lng: number;
  order_index: number;
  translations: Record<string, { description: string; wiki_text: string }>;
}

interface Props {
  places: Place[];
  locale: string;
}

// Always English landmark copy
function getDescription(
  translations: Record<string, { description: string; wiki_text: string }>,
  locale: string
) {
  return getPlaceContent(translations, locale);
}

function PlaceCard({ place, locale, index }: { place: Place; locale: string; index: number }) {
  const [wikiOpen, setWikiOpen] = useState(false);
  const { description, wiki_text } = getDescription(place.translations, locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-white/8 bg-white/4 hover:border-white/16 hover:bg-white/6 transition-all"
    >
      {/* Image */}
      <div className="relative sm:w-48 sm:flex-shrink-0 h-44 sm:h-auto rounded-xl overflow-hidden">
        <Image
          src={place.image_url}
          alt={place.name}
          fill
          sizes="(max-width: 640px) 100vw, 192px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
        {/* Order badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[oklch(0.72_0.13_82)] flex items-center justify-center text-white text-xs font-bold shadow-lg">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-white font-semibold text-lg leading-tight">
            {place.name}
          </h3>
          {/* Add to Route — placeholder for Module 4 */}
          <button
            disabled
            title="Coming in Module 4"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-xs font-medium cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Route
          </button>
        </div>

        {/* GPS */}
        <div className="flex items-center gap-1.5 text-white/35 text-xs mb-3">
          <MapPin className="w-3 h-3" />
          <span>
            {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-white/60 text-sm leading-relaxed line-clamp-3 mb-4">
            {description}
          </p>
        )}

        {/* Wikipedia accordion */}
        {wiki_text && (
          <div>
            <button
              onClick={() => setWikiOpen((o) => !o)}
              className="flex items-center gap-2 text-[oklch(0.72_0.13_82)] text-xs font-medium hover:opacity-80 transition-opacity"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {wikiOpen ? "Hide History" : "Read History"}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${wikiOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {wikiOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="mt-3 pt-3 border-t border-white/8 text-white/50 text-sm leading-relaxed">
                    {wiki_text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function PlacesList({ places, locale }: Props) {
  if (places.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No landmarks available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {places.map((place, i) => (
        <PlaceCard key={place.id} place={place} locale={locale} index={i} />
      ))}
    </div>
  );
}
