"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Command, CornerDownLeft, MapPin, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { IMAGE_REFERRER_POLICY, IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { filterSearchResults } from "@/lib/search-index";
import { LUXURY } from "@/lib/luxury-palette";
import { CountryFlag } from "@/components/public/country-flag";
import { fallbackImageUrl } from "@/lib/fallback-image";
import type { SearchResultItem } from "@/actions/get-destinations";

type PaletteItem = Pick<
  SearchResultItem,
  "type" | "name" | "country" | "slug" | "subtitle" | "coverImage" | "flagUrl"
>;

declare global {
  interface WindowEventMap {
    "viapins:open-command-palette": CustomEvent<void>;
  }
}

export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("viapins:open-command-palette"));
}

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const tHome = useTranslations("home");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const loadedRef = useRef(false);

  const results = useMemo(() => {
    const filtered = filterSearchResults(items as SearchResultItem[], query);
    return filtered.slice(0, 20);
  }, [items, query]);

  const loadIndex = useCallback(async () => {
    if (loadedRef.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search-index");
      const data = (await res.json()) as { items?: PaletteItem[] };
      setItems(data.items ?? []);
      loadedRef.current = true;
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    void loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery("");
            setActiveIndex(0);
            return false;
          }
          void loadIndex();
          return true;
        });
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    function onOpenEvent() {
      openPalette();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("viapins:open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("viapins:open-command-palette", onOpenEvent);
    };
  }, [close, loadIndex, open, openPalette]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function hrefFor(item: PaletteItem) {
    return item.type === "country"
      ? `/explore/${item.slug.country}`
      : `/explore/${item.slug.country}/${item.slug.city}`;
  }

  function goTo(item: PaletteItem) {
    close();
    router.push(hrefFor(item));
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      goTo(results[activeIndex]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: "rgba(28, 22, 16, 0.55)", backdropFilter: "blur(16px)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl"
            style={{
              background: LUXURY.creamCard,
              borderColor: LUXURY.bronzeBorder,
              boxShadow: "0 30px 80px rgba(44,36,22,0.28)",
            }}
          >
            <div
              className="flex items-center gap-3 border-b px-5 py-4"
              style={{ borderColor: LUXURY.bronzeBorder }}
            >
              <Search className="h-5 w-5 shrink-0 text-[#D9472C]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={t("placeholder")}
                className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-stone-400"
                style={{ color: LUXURY.text }}
                aria-controls={listId}
                aria-autocomplete="list"
                role="combobox"
                aria-expanded
                aria-activedescendant={
                  results[activeIndex]
                    ? `${listId}-opt-${activeIndex}`
                    : undefined
                }
              />
              <kbd
                className="hidden items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] sm:inline-flex"
                style={{
                  borderColor: LUXURY.bronzeBorder,
                  color: LUXURY.textMuted,
                  background: LUXURY.section,
                }}
              >
                esc
              </kbd>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 transition-colors hover:bg-stone-100"
                aria-label={t("close")}
                style={{ color: LUXURY.textMuted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div id={listId} role="listbox" className="max-h-[min(52vh,420px)] overflow-y-auto p-2">
              {!query.trim() ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium" style={{ color: LUXURY.textSecondary }}>
                    {loading ? t("loading") : t("hint")}
                  </p>
                  {!loading && (
                    <p className="mt-1 text-xs" style={{ color: LUXURY.textMuted }}>
                      {t("hintSecondary")}
                    </p>
                  )}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-base font-medium mb-1" style={{ color: LUXURY.text }}>
                    {tHome("searchEmpty")}
                  </p>
                  <p className="text-xs" style={{ color: LUXURY.textMuted }}>
                    {t("emptyHint")}
                  </p>
                </div>
              ) : (
                results.map((item, index) => {
                  const active = index === activeIndex;
                  return (
                    <button
                      key={`${item.type}-${item.slug.country}-${item.slug.city ?? ""}`}
                      id={`${listId}-opt-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
                      style={{
                        background: active ? "rgba(217,71,44,0.08)" : "transparent",
                      }}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {item.type === "country" ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <CountryFlag country={item.name} size="md" />
                          </div>
                        ) : (
                          <Image
                            src={
                              item.coverImage ||
                              fallbackImageUrl(`${item.name}-${item.country}`, 160, 160)
                            }
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized={IMAGE_UNOPTIMIZED}
                            referrerPolicy={IMAGE_REFERRER_POLICY}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-semibold transition-colors"
                          style={{ color: active ? "#D9472C" : LUXURY.text }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="truncate text-xs inline-flex items-center gap-1"
                          style={{ color: LUXURY.textMuted }}
                        >
                          <MapPin className="h-3 w-3 shrink-0 text-amber-600/80" />
                          {item.type === "country"
                            ? tHome("searchTypeCountry")
                            : item.country}
                        </p>
                      </div>
                      {active && (
                        <CornerDownLeft
                          className="hidden h-3.5 w-3.5 shrink-0 sm:block"
                          style={{ color: LUXURY.textMuted }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div
              className="flex items-center justify-between border-t px-5 py-3 text-[11px]"
              style={{ borderColor: LUXURY.bronzeBorder, color: LUXURY.textMuted }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Command className="h-3 w-3" />
                {query.trim() ? t("escHint") : t("shortcutHint")}
              </span>
              <span>
                {query.trim()
                  ? t("resultsCount", { count: results.length })
                  : t("navigateHint")}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
