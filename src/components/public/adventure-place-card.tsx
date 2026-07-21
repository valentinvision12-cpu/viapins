"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { MapPin, Plus, Check, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouteCart, type RouteCartItem } from "@/lib/context/route-cart-context";
import type { AdventurePlace, AdventureTag } from "@/lib/adventure-types";
import { buildPlaceSeo } from "@/lib/seo";
import { getPlaceContent } from "@/lib/content-locale";
import { fallbackImageUrl } from "@/lib/fallback-image";

interface Props {
  place: AdventurePlace;
  locale: string;
  index: number;
  stopNumber: number;
}

export function AdventurePlaceCard({ place, locale, index, stopNumber }: Props) {
  const t = useTranslations("adventure");
  const tRoute = useTranslations("route");
  const _fallback = fallbackImageUrl(`${place.name}-${place.country}`);
  const [imgSrc, setImgSrc] = useState(place.image_url || _fallback);
  const { addItem, removeItem, isInCart, openPanel } = useRouteCart();

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
  const { description } = getPlaceContent(place.translations, locale);
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
      return;
    }
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
    const added = addItem(item);
    if (added) openPanel();
  }

  return (
    <article
      id={`adventure-${place.id}`}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        inCart
          ? "border-orange-300 bg-orange-50/60 shadow-md shadow-orange-100"
          : "border-stone-100 bg-white shadow-sm hover:border-stone-200 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col gap-0 sm:flex-row">
        <button
          type="button"
          onClick={handleCartToggle}
          className="relative h-48 flex-shrink-0 overflow-hidden sm:h-auto sm:w-56 sm:rounded-l-2xl"
          aria-label={inCart ? tRoute("removeFromRoute") : t("addStop")}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={placeSeo.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              referrerPolicy={IMAGE_REFERRER_POLICY}
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
              unoptimized={IMAGE_UNOPTIMIZED}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-200">
              <Compass className="h-10 w-10 text-orange-300/80" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-md ${
                inCart ? "bg-orange-500 text-white" : "bg-white/90 text-stone-700"
              }`}
            >
              {stopNumber}
            </div>
            <div className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {t("dayLabel", { day: place.day })}
            </div>
          </div>
        </button>

        <div className="min-w-0 flex-1 p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight text-stone-900">{place.name}</h3>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600/80">
                <MapPin className="h-3 w-3" />
                {place.region} · {t("stopLabel", { number: stopNumber })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCartToggle}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                inCart
                  ? "border-transparent bg-orange-500 text-white shadow-sm"
                  : "border-stone-300 bg-stone-50 text-stone-700 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {t("inAdventure")}
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  {t("addStop")}
                </>
              )}
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700"
              >
                {tagLabels[tag]}
              </span>
            ))}
          </div>

          {description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-stone-500">{description}</p>
          )}
        </div>
      </div>
    </article>
  );
}
