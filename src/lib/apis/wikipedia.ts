"use server";

const CORE_LOCALES = ["en", "es", "fr", "de", "it"] as const;
type CoreLocale = (typeof CORE_LOCALES)[number];

export type WikiSummaries = Record<CoreLocale, string>;

interface WikiRestResponse {
  extract?: string;
  title?: string;
}

/**
 * Fetches the Wikipedia article summary for a given title in a specific language.
 * Returns empty string if the article is not found or the request fails.
 */
async function fetchSummary(title: string, lang: CoreLocale): Promise<string> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, "_"));
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 7 * 24 * 3600 }, // Cache for 7 days
    });

    if (!response.ok) return "";

    const data: WikiRestResponse = await response.json();
    return data.extract ?? "";
  } catch {
    return "";
  }
}

/**
 * Fetches Wikipedia summaries for all 5 core languages in parallel.
 * Gracefully falls back to English text if a language version isn't available.
 */
export async function fetchWikipediaSummaries(
  wikiTitle: string
): Promise<WikiSummaries> {
  const results = await Promise.allSettled(
    CORE_LOCALES.map((lang) => fetchSummary(wikiTitle, lang))
  );

  const summaries = {} as WikiSummaries;

  CORE_LOCALES.forEach((lang, i) => {
    const result = results[i];
    summaries[lang] = result.status === "fulfilled" ? result.value : "";
  });

  // Fall back to English text for any language that returned empty
  const englishFallback = summaries.en;
  CORE_LOCALES.forEach((lang) => {
    if (!summaries[lang] && englishFallback) {
      summaries[lang] = englishFallback;
    }
  });

  return summaries;
}
