"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { CORE_LOCALES, LOCALE_LABELS, type CoreLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "minimal";
  className?: string;
}

/** Persist locale so middleware / next visit prefer the user's choice. */
function persistLocale(code: CoreLocale) {
  document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;samesite=lax`;
  try {
    localStorage.setItem("viapins_locale", code);
  } catch {
    /* ignore */
  }
}

export function LanguageSwitcher({
  variant = "default",
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("language");
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = (CORE_LOCALES as readonly string[]).includes(locale)
    ? (locale as CoreLocale)
    : "en";
  const currentLabel = LOCALE_LABELS[current];

  function switchLocale(code: CoreLocale) {
    if (code === current) {
      setOpen(false);
      return;
    }
    setOpen(false);
    persistLocale(code);

    const bare = pathname && pathname !== "/" ? pathname : "";
    // Full navigation so every server component remounts with new messages
    startTransition(() => {
      window.location.assign(`/${code}${bare}`);
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
        className={cn(
          "flex items-center gap-1.5 rounded-full border transition-all text-sm font-semibold",
          variant === "default"
            ? "px-3 py-2 bg-white/15 border-white/25 text-white hover:bg-white/25 backdrop-blur-sm"
            : "px-3 py-1.5 bg-white border-stone-200 text-stone-800 hover:border-stone-300 hover:bg-stone-50 shadow-sm",
          isPending && "opacity-60 cursor-wait"
        )}
      >
        <span className="text-base leading-none" aria-hidden>
          {currentLabel.flag}
        </span>
        <span className="hidden sm:inline">{currentLabel.nativeLabel}</span>
        <span className="sm:hidden uppercase tracking-wide text-xs">
          {current}
        </span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform opacity-70", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("selectLanguage")}
          className={cn(
            "absolute z-[60] mt-2 w-56 rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden",
            "left-0 sm:left-auto sm:right-0"
          )}
        >
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            {t("coreLanguages")}
          </p>
          {CORE_LOCALES.map((code) => {
            const { flag, nativeLabel, label } = LOCALE_LABELS[code];
            const isActive = current === code;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                  isActive
                    ? "bg-amber-50 text-stone-900 font-semibold"
                    : "hover:bg-stone-50 text-stone-700"
                )}
              >
                <span className="text-base w-5 text-center">{flag}</span>
                <span className="flex-1">{nativeLabel}</span>
                <span className="text-xs text-stone-400">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
