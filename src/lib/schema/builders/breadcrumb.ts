import type { JsonLdNode, SchemaBreadcrumbItem } from "../types";
import { buildBreadcrumbId, buildPageUrl, stripUndefined } from "../utils";

export function buildBreadcrumbNode(
  pageUrl: string,
  items: SchemaBreadcrumbItem[]
): JsonLdNode {
  return stripUndefined({
    "@type": "BreadcrumbList",
    "@id": buildBreadcrumbId(pageUrl),
    itemListElement: items.map((item, index) =>
      stripUndefined({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })
    ),
  }) as JsonLdNode;
}

export function getDefaultHomeBreadcrumbs(
  locale: string,
  siteUrl: string
): SchemaBreadcrumbItem[] {
  return [{ name: "Home", url: `${siteUrl}/${locale}` }];
}

export function getDefaultCountryBreadcrumbs(
  locale: string,
  siteUrl: string,
  country: string,
  countrySlug: string
): SchemaBreadcrumbItem[] {
  return [
    { name: "Home", url: `${siteUrl}/${locale}` },
    {
      name: country,
      url: buildPageUrl(locale, "explore", countrySlug),
    },
  ];
}

export function getDefaultCityBreadcrumbs(
  locale: string,
  siteUrl: string,
  country: string,
  countrySlug: string,
  city: string,
  citySlug: string
): SchemaBreadcrumbItem[] {
  return [
    { name: "Home", url: `${siteUrl}/${locale}` },
    {
      name: country,
      url: buildPageUrl(locale, "explore", countrySlug),
    },
    {
      name: city,
      url: buildPageUrl(locale, "explore", countrySlug, citySlug),
    },
  ];
}

export function getDefaultAttractionBreadcrumbs(
  locale: string,
  siteUrl: string,
  country: string,
  countrySlug: string,
  city: string,
  citySlug: string,
  placeName: string,
  placeUrl: string
): SchemaBreadcrumbItem[] {
  return [
    ...getDefaultCityBreadcrumbs(
      locale,
      siteUrl,
      country,
      countrySlug,
      city,
      citySlug
    ),
    { name: placeName, url: placeUrl },
  ];
}

export function getDefaultTripBreadcrumbs(
  locale: string,
  siteUrl: string,
  country: string,
  countrySlug: string,
  tripUrl: string
): SchemaBreadcrumbItem[] {
  return [
    { name: "Home", url: `${siteUrl}/${locale}` },
    {
      name: country,
      url: buildPageUrl(locale, "explore", countrySlug),
    },
    { name: "Adventure", url: tripUrl },
  ];
}
