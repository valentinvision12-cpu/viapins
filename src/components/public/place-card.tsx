"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Plus, Check, ExternalLink, Heart, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { useFavorites } from "@/lib/context/favorites-context";
import { isBadImageUrl } from "@/lib/wiki-image";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { buildPlaceSeo } from "@/lib/seo";
import { wikipediaUrl } from "@/lib/place-links";
import { MapsPlaceLink } from "@/components/public/maps-place-link";
import { PassportPostComposer } from "@/components/public/passport-post-composer";
import { Link } from "@/i18n/navigation";
import { getPlaceContent } from "@/lib/content-locale";
import { placeSlug } from "@/lib/place-slug";
import { slugify } from "@/lib/utils";

interface PlaceData {
  id: string;
  name: string;
  image_url: string;
  lat: number;
  lng: number;
  order_index: number;
  translations: Record<
    string,
    {
      description: string;
      wiki_text: string;
      wiki_title?: string;
      maps_query?: string;
      maps_url?: string;
      seo_keywords?: string[];
      seo_phrase?: string;
    }
  >;
}

interface Props {
  place: PlaceData;
  locale: string;
  city: string;
  country: string;
  index: number;
}

export function PlaceCard({ place, locale, city, country, index }: Props) {
  const t = useTranslations("route");
  const tPlace = useTranslations("place");
  const tTrip = useTranslations("myTrip");
  const [wikiOpen, setWikiOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const fallback = fallbackImageUrl(`${place.name}-${city}`);
  const [imgSrc, setImgSrc] = useState(place.image_url || fallback);
  const { addItem, removeItem, isInCart } = useRouteCart();
  const { isFavorite, toggleFavorite, isLoggedIn, favorites } = useFavorites();

  useEffect(() => {
    setImgSrc(place.image_url || fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.image_url]);

  // Only fetch when image is missing/bad — skip geo-verify on the hot path
  // (false positives from Wikimedia filenames caused N API calls per city).
  useEffect(() => {
    const url = place.image_url?.trim() ?? "";
    if (url && !isBadImageUrl(url)) return;
    let cancelled = false;
    fetch(`/api/places/${place.id}/image`)
      .then((r) => r.json())
      .then((data: { url?: string }) => {
        if (!cancelled && data.url) setImgSrc(data.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [place.id, place.image_url]);

  const inTrip = isInCart(place.id);
  const { description, wiki_text, wiki_title, maps_query, maps_url } = getPlaceContent(place.translations, locale);
  const placeSeo = buildPlaceSeo({
    name: place.name,
    city,
    country,
    locale,
    translations: place.translations,
  });

  function handleTripToggle() {
    if (inTrip) {
      removeItem(place.id);
      return;
    }

    addItem({
      id: place.id,
      name: place.name,
      city,
      country,
      lat: place.lat,
      lng: place.lng,
      image_url: place.image_url,
      order_index: place.order_index,
      mode: "city",
    });
  }

  function handleFavoriteToggle() {
    if (!isLoggedIn) return;
    toggleFavorite({
      place_id: place.id,
      name: place.name,
      city,
      country,
      image_url: place.image_url,
      lat: place.lat,
      lng: place.lng,
    });
  }

  const isFav = isFavorite(place.id);

  const wikiUrl = wiki_title ? wikipediaUrl(wiki_title) : null;

  return (
    <motion.article
      id={`place-${place.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      aria-label={placeSeo.seoPhrase}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
        inTrip
          ? "border-amber-300/80 bg-amber-50/50 shadow-sm"
          : "border-stone-200/80 bg-white shadow-sm hover:shadow-md hover:border-stone-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-0">
        <div className="relative sm:w-56 flex-shrink-0 h-48 sm:min-h-[11.5rem] sm:h-auto overflow-hidden sm:rounded-l-2xl bg-stone-100">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={placeSeo.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover"
              referrerPolicy={IMAGE_REFERRER_POLICY}
              onError={() => {
                fetch(`/api/places/${place.id}/image?refresh=1`)
                  .then((r) => r.json())
                  .then((data: { url?: string }) => {
                    if (data.url) setImgSrc(data.url);
                    else setImgSrc(fallbackImageUrl(`${place.name}-${city}`));
                  })
                  .catch(() => setImgSrc(fallbackImageUrl(`${place.name}-${city}`)));
              }}
              unoptimized={IMAGE_UNOPTIMIZED} />
          ) : (
            <div className="relative w-full h-full bg-gradient-to-br from-stone-200 to-stone-300">
              <Image
                src={fallbackImageUrl(`${place.name}-${city}`)}
                alt={place.name}
                fill
                sizes="(max-width: 640px) 100vw, 208px"
                className="object-cover opacity-70"
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
            </div>
          )}

          <div
            className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
              inTrip ? "text-white" : "bg-white/95 text-stone-700"
            }`}
            style={inTrip ? { background: "oklch(0.68 0.16 82)" } : undefined}
          >
            {index + 1}
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-5 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-stone-900 font-bold text-base sm:text-lg leading-tight">
                <Link
                  href={`/explore/${slugify(country)}/${slugify(city)}/${placeSlug(place.name, place.id)}`}
                  className="hover:underline"
                >
                  {place.name}
                </Link>
              </h3>
              <MapsPlaceLink
                lat={place.lat}
                lng={place.lng}
                name={place.name}
                city={city}
                country={country}
                mapsQuery={maps_query}
                mapsUrl={maps_url}
                translations={place.translations}
                locale={locale}
                className="inline-flex items-center gap-1 mt-1 text-stone-400 hover:text-blue-600 text-xs transition-colors"
              />
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleFavoriteToggle}
                whileTap={{ scale: 0.96 }}
                aria-pressed={isFav}
                title={isFav ? tPlace("saved") : tPlace("save")}
                className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                  isFav
                    ? "border-red-200 bg-red-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                } ${!isLoggedIn ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={!isLoggedIn}
              >
                <Heart
                  className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-stone-400"}`}
                />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setReviewOpen(true)}
                whileTap={{ scale: 0.96 }}
                title={tTrip("passportPostReviewPlace")}
                className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all border-stone-200 bg-white hover:border-amber-300 ${
                  !isLoggedIn ? "opacity-40 cursor-not-allowed" : ""
                }`}
                disabled={!isLoggedIn}
              >
                <Star className="w-4 h-4 text-amber-500" />
              </motion.button>

              <motion.button
                type="button"
                onClick={handleTripToggle}
                whileTap={{ scale: 0.96 }}
                aria-pressed={inTrip}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  inTrip
                    ? "text-white shadow-sm"
                    : "bg-stone-900 text-white hover:bg-stone-800"
                }`}
                style={inTrip ? { background: "oklch(0.68 0.16 82)" } : undefined}
              >
                {inTrip ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("removeFromRoute")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t("addToRoute")}
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {description && (
            <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-2">
              {description}
            </p>
          )}

          {(wiki_text || wikiUrl) && (
            <div className="mt-auto pt-2 border-t border-stone-50">
              {wikiUrl && !wiki_text && (
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-600 text-xs"
                >
                  Wikipedia
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {wiki_text && (
                <>
                  <button
                    type="button"
                    onClick={() => setWikiOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {wikiOpen ? tPlace("hideHistory") : tPlace("readHistory")}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${wikiOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {wikiOpen && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden text-stone-400 text-sm leading-relaxed mt-2"
                      >
                        {wiki_text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <PassportPostComposer
        favorites={favorites}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        initialPlace={{
          place_id: place.id,
          name: place.name,
          city,
          country,
          image_url: place.image_url || imgSrc,
        }}
      />
    </motion.article>
  );
}
