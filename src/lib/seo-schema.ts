/**
 * Schema.org JSON-LD builders — validated structure for Google rich results.
 */

import type { PlaceTranslation } from "./seo";
import { buildPlaceSeo, getSiteUrl } from "./seo";
import { SITE_FULL_NAME, SITE_LOGO_PATH, SITE_NAME } from "./site-brand";

export interface SchemaPlace {
  name: string;
  lat?: number | null;
  lng?: number | null;
  image_url?: string | null;
  translations?: Record<string, PlaceTranslation>;
  seo_keywords?: string[];
  seo_phrase?: string;
}

export interface CitySchemaInput {
  city: string;
  country: string;
  locale: string;
  countrySlug: string;
  citySlug: string;
  heroImage?: string;
  description: string;
  intro: string;
  keywords: string[];
  places: SchemaPlace[];
}

function validCoord(value: number | null | undefined): number | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Number(value);
  if (n < -180 || n > 180) return undefined;
  return n;
}

function geoBlock(lat?: number, lng?: number) {
  if (lat == null || lng == null) return {};
  return { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } };
}

function imageBlock(url: string | null | undefined, name: string, description: string) {
  if (!url?.trim()) return {};
  return {
    image: {
      "@type": "ImageObject",
      url,
      name,
      description,
    },
  };
}

/** All city-page JSON-LD blocks in one @graph (Google-recommended) */
export function buildCityJsonLd(input: CitySchemaInput) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${input.locale}/explore/${input.countrySlug}/${input.citySlug}`;
  const homeUrl = `${siteUrl}/${input.locale}`;

  const attractions = input.places.map((p) => {
    const placeSeo = buildPlaceSeo({
      name: p.name,
      city: input.city,
      country: input.country,
      locale: input.locale,
      translations: p.translations,
      seo_keywords: p.seo_keywords,
      seo_phrase: p.seo_phrase,
    });
    const lat = validCoord(p.lat);
    const lng = validCoord(p.lng);

    return {
      "@type": "TouristAttraction",
      "@id": `${pageUrl}#${encodeURIComponent(p.name.toLowerCase().replace(/\s+/g, "-"))}`,
      name: p.name,
      description: placeSeo.schemaDescription,
      url: pageUrl,
      ...geoBlock(lat, lng),
      address: {
        "@type": "PostalAddress",
        addressLocality: input.city,
        addressCountry: input.country,
      },
      ...imageBlock(p.image_url, p.name, placeSeo.imageAlt),
      keywords: placeSeo.seoKeywords.join(", "),
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `Top Things to Do in ${input.city}, ${input.country}`,
        description: input.description,
        inLanguage: input.locale,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${pageUrl}#destination` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        primaryImageOfPage: input.heroImage
          ? { "@type": "ImageObject", url: input.heroImage }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: input.country,
            item: `${siteUrl}/${input.locale}/explore/${input.countrySlug}`,
          },
          { "@type": "ListItem", position: 3, name: input.city, item: pageUrl },
        ],
      },
      {
        "@type": "TouristDestination",
        "@id": `${pageUrl}#destination`,
        name: `${input.city}, ${input.country}`,
        description: input.intro,
        url: pageUrl,
        keywords: input.keywords.join(", "),
        ...imageBlock(
          input.heroImage,
          `${input.city}, ${input.country}`,
          `${input.city} travel guide`
        ),
        containedInPlace: { "@type": "Country", name: input.country },
        touristType: [
          "Cultural tourists",
          "City tourists",
          "History enthusiasts",
        ],
        includesAttraction: attractions.map((a) => ({ "@id": a["@id"] })),
      },
      ...attractions,
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: `Top ${input.places.length} Things to Do in ${input.city}, ${input.country}`,
        description: input.description,
        url: pageUrl,
        numberOfItems: input.places.length,
        itemListElement: input.places.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          item: {
            "@type": "TouristAttraction",
            name: p.name,
            ...geoBlock(validCoord(p.lat), validCoord(p.lng)),
            ...(p.image_url ? { image: p.image_url } : {}),
          },
        })),
      },
    ],
  };
}

export function buildHomeJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  const homeUrl = `${siteUrl}/${locale}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: SITE_NAME,
        url: siteUrl,
        description:
          "Curated travel guides with GPS-guided routes for top destinations worldwide.",
        inLanguage: ["en", "es", "fr", "de", "it"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${homeUrl}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}${SITE_LOGO_PATH}`,
        },
      },
      {
        "@type": "WebPage",
        "@id": homeUrl,
        url: homeUrl,
        name: `${SITE_FULL_NAME} — Travel Guides & GPS Routes`,
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}

export function buildCountryJsonLd(input: {
  country: string;
  locale: string;
  countrySlug: string;
  description: string;
  coverImage?: string;
  cities: { name: string; slug: string; coverImage?: string; placeCount: number }[];
}) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${input.locale}/explore/${input.countrySlug}`;
  const homeUrl = `${siteUrl}/${input.locale}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `Top Cities in ${input.country}`,
        description: input.description,
        inLanguage: input.locale,
        isPartOf: { "@id": `${siteUrl}/#website` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        primaryImageOfPage: input.coverImage
          ? { "@type": "ImageObject", url: input.coverImage }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
          { "@type": "ListItem", position: 2, name: input.country, item: pageUrl },
        ],
      },
      {
        "@type": "Country",
        "@id": `${pageUrl}#country`,
        name: input.country,
        url: pageUrl,
        ...imageBlock(input.coverImage, input.country, `${input.country} travel guide`),
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#cities`,
        name: `Top cities in ${input.country}`,
        numberOfItems: input.cities.length,
        itemListElement: input.cities.map((city, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: city.name,
          url: `${pageUrl}/${city.slug}`,
          item: {
            "@type": "TouristDestination",
            name: `${city.name}, ${input.country}`,
            url: `${pageUrl}/${city.slug}`,
            ...(city.coverImage ? { image: city.coverImage } : {}),
          },
        })),
      },
    ],
  };
}
