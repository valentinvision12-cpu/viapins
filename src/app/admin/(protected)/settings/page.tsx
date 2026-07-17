"use client";

import { useState, useTransition } from "react";
import {
  Settings,
  Globe2,
  Share2,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import { updateSettingsAction } from "@/actions/update-settings";
import { saveSupabaseKeys } from "@/app/setup/actions";

export const dynamic = "force-dynamic";

const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourprofile" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/yourhandle" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
] as const;

export default function SettingsPage() {
  const [heroTitles, setHeroTitles] = useState<Record<string, string>>({
    en: "Your Journey Begins Here",
    es: "Tu Aventura Comienza Aquí",
    fr: "Votre Aventure Commence Ici",
    de: "Ihr Abenteuer Beginnt Hier",
    it: "Il Tuo Viaggio Inizia Qui",
  });

  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Supabase keys state
  const [sbUrl, setSbUrl] = useState(
    typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  );
  const [sbAnon, setSbAnon] = useState("");
  const [sbService, setSbService] = useState("");
  const [showAnon, setShowAnon] = useState(false);
  const [showService, setShowService] = useState(false);
  const [sbState, setSbState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [sbError, setSbError] = useState("");

  function handleSaveSupabase() {
    setSbState("saving");
    setSbError("");
    const fd = new FormData();
    fd.append("url", sbUrl);
    fd.append("anon", sbAnon);
    fd.append("service", sbService);
    startTransition(async () => {
      const r = await saveSupabaseKeys(fd);
      if (r.success) {
        setSbState("saved");
        setTimeout(() => setSbState("idle"), 4000);
      } else {
        setSbState("error");
        setSbError(r.error ?? "Грешка");
      }
    });
  }

  function handleSave() {
    setSaveState("saving");
    setErrorMsg("");

    startTransition(async () => {
      try {
        await updateSettingsAction({
          hero_titles: heroTitles,
          social_links: socialLinks,
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 3000);
      } catch (err) {
        setSaveState("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Грешка при записване."
        );
      }
    });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <Settings className="w-5 h-5 text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">Настройки на сайта</h1>
      </div>

      <div className="space-y-8">
        {/* ── Hero Titles ──────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe2 className="w-4.5 h-4.5 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Hero Заглавия (5 езика)
            </h2>
          </div>
          <div className="space-y-3">
            {LOCALES.map(({ code, label, flag }) => (
              <div key={code} className="flex items-center gap-3">
                <div className="w-28 flex items-center gap-2 flex-shrink-0">
                  <span className="text-base">{flag}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {label}
                  </span>
                </div>
                <input
                  type="text"
                  value={heroTitles[code] ?? ""}
                  onChange={(e) =>
                    setHeroTitles((prev) => ({
                      ...prev,
                      [code]: e.target.value,
                    }))
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Social Links ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Share2 className="w-4.5 h-4.5 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Социални мрежи
            </h2>
          </div>
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-xs font-medium text-gray-500 flex-shrink-0">
                  {label}
                </span>
                <input
                  type="url"
                  value={socialLinks[key] ?? ""}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Supabase Keys ────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-700">Supabase конфигурация</h2>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              supabase.com/dashboard ↗
            </a>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Settings → API → копирай стойностите тук. След запазване <strong>рестартирай сървъра</strong>.
          </p>

          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Project URL
              </label>
              <input
                type="url"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Anon key */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                anon public key
              </label>
              <div className="relative">
                <input
                  type={showAnon ? "text" : "password"}
                  value={sbAnon}
                  onChange={(e) => setSbAnon(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowAnon((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showAnon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Service role */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                service_role key <span className="text-orange-500">(секретен — не го споделяй!)</span>
              </label>
              <div className="relative">
                <input
                  type={showService ? "text" : "password"}
                  value={sbService}
                  onChange={(e) => setSbService(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowService((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showService ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {sbState === "saved" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Записано! Рестартирай сървъра за да влязат в сила.
            </div>
          )}
          {sbState === "error" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> {sbError}
            </div>
          )}

          <button
            onClick={handleSaveSupabase}
            disabled={isPending || !sbUrl || !sbAnon || !sbService}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all"
          >
            {sbState === "saving" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : sbState === "saved" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Запази Supabase ключовете
          </button>
        </section>

        {/* ── Save button ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {saveState === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          {saveState === "saved" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Записано успешно!
            </div>
          )}
          {saveState === "idle" && <div />}
          {saveState === "saving" && <div />}

          <button
            onClick={handleSave}
            disabled={isPending || saveState === "saving"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {saveState === "saving" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Запази промените
          </button>
        </div>
      </div>
    </div>
  );
}
