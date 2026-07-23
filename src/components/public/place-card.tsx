"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { Plus, Check, ChevronRight, Heart, Building2, ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { useFavorites } from "@/lib/context/favorites-context";
import { useAffiliateConfig } from "@/components/public/trip-extras-section";
import {
  buildAffiliateUrl,
  getActivePartners,
  type AffiliateLinkContext,
} from "@/lib/affiliates";
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
  const { addItem, removeItem, isInCart } = useRouteCart();

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
        <Link
          href={detailHref}
          className="relative sm:w-56 flex-shrink-0 h-48 sm:min-h-[11.5rem] sm:h-auto overflow-hidden sm:rounded-l-2xl bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          aria-label={place.name}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={placeSeo.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              referrerPolicy={IMAGE_REFERRER_POLICY}
              onError={() => {
                setImgSrc("");
                fetch(`/api/places/${place.id}/image?refresh=1`)
                  .then((r) => r.json())
                  .then((data: { url?: string }) => {
                    if (data.url && !isBadImageUrl(data.url)) setImgSrc(data.url);
                  })
                  .catch(() => {});
              }}
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
        </Link>

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

interface DetailActionsProps {
  placeId: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  lat: number;
  lng: number;
  orderIndex?: number;
}

export function PlaceDetailActions({
  placeId,
  name,
  city,
  country,
  imageUrl,
  lat,
  lng,
  orderIndex = 0,
}: DetailActionsProps) {
  const tRoute = useTranslations("route");
  const tPlace = useTranslations("placePage");
  const { addItem, removeItem, isInCart } = useRouteCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const inRoute = isInCart(placeId);
  const saved = isFavorite(placeId);

  function handleRouteToggle() {
    if (inRoute) {
      removeItem(placeId);
      return;
    }
    addItem({
      id: placeId,
      name,
      city,
      country,
      lat,
      lng,
      image_url: imageUrl,
      order_index: orderIndex,
      mode: "city",
    });
  }

  function handleSaveToggle() {
    toggleFavorite({
      place_id: placeId,
      name,
      city,
      country,
      image_url: imageUrl,
      lat,
      lng,
    });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleRouteToggle}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
          inRoute
            ? "bg-stone-900 text-white"
            : "bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] hover:opacity-90"
        }`}
      >
        {inRoute ? (
          <>
            <Check className="h-4 w-4" />
            {tRoute("removeFromRoute")}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {tRoute("addToRoute")}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleSaveToggle}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
          saved
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
        }`}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        {saved ? tPlace("saved") : tPlace("savePlace")}
      </button>
    </div>
  );
}

interface StaysPanelProps {
  city: string;
  country: string;
  countrySlug: string;
  lat?: number;
  lng?: number;
}

export function StaysCityPanel({
  city,
  country,
  countrySlug,
  lat,
  lng,
}: StaysPanelProps) {
  const config = useAffiliateConfig();
  const locale = useLocale();
  const t = useTranslations("stays");
  const ctx: AffiliateLinkContext = {
    city,
    country,
    country_slug: countrySlug,
    locale,
    lat,
    lng,
    is_adventure: false,
  };

  const hotels = getActivePartners(config, ctx, 1).filter(
    (p) => p.category === "hotels"
  );
  if (!hotels.length) return null;

  const disclosure =
    locale === "bg" ? config.disclosure_bg : config.disclosure_en;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
        {t("title", { city })}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
        {t("subtitle", { city, country })}
      </p>

      <div className="mt-6 space-y-2">
        {hotels.map((partner) => {
          const href = buildAffiliateUrl(partner.url_template, ctx);
          if (!href) return null;
          return (
            <a
              key={partner.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 transition-colors hover:border-stone-200"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                <Building2 className="h-4 w-4 text-stone-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-stone-900">
                  {partner.label}
                </p>
                <p className="truncate text-xs text-stone-400">{partner.description}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-stone-300 group-hover:text-stone-500" />
            </a>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-stone-400">{disclosure}</p>
    </div>
  );
}
