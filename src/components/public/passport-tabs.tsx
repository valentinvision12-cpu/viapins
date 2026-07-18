"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookMarked, Stamp, Globe, MapPin, Map, Heart, ExternalLink, Navigation, LayoutGrid, List, Settings, LogOut, ChevronRight, Languages } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import type { SavedRoute } from "@/actions/get-my-routes";
import type { FavoritePlace } from "@/actions/favorites";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import { PassportRouteCard } from "@/components/public/passport-route-card";
import { CountryCollectionCard } from "@/components/public/country-collection-card";
import { ShareButton } from "@/components/public/share-button";
import { useFavorites } from "@/lib/context/favorites-context";
import { groupPlacesByCountry } from "@/lib/collection-export";
import { SITE_DEFAULT_URL } from "@/lib/site-brand";
import { slugify } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

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
    { icon: Globe, label: t("statsCountries"), value: uniqueCountries, color: "text-amber-500" },
    { icon: Heart, label: t("statsPlaces"), value: totalFavorites, color: "text-red-400" },
    { icon: Map, label: t("statsRoutes"), value: allRoutes.length, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex flex-col items-center gap-1.5 p-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
        >
          <s.icon className={`w-4 h-4 ${s.color}`} />
          <span className="text-2xl font-black text-white">{s.value}</span>
          <span className="text-white/55 text-[10px] text-center leading-tight">{s.label}</span>
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
      className="group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl hover:bg-white/[0.07] transition-all"
    >
      <div className="relative h-40 overflow-hidden">
        {place.image_url ? (
          <Image
            src={place.image_url}
            alt={place.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800/80 to-slate-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

        <button
          onClick={() => toggleFavorite(place)}
          className="absolute top-2 right-2 w-8 h-8 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center shadow hover:bg-black/45 hover:scale-[1.03] transition-all"
          title={t("removeFavorite")}
        >
          <Heart className="w-4 h-4 fill-red-500 text-red-400" />
        </button>

        {pin && (
          <a
            href={pin.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md text-white/90 text-[10px] font-semibold shadow hover:bg-black/45 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="w-3 h-3 text-cyan-300" />
            {t("navigate")}
          </a>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-white font-semibold text-sm leading-snug truncate">{place.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-white/55 text-xs truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {place.city}, {place.country}
          </p>
          {pin && (
            <a
              href={pin.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-cyan-200 transition-colors flex-shrink-0"
              title={pin.title}
            >
              <ExternalLink className="w-3 h-3" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white text-sm font-semibold">{t("sharePrompt")}</p>
          <p className="text-white/55 text-xs mt-0.5">
            {t("sharePromptDesc", { count: favorites.length })}
          </p>
        </div>
        <ShareButton
          url={shareUrl}
          title={`Explore ${topCountry} with me`}
          description={`${topPlaces.length} landmarks saved`}
          variant="pill"
        />
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
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
  ];

  return (
    <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="space-y-4">
        {/* Language */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-300" />
            <p className="text-white font-semibold text-sm">Language</p>
          </div>
          <div className="divide-y divide-white/10">
            {LANG_OPTIONS.map((lang) => {
              const isCurrent = locale === lang.code;
              return (
                <a
                  key={lang.code}
                  href={`/${lang.code}/my-passport`}
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                    isCurrent ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className={`text-sm font-medium ${isCurrent ? "text-white" : "text-white/70"}`}>{lang.label}</span>
                  </div>
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                </a>
              );
            })}
          </div>
        </div>

        {/* Legal links */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          {[
            { label: "Terms of Service", href: `/${locale}/terms` },
            { label: "Privacy Policy", href: `/${locale}/privacy` },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors border-b border-white/10 last:border-0"
            >
              <span className="text-white/70 text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-white/35" />
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
          {signingOut ? "Signing out…" : "Sign Out"}
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
    { key: "settings", label: "Settings", icon: Settings },
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

      <div className="hidden md:flex gap-1 p-1 rounded-3xl w-full max-w-full overflow-x-auto mb-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              tab === item.key
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/55 hover:text-white"
            }`}
          >
            <item.icon
              className={`w-3.5 h-3.5 ${
                tab === item.key && item.key === "saved" ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === item.key ? "bg-cyan-500/15 text-cyan-200" : "bg-white/10 text-white/55"
                }`}
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
              <div className="text-center py-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <Heart className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white font-medium">{t("emptySavedTitle")}</p>
                <p className="text-white/55 text-sm mt-1 max-w-sm mx-auto">{t("emptySavedDesc")}</p>
              </div>
            ) : (
              <>
                <ShareTopCollectionBanner favorites={favorites} locale={locale} />

                <div className="flex gap-1 p-1 rounded-2xl w-fit mb-4 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setSavedView("country")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      savedView === "country"
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {t("viewByCountry")}
                    <span className="text-white/35">({collectionCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSavedView("all")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      savedView === "all"
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    {t("viewAllPlaces")}
                  </button>
                </div>

                {savedView === "country" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <div className="text-center py-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                {tab === "routes" ? (
                  <>
                    <BookMarked className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white font-medium">{t("emptyRoutesTitle")}</p>
                    <p className="text-white/55 text-sm mt-1 max-w-sm mx-auto">{t("emptyRoutesDesc")}</p>
                  </>
                ) : (
                  <>
                    <Stamp className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white font-medium">{t("emptyVisitedTitle")}</p>
                    <p className="text-white/55 text-sm mt-1 max-w-sm mx-auto">{t("emptyVisitedDesc")}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-white/10 bg-slate-950/70 backdrop-blur-2xl">
        <div className="container max-w-4xl mx-auto px-4 py-3 pb-safe">
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: "saved", icon: Heart, label: t("tabSaved") },
              { key: "routes", icon: BookMarked, label: t("tabRoutes") },
              { key: "visited", icon: Stamp, label: t("tabVisited") },
              { key: "settings", icon: Settings, label: "Settings" },
            ].map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key as (Tab | "settings"))}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 transition-all ${
                    active ? "bg-white/15 text-white shadow-sm" : "text-white/55 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active && item.key === "saved" ? "fill-red-500 text-red-500" : ""}`} />
                  <span className="text-[10px] font-semibold leading-none text-center line-clamp-1">
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
