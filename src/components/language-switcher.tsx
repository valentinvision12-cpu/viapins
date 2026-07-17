"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe, ChevronDown, Search, Zap } from "lucide-react";
import { CORE_LOCALES, LOCALE_LABELS, type CoreLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Extended list of languages for the auto-translate option
const EXTRA_LANGUAGES = [
  { code: "pt", label: "Português",    flag: "🇵🇹" },
  { code: "ru", label: "Русский",      flag: "🇷🇺" },
  { code: "zh", label: "中文",          flag: "🇨🇳" },
  { code: "ja", label: "日本語",        flag: "🇯🇵" },
  { code: "ko", label: "한국어",        flag: "🇰🇷" },
  { code: "ar", label: "العربية",      flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी",       flag: "🇮🇳" },
  { code: "tr", label: "Türkçe",       flag: "🇹🇷" },
  { code: "nl", label: "Nederlands",   flag: "🇳🇱" },
  { code: "pl", label: "Polski",       flag: "🇵🇱" },
  { code: "sv", label: "Svenska",      flag: "🇸🇪" },
  { code: "uk", label: "Українська",   flag: "🇺🇦" },
  { code: "bg", label: "Български",    flag: "🇧🇬" },
  { code: "cs", label: "Čeština",      flag: "🇨🇿" },
  { code: "ro", label: "Română",       flag: "🇷🇴" },
  { code: "hu", label: "Magyar",       flag: "🇭🇺" },
  { code: "el", label: "Ελληνικά",     flag: "🇬🇷" },
  { code: "da", label: "Dansk",        flag: "🇩🇰" },
  { code: "fi", label: "Suomi",        flag: "🇫🇮" },
  { code: "no", label: "Norsk",        flag: "🇳🇴" },
  { code: "he", label: "עברית",        flag: "🇮🇱" },
  { code: "th", label: "ภาษาไทย",      flag: "🇹🇭" },
  { code: "id", label: "Indonesia",    flag: "🇮🇩" },
  { code: "ms", label: "Melayu",       flag: "🇲🇾" },
  { code: "vi", label: "Tiếng Việt",   flag: "🇻🇳" },
];

interface LanguageSwitcherProps {
  /** Visual variant: 'default' for the public site header, 'minimal' for compact use */
  variant?: "default" | "minimal";
  className?: string;
}

export function LanguageSwitcher({
  variant = "default",
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [autoTranslatingCode, setAutoTranslatingCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const currentLocale = CORE_LOCALES.includes(locale as CoreLocale)
    ? (locale as CoreLocale)
    : null;

  const currentLabel = currentLocale
    ? LOCALE_LABELS[currentLocale]
    : { flag: "🌐", nativeLabel: locale.toUpperCase() };

  function handleCoreLocaleSelect(code: CoreLocale) {
    setOpen(false);
    setQuery("");
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  async function handleExtraLocaleSelect(code: string, label: string) {
    setOpen(false);
    setQuery("");
    setAutoTranslatingCode(code);

    // Store the active extra locale in sessionStorage so the translation
    // hook (Module 3) can pick it up without routing to a new URL
    sessionStorage.setItem("autoLocale", code);
    sessionStorage.setItem("autoLocaleLabel", label);

    // Dispatch a custom event so any mounted listener can react immediately
    window.dispatchEvent(
      new CustomEvent("autoLocaleChange", { detail: { code, label } })
    );

    // Short visual feedback
    setTimeout(() => setAutoTranslatingCode(null), 1500);
  }

  // Filter logic
  const lowerQuery = query.toLowerCase();
  const filteredCore = CORE_LOCALES.filter((code) => {
    const { label, nativeLabel } = LOCALE_LABELS[code];
    return (
      !lowerQuery ||
      label.toLowerCase().includes(lowerQuery) ||
      nativeLabel.toLowerCase().includes(lowerQuery)
    );
  });
  const filteredExtra = EXTRA_LANGUAGES.filter(
    ({ label, code }) =>
      !lowerQuery ||
      label.toLowerCase().includes(lowerQuery) ||
      code.toLowerCase().includes(lowerQuery)
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border transition-all",
          variant === "default"
            ? "px-4 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm text-sm font-medium"
            : "px-3 py-1.5 bg-card border-border text-foreground hover:bg-secondary text-sm",
          isPending && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className="text-base leading-none">{currentLabel.flag}</span>
        <span>{currentLabel.nativeLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden",
            variant === "default" ? "right-0" : "left-0"
          )}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {/* Core languages — native next-intl routing */}
            {filteredCore.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("coreLanguages")}
                </p>
                {filteredCore.map((code) => {
                  const { flag, nativeLabel, label } = LOCALE_LABELS[code];
                  const isActive = locale === code;
                  return (
                    <button
                      key={code}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleCoreLocaleSelect(code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left",
                        isActive
                          ? "bg-primary/8 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="text-base w-5 text-center">{flag}</span>
                      <span className="flex-1">{nativeLabel}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Extra languages — auto-translation via API */}
            {filteredExtra.length > 0 && (
              <div>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t("moreLanguages")} — {t("autoTranslated")}
                </p>
                {filteredExtra.map(({ code, label, flag }) => {
                  const isTranslating = autoTranslatingCode === code;
                  return (
                    <button
                      key={code}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleExtraLocaleSelect(code, label)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-base w-5 text-center">{flag}</span>
                      <span className="flex-1 text-foreground">{label}</span>
                      {isTranslating ? (
                        <span className="text-xs text-gold animate-pulse">
                          {t("autoTranslating")}
                        </span>
                      ) : (
                        <Zap className="w-3 h-3 text-muted-foreground/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredCore.length === 0 && filteredExtra.length === 0 && (
              <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                No languages found for &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
