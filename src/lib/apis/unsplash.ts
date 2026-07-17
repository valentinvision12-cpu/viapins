// Plain server-side helper — NOT a Server Action, do NOT add "use server"

export interface PlacePhoto {
  url: string;
  thumbUrl: string;
  credit: string;
  creditLink: string;
}

/**
 * Fetches the main image for a Wikipedia article via the free Wikimedia API.
 * No API key required. Uses the wiki_title already provided by Claude.
 */
export async function fetchWikimediaImage(
  wikiTitle: string
): Promise<PlacePhoto | null> {
  if (!wikiTitle) return null;

  try {
    const encoded = encodeURIComponent(wikiTitle);
    const apiUrl =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encoded}&prop=pageimages&format=json&pithumbsize=1200&origin=*`;

    const response = await fetch(apiUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as Record<string, unknown>;
    const thumb = (page?.thumbnail as { source?: string; width?: number }) ?? null;
    if (!thumb?.source) return null;

    // Upgrade thumbnail to full-width image by increasing the px-size in the URL
    const fullUrl = thumb.source.replace(/\/\d+px-/, "/1280px-");

    return {
      url: fullUrl,
      thumbUrl: thumb.source,
      credit: "Wikimedia Commons",
      creditLink: `https://en.wikipedia.org/wiki/${encoded}`,
    };
  } catch {
    return null;
  }
}

/**
 * Deterministic placeholder via Picsum Photos (free, no auth).
 * Used when Wikimedia has no image for the article.
 */
export function getPlaceholderImageUrl(query: string): string {
  const seed = encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${seed}/1600/900`;
}
