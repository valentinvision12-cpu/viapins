import type { JsonLdNode, TripSchemaData } from "../types";
import { resolveAttractionTypes } from "../registry";
import {
  buildEntityId,
  buildGeoCoordinates,
  buildImageObject,
  buildItemListId,
  buildPageUrl,
  entityReference,
  stripUndefined,
} from "../utils";

export function buildTripPageUrl(locale: string, countrySlug: string): string {
  return buildPageUrl(locale, "explore", countrySlug, "adventure");
}

export function buildTripEntityNodes(
  data: TripSchemaData,
  webpageId: string
): JsonLdNode[] {
  const pageUrl = buildTripPageUrl(data.locale, data.countrySlug);
  const entityId = buildEntityId(pageUrl);
  const itineraryId = buildItemListId(pageUrl, "itinerary");

  const itineraryItems = data.stops.map((stop, index) => {
    if (stop.entityUrl) {
      return {
        "@type": "ListItem" as const,
        position: index + 1,
        name: stop.name,
        item: entityReference(buildEntityId(stop.entityUrl)),
      };
    }

    const types = resolveAttractionTypes(
      stop.category ?? stop.type,
      stop.name,
      stop.tags
    );
    const geo = buildGeoCoordinates(stop.lat, stop.lng);

    return {
      "@type": "ListItem" as const,
      position: index + 1,
      name: stop.name,
      item: stripUndefined({
        "@type": types,
        name: stop.name,
        description: stop.description,
        geo,
        image: stop.imageUrl
          ? buildImageObject({ url: stop.imageUrl, caption: stop.name })
          : undefined,
      }),
    };
  });

  const entity = stripUndefined({
    "@type": ["Trip", "TouristTrip"],
    "@id": entityId,
    name: data.title,
    description: data.description,
    url: pageUrl,
    inLanguage: data.locale,
    image: data.heroImage
      ? buildImageObject({ url: data.heroImage, caption: data.title })
      : undefined,
    duration: data.totalDays ? `P${data.totalDays}D` : undefined,
    itinerary: { "@id": itineraryId },
    mainEntityOfPage: { "@id": webpageId },
    containedInPlace: {
      "@type": "Country",
      name: data.country,
      url: buildPageUrl(data.locale, "explore", data.countrySlug),
    },
  }) as JsonLdNode;

  const itinerary = stripUndefined({
    "@type": "ItemList",
    "@id": itineraryId,
    name: `${data.country} road trip itinerary`,
    numberOfItems: data.stops.length,
    itemListElement: itineraryItems,
  }) as JsonLdNode;

  return [entity, itinerary];
}
