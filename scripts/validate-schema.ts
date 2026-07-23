import assert from "node:assert/strict";
import {
  generateSchema,
  resolveAttractionTypes,
  REVIEW_THRESHOLD,
} from "../src/lib/schema/index";
import type { JsonLdGraph, JsonLdNode } from "../src/lib/schema/types";

function graphOf(result: { jsonLd: JsonLdGraph } | JsonLdGraph): JsonLdGraph {
  return "jsonLd" in result ? result.jsonLd : result;
}

function ids(g: JsonLdGraph): string[] {
  return g["@graph"]
    .map((n) => n["@id"])
    .filter((id): id is string => typeof id === "string");
}

function node(g: JsonLdGraph, suffix: string): JsonLdNode | undefined {
  return g["@graph"].find(
    (n) => typeof n["@id"] === "string" && (n["@id"] as string).endsWith(suffix)
  );
}

function typesOf(n: JsonLdNode | undefined): string[] {
  const t = n?.["@type"];
  if (Array.isArray(t)) return t as string[];
  if (typeof t === "string") return [t];
  return [];
}

function byType(g: JsonLdGraph, type: string): JsonLdNode | undefined {
  return g["@graph"].find((n) => typesOf(n).includes(type));
}

console.log("Validating ViaPins schema engine...");

const home = graphOf(generateSchema("home", { locale: "en" }));
assert.equal(new Set(ids(home)).size, ids(home).length);
assert.ok(byType(home, "Organization"));
assert.ok(byType(home, "WebSite"));
assert.ok(node(home, "#webpage"));
console.log("OK home");

const country = graphOf(
  generateSchema("country", {
    locale: "en",
    country: "France",
    countrySlug: "france",
    description: "Top cities",
    cities: [{ name: "Paris", slug: "paris", placeCount: 12 }],
  })
);
assert.ok(typesOf(node(country, "#webpage")).includes("CollectionPage"));
assert.ok(node(country, "#entity"));
console.log("OK country");

const city = graphOf(
  generateSchema("city", {
    locale: "en",
    country: "France",
    city: "Paris",
    countrySlug: "france",
    citySlug: "paris",
    description: "Paris guide",
    intro: "Explore Paris",
    places: [
      { id: "p1", name: "Louvre Museum", category: "museum" },
      { id: "p2", name: "Chateau de Vincennes", category: "castle" },
    ],
  })
);
assert.ok(node(city, "#entity"));
const includes = node(city, "#entity")?.includesAttraction;
assert.ok(Array.isArray(includes) && includes.length === 2);
console.log("OK city");

const attraction = graphOf(
  generateSchema("attraction", {
    locale: "en",
    country: "Italy",
    city: "Rome",
    countrySlug: "italy",
    citySlug: "rome",
    placeSlug: "colosseum",
    place: { id: "c1", name: "Colosseum", category: "historic_site" },
    description: "Amphitheatre",
  })
);
const aWeb = node(attraction, "#webpage");
assert.ok(typesOf(aWeb).includes("WebPage"));
assert.ok(!typesOf(aWeb).includes("CollectionPage"));
assert.ok(
  typesOf(node(attraction, "#entity")).includes("LandmarksOrHistoricalBuildings")
);
console.log("OK attraction");

const low = graphOf(
  generateSchema("attraction", {
    locale: "en",
    country: "Italy",
    city: "Rome",
    countrySlug: "italy",
    citySlug: "rome",
    placeSlug: "pantheon",
    place: { id: "p1", name: "Pantheon" },
    description: "Temple",
    aggregateRating: { ratingValue: 4.5, reviewCount: 2 },
  })
);
assert.equal(node(low, "#aggregateRating"), undefined);

const high = graphOf(
  generateSchema("attraction", {
    locale: "en",
    country: "Italy",
    city: "Rome",
    countrySlug: "italy",
    citySlug: "rome",
    placeSlug: "pantheon",
    place: { id: "p1", name: "Pantheon" },
    description: "Temple",
    aggregateRating: { ratingValue: 4.6, reviewCount: 5 },
  })
);
assert.ok(node(high, "#aggregateRating"));
console.log(`OK reviews threshold ${REVIEW_THRESHOLD}`);

const faqCity = graphOf(
  generateSchema("city", {
    locale: "en",
    country: "France",
    city: "Paris",
    countrySlug: "france",
    citySlug: "paris",
    description: "Paris",
    places: [{ id: "1", name: "Eiffel Tower" }],
    faqs: [{ question: "Q?", answer: "A." }],
  })
);
const faqWeb = node(faqCity, "#webpage");
assert.ok(faqWeb?.mainEntity);
assert.ok(faqWeb?.hasPart);
console.log("OK FAQ");

const trip = graphOf(
  generateSchema("trip", {
    locale: "en",
    country: "France",
    countrySlug: "france",
    title: "France Road Trip",
    description: "Scenic drive",
    totalDays: 10,
    stops: [
      { name: "Mont Saint-Michel", lat: 48.636, lng: -1.511 },
      { name: "Verdon Gorge", lat: 43.761, lng: 6.23, category: "nature" },
    ],
  })
);
assert.ok(node(trip, "#itinerary") || byType(trip, "ItemList"));
assert.ok(typesOf(node(trip, "#webpage")).includes("WebPage"));
assert.ok(!typesOf(node(trip, "#webpage")).includes("CollectionPage"));
console.log("OK trip");

assert.deepEqual(resolveAttractionTypes("castle"), [
  "TouristAttraction",
  "Castle",
]);
assert.deepEqual(resolveAttractionTypes("bridge"), [
  "TouristAttraction",
  "Bridge",
]);
assert.deepEqual(resolveAttractionTypes("waterfall"), [
  "TouristAttraction",
  "Waterfall",
]);
assert.deepEqual(resolveAttractionTypes("medieval_castle"), [
  "TouristAttraction",
  "Castle",
]);
console.log("OK classifier");

console.log("All schema validations passed.");
