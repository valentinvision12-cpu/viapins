"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, X, Trash2, ChevronUp,
  RouteIcon, BookMarked, Share2, Check, Loader2,
  Wand2, Navigation,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { saveRouteAction } from "@/actions/save-route";
import { sortCartAdventureItems } from "@/lib/adventure-itinerary";
import { AuthModal } from "@/components/public/auth-modal";
import { TripExtrasSection } from "@/components/public/trip-extras-section";
import { ShareRouteSheet } from "@/components/public/share-route-sheet";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { slugify } from "@/lib/utils";
import type { RouteScope } from "@/lib/route-scope";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import { optimizeRoute, totalRouteKm, formatKm } from "@/lib/route-optimizer";
import { googleMapsRouteUrl } from "@/lib/collection-export";

function cartMatchesPage(pathname: string, scope: RouteScope | null): boolean {
  if (!scope) return true;
  const parts = pathname.split("/").filter(Boolean);
  const exploreIdx = parts.indexOf("explore");
  if (exploreIdx === -1) return true;

  const segment = parts[exploreIdx + 2];
  if (!segment) return true;

  if (segment === "adventure") {
    return scope.mode === "adventure";
  }

  if (scope.mode === "adventure") return false;

  return slugify(scope.city) === segment;
}

function estimateWalkMinutes(km: number): number {
  return Math.max(15, Math.round((km / 4.5) * 60));
}

