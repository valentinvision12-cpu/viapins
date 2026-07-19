"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  X,
  Dices,
  Mountain,
  Waves,
  Landmark,
  Trees,
  Sun,
  Map,
  Route,
  Clock,
  Globe2,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DestinationCard } from "@/actions/get-destinations";
import {
  matchDestination,
  randomDestination,
  type InspireVibe,
  type TripStyle,
  type InspireMatch,
} from "@/lib/inspire-engine";
import { LUXURY } from "@/lib/luxury-palette";
import { fallbackImageUrl } from "@/lib/fallback-image";

const GOLD = LUXURY.bronze;

const VIBES: { id: InspireVibe; icon: typeof Mountain; emoji: string }[] = [
  { id: "adventure", icon: Mountain, emoji: "🏔️" },
  { id: "relax", icon: Sun, emoji: "🧘" },
  { id: "culture", icon: Landmark, emoji: "🏛️" },
  { id: "nature", icon: Trees, emoji: "🌲" },
  { id: "beach", icon: Waves, emoji: "🏖️" },
  { id: "history", icon: Map, emoji: "📜" },
];

const TRIP_STYLES: { id: TripStyle; icon: typeof Route; emoji: string }[] = [
  { id: "single_city", icon: Landmark, emoji: "🏙️" },
  { id: "country_tour", icon: Globe2, emoji: "🗺️" },
  { id: "weekend", icon: Clock, emoji: "⚡" },
];

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

type Step = "welcome" | "vibe" | "style" | "season" | "result";

interface Props {
  destinations: DestinationCard[];
  open: boolean;
  onClose: () => void;
}

