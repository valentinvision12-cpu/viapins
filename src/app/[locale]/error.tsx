"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Home, RefreshCw } from "lucide-react";
import { SITE_NAME } from "@/lib/site-brand";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[PageError]", error);
    }
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center"
      style={{ background: LUXURY.creamDeep }}
    >
      <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-6 text-2xl">
        🗺️
      </div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Something went wrong</h1>
      <p className="text-stone-500 text-sm max-w-sm mb-8 leading-relaxed">
        We hit an unexpected error while loading this page. Your route and passport are safe.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to {SITE_NAME}
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-stone-300 text-[10px] font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
