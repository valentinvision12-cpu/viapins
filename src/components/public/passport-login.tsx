"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Loader2, CheckCircle2, AlertCircle, Heart, Map, Stamp } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export function PassportLogin() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const redirectTo = `http://localhost:3002/api/auth/callback?next=/en/my-passport`;

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("sending");
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (err) {
      setStep("error");
      setError(err.message);
    } else {
      setStep("sent");
    }
  }

  const features = [
    { icon: Heart, text: t("passportFeatureSave") },
    { icon: Map, text: t("passportFeatureRoutes") },
    { icon: Stamp, text: t("passportFeatureVisited") },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 items-stretch">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100"
      >
        <h2 className="text-stone-900 font-bold text-xl mb-2">
          {t("passportTitle")} 🌍
        </h2>
        <p className="text-stone-500 text-sm mb-8 leading-relaxed">
          {t("passportSubtitle")}
        </p>

        <div className="space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.72 0.13 82)" }}
              >
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-stone-700 text-sm font-medium">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-white rounded-3xl p-8 border border-stone-100 shadow-sm"
      >
        <h3 className="text-stone-900 font-bold text-lg mb-1">{t("signInOrRegister")}</h3>
        <p className="text-stone-400 text-sm mb-6">{t("signInFree")}</p>

        {step === "sent" ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <p className="text-stone-900 font-bold text-lg mb-2">{t("checkEmailTitle")}</p>
            <p className="text-stone-500 text-sm">
              {t("checkEmailDesc")}{" "}
              <span className="font-semibold text-stone-700">{email}</span>
            </p>
            <p className="text-stone-400 text-xs mt-3">{t("checkEmailHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-800 font-semibold text-sm transition-all"
            >
              <GoogleIcon />
              <span className="flex-1 text-left">{t("continueWithGoogle")}</span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-stone-300 text-xs">{t("orWithEmail")}</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full border-2 border-stone-200 rounded-2xl pl-10 pr-4 py-3.5 text-stone-900 text-sm outline-none focus:border-amber-400 transition-all placeholder-stone-300"
                />
              </div>

              {step === "error" && (
                <div className="flex items-center gap-2 text-red-500 text-xs px-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={step === "sending"}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
                style={{ background: "oklch(0.72 0.13 82)", color: "oklch(0.12 0.008 260)" }}
              >
                {step === "sending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("magicLinkSending")}
                  </>
                ) : (
                  `${t("magicLink")} →`
                )}
              </button>
            </form>

            <p className="text-stone-300 text-[11px] text-center pt-1">{t("freeNoSpam")}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
