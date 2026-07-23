import type { Metadata } from "next";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/site-brand";
import type { SchemaMetadataInput } from "./types";

function appendSiteName(title: string): string {
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

function ogLocale(locale: string): string {
  return locale === "en" ? "en_US" : locale;
}

export function buildSchemaMetadata(input: SchemaMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = input.path.startsWith("/")
    ? input.path
    : `/${input.path}`;
  const alternates = buildLocaleAlternates(normalizedPath);
  const bare =
    normalizedPath.replace(/^\/(en|es|fr|de|it|bg)(?=\/|$)/, "") || "/";
  const pageUrl = `${siteUrl}/${input.locale}${bare === "/" ? "" : bare}`;
  const ogImage = input.image || `${siteUrl}${SITE_LOGO_PATH}`;

  return {
    title: appendSiteName(input.title),
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: pageUrl,
      languages: alternates.languages,
    },
    openGraph: {
      title: appendSiteName(input.title),
      description: input.description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: input.ogType ?? "website",
      locale: ogLocale(input.locale),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: appendSiteName(input.title),
      description: input.description,
      images: [ogImage],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