export function RouteCart() {
  const {
    items: rawItems,
    removeItem,
    clearCart,
    totalItems,
    scope,
    cartMode,
    replaceCart,
    panelOpen,
    setPanelOpen,
  } = useRouteCart();
  const pathname = usePathname();
  const items = cartMode === "adventure" ? sortCartAdventureItems(rawItems) : rawItems;
  const locale = useLocale();
  const t = useTranslations("route");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [routeTitle, setRouteTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [optimized, setOptimized] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setIsLoggedIn(!!s?.user);
    });
    return () => subscription.unsubscribe();
  }, [isConfigured]);

  useEffect(() => {
    setOptimized(false);
  }, [rawItems.length]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !items.length) return "";
    const ids = items.map((i) => i.id).join(",");
    return `${window.location.origin}/${locale}/route?p=${ids}`;
  }, [items, locale]);

  const mapsUrl = useMemo(
    () =>
      googleMapsRouteUrl(
        items.map((i) => ({
          name: i.name,
          city: i.region ?? i.city,
          country: i.country,
          lat: i.lat,
          lng: i.lng,
        }))
      ),
    [items]
  );

  const routeCentroid = useMemo(() => {
    if (!items.length) return { lat: undefined, lng: undefined };
    const lat = items.reduce((s, i) => s + i.lat, 0) / items.length;
    const lng = items.reduce((s, i) => s + i.lng, 0) / items.length;
    return { lat, lng };
  }, [items]);

  if (totalItems === 0) return null;
  if (!cartMatchesPage(pathname, scope)) return null;

  const isAdventure = cartMode === "adventure";
  const cityLabel = scope?.mode === "city" ? scope.city : items[0]?.city ?? "";
  const countryLabel = scope?.country ?? items[0]?.country ?? "";

  const defaultTitle = isAdventure
    ? `${countryLabel} Adventure`
    : `${cityLabel} Route`;

  const routeDistanceKm = items.length >= 2 ? totalRouteKm(items) : null;
  const walkMinutes = routeDistanceKm != null ? estimateWalkMinutes(routeDistanceKm) : null;
  const canOptimize = !isAdventure && items.length >= 3;
  const coverImages = items.filter((i) => i.image_url).slice(0, 3);

  function handleOptimizeRoute() {
    const optimizedItems = optimizeRoute(items);
    replaceCart(optimizedItems.map((item, idx) => ({ ...item, order_index: idx })));
    setOptimized(true);
  }

  function handleCopyShare() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleSave() {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    startTransition(async () => {
      const result = await saveRouteAction(routeTitle || defaultTitle, items);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          clearCart();
          setPanelOpen(false);
        }, 2500);
      } else {
        setSaveError(result.error);
        setTimeout(() => setSaveError(""), 3000);
      }
    });
  }

  const placeWord = totalItems === 1 ? t("cartPlaceOne") : t("cartPlaceMany");
  const dayTitle = isAdventure
    ? t("cartTitleAdventure")
    : t("cartDayTitle", { city: cityLabel });

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full flex items-center gap-3 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-stone-200/90 bg-white/95 text-left"
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 text-white"
              style={{ background: isAdventure ? "#ea580c" : "oklch(0.68 0.16 82)" }}
            >
              {totalItems}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-900 text-sm font-semibold leading-tight truncate">
                {dayTitle}
              </p>
              <p className="text-stone-400 text-xs truncate">
                {totalItems} {placeWord}
                {routeDistanceKm !== null && (
                  <span className="ml-1.5">· {formatKm(routeDistanceKm)}</span>
                )}
              </p>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${panelOpen ? "rotate-180" : ""}`}
            />
          </button>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] flex flex-col bg-[#FDFBF7] border-t border-stone-200 rounded-t-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-stone-200" />
              </div>

              {coverImages.length > 0 && (
                <div className="mx-4 mb-3 h-24 rounded-2xl overflow-hidden grid flex-shrink-0"
                  style={{ gridTemplateColumns: `repeat(${coverImages.length}, 1fr)` }}
                >
                  {coverImages.map((item) => (
                    <div key={item.id} className="relative h-full bg-stone-200">
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized={IMAGE_UNOPTIMIZED}
                        referrerPolicy={IMAGE_REFERRER_POLICY}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-2 border-b border-stone-100 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <RouteIcon className={`w-4 h-4 flex-shrink-0 ${isAdventure ? "text-orange-600" : "text-amber-700"}`} />
                  <div className="min-w-0">
                    <p className="text-stone-900 font-semibold text-sm truncate">{dayTitle}</p>
                    <p className="text-stone-400 text-xs">
                      {totalItems} {placeWord}
                      {routeDistanceKm !== null && ` · ${formatKm(routeDistanceKm)}`}
                      {walkMinutes != null && ` · ~${walkMinutes}${t("cartWalkMin")}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 pt-3 flex-shrink-0">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity min-h-[52px]"
                  style={{ background: "oklch(0.68 0.16 82)" }}
                >
                  <Navigation className="w-5 h-5" />
                  {t("openInMaps")}
                </a>
              </div>

              <div className="px-5 pt-3 flex-shrink-0">
                <input
                  type="text"
                  value={routeTitle}
                  onChange={(e) => setRouteTitle(e.target.value)}
                  placeholder={defaultTitle}
                  maxLength={50}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm placeholder-stone-300 outline-none focus:border-stone-400"
                />
              </div>

              {!isAdventure && items.length >= 2 && canOptimize && (
                <div className="px-5 pt-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleOptimizeRoute}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      optimized
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {optimized ? <Check className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {optimized ? t("cartOptimized") : t("cartOptimize")}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-100"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: isAdventure ? "#ea580c" : "oklch(0.68 0.16 82)" }}
                    >
                      {idx + 1}
                    </div>
                    {item.image_url && (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image_url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                          unoptimized={IMAGE_UNOPTIMIZED}
                          referrerPolicy={IMAGE_REFERRER_POLICY}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-900 text-sm font-medium truncate">{item.name}</p>
                      <p className="text-stone-400 text-xs truncate">
                        {item.region ?? item.city}
                      </p>
                    </div>
                    {(() => {
                      const pin = mapsPinLinkProps(
                        item.lat,
                        item.lng,
                        item.name,
                        item.region ?? item.city,
                        item.country
                      );
                      if (!pin) return null;
                      return (
                        <a
                          href={pin.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={pin.title}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-blue-600 flex-shrink-0"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg text-stone-300 hover:text-red-500 flex-shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <TripExtrasSection
                city={cityLabel}
                country={countryLabel}
                countrySlug={slugify(countryLabel)}
                placeCount={totalItems}
                isAdventure={isAdventure}
                lat={routeCentroid.lat}
                lng={routeCentroid.lng}
              />

              <div className="px-4 pb-8 pt-2 border-t border-stone-100 flex-shrink-0 space-y-2 bg-white">
                {saveSuccess && (
                  <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm">
                    <Check className="w-4 h-4" /> {t("cartSavedToTrip")}
                  </div>
                )}
                {saveError && (
                  <p className="text-red-500 text-xs text-center">{saveError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending || saveSuccess}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 min-h-[48px]"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <BookMarked className="w-4 h-4" />
                    )}
                    {isLoggedIn ? t("cartSavePassport") : t("cartSignInSave")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 min-h-[48px]"
                    aria-label={t("shareTitle")}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { clearCart(); setPanelOpen(false); }}
                    className="p-3 rounded-xl border border-stone-200 text-stone-400 hover:text-red-500 min-h-[48px]"
                    title={t("cartClear")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isLoggedIn && (
                  <Link
                    href="/my-passport"
                    onClick={() => setPanelOpen(false)}
                    className="block text-center text-stone-400 hover:text-stone-700 text-xs py-1"
                  >
                    {t("cartOpenMyTrip")}
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ShareRouteSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        onCopy={handleCopyShare}
        copied={copied}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        pendingItems={items}
        routeTitle={routeTitle || defaultTitle}
        onAuthSuccess={() => { setAuthModalOpen(false); handleSave(); }}
      />
    </>
  );
}
