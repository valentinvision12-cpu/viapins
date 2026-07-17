"use client";

import { CORE_LOCALES, type CoreLocale } from "@/i18n/routing";

// In-memory cache to avoid duplicate API calls within a session
const translationCache = new Map<string, string>();

function cacheKey(text: string, targetLang: string): string {
  return `${targetLang}||${text}`;
}

/**
 * Translates a single string to the target language.
 * Returns the original text as fallback if translation fails.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = "en"
): Promise<string> {
  if (!text || targetLang === sourceLang) return text;

  const key = cacheKey(text, targetLang);
  if (translationCache.has(key)) return translationCache.get(key)!;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });

    if (!res.ok) return text;

    const { translatedText } = await res.json();
    translationCache.set(key, translatedText);
    return translatedText;
  } catch {
    return text;
  }
}

/**
 * Batch-translates multiple strings in a single API call.
 * Returns originals as fallback for any failed items.
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang = "en"
): Promise<string[]> {
  if (!texts.length || targetLang === sourceLang) return texts;

  const results: string[] = new Array(texts.length);
  const uncachedIndices: number[] = [];

  texts.forEach((text, i) => {
    const key = cacheKey(text, targetLang);
    if (translationCache.has(key)) {
      results[i] = translationCache.get(key)!;
    } else {
      uncachedIndices.push(i);
    }
  });

  if (uncachedIndices.length === 0) return results;

  const uncachedTexts = uncachedIndices.map((i) => texts[i]);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: uncachedTexts, targetLang, sourceLang }),
    });

    if (!res.ok) {
      uncachedIndices.forEach((i) => (results[i] = texts[i]));
      return results;
    }

    const { translatedText } = await res.json();
    const translated: string[] = Array.isArray(translatedText)
      ? translatedText
      : [translatedText];

    uncachedIndices.forEach((originalIdx, i) => {
      const value = translated[i] ?? texts[originalIdx];
      translationCache.set(cacheKey(texts[originalIdx], targetLang), value);
      results[originalIdx] = value;
    });
  } catch {
    uncachedIndices.forEach((i) => (results[i] = texts[i]));
  }

  return results;
}

/**
 * Returns true if the given locale code is one of the 5 core languages
 * that have native next-intl support.
 */
export function isCoreLocale(locale: string): locale is CoreLocale {
  return (CORE_LOCALES as readonly string[]).includes(locale);
}

/**
 * Resolves the best available text for a given locale from a JSONB
 * translations object (as stored in the `places.translations` column).
 * Falls back to English, then to the first available language.
 */
export function resolveTranslation(
  translations: Record<string, string> | null | undefined,
  locale: string
): string {
  if (!translations) return "";
  return (
    translations[locale] ??
    translations["en"] ??
    Object.values(translations)[0] ??
    ""
  );
}
