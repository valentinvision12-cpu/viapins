"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Map,
  MapPin,
  Heart,
  FolderOpen,
  Navigation,
  ExternalLink,
  Star,
  LayoutGrid,
  List,
} from "lucide-react";
import type { SavedRoute } from "@/actions/get-my-routes";
import type { FavoritePlace } from "@/actions/favorites";
import type {
  PassportCollection,
  PassportPost,
} from "@/actions/get-passport-profile";
import { PassportRouteCard } from "@/components/public/passport-route-card";
import { CountryCollectionCard } from "@/components/public/country-collection-card";
import { PassportEmptyState } from "@/components/public/passport-empty-state";
import { PassportPostComposer } from "@/components/public/passport-post-composer";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import { useFavorites } from "@/lib/context/favorites-context";
import { buildCountryCollections } from "@/lib/collection-export";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { cn } from "@/lib/utils";
import { PASSPORT } from "@/lib/luxury-palette";

export type PassportSectionTab = "trips" | "places" | "collections" | "posts";

type PlacesView = "grid" | "list";

interface Props {
  savedRoutes: SavedRoute[];
  visitedRoutes: SavedRoute[];
  sharedRoutes?: SavedRoute[];
  favorites: FavoritePlace[];
  collections?: PassportCollection[];
  posts?: PassportPost[];
  locale?: string;
  username?: string | null;
  defaultTab?: PassportSectionTab;
  /** When true, only Trips + Places tabs (no collections/posts). */
  simplified?: boolean;
}

type TripFilter = "all" | "saved" | "visited" | "shared";

const TAB_STORAGE_KEY = "viapins_passport_section";
const PLACES_VIEW_KEY = "viapins_passport_places_view";

const TABS: {
  id: PassportSectionTab;
  icon: typeof Map;
  labelKey:
    | "passportTabTrips"
    | "passportTabPlaces"
    | "passportTabCollections"
    | "passportTabPosts";
}[] = [
  { id: "trips", icon: Map, labelKey: "passportTabTrips" },
  { id: "places", icon: Heart, labelKey: "passportTabPlaces" },
  { id: "collections", icon: FolderOpen, labelKey: "passportTabCollections" },
  { id: "posts", icon: Camera, labelKey: "passportTabPosts" },
];

