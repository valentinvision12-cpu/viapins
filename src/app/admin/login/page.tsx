"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/site-brand";
import { Globe2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "not_admin"
      ? "Този акаунт не е администратор. Влез с админ имейл."
      : null
  );
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // Clear non-admin session so the admin form can sign in cleanly.
  useEffect(() => {
    if (urlError !== "not_admin") return;
    void supabase.auth.signOut();
  }, [urlError, supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Невалиден имейл или парола."
            : "Възникна грешка. Моля, опитайте отново."
        );
        return;
      }

      const userId = signInData.user?.id;
      if (!userId) {
        setError("Влизането не успя. Опитай отново.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setError("Този акаунт не е администратор. Нужен е админ достъп.");
        return;
      }

      const safeDest = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
      router.push(safeDest);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(0.13_0.01_260)] p-4">
      {/* Background gradient */}
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.13 82 / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, oklch(0.22 0.07 250 / 0.3) 0%, transparent 60%)",
        }}
      />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[oklch(0.72_0.13_82)] flex items-center justify-center mb-4 shadow-lg shadow-[oklch(0.72_0.13_82)/0.3]">
            <Globe2 className="w-6 h-6 text-[oklch(0.12_0.008_260)]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Контролен Панел</h1>
          <p className="text-sm text-white/40">Достъп само за администратори</p>
        </div>

        {/* Form card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-white/60 uppercase tracking-wider"
              >
                Имейл адрес
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm outline-none focus:border-[oklch(0.72_0.13_82)] focus:bg-white/10 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-white/60 uppercase tracking-wider"
              >
                Парола
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm outline-none focus:border-[oklch(0.72_0.13_82)] focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] font-semibold text-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Влизане…
                </>
              ) : (
                "Влез в системата"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          {SITE_NAME} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[oklch(0.13_0.01_260)]">
          <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.72_0.13_82)]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
