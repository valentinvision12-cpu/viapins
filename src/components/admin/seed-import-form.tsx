"use client";

import { useState, useTransition } from "react";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  MapPin,
  Zap,
} from "lucide-react";
import { importSeedAction, previewSeedAction, importAlbaniaQuickAction } from "@/actions/import-seed";
import { exportAlbaniaSeedAction, exportBulgariaSeedAction } from "@/actions/export-seed";
import { emptySeedTemplate, COUNTRY_SEED_SPEC } from "@/lib/travel-seed";
import { ADVENTURE_SEED_SPEC } from "@/lib/adventure-seed";

type PreviewStats = {
  country: string;
  cityCount: number;
  placeCount: number;
  expectedCities: number;
  expectedPlaces: number;
  isComplete: boolean;
  cities: { city: string; places: number; isComplete: boolean }[];
};

type PreviewAdventure = {
  placeCount: number;
  dayCount: number;
  expectedPlaces: number;
  expectedDays: number;
  isComplete: boolean;
};

export function SeedImportForm() {
  const [json, setJson] = useState("");
  const [preview, setPreview] = useState<PreviewStats | null>(null);
  const [adventurePreview, setAdventurePreview] = useState<PreviewAdventure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJson(ev.target?.result as string);
      setPreview(null);
      setError(null);
      setSuccess(null);
    };
    reader.readAsText(file);
  }

  function handlePreview() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await previewSeedAction(json);
      if (result.success) {
        setPreview(result.stats);
        setAdventurePreview(result.adventure ?? null);
      } else {
        setError(result.error);
        setPreview(null);
        setAdventurePreview(null);
      }
    });
  }

  function handleImport() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await importSeedAction(json);
      if (result.success) {
        setSuccess(
          `✓ ${result.stats.country}: ${result.stats.placeCount} градски места + ${result.adventure?.placeCount ?? 0} adventure спирки`
        );
        setPreview(result.stats);
        setAdventurePreview(result.adventure ?? null);
      } else {
        setError(result.error);
      }
    });
  }

  function loadTemplate() {
    setJson(JSON.stringify(emptySeedTemplate("Greece"), null, 2));
    setPreview(null);
    setError(null);
    setSuccess(null);
  }

  function loadBulgaria() {
    startTransition(async () => {
      const exported = await exportBulgariaSeedAction();
      setJson(exported);
      setPreview(null);
      setError(null);
      setSuccess(null);
    });
  }

  function loadAlbania() {
    startTransition(async () => {
      const exported = await exportAlbaniaSeedAction();
      setJson(exported);
      setPreview(null);
      setError(null);
      setSuccess(null);
    });
  }

  function handleQuickAlbania() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await importAlbaniaQuickAction();
      if (result.success) {
        setSuccess(
          `✓ Албания е на сайта: ${result.stats.placeCount} места + ${result.adventure?.placeCount ?? 0} adventure спирки`
        );
        setPreview(result.stats);
        setAdventurePreview(result.adventure ?? null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Workflow */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/8 p-5">
        <h3 className="text-sm font-bold text-emerald-200 mb-2">
          Обичайният начин — без ключ, без JSON
        </h3>
        <p className="text-xs text-white/55 mb-3">
          Пиши в Cursor chat: <strong className="text-white/80">„Качи Albania“</strong> или{" "}
          <strong className="text-white/80">„Направи и качи Greece“</strong> — agent прави файла и
          го качва. Ти управляваш от{" "}
          <a href="/admin/destinations" className="text-emerald-300 underline">
            Дестинации
          </a>
          .
        </p>
        <p className="text-[10px] text-white/35 mb-3">
          По-долу — само ако искаш ръчно да качиш .json файл
        </p>
        <button
          type="button"
          onClick={handleQuickAlbania}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Ръчно: Публикувай Albania
        </button>
      </div>

      {/* Quick Albania */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
          Как работи Travel Seed
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-white/45">
          <div>
            <p className="font-medium text-white/60 mb-1">1. Един файл = една държава</p>
            <p>Точно {COUNTRY_SEED_SPEC.citiesPerCountry} града × {COUNTRY_SEED_SPEC.placesPerCity} места + Adventure {ADVENTURE_SEED_SPEC.placesPerCountry} спирки / {ADVENTURE_SEED_SPEC.daysPerRoute} дни</p>
          </div>
          <div>
            <p className="font-medium text-white/60 mb-1">2. Минимален JSON</p>
            <p>Име + wiki_title + GPS + SEO ключове (по избор)</p>
          </div>
          <div>
            <p className="font-medium text-white/60 mb-1">3. Един клик → сайт</p>
            <p>Wikipedia добавя снимки и история → Supabase</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadAlbania}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/8 text-white/70 hover:bg-white/12 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Зареди Албания (10×10)
        </button>
        <button
          type="button"
          onClick={loadBulgaria}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/8 text-white/70 hover:bg-white/12 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Зареди България (10×10)
        </button>
        <button
          type="button"
          onClick={loadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/8 text-white/70 hover:bg-white/12 transition-colors"
        >
          <FileJson className="w-3.5 h-3.5" />
          Празен шаблон
        </button>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/8 text-white/70 hover:bg-white/12 transition-colors cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          Качи .json файл
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* JSON editor */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">
          Travel Seed JSON
        </label>
        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setPreview(null);
            setError(null);
            setSuccess(null);
          }}
          placeholder={'{\n  "version": 1,\n  "country": "Greece",\n  "cities": [...]\n}'}
          rows={18}
          className="w-full rounded-2xl border border-white/10 bg-[oklch(0.10_0.01_260)] text-white/80 text-xs font-mono p-4 resize-y focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.13_82)]/50"
        />
      </div>

      {/* Preview stats */}
      {preview && (
        <div className={`rounded-2xl border p-5 ${
          preview.isComplete
            ? "border-emerald-400/30 bg-emerald-400/5"
            : "border-amber-400/30 bg-amber-400/5"
        }`}>
          <p className={`text-sm font-semibold mb-1 ${
            preview.isComplete ? "text-emerald-300" : "text-amber-300"
          }`}>
            {preview.country}: {preview.cityCount}/{preview.expectedCities} града,{" "}
            {preview.placeCount}/{preview.expectedPlaces} места
            {preview.isComplete ? " ✓" : " — непълен файл"}
          </p>
          {!preview.isComplete && (
            <p className="text-xs text-amber-200/70 mb-3">
              Градове: {COUNTRY_SEED_SPEC.citiesPerCountry}×{COUNTRY_SEED_SPEC.placesPerCity} · Adventure: {ADVENTURE_SEED_SPEC.placesPerCountry} спирки / {ADVENTURE_SEED_SPEC.daysPerRoute} дни
            </p>
          )}
          {adventurePreview && (
            <p className={`text-xs mb-3 ${adventurePreview.isComplete ? "text-emerald-200/80" : "text-amber-200/80"}`}>
              Adventure: {adventurePreview.placeCount}/{adventurePreview.expectedPlaces} спирки, {adventurePreview.dayCount}/{adventurePreview.expectedDays} дни
              {adventurePreview.isComplete ? " ✓" : " ⚠"}
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {preview.cities.map((c) => (
              <div
                key={c.city}
                className={`flex items-center gap-2 text-xs ${
                  c.isComplete ? "text-white/50" : "text-amber-200/80"
                }`}
              >
                <MapPin className="w-3 h-3 text-white/30" />
                {c.city} — {c.places}/{COUNTRY_SEED_SPEC.placesPerCity}
                {c.isComplete ? "" : " ⚠"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-400/10 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 text-sm text-emerald-400 bg-emerald-400/10 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!json.trim() || isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white/60 hover:bg-white/6 disabled:opacity-40 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileJson className="w-4 h-4" />
          )}
          Преглед
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!json.trim() || isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Импортирай на сайта
        </button>
      </div>
    </div>
  );
}
