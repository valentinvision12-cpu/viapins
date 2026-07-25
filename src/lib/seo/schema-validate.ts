import { generateSchema } from "@/lib/schema";
import type {
  JsonLdGraph,
  JsonLdNode,
  SchemaPageType,
} from "@/lib/schema/types";
import { getSiteUrl } from "@/lib/seo";
import { getDestinationByCityCountry } from "@/actions/get-destinations";
import { getCountryBySlug, getCitiesByCountrySlug } from "@/actions/get-destinations";
import { getAdventureCollection } from "@/lib/adventure-data";
import { findPlaceBySlug, placeSlug } from "@/lib/place-slug";
import { getPlaceContent } from "@/lib/content-locale";
import { isCityGuideSlug } from "@/lib/city-guides";
import {
  buildAdventureFaqs,
  buildCityFaqs,
  buildCountryFaqs,
} from "@/lib/schema";

export type SchemaCheck = {
  ok: boolean;
  message: string;
};

export type SchemaValidateResult = {
  ok: boolean;
  pageType: SchemaPageType | "unknown";
  canonicalUrl?: string;
  checks: SchemaCheck[];
  jsonLd?: JsonLdGraph;
  error?: string;
};

function typesOf(n: JsonLdNode | undefined): string[] {
  const t = n?.["@type"];
  if (Array.isArray(t)) return t as string[];
  if (typeof t === "string") return [t];
  return [];
}

function ids(g: JsonLdGraph): string[] {
  return g["@graph"]
    .map((n) => n["@id"])
    .filter((id): id is string => typeof id === "string");
}

function byType(g: JsonLdGraph, type: string): JsonLdNode | undefined {
  return g["@graph"].find((n) => typesOf(n).includes(type));
}

function node(g: JsonLdGraph, suffix: string): JsonLdNode | undefined {
  return g["@graph"].find(
    (n) => typeof n["@id"] === "string" && (n["@id"] as string).endsWith(suffix)
  );
}

function softValidate(g: JsonLdGraph, pageType: SchemaPageType): SchemaCheck[] {
  const checks: SchemaCheck[] = [];
  const allIds = ids(g);
  checks.push({
    ok: new Set(allIds).size === allIds.length,
    message: "Unique @id values in @graph",
  });
  checks.push({
    ok: Boolean(byType(g, "Organization")),
    message: "Organization present",
  });
  checks.push({
    ok: Boolean(byType(g, "WebSite") || node(g, "#webpage")),
    message: "WebSite or WebPage present",
  });

  if (pageType === "guide") {
    checks.push({
      ok: Boolean(byType(g, "Article")),
      message: "Article node for guide",
    });
    checks.push({
      ok: Boolean(byType(g, "ItemList")),
      message: "ItemList node for guide places",
    });
  }
  if (pageType === "country" || pageType === "city" || pageType === "collection") {
    checks.push({
      ok: typesOf(node(g, "#webpage")).includes("CollectionPage"),
      message: "CollectionPage webpage type",
    });
  }
  if (pageType === "attraction" || pageType === "trip") {
    checks.push({
      ok:
        typesOf(node(g, "#webpage")).includes("WebPage") &&
        !typesOf(node(g, "#webpage")).includes("CollectionPage"),
      message: "WebPage (not CollectionPage) for entity page",
    });
  }
  if (byType(g, "FAQPage") || node(g, "#faq")) {
    const faq = byType(g, "FAQPage") ?? node(g, "#faq");
    checks.push({
      ok: Boolean(faq?.mainEntity),
      message: "FAQPage has mainEntity",
    });
  }
  return checks;
}

/** Parse a site path or full URL into locale + path segments. */
export function parseSeoUrl(input: string): {
  locale: string;
  path: string;
  segments: string[];
} | null {
  const raw = input.trim();
  if (!raw) return null;

  let pathname = raw;
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      pathname = new URL(raw).pathname;
    }
  } catch {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { locale: "en", path: "/", segments: [] };
  }

  // Assume first segment is locale when 2 letters
  const maybeLocale = parts[0];
  const hasLocale = /^[a-z]{2}$/i.test(maybeLocale);
  const locale = hasLocale ? maybeLocale.toLowerCase() : "en";
  const segments = hasLocale ? parts.slice(1) : parts;
  const path = `/${segments.join("/")}` || "/";
  return { locale, path, segments };
}

