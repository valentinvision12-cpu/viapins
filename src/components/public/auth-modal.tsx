"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { X, Globe, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { RouteCartItem } from "@/lib/context/route-cart-context";
import { useAdBlock } from "@/components/public/adblock-detector";
import { buildOAuthRedirectTo, OAUTH_PERSIST_QUERY } from "@/i18n/routing";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: RouteCartItem[];
  routeTitle: string;
  onAuthSuccess: () => void;
}

type Step = "idle" | "sending" | "sent" | "error";

// ── Provider icons ────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export function AuthModal({ isOpen, onClose, pendingItems, routeTitle, onAuthSuccess }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { adBlockDetected } = useAdBlock();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  function getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  function savePendingRoute() {
    localStorage.setItem(
      "pending_route",
      JSON.stringify({ title: routeTitle, items: pendingItems })
    );
  }

  const redirectTo = buildOAuthRedirectTo("/my-passport", locale);

  async function handleOAuth(provider: "google" | "facebook" | "apple") {
    if (!isConfigured) return;
    savePendingRoute();
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: provider === "google" ? OAUTH_PERSIST_QUERY : undefined,
      },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !isConfigured) return;
    setStep("sending");
    setErrorMsg("");
    savePendingRoute();

    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStep("error");
      setErrorMsg(error.message);
    } else {
      setStep("sent");
    }
  }

  const cityList = [...new Set(pendingItems.map((i) => i.city))].join(", ");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-[oklch(0.13_0.06_252)] border border-white/10 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden">

              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-white/8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: "oklch(0.72 0.13 82)" }}>
                    <Globe className="w-6 h-6 text-[oklch(0.12_0.008_260)]" />
                  </div>
                </div>

                <h2 className="text-white text-lg font-bold text-center mb-1">
                  {t("saveRoutePrompt")}
                </h2>

                {pendingItems.length > 0 && (
                  <p className="text-white/40 text-xs text-center">
                    <span className="text-[oklch(0.82_0.12_82)] font-semibold">
                      {t("placesPending", { count: pendingItems.length })}
                    </span>
                    {cityList && ` · ${cityList}`}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {!isConfigured ? (
                  <div className="text-center py-4 px-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-amber-300 text-sm font-medium mb-1">{t("supabaseMissing")}</p>
                    <p className="text-amber-400/60 text-xs">{t("supabaseMissingDesc")}</p>
                  </div>

                ) : adBlockDetected ? (
                  <div className="text-center py-4 px-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                    <p className="text-amber-200 text-sm font-medium">Account creation is paused</p>
                    <p className="text-amber-300/70 text-xs leading-relaxed">
                      Please disable your ad blocker for ViaPins to create an account and save routes to your passport.
                      Browsing remains free.
                    </p>
                  </div>
                ) : step === "sent" ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-semibold mb-2">{t("checkEmailTitle")}</p>
                    <p className="text-white/45 text-sm">
                      {t("checkEmailDesc")}{" "}
                      <span className="text-white/70 font-medium">{email}</span>
                    </p>
                    <p className="text-white/25 text-xs mt-3">{t("checkEmailHintSave")}</p>
                  </div>

                ) : (
                  <div className="space-y-3">
                    {/* Google */}
                    <button
                      onClick={() => handleOAuth("google")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-all shadow-sm"
                    >
                      <GoogleIcon />
                      <span className="flex-1 text-left">{t("continueWithGoogle")}</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-white/25 text-xs">{t("orWithEmail")}</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {/* Magic Link */}
                    <form onSubmit={handleMagicLink} className="space-y-2.5">
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("emailPlaceholder")}
                          className="w-full bg-white/6 border border-white/12 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                        />
                      </div>

                      {step === "error" && (
                        <div className="flex items-center gap-2 text-red-400 text-xs px-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {errorMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={step === "sending"}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
                        style={{ background: "oklch(0.72 0.13 82)", color: "oklch(0.12 0.008 260)" }}
                      >
                        {step === "sending" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> {t("magicLinkSending")}</>
                        ) : (
                          <>{t("magicLink")}</>
                        )}
                      </button>
                    </form>

                    <p className="text-white/20 text-[10px] text-center pt-1">
                      {t("freeNoSpam")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
