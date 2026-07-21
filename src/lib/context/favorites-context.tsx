"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, LogIn } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { addFavoriteAction, removeFavoriteAction, getFavoritesAction, type FavoritePlace } from "@/actions/favorites";
import { buildOAuthRedirectTo, getLocaleFromPath, OAUTH_PERSIST_QUERY } from "@/i18n/routing";
import { PASSPORT } from "@/lib/luxury-palette";

// ── Context type ─────────────────────────────────────────────────────────────

interface FavoritesContextType {
  favoriteIds: Set<string>;
  favorites: FavoritePlace[];
  isFavorite: (placeId: string) => boolean;
  toggleFavorite: (place: FavoritePlace) => void;
  isLoggedIn: boolean;
  totalFavorites: number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}

// ── Auth nudge banner ─────────────────────────────────────────────────────────

function AuthNudge({ place, onClose, onLogin }: {
  place: FavoritePlace;
  onClose: () => void;
  onLogin: () => void;
}) {
  const t = useTranslations("favorites");

  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 border border-stone-100 px-4 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-900 text-sm font-semibold truncate">
            {t("nudgeTitle", { name: place.name })}
          </p>
          <p className="text-stone-400 text-xs mt-0.5">
            {t("nudgeDesc")}
          </p>
        </div>
        <Link
          href="/my-passport"
          onClick={onLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors flex-shrink-0"
        >
          <LogIn className="w-3 h-3" />
          {t("nudgeSignIn")}
        </Link>
        <button
          onClick={onClose}
          className="p-1 text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nudgePlace, setNudgePlace] = useState<FavoritePlace | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [pendingLoginPlace, setPendingLoginPlace] = useState<FavoritePlace | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  // ── Bootstrap auth + load favorites ──
  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function loadFavorites() {
      const { data } = await supabase.auth.getUser();
      const loggedIn = !!data.user;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const data2 = await getFavoritesAction();
        setFavorites(data2);
        setFavoriteIds(new Set(data2.map((f) => f.place_id)));
      }
    }

    loadFavorites();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const data2 = await getFavoritesAction();
        setFavorites(data2);
        setFavoriteIds(new Set(data2.map((f) => f.place_id)));

        // Auto-save pending place after login
        if (pendingLoginPlace) {
          await addFavoriteAction(pendingLoginPlace);
          setFavorites((prev) => [pendingLoginPlace, ...prev]);
          setFavoriteIds((prev) => new Set([...prev, pendingLoginPlace.place_id]));
          setPendingLoginPlace(null);
        }
      } else {
        setFavorites([]);
        setFavoriteIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured]);

  const isFavorite = useCallback((placeId: string) => favoriteIds.has(placeId), [favoriteIds]);

  const toggleFavorite = useCallback((place: FavoritePlace) => {
    if (!isLoggedIn) {
      // Show nudge banner
      setNudgePlace(place);
      setNudgeOpen(true);
      setPendingLoginPlace(place);
      return;
    }

    if (favoriteIds.has(place.place_id)) {
      // Optimistic remove
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(place.place_id); return next; });
      setFavorites((prev) => prev.filter((f) => f.place_id !== place.place_id));
      removeFavoriteAction(place.place_id);
    } else {
      // Optimistic add
      setFavoriteIds((prev) => new Set([...prev, place.place_id]));
      setFavorites((prev) => [place, ...prev]);
      addFavoriteAction(place);
    }
  }, [isLoggedIn, favoriteIds]);

  function handleNudgeLogin() {
    setNudgeOpen(false);
    setAuthOpen(true);
  }

  return (
    <FavoritesContext.Provider value={{
      favoriteIds, favorites, isFavorite, toggleFavorite,
      isLoggedIn, totalFavorites: favorites.length,
    }}>
      {children}

      {/* Auth nudge banner */}
      <AnimatePresence>
        {nudgeOpen && nudgePlace && (
          <AuthNudge
            place={nudgePlace}
            onClose={() => setNudgeOpen(false)}
            onLogin={handleNudgeLogin}
          />
        )}
      </AnimatePresence>

      {/* Inline auth modal for favorites */}
      {authOpen && (
        <FavoritesAuthModal
          onClose={() => setAuthOpen(false)}
          pendingPlace={pendingLoginPlace}
        />
      )}
    </FavoritesContext.Provider>
  );
}

// ── Standalone auth modal for favorites (Google-only) ────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FavoritesAuthModal({ onClose, pendingPlace }: {
  onClose: () => void;
  pendingPlace: FavoritePlace | null;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGoogle() {
    setLoading(true);
    setError("");
    if (pendingPlace) {
      localStorage.setItem("pending_favorite", JSON.stringify(pendingPlace));
    }
    const activeLocale = locale || getLocaleFromPath(pathname);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildOAuthRedirectTo("/my-passport", activeLocale),
        queryParams: OAUTH_PERSIST_QUERY,
      },
    });
    if (err) {
      setError(t("authError"));
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-[#1C1409]/20 p-4 backdrop-blur-md sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl"
          style={{
            background: PASSPORT.card,
            borderColor: PASSPORT.cardBorder,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute left-0 right-0 top-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${PASSPORT.accent}, transparent)`,
            }}
          />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-stone-300 transition-colors hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>

          {pendingPlace && (
            <div
              className="mb-5 flex items-center gap-3 rounded-2xl border p-3"
              style={{ background: PASSPORT.accentSoft, borderColor: PASSPORT.cardBorder }}
            >
              {pendingPlace.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pendingPlace.image_url}
                  alt={pendingPlace.name}
                  className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: PASSPORT.text }}>
                  {pendingPlace.name}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: PASSPORT.textMuted }}>
                  {pendingPlace.city}, {pendingPlace.country}
                </p>
              </div>
              <Heart className="h-5 w-5 flex-shrink-0 fill-red-500 text-red-500" />
            </div>
          )}

          <div className="mb-6 text-center">
            <h3 className="mb-2 text-xl font-extrabold leading-tight" style={{ color: PASSPORT.text }}>
              {pendingPlace ? t("saveThisPlace") : t("saveYourFavorites")}
            </h3>
            <p className="text-sm" style={{ color: PASSPORT.textMuted }}>
              {t("saveFreeGoogle")}
            </p>
          </div>

          <motion.button
            onClick={handleGoogle}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-5 py-4 text-base font-bold text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:shadow-md disabled:opacity-60"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            {loading ? t("signingIn") : t("continueWithGoogle")}
          </motion.button>

          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

          <p className="mt-3 text-center text-[11px]" style={{ color: PASSPORT.textMuted }}>
            {t("freeNoCard")}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
