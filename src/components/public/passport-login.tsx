"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { Heart, Car, Sparkles } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { PASSPORT } from "@/lib/luxury-palette";
import { buildOAuthRedirectTo, getLocaleFromPath, OAUTH_PERSIST_QUERY } from "@/i18n/routing";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function PassportLogin() {
  const t = useTranslations("auth");
  const tTrips = useTranslations("MyTrips");
  const locale = useLocale();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const perks = [
    { icon: Heart, text: tTrips("featureSavePlaces") },
    { icon: Car, text: tTrips("featureTrackRoutes") },
  ];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGoogle() {
    setLoading(true);
    setError("");
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
    <div className="relative mx-auto w-full max-w-lg px-2 py-6 sm:py-10">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-50 blur-3xl"
        style={{ background: PASSPORT.heroGradient }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
          boxShadow: PASSPORT.cardShadowHover,
        }}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${PASSPORT.accent}, #C9A66B, ${PASSPORT.accent}, transparent)`,
          }}
        />

        <div className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: PASSPORT.accentSoft,
                color: PASSPORT.accent,
                border: `1px solid ${PASSPORT.accentBorder}`,
              }}
            >
              <Sparkles className="h-3 w-3" />
              {t("passportBadge")}
            </div>

            <h1
              className="mb-3 text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: PASSPORT.text }}
            >
              {tTrips("title")}
            </h1>
            <p
              className="mx-auto max-w-sm text-base leading-relaxed"
              style={{ color: PASSPORT.textMuted }}
            >
              {tTrips("loginSubtitle")}
            </p>
          </div>

          <ul className="mb-8 space-y-3">
            {perks.map((p, i) => (
              <motion.li
                key={p.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className="flex items-start gap-3 rounded-2xl border p-4"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  borderColor: PASSPORT.cardBorder,
                }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: PASSPORT.accentSoft }}
                >
                  <p.icon className="h-4 w-4" style={{ color: PASSPORT.accent }} />
                </div>
                <p className="pt-1.5 text-sm font-medium leading-snug" style={{ color: PASSPORT.text }}>
                  {p.text}
                </p>
              </motion.li>
            ))}
          </ul>

          <div
            className="rounded-2xl border p-5"
            style={{
              background: PASSPORT.accentSoft,
              borderColor: PASSPORT.accentBorder,
            }}
          >
            <motion.button
              onClick={handleGoogle}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-base font-bold text-stone-800 shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              style={{ border: `1px solid ${PASSPORT.cardBorder}` }}
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <GoogleIcon />
              )}
              <span>{loading ? t("signingIn") : t("continueWithGoogle")}</span>
            </motion.button>

            {error && (
              <p className="mt-3 text-center text-sm font-medium text-red-500">{error}</p>
            )}

            <p className="mt-4 text-center text-xs" style={{ color: PASSPORT.textMuted }}>
              {t("freeNoSpam")}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
