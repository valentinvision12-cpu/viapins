"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Image,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe2,
  Send,
  Tag,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateDestinationAction,
  type GenerationResult,
} from "@/actions/generate-destination";
import { publishDestinationAction } from "@/actions/publish-destination";
import { PlacePreviewCard } from "./place-preview-card";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    icon: Bot,
    label: "Claude AI",
    description: "Генерира Топ 10 забележителности с описания на 5 езика",
    delay: 0,
  },
  {
    id: 2,
    icon: Image,
    label: "Unsplash",
    description: "Изтегля HD изображения за всяка забележителност",
    delay: 3000,
  },
  {
    id: 3,
    icon: BookOpen,
    label: "Wikipedia",
    description: "Обогатява с исторически данни на 5 езика",
    delay: 5500,
  },
] as const;

type FormState =
  | { status: "idle" }
  | { status: "loading"; activeSteps: number[] }
  | { status: "preview"; data: GenerationResult }
  | { status: "publishing" }
  | { status: "published"; city: string; country: string }
  | { status: "error"; message: string };

// ── Progress step component ───────────────────────────────────────────────────
function StepIndicator({
  step,
  active,
  done,
}: {
  step: (typeof STEPS)[number];
  active: boolean;
  done: boolean;
}) {
  const Icon = step.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-500",
        done
          ? "border-emerald-200 bg-emerald-50/60"
          : active
          ? "border-blue-200 bg-blue-50/60"
          : "border-gray-100 bg-white opacity-40"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
          done
            ? "bg-emerald-500 text-white"
            : active
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-400"
        )}
      >
        {done ? (
          <CheckCircle2 className="w-4.5 h-4.5" />
        ) : active ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
        ) : (
          <Icon className="w-4.5 h-4.5" />
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            done
              ? "text-emerald-700"
              : active
              ? "text-blue-700"
              : "text-gray-400"
          )}
        >
          {step.label}
        </p>
        <p
          className={cn(
            "text-xs mt-0.5",
            done || active ? "text-gray-600" : "text-gray-400"
          )}
        >
          {step.description}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AiGeneratorForm() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  // Animate steps with staggered delays during loading
  useEffect(() => {
    if (formState.status !== "loading") return;

    const timers = STEPS.slice(1).map((step) =>
      setTimeout(() => {
        setFormState((prev) =>
          prev.status === "loading"
            ? { ...prev, activeSteps: [...prev.activeSteps, step.id] }
            : prev
        );
      }, step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [formState.status]);

  function handleGenerate() {
    if (!city.trim() || !country.trim()) return;

    setFormState({ status: "loading", activeSteps: [1] });

    startTransition(async () => {
      const result = await generateDestinationAction(city.trim(), country.trim());

      if (result.success) {
        setFormState({ status: "preview", data: result.data });
      } else {
        setFormState({ status: "error", message: result.error });
      }
    });
  }

  function handlePublish() {
    if (formState.status !== "preview") return;
    const data = formState.data;

    setFormState({ status: "publishing" });

    startTransition(async () => {
      const result = await publishDestinationAction(data);

      if (result.success) {
        setFormState({
          status: "published",
          city: data.destination.city,
          country: data.destination.country,
        });
      } else {
        setFormState({ status: "error", message: result.error });
      }
    });
  }

  function handleReset() {
    setFormState({ status: "idle" });
  }

  // ── Idle: input form ─────────────────────────────────────────────────────
  if (formState.status === "idle") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.22_0.07_250)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">AI Генератор</h2>
              <p className="text-xs text-gray-500">
                Въведи дестинация → получи Топ 10 за 5 секунди
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Град
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="напр. Барселона"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Държава
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="напр. Испания"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!city.trim() || !country.trim() || isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Генерирай с Claude AI
            </button>
          </div>

          {/* API key hint */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Изисква{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Anthropic API ключ
            </a>{" "}
            . Снимките се зареждат от Wikimedia Commons (безплатен)
          </p>
        </div>
      </div>
    );
  }

  // ── Loading: step progress ────────────────────────────────────────────────
  if (formState.status === "loading") {
    const { activeSteps } = formState;

    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-semibold text-gray-700">
              Генериране на{" "}
              <span className="text-blue-600">
                {city}, {country}
              </span>
              …
            </span>
          </div>

          <div className="space-y-3">
            {STEPS.map((step) => {
              const stepIdx = STEPS.findIndex((s) => s.id === step.id);
              const active = activeSteps.includes(step.id);
              // A step is "done" only when the next step becomes active
              const done =
                active &&
                stepIdx < STEPS.length - 1 &&
                activeSteps.includes(STEPS[stepIdx + 1].id);

              return (
                <StepIndicator
                  key={step.id}
                  step={step}
                  active={active && !done}
                  done={done}
                />
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Обикновено отнема 10–20 секунди…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (formState.status === "error") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Грешка</p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                {formState.message}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  // ── Published state ───────────────────────────────────────────────────────
  if (formState.status === "published") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Публикувано успешно! 🎉
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">
              {formState.city}, {formState.country}
            </span>{" "}
            е добавена в базата данни с всички 10 забележителности.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              Генерирай нова
            </button>
            <a
              href="/admin/destinations"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Виж дестинациите
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Publishing state ──────────────────────────────────────────────────────
  if (formState.status === "publishing") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-700">
            Записва в базата данни…
          </p>
        </div>
      </div>
    );
  }

  // ── Preview: the 10 place cards ───────────────────────────────────────────
  const { data } = formState;

  return (
    <div className="space-y-6">
      {/* Destination header */}
      <div className="bg-gradient-to-r from-[oklch(0.22_0.07_250)] to-[oklch(0.28_0.10_265)] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe2 className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
              <span className="text-sm text-white/60 font-medium">Генерирана дестинация</span>
            </div>
            <h2 className="text-2xl font-bold">
              {data.destination.city},{" "}
              <span className="text-white/70">{data.destination.country}</span>
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {data.destination.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-xs text-white/80"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
            >
              Нова
            </button>
            <button
              onClick={handlePublish}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] font-semibold text-sm hover:brightness-105 disabled:opacity-50 transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
              Публикувай
            </button>
          </div>
        </div>
      </div>

      {/* Place cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {data.places.map((place, i) => (
          <PlacePreviewCard
            key={place.name}
            place={place}
            rank={i + 1}
            city={data.destination.city}
            country={data.destination.country}
          />
        ))}
      </div>

      {/* Bottom publish bar */}
      <div className="sticky bottom-6 flex justify-center">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">10</span> забележителности готови
          </span>
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Публикувай всичко
          </button>
        </div>
      </div>
    </div>
  );
}
