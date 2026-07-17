"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, X } from "lucide-react";
import { LUXURY } from "@/lib/luxury-palette";

const STORAGE_KEY = "ltm_onboarding_v3";

export function WelcomeOnboarding() {
  const t = useTranslations("onboarding");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!mounted) return null;

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
  ];
  const current = steps[step];

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={finish}
          />
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[min(400px,calc(100vw-2rem))] bg-white rounded-3xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 pt-7 pb-6">
              <button
                type="button"
                onClick={finish}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-300 hover:text-stone-600"
                aria-label={t("skip")}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${LUXURY.bronze}18`, color: LUXURY.bronze }}
                >
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                >
                  <h2 className="text-lg font-bold text-stone-900 text-center mb-2">
                    {step === 0 ? t("welcomeTitle") : current.title}
                  </h2>
                  <p className="text-stone-500 text-sm text-center leading-relaxed mb-6">
                    {current.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-1.5 mb-5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-stone-900" : "w-1.5 bg-stone-200"}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step < steps.length - 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={finish}
                      className="px-4 py-3 text-stone-400 text-sm hover:text-stone-600"
                    >
                      {t("skip")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                      style={{ background: LUXURY.bronze }}
                    >
                      {t("next")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={finish}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                    style={{ background: LUXURY.bronze }}
                  >
                    {t("getStarted")}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
