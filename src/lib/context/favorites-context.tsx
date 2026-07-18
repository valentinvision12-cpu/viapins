"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addFavoriteAction, removeFavoriteAction, getFavoritesAction, type FavoritePlace } from "@/actions/favorites";
import { useAdBlock } from "@/components/public/adblock-detector";

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
  const { adBlockDetected } = useAdBlock();

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
    if (adBlockDetected) return;

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
  }, [isLoggedIn, favoriteIds, adBlockDetected]);

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

// ── Standalone auth modal for favorites ───────────────────────────────────────

function FavoritesAuthModal({ onClose, pendingPlace }: {
  onClose: () => void;
  pendingPlace: FavoritePlace | null;
}) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("sending");

    if (pendingPlace) {
      localStorage.setItem("pending_favorite", JSON.stringify(pendingPlace));
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "")}/api/auth/callback?next=/en/my-passport` },
    });

    setStep(error ? "error" : "sent");
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5 fill-red-500 text-red-500" />
              </div>
              <div>
                <h3 className="text-stone-900 font-bold text-base">Запази в профила си</h3>
                <p className="text-stone-400 text-xs">Безплатно и за 30 секунди</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-stone-300 hover:text-stone-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          {pendingPlace && (
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-stone-50 border border-stone-100">
              {pendingPlace.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pendingPlace.image_url} alt={pendingPlace.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-stone-900 text-sm font-semibold truncate">{pendingPlace.name}</p>
                <p className="text-stone-400 text-xs">{pendingPlace.city}, {pendingPlace.country}</p>
              </div>
              <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0 ml-auto" />
            </div>
          )}

          {step === "sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-stone-900 font-semibold mb-1">Провери имейла си</p>
              <p className="text-stone-400 text-sm">Изпратихме ти магически линк за вход. Местото ще се запази автоматично.</p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="твоят@имейл.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm outline-none focus:border-stone-400 transition-colors"
              />
              <button
                type="submit"
                disabled={step === "sending" || !email}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {step === "sending" ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Влез / Регистрирай се
              </button>
              {step === "error" && (
                <p className="text-red-500 text-xs text-center">Нещо се обърка. Опитай пак.</p>
              )}
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
