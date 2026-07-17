"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isValidMapLocation,
  resolveMapsHref,
  resolveMapsDisplayAddress,
} from "@/lib/place-links";

interface MapsPlaceLinkProps {
  lat: number;
  lng: number;
  name: string;
  city?: string;
  country?: string;
  mapsQuery?: string;
  mapsUrl?: string;
  translations?: Record<string, { maps_query?: string; maps_url?: string }>;
  locale?: string;
  className?: string;
  showExternalIcon?: boolean;
}

/** Single Maps link — always opens Google place card, never raw coordinates. */
export function MapsPlaceLink({
  lat,
  lng,
  name,
  city,
  country,
  mapsQuery,
  mapsUrl,
  translations,
  locale,
  className = "inline-flex items-center gap-1 text-stone-400 hover:text-stone-600 text-xs transition-colors",
  showExternalIcon = true,
}: MapsPlaceLinkProps) {
  const t = useTranslations("place");

  if (!isValidMapLocation(lat, lng, name)) return null;

  const href = resolveMapsHref({
    lat,
    lng,
    name,
    city,
    country,
    mapsQuery,
    mapsUrl,
    translations,
    locale,
  });

  const address = resolveMapsDisplayAddress(translations, locale);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={address || undefined}
    >
      <MapPin className="w-3 h-3" />
      <span className="truncate max-w-[min(100%,280px)]">
        {address || t("viewOnMap")}
      </span>
      {showExternalIcon && <ExternalLink className="w-2.5 h-2.5" />}
    </a>
  );
}

export function mapsPinLinkProps(
  lat: number,
  lng: number,
  name: string,
  city?: string,
  country?: string,
  mapsQuery?: string,
  mapsUrl?: string,
  translations?: Record<string, { maps_query?: string; maps_url?: string }>,
  locale?: string
): { href: string; title: string } | null {
  if (!isValidMapLocation(lat, lng, name)) return null;
  return {
    href: resolveMapsHref({
      lat,
      lng,
      name,
      city,
      country,
      mapsQuery,
      mapsUrl,
      translations,
      locale,
    }),
    title: "Open in Google Maps",
  };
}
