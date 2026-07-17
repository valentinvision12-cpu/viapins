/** Public site copy and place stories are always English. */
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

/** Landmark descriptions and history — always English Wikipedia copy. */
export function getPlaceContent(
  translations: Record<string, PlaceTranslation> | undefined,
  _uiLocale?: string
): PlaceTranslation {
  if (!translations) return {};
  return (
    translations[CONTENT_LOCALE] ??
    translations.en ??
    Object.values(translations)[0] ??
    {}
  );
}