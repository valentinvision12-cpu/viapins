import { defineRouting } from "next-intl/routing";

export const CORE_LOCALES = ["en", "es", "fr", "de", "it"] as const;
export type CoreLocale = (typeof CORE_LOCALES)[number];

export const LOCALE_LABELS: Record<CoreLocale, { label: string; flag: string; nativeLabel: string }> = {
  en: { label: "English",  flag: "🇬🇧", nativeLabel: "English"   },
  es: { label: "Spanish",  flag: "🇪🇸", nativeLabel: "Español"   },
  fr: { label: "French",   flag: "🇫🇷", nativeLabel: "Français"  },
  de: { label: "German",   flag: "🇩🇪", nativeLabel: "Deutsch"   },
  it: { label: "Italian",  flag: "🇮🇹", nativeLabel: "Italiano"  },
};

export const routing = defineRouting({
  locales: [...CORE_LOCALES],
  defaultLocale: "en",
});
