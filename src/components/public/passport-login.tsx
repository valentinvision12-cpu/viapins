"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { Heart, Map, Stamp, Globe, Pin } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const PERKS = [
  { icon: Heart,  emoji: "❤️",  title: "Запазвай любими места",       desc: "Маркирай всяко място с едно докосване" },
  { icon: Map,    emoji: "🗺️",  title: "Изгради своя маршрут",        desc: "Наредби спирките и вземи GPX файл" },
  { icon: Stamp,  emoji: "✈️",  title: "Проследи пътуванията си",     desc: "Маркирай посетените маршрути" },
  { icon: Globe,  emoji: "🌍",  title: "Открий света по своя начин",  desc: "Над 2000 места в Европа и Азия" },
];

export function PassportLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=/en/my-passport`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (err) {
      setError("Нещо се обърка. Опитай отново.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-400/25 mb-6">
          <Pin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          Твоят личен пътеводител
        </h1>
        <p className="text-stone-500 text-base leading-relaxed max-w-sm mx-auto">
          Запазвай места, строй маршрути и проследявай всяко пътуване — всичко на едно място, безплатно.
        </p>
      </motion.div>

      {/* Perks grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md grid grid-cols-2 gap-3 mb-8"
      >
        {PERKS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="flex flex-col gap-2 p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors"
          >
            <span className="text-2xl">{p.emoji}</span>
            <p className="text-stone-800 font-semibold text-sm leading-snug">{p.title}</p>
            <p className="text-stone-400 text-xs leading-snug">{p.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="w-full max-w-md space-y-3"
      >
        <motion.button
          onClick={handleGoogle}
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-400 hover:shadow-md text-stone-800 font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <GoogleIcon />
          )}
          <span>{loading ? "Влизане..." : "Продължи с Google"}</span>
        </motion.button>

        {error && (
          <p className="text-red-500 text-sm text-center font-medium">{error}</p>
        )}

        <p className="text-center text-stone-400 text-xs">
          Безплатно · Без карта · Без спам · Изход по всяко време
        </p>
      </motion.div>
    </div>
  );
}