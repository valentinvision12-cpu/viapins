import { placeSlug } from "@/lib/place-slug";
import type {
  AttractionEntity,
  CitySchemaData,
  CountrySchemaData,
  JsonLdNode,
} from "../types";
import {
  buildEntityId,
  buildImageObject,
  buildItemListId,
  buildPageUrl,
  entityReference,
  stripUndefined,
} from "../utils";

export function buildCountryPageUrl(locale: string, countrySlug: string): string {
  return buildPageUrl(locale, "explore", countrySlug);
}

export function buildCityPageUrl(
  locale: string,
  countrySlug: string,
  citySlug: string
): string {
  return buildPageUrl(locale, "explore", countrySlug, citySlug);
}

export function buildAttractionPageUrl(
  locale: string,
  countrySlug: string,
  citySlug: string,
  place: Pick<AttractionEntity, "name" | "id" | "slug">
): string {
  const slug = place.slug ?? placeSlug(place.name, place.id);
  return buildPageUrl(locale, "explore", countrySlug, citySlug, slug);
}

export function buildCountryEntityNodes(data: CountrySchemaData): JsonLdNode[] {
  const pageUrl = buildCountryPageUrl(data.locale, data.countrySlug);
  const entityId = buildEntityId(pageUrl);
  const itemListId = buildItemListId(pageUrl, "cities");

  const entity = stripUndefined({
    "@type": ["Country", "TouristDestination"],
    "@id": entityId,
    name: data.country,
    description: data.description,
    url: pageUrl,
    inLanguage: data.locale,
    image: data.coverImage
      ? buildImageObject({
          url: data.coverImage,
          caption: `${data.country} travel guide`,
        })
      : undefined,
  }) as JsonLdNode;

  const itemList = stripUndefined({
    "@type": "ItemList",
    "@id": itemListId,
    name: `Top cities in ${data.country}`,
    numberOfItems: data.cities.length,
    itemListElement: data.cities.map((city, index) => {
      const cityPageUrl = buildCityPageUrl(
        data.locale,
        data.countrySlug,
        city.slug
      );
      return {
        "@type": "ListItem",
        position: index + 1,
        name: city.name,
        item: entityReference(buildEntityId(cityPageUrl)),
      };
    }),
  }) as JsonLdNode;

  return [entity, itemList];
}

export function buildCityEntityNodes(data: CitySchemaData): JsonLdNode[] {
  const pageUrl = buildCityPageUrl(
    data.locale,
    data.countrySlug,
    data.citySlug
  );
  const entityId = buildEntityId(pageUrl);
  const itemListId = buildItemListId(pageUrl, "attractions");

  const attractionRefs = data.places.map((place) =>
    entityReference(
      buildEntityId(
        buildAttractionPageUrl(
          data.locale,
          data.countrySlug,
          data.citySlug,
          place
        )
      )
    )
  );

  const entity = stripUndefined({
    "@type": ["TouristDestination", "City"],
    "@id": entityId,
    name: `${data.city}, ${data.country}`,
    description: data.intro ?? data.description,
    url: pageUrl,
    inLanguage: data.locale,
    keywords: data.keywords?.join(", "),
    image: data.heroImage
      ? buildImageObject({
          url: data.heroImage,
          caption: `${data.city}, ${data.country} travel guide`,
        })
      : undefined,
    containedInPlace: {
      "@type": "Country",
      name: data.country,
      url: buildCountryPageUrl(data.locale, data.countrySlug),
    },
    includesAttraction: attractionRefs,
  }) as JsonLdNode;

  const itemList = stripUndefined({
    "@type": "ItemList",
    "@id": itemListId,
    name: `Top ${data.places.length} Things to Do in ${data.city}, ${data.country}`,
    description: data.description,
    numberOfItems: data.places.length,
    itemListElement: data.places.map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: place.name,
      item: entityReference(
        buildEntityId(
          buildAttractionPageUrl(
            data.locale,
            data.countrySlug,
            data.citySlug,
            place
          )
        )
      ),
    })),
  }) as JsonLdNode;

  return [entity, itemList];
}
