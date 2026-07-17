"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff, Loader2, CheckCircle2, Globe2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "saving" | "done">("idle");
  const [isPending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Supabase puts tokens in the URL hash — exchange them for a session
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Паролата трябва да е поне 8 символа.");
      return;
    }
    if (password !== confirm) {
      setError("Паролите не съвпадат.");
      return;
    }

    startTransition(async () => {
      setStep("saving");
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        setStep("idle");
      } else {
        setStep("done");
        setTimeout(() => router.push("/admin"), 2000);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(0.13_0.01_260)] p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[oklch(0.72_0.13_82)] flex items-center justify-center mb-4 shadow-lg">
            <Globe2 className="w-6 h-6 text-[oklch(0.12_0.008_260)]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Нова парола</h1>
          <p className="text-sm text-white/40">За Admin панела</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {step === "done" ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Паролата е зададена!</p>
              <p className="text-white/40 text-sm mt-1">Пренасочване към Admin...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin mx-auto mb-3" />
              <p className="text-white/40 text-sm">Зареждане...</p>
              <p className="text-white/20 text-xs mt-2">
                Ако се забави — копирай линка от имейла и смени порта на 3002
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Нова парола
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="минимум 8 символа"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm outline-none focus:border-[oklch(0.72_0.13_82)] transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Потвърди паролата
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="повтори паролата"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm outline-none focus:border-[oklch(0.72_0.13_82)] transition-all"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending || step === "saving"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] font-semibold text-sm hover:brightness-105 disabled:opacity-50 transition-all mt-2"
              >
                {step === "saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Запазване...</>
                ) : "Запази паролата"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
