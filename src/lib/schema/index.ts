import { SITE_FULL_NAME } from "@/lib/site-brand";
import type {
  AttractionSchemaData,
  CitySchemaData,
  CountrySchemaData,
  HomeSchemaData,
  JsonLdNode,
  SchemaEngineResult,
  SchemaPageType,
  TripSchemaData,
  ViaPinsSchemaInput,
} from "./types";
import { buildGlobalEntityNodes } from "./builders/organization";
import {
  buildBreadcrumbNode,
  getDefaultAttractionBreadcrumbs,
  getDefaultCityBreadcrumbs,
  getDefaultCountryBreadcrumbs,
  getDefaultHomeBreadcrumbs,
  getDefaultTripBreadcrumbs,
} from "./builders/breadcrumb";
import { buildFaqNode } from "./builders/faq";
import { buildAttractionEntityNode } from "./builders/attraction";
import {
  buildAttractionPageUrl,
  buildCityEntityNodes,
  buildCityPageUrl,
  buildCountryEntityNodes,
  buildCountryPageUrl,
} from "./builders/destination";
import { buildTripEntityNodes, buildTripPageUrl } from "./builders/trip";
import { buildSchemaMetadata } from "./metadata";
import {
  buildEntityId,
  buildOrganizationId,
  buildWebpageId,
  buildWebsiteId,
  createGraph,
  getSchemaSiteUrl,
  stripUndefined,
} from "./utils";

function buildWebPageNode(input: {
  pageUrl: string;
  webpageId: string;
  entityId: string;
  websiteId: string;
  orgId: string;
  name: string;
  description?: string;
  locale: string;
  breadcrumbId: string;
  faqId?: string;
  heroImage?: string;
  pageTypes: JsonLdNode["@type"];
}): JsonLdNode {
  return stripUndefined({
    "@type": input.pageTypes,
    "@id": input.webpageId,
    url: input.pageUrl,
    name: input.name,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { "@id": input.websiteId },
    publisher: { "@id": input.orgId },
    about: { "@id": input.entityId },
    mainEntity: { "@id": input.entityId },
    breadcrumb: { "@id": input.breadcrumbId },
    primaryImageOfPage: input.heroImage
      ? { "@type": "ImageObject", url: input.heroImage }
      : undefined,
    hasPart: input.faqId ? [{ "@id": input.faqId }] : undefined,
  }) as JsonLdNode;
}