export function InspireMeModal({ destinations, open, onClose }: Props) {
  const t = useTranslations("inspire");
  const tSeasons = useTranslations("seasons");
  const [step, setStep] = useState<Step>("welcome");
  const [vibe, setVibe] = useState<InspireVibe | null>(null);
  const [tripStyle, setTripStyle] = useState<TripStyle | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [result, setResult] = useState<InspireMatch | null>(null);
  const [spinning, setSpinning] = useState(false);

  const reset = useCallback(() => {
    setStep("welcome");
    setVibe(null);
    setTripStyle(null);
    setSeason(null);
    setResult(null);
    setSpinning(false);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleSurprise() {
    setSpinning(true);
    setTimeout(() => {
      const match = randomDestination(destinations);
      setResult(match);
      setStep("result");
      setSpinning(false);
    }, 1200);
  }

  function finishQuiz() {
    if (!vibe || !tripStyle) return;
    const match = matchDestination(destinations, {
      vibe,
      tripStyle,
      season: season ?? undefined,
    });
    setResult(match);
    setStep("result");
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Panel — bottom sheet on phone, centered dialog on desktop */}
      <motion.div
        className="relative w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
        style={{ background: LUXURY.cream }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.2 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-stone-200/60 bg-[#FDF9F1]/95 backdrop-blur-sm rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
            <span className="font-bold text-stone-900 text-sm">{t("title")}</span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-6">
          <AnimatePresence mode="wait">
            {/* ── WELCOME ─────────────────────────────────────────────── */}
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
                  style={{ background: "rgba(139,100,20,0.1)" }}
                >
                  ✨
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">
                  {t("welcomeTitle")}
                </h2>
                <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                  {t("welcomeSubtitle")}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep("vibe")}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: GOLD,
                      color: "white",
                    }}
                  >
                    <Sparkles className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{t("takeQuiz")}</p>
                      <p className="text-xs opacity-80 mt-0.5">{t("takeQuizDesc")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0" />
                  </button>

                  <button
                    onClick={handleSurprise}
                    disabled={spinning}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed text-left transition-all hover:bg-stone-50 disabled:opacity-60"
                    style={{ borderColor: "rgba(139,100,20,0.3)" }}
                  >
                    <Dices className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                    <div>
                      <p className="font-semibold text-sm text-stone-800">
                        {spinning ? t("spinning") : t("surpriseMe")}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{t("surpriseMeDesc")}</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── VIBE ────────────────────────────────────────────────── */}
            {step === "vibe" && (
              <motion.div
                key="vibe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepHeader
                  step={1}
                  total={3}
                  question={t("vibeQuestion")}
                  hint={t("vibeHint")}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  {VIBES.map((v) => (
                    <OptionCard
                      key={v.id}
                      emoji={v.emoji}
                      label={t(`vibe_${v.id}`)}
                      selected={vibe === v.id}
                      onClick={() => {
                        setVibe(v.id);
                        setTimeout(() => setStep("style"), 300);
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── TRIP STYLE ─────────────────────────────────────────── */}
            {step === "style" && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep("vibe")}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mb-4"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("back")}
                </button>
                <StepHeader
                  step={2}
                  total={3}
                  question={t("styleQuestion")}
                  hint={t("styleHint")}
                />
                <div className="space-y-2.5">
                  {TRIP_STYLES.map((s) => (
                    <OptionCard
                      key={s.id}
                      emoji={s.emoji}
                      label={t(`style_${s.id}`)}
                      selected={tripStyle === s.id}
                      wide
                      onClick={() => {
                        setTripStyle(s.id);
                        setTimeout(() => setStep("season"), 300);
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── SEASON ─────────────────────────────────────────────── */}
            {step === "season" && (
              <motion.div
                key="season"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep("style")}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mb-4"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("back")}
                </button>
                <StepHeader
                  step={3}
                  total={3}
                  question={t("seasonQuestion")}
                  hint={t("seasonHint")}
                />
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {SEASONS.map((s) => (
                    <OptionCard
                      key={s}
                      label={tSeasons(s)}
                      selected={season === s}
                      onClick={() => setSeason(season === s ? null : s)}
                    />
                  ))}
                </div>
                <button
                  onClick={finishQuiz}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all hover:brightness-105"
                  style={{ background: GOLD }}
                >
                  {t("findMyCity")}
                </button>
                <button
                  onClick={finishQuiz}
                  className="w-full mt-2 py-2 text-xs text-stone-400 hover:text-stone-600"
                >
                  {t("skipSeason")}
                </button>
              </motion.div>
            )}

            {/* ── RESULT ─────────────────────────────────────────────── */}
            {step === "result" && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: GOLD }}
                >
                  {t("yourMatch")}
                </p>

                <div className="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
                  <Image
                    src={
                      result.destination.coverImage ||
                      fallbackImageUrl(
                        `${result.destination.city}-${result.destination.country}`,
                        900,
                        540
                      )
                    }
                    alt={result.destination.city}
                    fill
                    className="object-cover"
                    unoptimized={IMAGE_UNOPTIMIZED}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-left">
                    <p className="text-white/70 text-xs">{result.destination.country}</p>
                    <p className="text-white text-2xl font-bold">
                      {result.destination.city}
                    </p>
                  </div>
                </div>

                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  {t(result.reasonKey)}
                </p>

                <Link
                  href={`/explore/${result.destination.slug.country}/${result.destination.slug.city}`}
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 w-full justify-center py-3.5 rounded-2xl font-semibold text-sm text-white mb-3 transition-all hover:brightness-105"
                  style={{ background: GOLD }}
                >
                  {t("exploreCity", { city: result.destination.city })}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={reset}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  {t("tryAgain")}
                </button>
              </motion.div>
            )}

            {step === "result" && !result && (
              <p className="text-center text-stone-400 text-sm py-8">
                {t("noDestinations")}
              </p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function StepHeader({
  step,
  total,
  question,
  hint,
}: {
  step: number;
  total: number;
  question: string;
  hint: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{
              background:
                i < step ? GOLD : "rgba(139,100,20,0.15)",
            }}
          />
        ))}
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-1">{question}</h2>
      <p className="text-stone-400 text-sm">{hint}</p>
    </div>
  );
}

function OptionCard({
  emoji,
  label,
  selected,
  wide,
  onClick,
}: {
  emoji?: string;
  label: string;
  selected: boolean;
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
        wide ? "w-full px-4 py-3.5" : "px-3 py-3.5 flex-col items-center text-center gap-1.5"
      }`}
      style={{
        borderColor: selected ? GOLD : "rgba(0,0,0,0.06)",
        background: selected ? "rgba(139,100,20,0.08)" : "white",
      }}
    >
      {emoji && <span className="text-2xl">{emoji}</span>}
      <span
        className={`font-semibold text-stone-800 ${wide ? "text-sm" : "text-xs"}`}
      >
        {label}
      </span>
    </button>
  );
}

/** Trigger button — used in hero & search bar */
export function InspireMeButton({
  destinations,
  variant = "hero",
}: {
  destinations: DestinationCard[];
  variant?: "hero" | "inline";
}) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);

  if (variant === "hero") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm border transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] min-h-[48px] w-full sm:w-auto"
          style={{
            borderColor: "rgba(217,71,44,.28)",
            color: "#C63E27",
            background: LUXURY.creamCard,
          }}
        >
          <Sparkles className="w-4 h-4" />
          {t("inspireMe")}
        </button>
        <InspireMeModal
          destinations={destinations}
          open={open}
          onClose={() => setOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap min-h-[48px]"
        style={{
          background: LUXURY.creamCard,
          border: `1px solid ${LUXURY.bronzeBorder}`,
          color: LUXURY.textSecondary,
        }}
      >
        <Sparkles className="w-4 h-4" style={{ color: LUXURY.bronze }} />
        {t("inspireMe")}
      </button>
      <InspireMeModal
        destinations={destinations}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
