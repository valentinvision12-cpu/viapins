/**
 * Next/Image `unoptimized` — only skip the optimizer in local/dev.
 * Production uses next.config remotePatterns + the Image Optimization API.
 */
export const IMAGE_UNOPTIMIZED = process.env.NODE_ENV !== "production";
