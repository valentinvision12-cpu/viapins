const HTML_TAG_RE = /<[^>]+>/g;
const WORD_RE = /[\p{L}\p{N}]+/gu;

/** Strip HTML/tags and collapse whitespace before counting. */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(HTML_TAG_RE, " ").replace(/\s+/g, " ").trim();
}

/** Count words in plain or lightly marked-up text. */
export function countWords(text: string | null | undefined): number {
  const plain = stripHtml(text);
  if (!plain) return 0;
  const matches = plain.match(WORD_RE);
  return matches?.length ?? 0;
}

/**
 * Thin content heuristic for crawl triage.
 * Default threshold: fewer than 100 words.
 */
export function isThinContent(
  text: string | null | undefined,
  minWords = 100
): boolean {
  return countWords(text) < minWords;
}

/**
 * Combine place description + wiki_text for quality checks.
 * Prefers English/default locale text when a translations map is provided.
 */
export function placeTextForQuality(input: {
  description?: string | null;
  wiki_text?: string | null;
  translations?: Record<
    string,
    { description?: string; wiki_text?: string } | undefined
  > | null;
  locale?: string;
}): string {
  const locale = input.locale?.trim() || "en";
  const fromLocale = input.translations?.[locale];
  const fromEn = input.translations?.en;
  const description =
    input.description ||
    fromLocale?.description ||
    fromEn?.description ||
    "";
  const wiki =
    input.wiki_text || fromLocale?.wiki_text || fromEn?.wiki_text || "";
  return [description, wiki].filter(Boolean).join(" ");
}

export function isThinPlaceContent(
  input: {
    description?: string | null;
    wiki_text?: string | null;
    translations?: Record<
      string,
      { description?: string; wiki_text?: string } | undefined
    > | null;
    locale?: string;
  },
  minWords = 100
): boolean {
  return isThinContent(placeTextForQuality(input), minWords);
}
