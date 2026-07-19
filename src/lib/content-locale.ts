/** Fallback when a place has no translation for the active UI locale. */
export const CONTENT_LOCALE = "en" as const;

export type PlaceTranslation = {
  description?: string;
  wiki_text?: string;
  wiki_title?: string;
  maps_query?: string;
  maps_url?: string;
  seo_keywords?: string[];
  seo_phrase?: string;
};

/**
 * Landmark copy for the active UI locale.
 * Prefers translations[locale], then English, then any available locale.
 */
export function getPlaceContent(
  translations: Record<string, PlaceTranslation> | undefined,
  uiLocale?: string
): PlaceTranslation {
  if (!translations) return {};
  const locale = uiLocale?.trim() || CONTENT_LOCALE;
  return (
    translations[locale] ??
    translations[CONTENT_LOCALE] ??
    translations.en ??
    Object.values(translations)[0] ??
    {}
  );
}