function PlaceGridCard({ place, index }: { place: FavoritePlace; index: number }) {
  const t = useTranslations("myTrip");
  const { toggleFavorite } = useFavorites();
  const pin = mapsPinLinkProps(
    place.lat,
    place.lng,
    place.name,
    place.city,
    place.country
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      className="group overflow-hidden rounded-2xl border"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div className="relative h-40 overflow-hidden sm:h-44">
        <Image
          src={place.image_url || fallbackImageUrl(`${place.name}-${place.city}`)}
          alt={place.name}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <button
          type="button"
          onClick={() => toggleFavorite(place)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
          title={t("removeFavorite")}
          aria-label={t("removeFavorite")}
        >
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </button>
        {pin ? (
          <a
            href={pin.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1.5 text-[10px] font-semibold text-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-3 w-3" style={{ color: PASSPORT.accent }} />
            {t("navigate")}
          </a>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold" style={{ color: PASSPORT.text }}>
          {place.name}
        </h3>
        <p
          className="mt-1 flex items-center gap-1 truncate text-xs"
          style={{ color: PASSPORT.textMuted }}
        >
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          {place.city}, {place.country}
        </p>
      </div>
    </motion.article>
  );
}

function PlaceListRow({ place, index }: { place: FavoritePlace; index: number }) {
  const t = useTranslations("myTrip");
  const { toggleFavorite } = useFavorites();
  const pin = mapsPinLinkProps(
    place.lat,
    place.lng,
    place.name,
    place.city,
    place.country
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="flex items-center gap-3 rounded-2xl border p-2.5 sm:p-3"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16">
        <Image
          src={place.image_url || fallbackImageUrl(`${place.name}-${place.city}`)}
          alt={place.name}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold" style={{ color: PASSPORT.text }}>
          {place.name}
        </h3>
        <p
          className="mt-0.5 flex items-center gap-1 truncate text-xs"
          style={{ color: PASSPORT.textMuted }}
        >
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {place.city}, {place.country}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {pin ? (
          <a
            href={pin.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: PASSPORT.cardBorder, color: PASSPORT.accent }}
            title={pin.title}
            aria-label={t("navigate")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => toggleFavorite(place)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/[0.03]"
          style={{ borderColor: PASSPORT.cardBorder }}
          title={t("removeFavorite")}
          aria-label={t("removeFavorite")}
        >
          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
        </button>
      </div>
    </motion.article>
  );
}

function PostsEmpty({ onCompose }: { onCompose: () => void }) {
  const t = useTranslations("myTrip");
  return (
    <div className="space-y-4">
      <PassportEmptyState
        icon={Camera}
        title={t("passportEmptyPostsTitle")}
        description={t("passportEmptyPostsDesc")}
        ctaLabel={t("passportPostNew")}
        onCta={onCompose}
      />
      <div
        className="rounded-2xl border p-4 opacity-55"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
        }}
        aria-hidden
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: PASSPORT.accent }}
        >
          {t("passportPostPreviewLabel")}
        </p>
        <div className="mt-3 flex items-start gap-3">
          <div
            className="h-16 w-16 flex-shrink-0 rounded-xl"
            style={{ background: PASSPORT.accentSoft }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: PASSPORT.text }}>
              {t("passportPostPreviewTitle")}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1 text-xs"
              style={{ color: PASSPORT.textMuted }}
            >
              <MapPin className="h-3 w-3" />
              {t("passportPostPreviewLocation")}
            </p>
            <div className="mt-1.5 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  style={{ color: PASSPORT.accent, fill: PASSPORT.accent }}
                />
              ))}
            </div>
            <p
              className="mt-2 text-xs leading-relaxed"
              style={{ color: PASSPORT.textSecondary }}
            >
              {t("passportPostPreviewTip")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full passport tab system — Trips · Places · Collections · Posts.
 * Bound only to getPassportProfile() props (no extra fetches).
 */
export function PassportSections({
  savedRoutes,
  visitedRoutes,
  sharedRoutes = [],
  favorites: initialFavorites,
  collections: initialCollections,
  posts = [],
  locale = "en",
  username = null,
  defaultTab = "trips",
  simplified = false,
}: Props) {
  const t = useTranslations("myTrip");
  const tTrips = useTranslations("MyTrips");
  const visibleTabs = simplified ? TABS.filter((tab) => tab.id === "trips" || tab.id === "places") : TABS;
  const { favorites: liveFavorites } = useFavorites();
  const [tab, setTab] = useState<PassportSectionTab>(
    simplified && (defaultTab === "collections" || defaultTab === "posts")
      ? "trips"
      : defaultTab
  );
  const [tripFilter, setTripFilter] = useState<TripFilter>("all");
  const [placesView, setPlacesView] = useState<PlacesView>("grid");
  const [clientReady, setClientReady] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    setClientReady(true);
    try {
      const stored = localStorage.getItem(TAB_STORAGE_KEY) as PassportSectionTab | null;
      if (stored && visibleTabs.some((x) => x.id === stored)) {
        setTab(stored);
      } else if (simplified) {
        setTab("trips");
      }
      const view = localStorage.getItem(PLACES_VIEW_KEY) as PlacesView | null;
      if (view === "grid" || view === "list") setPlacesView(view);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from storage
  }, []);

  function tabLabel(labelKey: (typeof TABS)[number]["labelKey"]) {
    if (simplified && labelKey === "passportTabTrips") return tTrips("tabsTrips");
    if (simplified && labelKey === "passportTabPlaces") return tTrips("tabsPlaces");
    return t(labelKey);
  }

  function selectTab(next: PassportSectionTab) {
    setTab(next);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function selectPlacesView(view: PlacesView) {
    setPlacesView(view);
    try {
      localStorage.setItem(PLACES_VIEW_KEY, view);
    } catch {
      /* ignore */
    }
  }

  // After hydration use live favorites (supports remove); before that use SSR data
  const placesList = clientReady ? liveFavorites : initialFavorites;

  const collections = useMemo(() => {
    if (clientReady) return buildCountryCollections(liveFavorites);
    if (initialCollections && initialCollections.length > 0) return initialCollections;
    return buildCountryCollections(initialFavorites);
  }, [clientReady, liveFavorites, initialCollections, initialFavorites]);

  const allTrips = useMemo(
    () => [...savedRoutes, ...visitedRoutes, ...sharedRoutes],
    [savedRoutes, visitedRoutes, sharedRoutes]
  );

  const trips =
    tripFilter === "all"
      ? allTrips
      : tripFilter === "saved"
        ? savedRoutes
        : tripFilter === "visited"
          ? visitedRoutes
          : sharedRoutes;

  const counts: Record<PassportSectionTab, number> = {
    trips: allTrips.length,
    places: placesList.length,
    collections: collections.length,
    posts: posts.length,
  };

  return (
    <section className="mt-2" aria-label={t("passportSectionsLabel")}>
      {/* Sticky tab navigation */}
      <div className="sticky top-[calc(var(--site-header-height)+0.25rem)] z-20 -mx-1 mb-5 overflow-x-auto px-1 pb-1">
        <div
          role="tablist"
          aria-label={t("passportSectionsLabel")}
          className="flex min-w-max gap-1 rounded-2xl border p-1 sm:min-w-0 sm:w-full"
          style={{
            background: PASSPORT.card,
            borderColor: PASSPORT.cardBorder,
            boxShadow: PASSPORT.cardShadow,
          }}
        >
          {visibleTabs.map(({ id, icon: Icon, labelKey }) => {
            const active = tab === id;
            const count = counts[id];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`passport-tab-${id}`}
                aria-controls={`passport-panel-${id}`}
                onClick={() => selectTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                  active ? "shadow-sm" : "hover:bg-black/[0.03]"
                )}
                style={
                  active
                    ? { background: PASSPORT.accentSoft, color: PASSPORT.accent }
                    : { color: PASSPORT.textMuted }
                }
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">
                  {tabLabel(labelKey)}
                  {count > 0 ? (
                    <span className="font-bold tabular-nums opacity-80">
                      {" "}
                      ({count})
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          id={`passport-panel-${tab}`}
          aria-labelledby={`passport-tab-${tab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Trips ── */}
          {tab === "trips" && (
            <div className="space-y-4">
              {allTrips.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["all", t("passportTripsAll"), allTrips.length],
                        ["saved", t("passportTripsPlanning"), savedRoutes.length],
                        ["visited", t("passportTripsCompleted"), visitedRoutes.length],
                        ...(sharedRoutes.length > 0
                          ? ([["shared", t("passportTripsShared"), sharedRoutes.length]] as const)
                          : []),
                      ] as const
                    ).map(([id, label, count]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTripFilter(id)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                        style={
                          tripFilter === id
                            ? { background: PASSPORT.accent, color: "#fff" }
                            : {
                                background: PASSPORT.card,
                                color: PASSPORT.textSecondary,
                                border: `1px solid ${PASSPORT.cardBorder}`,
                              }
                        }
                      >
                        {label}{" "}
                        <span className="opacity-70">({count})</span>
                      </button>
                    ))}
                  </div>

                  {trips.length === 0 ? (
                    <PassportEmptyState
                      icon={Map}
                      title={t("passportEmptyTripsFilterTitle")}
                      description={t("passportEmptyTripsFilterDesc")}
                      ctaLabel={tTrips("ctaExploreCities")}
                      href="/"
                      secondaryCtaLabel={tTrips("ctaDiscoverRoadTrips")}
                      secondaryHref="/adventures"
                    />
                  ) : (
                    <div className="space-y-4">
                      {trips.map((route) => (
                        <PassportRouteCard key={route.id} route={route} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <PassportEmptyState
                  icon={Map}
                  title={tTrips("emptyTripsTitle")}
                  description={tTrips("emptyTripsDesc")}
                  ctaLabel={tTrips("ctaExploreCities")}
                  href="/"
                  secondaryCtaLabel={tTrips("ctaDiscoverRoadTrips")}
                  secondaryHref="/adventures"
                />
              )}
            </div>
          )}

          {/* ── Places ── */}
          {tab === "places" &&
            (placesList.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs" style={{ color: PASSPORT.textMuted }}>
                    {t("passportPlacesCount", { count: placesList.length })}
                  </p>
                  <div
                    className="flex gap-1 rounded-xl border p-1"
                    style={{
                      background: PASSPORT.card,
                      borderColor: PASSPORT.cardBorder,
                    }}
                    role="group"
                    aria-label={t("passportPlacesViewLabel")}
                  >
                    <button
                      type="button"
                      onClick={() => selectPlacesView("grid")}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                      style={
                        placesView === "grid"
                          ? {
                              background: PASSPORT.accentSoft,
                              color: PASSPORT.accent,
                            }
                          : { color: PASSPORT.textMuted }
                      }
                      aria-pressed={placesView === "grid"}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {t("passportPlacesGrid")}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPlacesView("list")}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                      style={
                        placesView === "list"
                          ? {
                              background: PASSPORT.accentSoft,
                              color: PASSPORT.accent,
                            }
                          : { color: PASSPORT.textMuted }
                      }
                      aria-pressed={placesView === "list"}
                    >
                      <List className="h-3.5 w-3.5" />
                      {t("passportPlacesList")}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {placesView === "grid" ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
                    >
                      {placesList.map((place, i) => (
                        <PlaceGridCard key={place.place_id} place={place} index={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {placesList.map((place, i) => (
                        <PlaceListRow key={place.place_id} place={place} index={i} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <PassportEmptyState
                icon={Heart}
                title={tTrips("emptyPlacesTitle")}
                description={tTrips("emptyPlacesDesc")}
                ctaLabel={tTrips("ctaExplorePlaces")}
                href="/"
              />
            ))}

          {/* ── Collections ── */}
          {!simplified && tab === "collections" &&
            (collections.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: PASSPORT.textMuted }}>
                  {t("passportCollectionsHint")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {collections.map((collection, index) => (
                    <CountryCollectionCard
                      key={collection.id}
                      country={collection.country}
                      places={collection.places}
                      index={index}
                      locale={locale}
                      visibility={collection.visibility}
                      title={collection.title}
                      username={username}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <PassportEmptyState
                icon={FolderOpen}
                title={t("passportEmptyCollectionsTitle")}
                description={t("passportEmptyCollectionsDesc")}
                ctaLabel={t("passportEmptyCollectionsCta")}
              />
            ))}

          {/* ── Posts ── */}
          {!simplified && tab === "posts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: PASSPORT.textMuted }}>
                  {t("passportPostsCount", { count: posts.length })}
                </p>
                <button
                  type="button"
                  onClick={() => setComposeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: PASSPORT.accent }}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t("passportPostNew")}
                </button>
              </div>
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border p-4"
                      style={{
                        background: PASSPORT.card,
                        borderColor: PASSPORT.cardBorder,
                      }}
                    >
                      <h3 className="font-semibold" style={{ color: PASSPORT.text }}>
                        {post.title}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: PASSPORT.textMuted }}>
                        {[post.location, post.date].filter(Boolean).join(" · ")}
                      </p>
                      {post.rating > 0 && (
                        <div className="mt-1.5 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3"
                              style={{
                                color: PASSPORT.accent,
                                fill: i < post.rating ? PASSPORT.accent : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {post.tip ? (
                        <p
                          className="mt-2 text-sm"
                          style={{ color: PASSPORT.textSecondary }}
                        >
                          {post.tip}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <PostsEmpty onCompose={() => setComposeOpen(true)} />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <PassportPostComposer
        favorites={placesList}
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
    </section>
  );
}
