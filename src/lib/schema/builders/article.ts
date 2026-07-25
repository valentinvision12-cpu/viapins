import type { GuideSchemaData, JsonLdNode } from "../types";
import {
  buildAttractionPageUrl,
  buildCityPageUrl,
} from "./destination";
import {
  buildEntityId,
  buildImageObject,
  buildItemListId,
  buildOrganizationId,
  buildPageUrl,
  entityReference,
  getSchemaSiteUrl,
  stripUndefined,
} from "../utils";

export function buildGuidePageUrl(
  locale: string,
  countrySlug: string,
  citySlug: string,
  guideSlug: string
): string {
  return buildPageUrl(locale, "explore", countrySlug, citySlug, "guide", guideSlug);
}

export function buildGuideEntityNodes(
  data: GuideSchemaData,
  webpageId: string
): JsonLdNode[] {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = buildGuidePageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug,
    data.guideSlug
  );
  const entityId = buildEntityId(pageUrl);
  const itemListId = buildItemListId(pageUrl, "places");
  const orgId = buildOrganizationId(siteUrl);
  const cityPageUrl = buildCityPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug
  );
  const published = data.datePublished ?? data.dateModified ?? new Date().toISOString();
  const modified = data.dateModified ?? published;

  const itemList = stripUndefined({
    "@type": "ItemList",
    "@id": itemListId,
    name: data.title,
    numberOfItems: data.places.length,
    itemListElement: data.places.map((place, index) => {
      const placeUrl = buildAttractionPageUrl(
        data.locale,
        data.countrySlug,
        data.citySlug,
        place
      );
      return {
        "@type": "ListItem",
        position: index + 1,
        name: place.name,
        item: entityReference(buildEntityId(placeUrl)),
      };
    }),
  }) as JsonLdNode;

  const article = stripUndefined({
    "@type": "Article",
    "@id": entityId,
    headline: data.title,
    description: data.description,
    url: pageUrl,
    inLanguage: data.locale,
    datePublished: published,
    dateModified: modified,
    image: data.heroImage
      ? buildImageObject({ url: data.heroImage, caption: data.title })
      : undefined,
    author: { "@id": orgId },
    publisher: { "@id": orgId },
    mainEntity: { "@id": itemListId },
    mainEntityOfPage: { "@id": webpageId },
    about: {
      "@type": "City",
      name: data.city,
      url: cityPageUrl,
    },
  }) as JsonLdNode;

  return [article, itemList];
}