function buildHomeSchema(data: HomeSchemaData): SchemaEngineResult {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = `${siteUrl}/${data.locale}`;
  const webpageId = buildWebpageId(pageUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const orgId = buildOrganizationId(siteUrl);

  const globalNodes = buildGlobalEntityNodes({ locale: data.locale, siteUrl });
  const breadcrumbs = getDefaultHomeBreadcrumbs(data.locale, siteUrl);
  const breadcrumbNode = buildBreadcrumbNode(pageUrl, breadcrumbs);

  const webpage = buildWebPageNode({
    pageUrl,
    webpageId,
    entityId: websiteId,
    websiteId,
    orgId,
    name: data.title ?? `${SITE_FULL_NAME} — Travel Guides & GPS Routes`,
    description:
      data.description ??
      "Curated travel guides with GPS-guided routes for top destinations worldwide.",
    locale: data.locale,
    breadcrumbId: breadcrumbNode["@id"] as string,
    pageTypes: "WebPage",
  });

  return {
    jsonLd: createGraph([...globalNodes, breadcrumbNode, webpage]),
    canonicalUrl: pageUrl,
    webpageId,
    entityId: websiteId,
  };
}

function buildCountrySchema(data: CountrySchemaData): SchemaEngineResult {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = buildCountryPageUrl(data.locale, data.countrySlug);
  const webpageId = buildWebpageId(pageUrl);
  const entityId = buildEntityId(pageUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const orgId = buildOrganizationId(siteUrl);

  const globalNodes = buildGlobalEntityNodes({ locale: data.locale, siteUrl });
  const entityNodes = buildCountryEntityNodes(data);
  const breadcrumbs =
    data.breadcrumbs ??
    getDefaultCountryBreadcrumbs(
      data.locale,
      siteUrl,
      data.country,
      data.countrySlug
    );
  const breadcrumbNode = buildBreadcrumbNode(pageUrl, breadcrumbs);
  const faqNode = data.faqs?.length
    ? buildFaqNode(pageUrl, data.faqs, data.locale)
    : undefined;

  entityNodes[0].mainEntityOfPage = { "@id": webpageId };

  const webpage = buildWebPageNode({
    pageUrl,
    webpageId,
    entityId,
    websiteId,
    orgId,
    name: data.title ?? `Top Cities in ${data.country}`,
    description: data.description,
    locale: data.locale,
    breadcrumbId: breadcrumbNode["@id"] as string,
    faqId: faqNode?.["@id"] as string | undefined,
    heroImage: data.coverImage,
    pageTypes: ["WebPage", "CollectionPage"],
  });

  const nodes: JsonLdNode[] = [
    ...globalNodes,
    ...entityNodes,
    breadcrumbNode,
    webpage,
  ];
  if (faqNode) nodes.push(faqNode);

  return {
    jsonLd: createGraph(nodes),
    canonicalUrl: pageUrl,
    webpageId,
    entityId,
  };
}

function buildCitySchema(data: CitySchemaData): SchemaEngineResult {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = buildCityPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug
  );
  const webpageId = buildWebpageId(pageUrl);
  const entityId = buildEntityId(pageUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const orgId = buildOrganizationId(siteUrl);

  const globalNodes = buildGlobalEntityNodes({ locale: data.locale, siteUrl });
  const entityNodes = buildCityEntityNodes(data);
  const breadcrumbs =
    data.breadcrumbs ??
    getDefaultCityBreadcrumbs(
      data.locale,
      siteUrl,
      data.country,
      data.countrySlug,
      data.city,
      data.citySlug
    );
  const breadcrumbNode = buildBreadcrumbNode(pageUrl, breadcrumbs);
  const faqNode = data.faqs?.length
    ? buildFaqNode(pageUrl, data.faqs, data.locale)
    : undefined;

  entityNodes[0].mainEntityOfPage = { "@id": webpageId };

  const webpage = buildWebPageNode({
    pageUrl,
    webpageId,
    entityId,
    websiteId,
    orgId,
    name:
      data.title ??
      `Top Things to Do in ${data.city}, ${data.country}`,
    description: data.description,
    locale: data.locale,
    breadcrumbId: breadcrumbNode["@id"] as string,
    faqId: faqNode?.["@id"] as string | undefined,
    heroImage: data.heroImage,
    pageTypes: ["WebPage", "CollectionPage"],
  });

  const nodes: JsonLdNode[] = [
    ...globalNodes,
    ...entityNodes,
    breadcrumbNode,
    webpage,
  ];
  if (faqNode) nodes.push(faqNode);

  return {
    jsonLd: createGraph(nodes),
    canonicalUrl: pageUrl,
    webpageId,
    entityId,
  };
}

function buildAttractionSchema(data: AttractionSchemaData): SchemaEngineResult {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = buildAttractionPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug,
    { name: data.place.name, id: data.place.id, slug: data.placeSlug }
  );
  const webpageId = buildWebpageId(pageUrl);
  const entityId = buildEntityId(pageUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const orgId = buildOrganizationId(siteUrl);

  const globalNodes = buildGlobalEntityNodes({ locale: data.locale, siteUrl });
  const { entity, extraNodes } = buildAttractionEntityNode(data, webpageId);
  const breadcrumbs =
    data.breadcrumbs ??
    getDefaultAttractionBreadcrumbs(
      data.locale,
      siteUrl,
      data.country,
      data.countrySlug,
      data.city,
      data.citySlug,
      data.place.name,
      pageUrl
    );
  const breadcrumbNode = buildBreadcrumbNode(pageUrl, breadcrumbs);
  const faqNode = data.faqs?.length
    ? buildFaqNode(pageUrl, data.faqs, data.locale)
    : undefined;

  const webpage = buildWebPageNode({
    pageUrl,
    webpageId,
    entityId,
    websiteId,
    orgId,
    name:
      data.title ??
      `${data.place.name} — ${data.city}, ${data.country}`,
    description: data.description,
    locale: data.locale,
    breadcrumbId: breadcrumbNode["@id"] as string,
    faqId: faqNode?.["@id"] as string | undefined,
    heroImage: data.heroImage,
    pageTypes: "WebPage",
  });

  const nodes: JsonLdNode[] = [
    ...globalNodes,
    entity,
    ...extraNodes,
    breadcrumbNode,
    webpage,
  ];
  if (faqNode) nodes.push(faqNode);

  return {
    jsonLd: createGraph(nodes),
    canonicalUrl: pageUrl,
    webpageId,
    entityId,
  };
}

function buildTripSchema(data: TripSchemaData): SchemaEngineResult {
  const siteUrl = getSchemaSiteUrl();
  const pageUrl = buildTripPageUrl(data.locale, data.countrySlug);
  const webpageId = buildWebpageId(pageUrl);
  const entityId = buildEntityId(pageUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const orgId = buildOrganizationId(siteUrl);

  const globalNodes = buildGlobalEntityNodes({ locale: data.locale, siteUrl });
  const entityNodes = buildTripEntityNodes(data, webpageId);
  const breadcrumbs =
    data.breadcrumbs ??
    getDefaultTripBreadcrumbs(
      data.locale,
      siteUrl,
      data.country,
      data.countrySlug,
      pageUrl
    );
  const breadcrumbNode = buildBreadcrumbNode(pageUrl, breadcrumbs);
  const faqNode = data.faqs?.length
    ? buildFaqNode(pageUrl, data.faqs, data.locale)
    : undefined;

  const webpage = buildWebPageNode({
    pageUrl,
    webpageId,
    entityId,
    websiteId,
    orgId,
    name: data.title,
    description: data.description,
    locale: data.locale,
    breadcrumbId: breadcrumbNode["@id"] as string,
    faqId: faqNode?.["@id"] as string | undefined,
    heroImage: data.heroImage,
    pageTypes: "WebPage",
  });

  const nodes: JsonLdNode[] = [
    ...globalNodes,
    ...entityNodes,
    breadcrumbNode,
    webpage,
  ];
  if (faqNode) nodes.push(faqNode);

  return {
    jsonLd: createGraph(nodes),
    canonicalUrl: pageUrl,
    webpageId,
    entityId,
  };
}

export function generateSchema(
  pageType: "home",
  data: HomeSchemaData
): SchemaEngineResult;
export function generateSchema(
  pageType: "country",
  data: CountrySchemaData
): SchemaEngineResult;
export function generateSchema(
  pageType: "city",
  data: CitySchemaData
): SchemaEngineResult;
export function generateSchema(
  pageType: "attraction",
  data: AttractionSchemaData
): SchemaEngineResult;
export function generateSchema(
  pageType: "trip",
  data: TripSchemaData
): SchemaEngineResult;
export function generateSchema(
  pageType: SchemaPageType,
  data: ViaPinsSchemaInput
): SchemaEngineResult;
export function generateSchema(
  pageType: SchemaPageType,
  data: ViaPinsSchemaInput
): SchemaEngineResult {
  switch (pageType) {
    case "home":
      return buildHomeSchema(data as HomeSchemaData);
    case "country":
      return buildCountrySchema(data as CountrySchemaData);
    case "city":
      return buildCitySchema(data as CitySchemaData);
    case "attraction":
      return buildAttractionSchema(data as AttractionSchemaData);
    case "trip":
      return buildTripSchema(data as TripSchemaData);
    default: {
      const _exhaustive: never = pageType;
      throw new Error(`Unsupported schema page type: ${_exhaustive}`);
    }
  }
}

export function buildPageSeo(input: {
  pageType: SchemaPageType;
  data: ViaPinsSchemaInput;
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  ogType?: "website" | "article";
  noIndex?: boolean;
}) {
  const result = (generateSchema as (pageType: SchemaPageType, data: ViaPinsSchemaInput) => SchemaEngineResult)(input.pageType, input.data);
  const metadata = buildSchemaMetadata({
    title: input.title,
    description: input.description,
    path: input.path,
    locale: "locale" in input.data ? input.data.locale : "en",
    image: input.image,
    keywords: input.keywords,
    ogType: input.ogType,
    noIndex: input.noIndex,
  });

  return {
    metadata,
    jsonLd: result.jsonLd,
    canonicalUrl: result.canonicalUrl,
  };
}

export { REVIEW_THRESHOLD } from "./types";
export type {
  AttractionEntity,
  AttractionSchemaData,
  CitySchemaData,
  CountrySchemaData,
  HomeSchemaData,
  ItineraryStop,
  JsonLdGraph,
  JsonLdNode,
  SchemaEngineResult,
  SchemaFaqItem,
  SchemaMetadataInput,
  SchemaPageType,
  TripSchemaData,
  ViaPinsSchemaInput,
} from "./types";
export { resolveAttractionTypes } from "./registry";
export { buildSchemaMetadata } from "./metadata";
export { JsonLd, toJsonLdScript } from "./JsonLd";
export {
  buildAdventureFaqs,
  buildCityFaqs,
  buildCountryFaqs,
} from "./faqs";
