/**
 * Deterministic picsum fallback when a place or destination has no image
 * (or a broken one). Allowed by CSP (picsum.photos).
 */
export function fallbackImageUrl(seed: string, width = 800, height = 560): string {
  const safe = encodeURIComponent(
    seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "travel"
  );
  return `https://picsum.photos/seed/${safe}/${width}/${height}`;
}
