/** Detect AI/template filler — never show as place history. */
export function isGenericDescription(text: string | undefined | null): boolean {
  if (!text?.trim()) return true;
  const t = text.trim();
  if (t.length < 20) return true;
  if (/^[\w\s-]+$/i.test(t) && t.split(/\s+/).length <= 2) return true;

  const patterns = [
    /real-world travel stop with clear local appeal/i,
    /is a standout stop in .+, known for/i,
    /is one of the most distinctive stops in/i,
    /mixing local character with a strong visitor appeal/i,
    /is a standout open-air location for travelers/i,
    /travel guide and visitor tips/i,
    /— [^,]+, [^:]+: travel guide/i,
    /^[\w\s,'-]+ in [\w\s,'-]+ is a real-world/i,
    /^(heritage|shopping|museum|viewpoint|landmark|nature|church|historic_site|culture|religious)$/i,
  ];
  return patterns.some((p) => p.test(t));
}

/** First 1–2 sentences for card preview. */
export function shortPlaceDescription(
  wikiExtract: string,
  fallback = ""
): string {
  if (!wikiExtract?.trim()) return fallback;
  const sentences = wikiExtract.match(/[^.!?]+[.!?]+/g);
  if (!sentences?.length) return wikiExtract.slice(0, 220).trim();
  return sentences.slice(0, 2).join(" ").trim();
}

/** Normalize broken seed wiki titles (e.g. "Ledra Street, Nicosia.jpg"). */
export function resolveWikiLookupTitle(
  wikiTitle: string | undefined,
  placeName: string,
  city?: string
): string {
  let title = (wikiTitle || placeName).trim();
  title = title.replace(/\.(jpg|jpeg|png|webp)$/i, "").trim();
  if (!title || title.length < 3) return placeName;
  if (city && title.toLowerCase() === city.toLowerCase()) return placeName;
  return title;
}
