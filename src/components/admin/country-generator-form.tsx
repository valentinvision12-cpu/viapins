"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe2,
  MapPin,
  Compass,
  Car,
  ExternalLink,
} from "lucide-react";
import {
  generateCountryCitiesAction,
  generateCitySeedAction,
  generateCountryAdventureAction,
  uploadCountrySeedAction,
  type TravelSeedFile,
} from "@/actions/generate-country";
import { COUNTRY_SEED_SPEC } from "@/lib/travel-seed";
import { ADVENTURE_SEED_SPEC } from "@/lib/adventure-seed";
import type { TravelSeedCity } from "@/lib/travel-seed";

type Phase =
  | "idle"
  | "generating"
  | "preview"
  | "uploading"
  | "done"
  | "error";

const GENERATION_RULES = [
  `${COUNTRY_SEED_SPEC.citiesPerCountry} града — най-важните туристически дестинации`,
  `${COUNTRY_SEED_SPEC.placesPerCity} забележителности на град = ${COUNTRY_SEED_SPEC.placesPerCountry} общо`,
  `Adventure: ${ADVENTURE_SEED_SPEC.placesPerCountry} спирки × ${ADVENTURE_SEED_SPEC.daysPerRoute} дни (road trip с кола)`,
  "Wikipedia → снимки + история + SEO (автоматично при качване)",
  "След качване → управление от Дестинации (скрий / изтрий / замени)",
];

export function CountryGeneratorForm() {
  const [country, setCountry] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<TravelSeedFile | null>(null);
  const [cityProgress, setCityProgress] = useState<
    { city: string; places: number; done: boolean }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  async function handleGenerate() {
    if (!country.trim()) return;
    setPhase("generating");
    setError(null);
    setSeed(null);
    setCityProgress([]);

    const countryName = country.trim();

    try {
      setProgress("Избирам 10-те най-добри града…");
      const citiesResult = await generateCountryCitiesAction(countryName);
      if (!citiesResult.success) throw new Error(citiesResult.error);

      const cities: TravelSeedCity[] = [];
      const progressList = citiesResult.cities.map((c) => ({
        city: c.city,
        places: 0,
        done: false,
      }));
      setCityProgress([...progressList]);

      for (let i = 0; i < citiesResult.cities.length; i++) {
        const outline = citiesResult.cities[i];
        setProgress(`Град ${i + 1}/10: ${outline.city} — Топ 10 забележителности…`);

        const cityResult = await generateCitySeedAction(outline.city, countryName);
        if (!cityResult.success) throw new Error(cityResult.error);

        const merged: TravelSeedCity = {
          ...cityResult.citySeed,
          city: outline.city,
          tags: outline.tags.length ? outline.tags : cityResult.citySeed.tags,
          wiki_title: outline.wiki_title ?? cityResult.citySeed.wiki_title,
        };
        cities.push(merged);

        progressList[i] = {
          city: outline.city,
          places: merged.places.length,
          done: true,
        };
        setCityProgress([...progressList]);
      }

      setProgress("Adventure road trip — 10 спирки извън градовете…");
      const advResult = await generateCountryAdventureAction(countryName);
      if (!advResult.success) throw new Error(advResult.error);

      const fullSeed: TravelSeedFile = {
        version: 1,
        country: countryName,
        published: true,
        cities,
        adventure: advResult.adventure,
      };

      setSeed(fullSeed);
      setPhase("preview");
      setProgress("");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Грешка при генериране.");
    }
  }

  function handleUpload() {
    if (!seed) return;
    setPhase("uploading");
    setError(null);

    startTransition(async () => {
      const result = await uploadCountrySeedAction(seed);
      if (result.success) {
        setPhase("done");
      } else {
        setPhase("error");
        setError(result.error);
      }
    });
  }

  function handleReset() {
    setPhase("idle");
    setSeed(null);
    setError(null);
    setProgress("");
    setCityProgress([]);
  }

  if (phase === "done") {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-emerald-200 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {seed?.country} е на сайта!
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {COUNTRY_SEED_SPEC.placesPerCountry} места + Adventure са в Supabase и се виждат на началната страница.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Нова държава
          </button>
          <a
            href="/admin/destinations"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white text-sm font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Дестинации
          </a>
        </div>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border p-8 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="font-medium text-gray-800">Качване на сайта…</p>
        <p className="text-xs text-gray-400 mt-2">
          Wikipedia снимки + история за 100+ места — може да отнеме 2–4 минути
        </p>
      </div>
    );
  }

  if (phase === "preview" && seed) {
    const placeCount = seed.cities.reduce((n, c) => n + c.places.length, 0);
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[oklch(0.22_0.07_250)] to-[oklch(0.28_0.10_265)] rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-xs font-medium mb-1">Готово за качване</p>
              <h2 className="text-2xl font-bold">{seed.country}</h2>
              <p className="text-white/70 text-sm mt-2">
                {seed.cities.length} града · {placeCount} места ·{" "}
                {seed.adventure?.places.length ?? 0} adventure спирки
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-white/10 text-sm hover:bg-white/20"
              >
                Отначало
              </button>
              <button
                onClick={handleUpload}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] font-bold text-sm disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Качи на сайта
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {seed.cities.map((c) => (
            <div
              key={c.city}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium text-gray-800">{c.city}</span>
              <span className="text-gray-400 text-xs ml-auto">{c.places.length} места</span>
            </div>
          ))}
        </div>

        {seed.adventure && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
            <Compass className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{seed.adventure.title}</p>
              <p className="text-xs text-gray-500">{seed.adventure.subtitle}</p>
            </div>
            <Car className="w-4 h-4 text-orange-400 ml-auto" />
          </div>
        )}

        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[oklch(0.22_0.07_250)] text-white font-bold shadow-xl hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            Качи на сайта
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Rules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
          Какво генерира AI (фиксирани правила)
        </h3>
        <ul className="space-y-2">
          {GENERATION_RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-xs text-gray-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.22_0.07_250)] flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Генерирай държава</h2>
            <p className="text-xs text-gray-500">Само името → AI прави останалото</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Държава
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="напр. Albania, Greece, Croatia"
              disabled={phase === "generating"}
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && phase === "idle" && handleGenerate()}
            />
          </div>

          {phase === "generating" && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-blue-800">{progress}</span>
              </div>
              {cityProgress.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {cityProgress.map((c) => (
                    <span
                      key={c.city}
                      className={`text-[10px] px-2 py-1 rounded-lg ${
                        c.done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-white text-gray-400"
                      }`}
                    >
                      {c.done ? "✓" : "…"} {c.city}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-blue-600/70 mt-3">
                ~3–5 минути (11 AI заявки + Wikipedia при качване)
              </p>
            </div>
          )}

          {phase === "error" && error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!country.trim() || phase === "generating"}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40"
          >
            {phase === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Генерира…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Генерирай
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
