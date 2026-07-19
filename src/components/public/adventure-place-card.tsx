"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, BookOpen, ChevronDown, Plus, Check, ExternalLink, Compass,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouteCart, type RouteCartItem } from "@/lib/context/route-cart-context";
import type { AdventurePlace, AdventureTag } from "@/lib/adventure-types";
import { buildPlaceSeo } from "@/lib/seo";
import { wikipediaUrl } from "@/lib/place-links";
import { getPlaceContent } from "@/lib/content-locale";
import { MapsPlaceLink } from "@/components/public/maps-place-link";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  place: AdventurePlace;
  locale: string;
  index: number;
  stopNumber: number;
}

export function AdventurePlaceCard({ place, locale, index, stopNumber }: Props) {
  const t = useTranslations("adventure");
  const tPlace = useTranslations("place");
  const tRoute = useTranslations("route");
  const [wikiOpen, setWikiOpen] = useState(false);
  const _fallback = fallbackImageUrl(`${place.name}-${place.country}`);
  const [imgSrc, setImgSrc] = useState(place.image_url || _fallback);
  const { addItem, removeItem, isInCart } = useRouteCart();

  const tagLabels: Record<AdventureTag, string> = {
    hidden_gem: t("tagHiddenGem"),
    monument: t("tagMonument"),
    nature: t("tagNature"),
    ruins: t("tagRuins"),
    viewpoint: t("tagViewpoint"),
    cave: t("tagCave"),
  };

  useEffect(() => {
    setImgSrc(place.image_url || _fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.image_url]);

  const inCart = isInCart(place.id);
  const { description, wiki_text, wiki_title, maps_query, maps_url } = getPlaceContent(
    place.translations,
    locale
  );
  const placeSeo = buildPlaceSeo({
    name: place.name,
    city: place.region,
    country: place.country,
    locale: "en",
    translations: place.translations,
  });

  function handleCartToggle() {
    if (inCart) {
      removeItem(place.id);
    } else {
      const item: RouteCartItem = {
        id: place.id,
        name: place.name,
        city: place.region,
        country: place.country,
        region: place.region,
        lat: place.lat,
        lng: place.lng,
        image_url: place.image_url,
        order_index: place.order_index,
        mode: "adventure",
        requires_car: place.requires_car,
      };
      addItem(item);
    }
  }

  const wikiUrl = wikipediaUrl(place.wiki_title ?? wiki_title ?? place.name);

  return (
    <motion.article
      id={`adventure-${place.id}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        inCart
          ? "border-orange-300 bg-orange-50/60 shadow-md shadow-orange-100"
          : "border-stone-100 bg-white shadow-sm hover:shadow-md hover:border-stone-200"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-0">
        <div className="relative sm:w-56 flex-shrink-0 h-48 sm:h-auto overflow-hidden sm:rounded-l-2xl">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={placeSeo.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              unoptimized
              referrerPolicy="no-referrer"
              onError={() => {
                fetch(`/api/places/${place.id}/image?refresh=1`)
                  .then((r) => r.json())
                  .then((data: { url?: string }) => {
                    if (data.url) setImgSrc(data.url);
                    else if (imgSrc !== _fallback) setImgSrc(_fallback);
                    else setImgSrc("");
                  })
                  .catch(() => {
                    if (imgSrc !== _fallback) setImgSrc(_fallback);
                    else setImgSrc("");
                  });
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
              <Compass className="w-10 h-10 text-orange-300/80" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                inCart ? "text-white bg-orange-500" : "bg-white/90 text-stone-700"
              }`}
            >
              {stopNumber}
            </div>
            <div className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold">
              {t("dayLabel", { day: place.day })}
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-stone-900 font-bold text-lg leading-tight">
                {place.name}
              </h3>
              <p className="inline-flex items-center gap-1 mt-1 text-orange-600/80 text-xs font-medium">
                <MapPin className="w-3 h-3" />
                {place.region} · {t("stopLabel", { number: stopNumber })}
              </p>
              <MapsPlaceLink
                lat={place.lat}
                lng={place.lng}
                name={place.name}
                city={place.region}
                country={place.country}
                mapsQuery={maps_query}
                mapsUrl={maps_url}
                translations={place.translations}
                locale={locale}
                className="inline-flex items-center gap-1 mt-0.5 text-stone-400 hover:text-stone-600 text-xs transition-colors"
              />
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-0.5 ml-3 text-stone-400 hover:text-stone-600 text-xs transition-colors"
              >
                Wikipedia
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <motion.button
              onClick={handleCartToggle}
              whileTap={{ scale: 0.92 }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                inCart
                  ? "text-white border-transparent shadow-sm bg-orange-500"
                  : "border-stone-300 bg-stone-50 text-stone-700 hover:border-orange-400 hover:text-orange-700 hover:bg-orange-50"
              }`}
            >
              <AnimatePresence mode="wait">
                {inCart ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t("inAdventure")}
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("addStop")}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100"
              >
                {tagLabels[tag]}
              </span>
            ))}
          </div>

          {description && (
            <p className="text-stone-500 text-sm leading-relaxed line-clamp-3 mb-4">
              {description}
            </p>
          )}

          {wiki_text && (
            <div>
              <button
                onClick={() => setWikiOpen((o) => !o)}
                className="flex items-center gap-1.5 text-xs font-medium text-orange-700 hover:opacity-80 transition-opacity"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {wikiOpen ? tPlace("hideHistory") : tPlace("readHistory")}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    wikiOpen ? "rotate-180" : ""
                  }`}
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
                    <p className="mt-3 pt-3 border-t border-stone-100 text-stone-600 text-sm leading-relaxed">
                      {wiki_text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
