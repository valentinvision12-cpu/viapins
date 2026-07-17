"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Link } from "@/i18n/navigation";
import { User, Briefcase, LogOut, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NavTripBadge } from "@/components/public/nav-trip-badge";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

interface UserNavProps {
  dark?: boolean;
}

export function UserNav({ dark = false }: UserNavProps) {
  const t = useTranslations("nav");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    if (!isConfigured) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
  }

  if (!user) {
    return (
      <Link
        href="/my-passport"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
          dark
            ? "border-white/15 text-white/60 hover:text-white hover:border-white/30"
            : "border-stone-200 text-stone-600 hover:text-stone-900 bg-stone-50 hover:border-stone-300"
        }`}
      >
        <User className="w-3.5 h-3.5" />
        {t("signIn")}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border transition-all ${
          dark
            ? "border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/8"
            : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white"
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-[oklch(0.72_0.13_82)] flex items-center justify-center text-[oklch(0.12_0.008_260)] text-[10px] font-bold">
          {getInitials(user.email ?? "?")}
        </div>
        <span className={`text-xs hidden sm:block max-w-24 truncate ${dark ? "text-white/70" : "text-stone-700"}`}>
          {user.email?.split("@")[0]}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${dark ? "text-white/40" : "text-stone-400"} ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-[oklch(0.14_0.06_252)]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-3 py-2.5 border-b border-white/8">
              <p className="text-white/40 text-[10px] truncate">{user.email}</p>
            </div>
            <Link
              href="/my-passport"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-white/70 hover:text-white hover:bg-white/6 text-sm transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              {t("myPassport")}
              <NavTripBadge dark />
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-white/40 hover:text-red-400 hover:bg-red-500/8 text-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("signOut")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
