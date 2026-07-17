"use client";

import { useState, useTransition } from "react";
import { saveSupabaseKeys } from "./actions";

export default function SetupPage() {
  const [url, setUrl] = useState("");
  const [anon, setAnon] = useState("");
  const [service, setService] = useState("");
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("url", url);
    fd.append("anon", anon);
    fd.append("service", service);

    startTransition(async () => {
      const r = await saveSupabaseKeys(fd);
      setResult(r);
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-amber-50/30">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔑</span>
            <h1 className="text-stone-900 font-bold text-xl">Supabase Setup</h1>
          </div>
          <p className="text-stone-400 text-sm">
            Постави ключовете от{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:underline font-medium"
            >
              supabase.com/dashboard
            </a>
            {" "}→ Settings → API
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

          {/* URL */}
          <div>
            <label className="block text-stone-700 text-sm font-semibold mb-1.5">
              Project URL
            </label>
            <p className="text-stone-400 text-xs mb-2">Полето "Project URL" в Settings → API</p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://abcdefghijkl.supabase.co"
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder-stone-300"
            />
          </div>

          {/* Anon key */}
          <div>
            <label className="block text-stone-700 text-sm font-semibold mb-1.5">
              anon public key
            </label>
            <p className="text-stone-400 text-xs mb-2">Под "Project API Keys" — първият ключ</p>
            <textarea
              value={anon}
              onChange={(e) => setAnon(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-xs font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder-stone-300 resize-none"
            />
          </div>

          {/* Service role */}
          <div>
            <label className="block text-stone-700 text-sm font-semibold mb-1.5">
              service_role key
            </label>
            <p className="text-stone-400 text-xs mb-2">
              Под "Project API Keys" — натисни <strong>Reveal</strong> за да го видиш
            </p>
            <textarea
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-xs font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder-stone-300 resize-none"
            />
          </div>

          {/* Result */}
          {result?.success && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="text-emerald-800 font-semibold text-sm">Ключовете са записани!</p>
                <p className="text-emerald-600 text-xs mt-1">
                  Сега <strong>рестартирай dev сървъра</strong> — затвори терминала и пусни отново{" "}
                  <code className="bg-emerald-100 px-1 rounded">npm run dev</code>
                </p>
                <p className="text-emerald-600 text-xs mt-2">
                  След рестарт — не забравяй да изпълниш{" "}
                  <code className="bg-emerald-100 px-1 rounded">SETUP_ALL_IN_ONE.sql</code>{" "}
                  в Supabase SQL Editor.
                </p>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <span className="text-xl">❌</span>
              <p className="text-red-700 text-sm">{result.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || result?.success}
            className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Записвам..." : result?.success ? "✓ Записано" : "Запази ключовете"}
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-8 pb-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-blue-800 text-xs font-semibold mb-2">📋 Следващи стъпки след записване:</p>
            <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
              <li>Рестартирай dev сървъра</li>
              <li>В Supabase → SQL Editor → постави <code className="bg-blue-100 px-1 rounded">SETUP_ALL_IN_ONE.sql</code> → Run</li>
              <li>Провери <a href="/admin" className="underline font-medium">Admin панела</a></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