async function generateForPath(
  locale: string,
  segments: string[]
): Promise<{ pageType: SchemaPageType; result: ReturnType<typeof generateSchema> } | { error: string }> {
  // /adventures or /discover
  if (segments.length === 1 && (segments[0] === "adventures" || segments[0] === "discover")) {
    const pageType = "collection" as const;
    return {
      pageType,
      result: generateSchema("collection", {
        locale,
        title: segments[0] === "adventures" ? "Adventures" : "Discover",
        description: `${segments[0]} hub`,
        path: `/${segments[0]}`,
      }),
    };
  }

  if (segments[0] !== "explore") {
    return { error: "Поддържат се /explore/... и /adventures|/discover URL-и" };
  }

  const countrySlug = segments[1];
  if (!countrySlug) return { error: "Липсва country slug" };

  // /explore/{country}/adventure
  if (segments[2] === "adventure") {
    const collection = await getAdventureCollection(countrySlug);
    if (!collection) return { error: "Adventure не е намерен" };
    const faqs = buildAdventureFaqs(
      collection.country,
      collection.totalDays,
      collection.places.length
    );
    return {
      pageType: "trip",
      result: generateSchema("trip", {
        locale,
        country: collection.country,
        countrySlug,
        title: collection.seo?.title ?? collection.title,
        description:
          collection.seo?.description ?? collection.subtitle ?? collection.title,
        heroImage: collection.heroImage,
        totalDays: collection.totalDays,
        stops: collection.places.map((p) => ({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
        })),
        faqs,
      }),
    };
  }

  // /explore/{country}
  if (segments.length === 2) {
    const country = await getCountryBySlug(countrySlug);
    const cities = await getCitiesByCountrySlug(countrySlug);
    if (!country || !cities) return { error: "Държавата не е намерена" };
    return {
      pageType: "country",
      result: generateSchema("country", {
        locale,
        country: country.country,
        countrySlug,
        description: `${country.country} travel guide`,
        coverImage: country.coverImage,
        cities: cities.cities.map((c) => ({
          name: c.city,
          slug: c.slug.city,
          placeCount: c.placeCount,
        })),
        faqs: buildCountryFaqs(country.country),
      }),
    };
  }

  const citySlug = segments[2];
  if (!citySlug) return { error: "Липсва city slug" };

  const destination = await getDestinationByCityCountry(countrySlug, citySlug);
  if (!destination) return { error: "Градът не е намерен" };

  // /explore/{c}/{city}/guide/{guide}
  if (segments[3] === "guide" && segments[4]) {
    const guide = segments[4];
    if (!isCityGuideSlug(guide)) return { error: "Невалиден guide slug" };
    return {
      pageType: "guide",
      result: generateSchema("guide", {
        locale,
        country: destination.country,
        city: destination.city,
        countrySlug,
        citySlug,
        guideSlug: guide,
        title: `${guide} — ${destination.city}`,
        description: `Guide for ${destination.city}, ${destination.country}`,
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        places: destination.places.slice(0, 12).map((p) => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          lat: p.lat,
          lng: p.lng,
        })),
      }),
    };
  }

  // /explore/{c}/{city}/{place}
  if (segments.length >= 4 && segments[3] !== "guide" && segments[3] !== "stays") {
    const placeParam = segments[3];
    const place = findPlaceBySlug(destination.places, placeParam);
    if (!place) return { error: "Мястото не е намерено" };
    const { description } = getPlaceContent(place.translations, locale);
    const slug = placeSlug(place.name, place.id);
    return {
      pageType: "attraction",
      result: generateSchema("attraction", {
        locale,
        country: destination.country,
        city: destination.city,
        countrySlug,
        citySlug,
        placeSlug: slug,
        place: {
          id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          image_url: place.image_url,
          translations: place.translations,
        },
        description:
          description?.slice(0, 500) ||
          `Visit ${place.name} in ${destination.city}`,
        heroImage: place.image_url,
      }),
    };
  }

  // /explore/{c}/{city}
  const faqs = buildCityFaqs(destination.city, destination.country);
  return {
    pageType: "city",
    result: generateSchema("city", {
      locale,
      country: destination.country,
      city: destination.city,
      countrySlug,
      citySlug,
      description: `${destination.city} travel guide`,
      intro: `Explore ${destination.city}`,
      places: destination.places.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        image_url: p.image_url,
        translations: p.translations,
      })),
      faqs,
    }),
  };
}

