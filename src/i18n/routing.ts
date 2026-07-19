import { defineRouting } from "next-intl/routing";

export const CORE_LOCALES = ["en", "bg", "es", "fr", "de", "it"] as const;
export type CoreLocale = (typeof CORE_LOCALES)[number];

export const LOCALE_LABELS: Record<CoreLocale, { label: string; flag: string; nativeLabel: string }> = {
  en: { label: "English",   flag: "🇬🇧", nativeLabel: "English"    },
  bg: { label: "Bulgarian", flag: "🇧🇬", nativeLabel: "Български" },
  es: { label: "Spanish",   flag: "🇪🇸", nativeLabel: "Español"    },
  fr: { label: "French",    flag: "🇫🇷", nativeLabel: "Français"   },
  de: { label: "German",    flag: "🇩🇪", nativeLabel: "Deutsch"    },
  it: { label: "Italian",   flag: "🇮🇹", nativeLabel: "Italiano"   },
};

export const routing = defineRouting({
  locales: [...CORE_LOCALES],
  defaultLocale: "en",
});

export function getLocaleFromPath(pathname: string): CoreLocale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (CORE_LOCALES as readonly string[]).includes(seg) ? (seg as CoreLocale) : "en";
}

/** OAuth return URL — preserves current locale in the redirect path */
export function buildOAuthRedirectTo(path = "/my-passport", locale: string = "en"): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "");

  const safeLocale = (CORE_LOCALES as readonly string[]).includes(locale)
    ? locale
    : "en";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const hasLocale = CORE_LOCALES.some(
    (l) => normalized === `/${l}` || normalized.startsWith(`/${l}/`)
  );
  const next = hasLocale ? normalized : `/${safeLocale}${normalized}`;

  return `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Keeps Google refresh tokens; omit prompt so returning users stay signed in */
export const OAUTH_PERSIST_QUERY = { access_type: "offline" as const };
