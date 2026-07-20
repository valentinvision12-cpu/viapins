/**
 * Always skip Next Image Optimization for remote travel photos.
 * Wikimedia / Commons often block Vercel's `/_next/image` fetcher (403),
 * which shows broken icons and wrong Unsplash fallbacks on production.
 */
export const IMAGE_UNOPTIMIZED = true;

/** Prefer this on all remote <Image> tags that load wiki/unsplash/supabase. */
export const IMAGE_REFERRER_POLICY = "no-referrer" as const;