/** Sample fixtures when URL is empty — random-ish demo page types. */
export function sampleSchemaByType(pageType: SchemaPageType): SchemaValidateResult {
  const locale = "en";
  let result: ReturnType<typeof generateSchema>;
  switch (pageType) {
    case "home":
      result = generateSchema("home", { locale });
      break;
    case "country":
      result = generateSchema("country", {
        locale,
        country: "France",
        countrySlug: "france",
        description: "Top cities",
        cities: [{ name: "Paris", slug: "paris", placeCount: 12 }],
        faqs: buildCountryFaqs("France"),
      });
      break;
    case "city":
      result = generateSchema("city", {
        locale,
        country: "France",
        city: "Paris",
        countrySlug: "france",
        citySlug: "paris",
        description: "Paris guide",
        intro: "Explore Paris",
        places: [
          { id: "p1", name: "Louvre Museum", category: "museum" },
          { id: "p2", name: "Eiffel Tower", category: "landmark" },
        ],
        faqs: buildCityFaqs("Paris", "France"),
      });
      break;
    case "attraction":
      result = generateSchema("attraction", {
        locale,
        country: "Italy",
        city: "Rome",
        countrySlug: "italy",
        citySlug: "rome",
        placeSlug: "colosseum",
        place: { id: "c1", name: "Colosseum", category: "historic_site" },
        description: "Amphitheatre",
      });
      break;
    case "trip":
      result = generateSchema("trip", {
        locale,
        country: "France",
        countrySlug: "france",
        title: "France Road Trip",
        description: "Scenic drive",
        totalDays: 10,
        stops: [
          { name: "Mont Saint-Michel", lat: 48.636, lng: -1.511 },
          { name: "Verdon Gorge", lat: 43.761, lng: 6.23 },
        ],
        faqs: buildAdventureFaqs("France", 10, 2),
      });
      break;
    case "guide":
      result = generateSchema("guide", {
        locale,
        country: "France",
        city: "Paris",
        countrySlug: "france",
        citySlug: "paris",
        guideSlug: "things-to-do",
        title: "Things to Do in Paris",
        description: "Top landmarks",
        datePublished: "2024-01-01T00:00:00.000Z",
        dateModified: "2024-06-01T00:00:00.000Z",
        places: [
          { id: "p1", name: "Louvre Museum" },
          { id: "p2", name: "Eiffel Tower" },
        ],
      });
      break;
    case "collection":
      result = generateSchema("collection", {
        locale,
        title: "Adventures",
        description: "Road trip hubs",
        path: "/adventures",
      });
      break;
    default:
      return {
        ok: false,
        pageType: "unknown",
        checks: [],
        error: "Unknown page type",
      };
  }

  const checks = softValidate(result.jsonLd, pageType);
  return {
    ok: checks.every((c) => c.ok),
    pageType,
    canonicalUrl: result.canonicalUrl,
    checks,
    jsonLd: result.jsonLd,
  };
}

export async function validateSchemaForUrl(
  urlOrPath: string
): Promise<SchemaValidateResult> {
  const parsed = parseSeoUrl(urlOrPath);
  if (!parsed) {
    return {
      ok: false,
      pageType: "unknown",
      checks: [],
      error: "Невалиден URL",
    };
  }

  if (parsed.segments.length === 0) {
    const result = generateSchema("home", { locale: parsed.locale });
    const checks = softValidate(result.jsonLd, "home");
    return {
      ok: checks.every((c) => c.ok),
      pageType: "home",
      canonicalUrl: result.canonicalUrl,
      checks,
      jsonLd: result.jsonLd,
    };
  }

  try {
    const generated = await generateForPath(parsed.locale, parsed.segments);
    if ("error" in generated) {
      return {
        ok: false,
        pageType: "unknown",
        checks: [],
        error: generated.error,
      };
    }
    const checks = softValidate(generated.result.jsonLd, generated.pageType);
    return {
      ok: checks.every((c) => c.ok),
      pageType: generated.pageType,
      canonicalUrl: generated.result.canonicalUrl || `${getSiteUrl()}${parsed.path}`,
      checks,
      jsonLd: generated.result.jsonLd,
    };
  } catch (err) {
    return {
      ok: false,
      pageType: "unknown",
      checks: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
