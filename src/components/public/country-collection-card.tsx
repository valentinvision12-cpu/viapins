"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { useRouter } from "next/navigation";
import { MapPin, Layers, Lock, Globe2, Users, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { FavoritePlace } from "@/actions/favorites";
import { setCollectionVisibilityAction } from "@/actions/collection-meta";
import { CollectionDownloadMenu } from "@/components/public/collection-download-menu";
import { CollectionShareButton } from "@/components/public/share-button";
import { CountryFlag } from "@/components/public/country-flag";
import { Link } from "@/i18n/navigation";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import { slugify } from "@/lib/utils";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { PASSPORT } from "@/lib/luxury-palette";

type Visibility = "private" | "public" | "shared";

interface Props {
  country: string;
  places: FavoritePlace[];
  index: number;
  locale?: string;
  visibility?: Visibility;
  title?: string;
  canToggleVisibility?: boolean;
  username?: string | null;
}

const VIS_ICON = {
  private: Lock,
  public: Globe2,
  shared: Users,
} as const;

export function CountryCollectionCard({
  country,
  places,
  index,
  locale = "en",
  visibility = "private",
  title,
  canToggleVisibility = true,
  username = null,
}: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [vis, setVis] = useState<Visibility>(visibility);
  const coverImages = places.map((p) => p.image_url).filter(Boolean).slice(0, 3);
  const VisIcon = VIS_ICON[vis];
  const displayTitle = title?.trim() || t("passportCollectionTitle", { country });
  const exploreHref = `/explore/${slugify(country)}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}${exploreHref}`
      : `${SITE_DEFAULT_URL}/${locale}${exploreHref}`;

  function toggleVisibility() {
    const next: Visibility = vis === "public" ? "private" : "public";
    startTransition(async () => {
      const result = await setCollectionVisibilityAction(country, next);
      if (result.success) {
        setVis(next);
        router.refresh();
      }
    });
  }

  const collection = {
    title: displayTitle,
    subtitle: t("passportCollectionSubtitle", { count: places.length }),
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
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-2xl border transition-shadow"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div className="relative flex h-36 overflow-hidden" style={{ background: PASSPORT.accentSoft }}>
        {coverImages.length > 0 ? (
          coverImages.map((src, i) => (
            <div key={i} className="relative min-w-0 flex-1">
              <Image src={src} alt="" fill className="object-cover" unoptimized={IMAGE_UNOPTIMIZED} sizes="120px"
              referrerPolicy={IMAGE_REFERRER_POLICY} />
            </div>
          ))
        ) : (
          <div className="relative flex-1">
            <Image
              src={fallbackImageUrl(country)}
              alt={country}
              fill
              className="object-cover"
              unoptimized={IMAGE_UNOPTIMIZED}
              sizes="240px"
              referrerPolicy={IMAGE_REFERRER_POLICY} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <CountryFlag country={country} size="sm" />
          <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-sm">
            <VisIcon className="h-2.5 w-2.5" />
            {t(`passportVisibility_${vis}`)}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white drop-shadow-md">{displayTitle}</h3>
          <p className="flex items-center gap-1 text-xs text-white/85">
            <Layers className="h-3 w-3" />
            {t("passportCollectionPlacesCount", { count: places.length })}
          </p>
        </div>
      </div>

      <ul
        className="max-h-32 space-y-1.5 overflow-y-auto px-4 py-3"
        style={{ borderBottom: `1px solid ${PASSPORT.cardBorder}` }}
      >
        {places.slice(0, 5).map((p) => (
          <li
            key={p.place_id}
            className="flex items-center gap-2 text-xs"
            style={{ color: PASSPORT.textSecondary }}
          >
            <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: PASSPORT.accent }} />
            <span className="truncate font-medium" style={{ color: PASSPORT.text }}>
              {p.name}
            </span>
            <span className="truncate" style={{ color: PASSPORT.textMuted }}>
              {p.city}
            </span>
          </li>
        ))}
        {places.length > 5 ? (
          <li className="pl-5 text-[10px]" style={{ color: PASSPORT.textMuted }}>
            {t("passportCollectionMore", { count: places.length - 5 })}
          </li>
        ) : null}
      </ul>

      <div className="flex flex-wrap items-center gap-2 p-3">
        <Link
          href={exploreHref}
          className="rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            background: PASSPORT.accentSoft,
            color: PASSPORT.accent,
            border: `1px solid ${PASSPORT.accentBorder}`,
          }}
        >
          {t("passportCollectionExplore")}
        </Link>
        {vis === "public" && username ? (
          <Link
            href={`/traveler/${username}/collection/${slugify(country)}`}
            className="rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              background: PASSPORT.bg,
              color: PASSPORT.text,
              border: `1px solid ${PASSPORT.cardBorder}`,
            }}
          >
            {t("collectionPublicLink")}
          </Link>
        ) : null}
        {canToggleVisibility ? (
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60"
            style={{
              background: PASSPORT.bg,
              color: PASSPORT.text,
              border: `1px solid ${PASSPORT.cardBorder}`,
            }}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : vis === "public" ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Globe2 className="h-3 w-3" />
            )}
            {vis === "public" ? t("collectionMakePrivate") : t("collectionMakePublic")}
          </button>
        ) : null}
        <CollectionDownloadMenu collection={collection} variant="menu" className="flex-1" />
        <CollectionShareButton
          collection={collection}
          exploreUrl={shareUrl}
          className="flex-1"
        />
      </div>
    </motion.article>
  );
}
