"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { useTranslations } from "next-intl";
import { BookMarked, Stamp, Globe, MapPin, Map, Heart, ExternalLink, Navigation, LayoutGrid, List, Settings, LogOut, ChevronRight, Languages } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import type { SavedRoute } from "@/actions/get-my-routes";
import type { FavoritePlace } from "@/actions/favorites";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import { PassportRouteCard } from "@/components/public/passport-route-card";
import { CountryCollectionCard } from "@/components/public/country-collection-card";
import { CollectionShareButton } from "@/components/public/share-button";
import { CollectionDownloadMenu } from "@/components/public/collection-download-menu";
import { useFavorites } from "@/lib/context/favorites-context";
import { groupPlacesByCountry } from "@/lib/collection-export";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import { slugify } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { PASSPORT } from "@/lib/luxury-palette";

function TripStats({
  allRoutes,
  totalFavorites,
  uniqueCountries,
}: {
  allRoutes: SavedRoute[];
  totalFavorites: number;
  uniqueCountries: number;
}) {
  const t = useTranslations("myTrip");

  const stats = [
    { icon: Globe, label: t("statsCountries"), value: uniqueCountries, color: PASSPORT.accent },
    { icon: Heart, label: t("statsPlaces"), value: totalFavorites, color: "#C44B4B" },
    { icon: Map, label: t("statsRoutes"), value: allRoutes.length, color: PASSPORT.accent },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition-shadow hover:shadow-md"
          style={{
            background: PASSPORT.card,
            borderColor: PASSPORT.cardBorder,
            boxShadow: PASSPORT.cardShadow,
          }}
        >
          <s.icon className="h-4 w-4" style={{ color: s.color }} />
          <span className="text-2xl font-black" style={{ color: PASSPORT.text }}>
            {s.value}
          </span>
          <span
            className="text-center text-[10px] leading-tight"
            style={{ color: PASSPORT.textMuted }}
          >
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function FavoritePlaceCard({ place, index }: { place: FavoritePlace; index: number }) {
  const t = useTranslations("myTrip");
  const { toggleFavorite } = useFavorites();
  const pin = mapsPinLinkProps(place.lat, place.lng, place.name, place.city, place.country);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = PASSPORT.cardShadowHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = PASSPORT.cardShadow;
      }}
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={place.image_url || fallbackImageUrl(`${place.name}-${place.city}`)}
          alt={place.name}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          unoptimized={IMAGE_UNOPTIMIZED}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        <button
          onClick={() => toggleFavorite(place)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-105"
          title={t("removeFavorite")}
        >
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </button>

        {pin && (
          <a
            href={pin.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1.5 text-[10px] font-semibold text-stone-700 shadow-sm transition-colors hover:bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-3 w-3" style={{ color: PASSPORT.accent }} />
            {t("navigate")}
          </a>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold leading-snug" style={{ color: PASSPORT.text }}>
          {place.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <p
            className="flex items-center gap-1 truncate text-xs"
            style={{ color: PASSPORT.textMuted }}
          >
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            {place.city}, {place.country}
          </p>
          {pin && (
            <a
              href={pin.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-stone-300 transition-colors hover:text-stone-600"
              title={pin.title}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ShareTopCollectionBanner({
  favorites,
  locale,
}: {
  favorites: FavoritePlace[];
  locale?: string;
}) {
  const t = useTranslations("myTrip");
  const collections = groupPlacesByCountry(favorites);
  if (collections.size === 0 || favorites.length < 3) return null;

  const [topCountry, topPlaces] = [...collections.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )[0];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale ?? "en"}/explore/${slugify(topCountry)}`
      : `${SITE_DEFAULT_URL}/explore/${slugify(topCountry)}`;

  const collection = {
    title: `My ${topCountry} Collection`,
    subtitle: `${topPlaces.length} saved landmarks`,
    country: topCountry,
    places: topPlaces.map((p) => ({
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border p-4"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: PASSPORT.text }}>
            {t("sharePrompt")}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: PASSPORT.textMuted }}>
            {t("sharePromptDesc", { count: favorites.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CollectionDownloadMenu collection={collection} variant="menu" className="w-auto" />
          <CollectionShareButton collection={collection} exploreUrl={shareUrl} className="w-auto" />
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  savedRoutes: SavedRoute[];
  visitedRoutes: SavedRoute[];
  initialFavorites: FavoritePlace[];
  locale?: string;
}

type Tab = "saved" | "routes" | "visited";
type SavedView = "country" | "all";

function SettingsPanel({ locale }: { locale: string }) {
  const t = useTranslations("myTrip");
  const tNav = useTranslations("nav");
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  const LANG_OPTIONS = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "bg", label: "Български", flag: "🇧🇬" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
  ];

  return (
    <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="space-y-4">
        {/* Language */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ background: PASSPORT.card, borderColor: PASSPORT.cardBorder }}
        >
          <div
            className="flex items-center gap-2 border-b px-5 py-4"
            style={{ borderColor: PASSPORT.cardBorder }}
          >
            <Languages className="h-4 w-4" style={{ color: PASSPORT.accent }} />
            <p className="text-sm font-semibold" style={{ color: PASSPORT.text }}>
              {t("settingsLanguage")}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: PASSPORT.cardBorder }}>
            {LANG_OPTIONS.map((lang) => {
              const isCurrent = locale === lang.code;
              return (
                <a
                  key={lang.code}
                  href={`/${lang.code}/my-passport`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.cookie = `NEXT_LOCALE=${lang.code};path=/;max-age=31536000;samesite=lax`;
                    window.location.assign(`/${lang.code}/my-passport`);
                  }}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{
                    background: isCurrent ? PASSPORT.accentSoft : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: isCurrent ? PASSPORT.text : PASSPORT.textSecondary }}
                    >
                      {lang.label}
                    </span>
                  </div>
                  {isCurrent && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: PASSPORT.accent }}
                    />
                  )}
                </a>
              );
            })}
          </div>
        </div>

        {/* Legal links */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ background: PASSPORT.card, borderColor: PASSPORT.cardBorder }}
        >
          {[
            { label: t("settingsTerms"), href: `/${locale}/terms` },
            { label: t("settingsPrivacy"), href: `/${locale}/privacy` },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-between border-b px-5 py-3.5 transition-colors last:border-0 hover:bg-stone-50"
              style={{ borderColor: PASSPORT.cardBorder }}
            >
              <span className="text-sm" style={{ color: PASSPORT.textSecondary }}>
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-stone-300" />
            </a>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? t("signingOut") : tNav("signOut")}
        </button>
      </div>
    </motion.div>
  );
}

export function PassportTabs({ savedRoutes, visitedRoutes, initialFavorites, locale = "en" }: Props) {
  const t = useTranslations("myTrip");
  const [tab, setTab] = useState<Tab | "settings">("saved");
  const [savedView, setSavedView] = useState<SavedView>("country");
  const { favorites: liveFavorites, totalFavorites } = useFavorites();

  const favorites = liveFavorites.length > 0 ? liveFavorites : initialFavorites;
  const countryCollections = groupPlacesByCountry(favorites);
  const collectionCount = countryCollections.size;

  const allRoutes = [...savedRoutes, ...visitedRoutes];
  const uniqueCountries = new Set([
    ...favorites.map((f) => f.country),
    ...allRoutes.flatMap((r) => r.route_places.map((p) => p.country)),
  ]).size;

  const routes = tab === "routes" ? savedRoutes : visitedRoutes;

  const tabs: { key: Tab | "settings"; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "saved", label: t("tabSaved"), icon: Heart, count: totalFavorites || favorites.length },
    { key: "routes", label: t("tabRoutes"), icon: BookMarked, count: savedRoutes.length },
    { key: "visited", label: t("tabVisited"), icon: Stamp, count: visitedRoutes.length },
    { key: "settings", label: t("tabSettings"), icon: Settings },
  ];


  useEffect(() => {
    // Keep the last-open tab for mobile “app feel”
    try {
      localStorage.setItem("viapins_passport_tab", String(tab));
    } catch {
      // ignore
    }
  }, [tab]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("viapins_passport_tab");
      if (stored && ["saved", "routes", "visited", "settings"].includes(stored)) {
        setTab(stored as (Tab | "settings"));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-20 md:pb-0">
      <TripStats
        allRoutes={allRoutes}
        totalFavorites={totalFavorites || favorites.length}
        uniqueCountries={uniqueCountries}
      />

      <div
        className="mb-6 hidden w-full max-w-full gap-1 overflow-x-auto rounded-2xl border p-1.5 md:flex"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
          boxShadow: PASSPORT.cardShadow,
        }}
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all"
            style={
              tab === item.key
                ? {
                    background: PASSPORT.accentSoft,
                    color: PASSPORT.text,
                    boxShadow: "0 1px 2px rgba(28, 20, 9, 0.06)",
                  }
                : { color: PASSPORT.textMuted }
            }
          >
            <item.icon
              className={`h-3.5 w-3.5 ${
                tab === item.key && item.key === "saved" ? "fill-red-500 text-red-500" : ""
              }`}
              style={
                tab === item.key && item.key !== "saved"
                  ? { color: PASSPORT.accent }
                  : undefined
              }
            />
            {item.label}
            {typeof item.count === "number" && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={
                  tab === item.key
                    ? { background: "rgba(139, 101, 48, 0.15)", color: PASSPORT.accent }
                    : { background: "#F0EAE0", color: PASSPORT.textMuted }
                }
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "saved" && (
          <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {favorites.length === 0 ? (
              <div
                className="rounded-2xl border py-16 text-center"
                style={{
                  background: PASSPORT.card,
                  borderColor: PASSPORT.cardBorder,
                  boxShadow: PASSPORT.cardShadow,
                }}
              >
                <Heart className="mx-auto mb-3 h-10 w-10 text-stone-200" />
                <p className="font-medium" style={{ color: PASSPORT.text }}>
                  {t("emptySavedTitle")}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: PASSPORT.textMuted }}>
                  {t("emptySavedDesc")}
                </p>
              </div>
            ) : (
              <>
                <ShareTopCollectionBanner favorites={favorites} locale={locale} />

                <div
                  className="mb-4 flex w-fit gap-1 rounded-xl border p-1"
                  style={{ background: PASSPORT.card, borderColor: PASSPORT.cardBorder }}
                >
                  <button
                    type="button"
                    onClick={() => setSavedView("country")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      savedView === "country"
                        ? { background: PASSPORT.accentSoft, color: PASSPORT.text }
                        : { color: PASSPORT.textMuted }
                    }
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    {t("viewByCountry")}
                    <span style={{ color: PASSPORT.textMuted }}>({collectionCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSavedView("all")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      savedView === "all"
                        ? { background: PASSPORT.accentSoft, color: PASSPORT.text }
                        : { color: PASSPORT.textMuted }
                    }
                  >
                    <List className="h-3.5 w-3.5" />
                    {t("viewAllPlaces")}
                  </button>
                </div>

                {savedView === "country" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[...countryCollections.entries()].map(([country, places], i) => (
                      <CountryCollectionCard
                        key={country}
                        country={country}
                        places={places}
                        index={i}
                        locale={locale}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {favorites.map((place, i) => (
                      <FavoritePlaceCard key={place.place_id} place={place} index={i} />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {(tab === "routes" || tab === "visited") && (
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {routes.length === 0 ? (
              <div
                className="rounded-2xl border py-16 text-center"
                style={{
                  background: PASSPORT.card,
                  borderColor: PASSPORT.cardBorder,
                  boxShadow: PASSPORT.cardShadow,
                }}
              >
                {tab === "routes" ? (
                  <>
                    <BookMarked className="mx-auto mb-3 h-10 w-10 text-stone-200" />
                    <p className="font-medium" style={{ color: PASSPORT.text }}>
                      {t("emptyRoutesTitle")}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: PASSPORT.textMuted }}>
                      {t("emptyRoutesDesc")}
                    </p>
                  </>
                ) : (
                  <>
                    <Stamp className="mx-auto mb-3 h-10 w-10 text-stone-200" />
                    <p className="font-medium" style={{ color: PASSPORT.text }}>
                      {t("emptyVisitedTitle")}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: PASSPORT.textMuted }}>
                      {t("emptyVisitedDesc")}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {routes.map((route, i) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <PassportRouteCard route={route} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "settings" && (
          <SettingsPanel locale={locale} />
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation (Passport only) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{
          background: "rgba(253, 251, 247, 0.92)",
          borderColor: PASSPORT.cardBorder,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="container mx-auto max-w-4xl px-4 py-3 pb-safe">
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: "saved", icon: Heart, label: t("tabSaved") },
              { key: "routes", icon: BookMarked, label: t("tabRoutes") },
              { key: "visited", icon: Stamp, label: t("tabVisited") },
              { key: "settings", icon: Settings, label: t("tabSettings") },
            ].map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key as (Tab | "settings"))}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 transition-all"
                  style={
                    active
                      ? { background: PASSPORT.accentSoft, color: PASSPORT.text }
                      : { color: PASSPORT.textMuted }
                  }
                >
                  <item.icon
                    className={`h-5 w-5 ${active && item.key === "saved" ? "fill-red-500 text-red-500" : ""}`}
                    style={
                      active && item.key !== "saved" ? { color: PASSPORT.accent } : undefined
                    }
                  />
                  <span className="line-clamp-1 text-center text-[10px] font-semibold leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
