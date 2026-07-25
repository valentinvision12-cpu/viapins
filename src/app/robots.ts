import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const BASE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/embed/",
          "/*/my-passport",
          "/*/my-passport/",
          "/*/route",
          "/*/route/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/embed/",
          "/*/my-passport",
          "/*/my-passport/",
          "/*/route",
          "/*/route/",
        ],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin/", "/api/", "/embed/"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/embed/"],
      },
    ],
    // Next.js generateSitemaps() serves a functional sitemap index at /sitemap.xml
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
