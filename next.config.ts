import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline scripts + Mapbox
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://events.mapbox.com",
      // Styles: self + inline (Tailwind/Mapbox CSS) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
      // Fonts
      "font-src 'self' data: https://fonts.gstatic.com https://api.mapbox.com",
      // Images: self + data URIs + Wikimedia + Supabase + Mapbox + Picsum + FlagCDN + commons
      "img-src 'self' data: blob: https://*.supabase.co https://upload.wikimedia.org https://commons.wikimedia.org https://flagcdn.com https://api.mapbox.com https://picsum.photos https://*.unsplash.com",
      // Connect: API calls to Supabase + Mapbox
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com",
      // Workers for Mapbox GL
      "worker-src blob:",
      // Frames: only self (embed route)
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon.png" },
      // Bait path for ad-block probes (see adblock-detector.tsx)
      { source: "/ads/check", destination: "/api/ads/check" },
    ];
  },
  images: {
    // Only bypass optimization in development (corporate proxy SSL workaround)
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
