import { buildPlaceSeo } from "@/lib/seo";
import type { AttractionSchemaData, JsonLdNode } from "../types";
import {
  resolveAttractionTypes,
  resolveEntityCategory,
  resolveEntityImage,
} from "../registry";
import {
  buildAggregateRatingNode,
  buildReviewNodes,
  computeAggregateRating,
} from "./review";
import {
  buildEntityId,
  buildGeoCoordinates,
  buildImageObject,
  buildOpeningHours,
  buildPostalAddress,
  stripUndefined,
} from "../utils";
import {
  buildAttractionPageUrl,
  buildCityPageUrl,
} from "./destination";

export { buildAttractionPageUrl } from "./destination";

export function buildAttractionEntityNode(
  data: AttractionSchemaData,
  webpageId: string
): { entity: JsonLdNode; extraNodes: JsonLdNode[] } {
  const pageUrl = buildAttractionPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug,
    { name: data.place.name, id: data.place.id, slug: data.placeSlug }
  );
  const entityId = buildEntityId(pageUrl);
  const cityPageUrl = buildCityPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug
  );

  const category = resolveEntityCategory(data.place);
  const types = resolveAttractionTypes(
    category,
    data.place.name,
    data.place.tags
  );
  const imageUrl = data.heroImage ?? resolveEntityImage(data.place);

  const placeSeo = buildPlaceSeo({
    name: data.place.name,
    city: data.city,
    country: data.country,
    locale: data.locale,
    translations: data.place.translations as Record<string, import("@/lib/seo").PlaceTranslation> | undefined,
    seo_keywords: data.place.seoKeywords,
  });

  const lat = data.place.lat;
  const lng = data.place.lng;
  const geo = buildGeoCoordinates(lat, lng);

  const aggregateInput =
    data.aggregateRating ??
    (data.reviews?.length ? computeAggregateRating(data.reviews) : undefined);

  const aggregateRating = buildAggregateRatingNode(pageUrl, aggregateInput);
  const reviewNodes = buildReviewNodes(pageUrl, data.reviews);

  const entity = stripUndefined({
    "@type": types,
    "@id": entityId,
    name: data.place.name,
    description: data.description || placeSeo.schemaDescription,
    url: pageUrl,
    inLanguage: data.locale,
    publicAccess: true,
    geo,
    address: buildPostalAddress({
      streetAddress: data.place.address,
      addressLocality: data.city,
      addressCountry: data.country,
    }),
    image: imageUrl
      ? buildImageObject({
          url: imageUrl,
          caption: placeSeo.imageAlt,
        })
      : undefined,
    openingHoursSpecification: buildOpeningHours(data.place.openingHours),
    keywords: placeSeo.seoKeywords.join(", "),
    aggregateRating: aggregateRating
      ? { "@id": aggregateRating["@id"] }
      : undefined,
    review: reviewNodes.length
      ? reviewNodes.map((node) => ({ "@id": node["@id"] }))
      : undefined,
    mainEntityOfPage: { "@id": webpageId },
    containedInPlace: {
      "@type": "City",
      name: data.city,
      url: cityPageUrl,
    },
    hasMap:
      geo && lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : undefined,
  }) as JsonLdNode;

  const extraNodes: JsonLdNode[] = [];
  if (aggregateRating) extraNodes.push(aggregateRating);
  extraNodes.push(...reviewNodes);

  return { entity, extraNodes };
}
