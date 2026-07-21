"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { Plus, Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { isBadImageUrl } from "@/lib/wiki-image";
import { buildPlaceSeo } from "@/lib/seo";
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
  const [imgSrc, setImgSrc] = useState(place.image_url || "");
  const { addItem, removeItem, isInCart, openPanel } = useRouteCart();

  useEffect(() => {
    setImgSrc(place.image_url || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.image_url]);

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
  const { description } = getPlaceContent(place.translations, locale);
  const placeSeo = buildPlaceSeo({
    name: place.name,
    city,
    country,
    locale,
    translations: place.translations,
  });

  const detailHref = `/explore/${slugify(country)}/${slugify(city)}/${placeSlug(place.name, place.id)}`;

  function handleToggle() {
    if (inTrip) {
      removeItem(place.id);
      return;
    }
    const added = addItem({
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
    if (added) openPanel();
  }

  return (
    <article
      id={`place-${place.id}`}
      aria-label={placeSeo.seoPhrase}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
        inTrip
          ? "border-amber-300/90 bg-amber-50/40 shadow-sm ring-1 ring-amber-200/50"
          : "border-stone-200/80 bg-white shadow-sm hover:shadow-md hover:border-stone-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-0">
        <button
          type="button"
          onClick={handleToggle}
          className="relative sm:w-56 flex-shrink-0 h-48 sm:min-h-[11.5rem] sm:h-auto overflow-hidden sm:rounded-l-2xl bg-stone-100 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          aria-pressed={inTrip}
          aria-label={inTrip ? t("removeFromRoute") : t("addToRoute")}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={placeSeo.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              referrerPolicy={IMAGE_REFERRER_POLICY}
              onError={() => setImgSrc("")}
              unoptimized={IMAGE_UNOPTIMIZED}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" aria-hidden />
          )}

          <div
            className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
              inTrip ? "text-white" : "bg-white/95 text-stone-700"
            }`}
            style={inTrip ? { background: "oklch(0.68 0.16 82)" } : undefined}
          >
            {index + 1}
          </div>

          <div
            className={`absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
              inTrip ? "bg-white/95 text-amber-800" : "bg-stone-900/85 text-white"
            }`}
          >
            {inTrip ? (
              <>
                <Check className="w-3.5 h-3.5" />
                {t("inRoute")}
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                {t("addShort")}
              </>
            )}
          </div>
        </button>

        <div className="flex-1 p-4 sm:p-5 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-stone-900 font-bold text-base sm:text-lg leading-tight">
                <Link href={detailHref} className="hover:underline">
                  {place.name}
                </Link>
              </h3>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all min-h-[40px] ${
                inTrip
                  ? "text-amber-800 bg-amber-100 hover:bg-amber-200/80"
                  : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              {inTrip ? (
                <>
                  <Check className="w-4 h-4" />
                  {t("inRoute")}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("addShort")}
                </>
              )}
            </button>
          </div>

          {description && (
            <p className="text-stone-600 text-sm leading-relaxed line-clamp-2 mb-3">
              {description}
            </p>
          )}

          <Link
            href={detailHref}
            className="mt-auto inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 text-xs font-medium transition-colors"
          >
            {t("readMore")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
