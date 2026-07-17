/**
 * Adventure seed — country-wide road trip (outside cities).
 * Standard: 10 stops × 10 days, car required, with SEO.
 */

import {
  getWikiExtract,
  resolveWikiExtract,
  resolvePlaceImage,
  isGenericWikiTitle,
  isBadImageUrl,
} from "./wiki-image";
import {
  isGenericDescription,
  shortPlaceDescription,
  resolveWikiLookupTitle,
} from "./place-description";
import { isValidMapLocation } from "./place-links";
import { isVaguePlace, isCoordInCountry } from "./precise-place-filter";
import type { AdventureCollection, AdventurePlace, AdventureTag } from "./adventure-types";

const LOCALES = ["en", "es", "fr", "de", "it"] as const;

export const ADVENTURE_SEED_SPEC = {
  placesPerCountry: 10,
  daysPerRoute: 10,
} as const;

export interface TravelSeedAdventureSeo {
  title?: string;
  description?: string;
  intro?: string;
  keywords?: string[];
}

export interface TravelSeedAdventurePlace {
  name: string;
  wiki_title: string;
  region: string;
  lat: number;
  lng: number;
  day: number;
  order_index?: number;
  requires_car?: boolean;
  tags?: AdventureTag[];
  description?: string;
  seo_phrase?: string;
  seo_keywords?: string[];
  image_url?: string;
  commons_file?: string;
  seo_priority?: number;
  best_season?: string[];
  visit_duration_hours?: number;
}

export interface TravelSeedAdventure {
  title: string;
  subtitle: string;
  wiki_title?: string;
  totalDays?: number;
  seo?: TravelSeedAdventureSeo;
  places: TravelSeedAdventurePlace[];
}

type AdventureTranslation = {
  description: string;
  wiki_text: string;
  wiki_title?: string;
  maps_query?: string;
  seo_keywords?: string[];
  seo_phrase?: string;
  seo_priority?: number;
  best_season?: string[];
  visit_duration_hours?: number;
};

function slugifyCountry(country: string): string {
  return country
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function adventureMetaFromSeed(
  place: TravelSeedAdventurePlace
): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (place.seo_priority != null) meta.seo_priority = place.seo_priority;
  if (place.best_season?.length) meta.best_season = place.best_season;
  if (place.visit_duration_hours != null) {
    meta.visit_duration_hours = place.visit_duration_hours;
  }
  return meta;
}

function makeTranslations(
  description: string,
  wikiText: string,
  wikiTitle: string,
  mapsQuery: string,
  seoKeywords?: string[],
  seoPhrase?: string,
  extraMeta?: Record<string, unknown>
): Record<(typeof LOCALES)[number], AdventureTranslation> {
  const entry = {
    description,
    wiki_text: wikiText,
    wiki_title: wikiTitle,
    maps_query: mapsQuery,
    ...(seoKeywords?.length ? { seo_keywords: seoKeywords } : {}),
    ...(seoPhrase ? { seo_phrase: seoPhrase } : {}),
    ...extraMeta,
  };
  return { en: entry, es: entry, fr: entry, de: entry, it: entry };
}

function shortDescription(text: string, fallback: string): string {
  return shortPlaceDescription(text, fallback);
}

export function validateAdventureSeed(
  adventure: TravelSeedAdventure,
  country: string,
  options?: { partial?: boolean }
): void {
  const partial = options?.partial === true;
  if (!adventure.title?.trim()) {
    throw new Error(`Adventure за ${country}: липсва title.`);
  }
  if (!adventure.subtitle?.trim()) {
    throw new Error(`Adventure за ${country}: липсва subtitle.`);
  }
  if (!Array.isArray(adventure.places) || adventure.places.length === 0) {
    throw new Error(`Adventure за ${country}: липсва places масив.`);
  }
  if (
    !partial &&
    adventure.places.length !== ADVENTURE_SEED_SPEC.placesPerCountry
  ) {
    throw new Error(
      `Adventure за ${country}: трябват точно ${ADVENTURE_SEED_SPEC.placesPerCountry} спирки, има ${adventure.places.length}.`
    );
  }

  const days = new Set<number>();
  for (const place of adventure.places) {
    if (!place.name?.trim()) throw new Error("Adventure място без име.");
    if (!place.wiki_title?.trim()) {
      throw new Error(`Adventure "${place.name}" няма wiki_title.`);
    }
    if (!place.region?.trim()) {
      throw new Error(`Adventure "${place.name}" няма region.`);
    }
    if (typeof place.lat !== "number" || typeof place.lng !== "number") {
      throw new Error(`Adventure "${place.name}" няма lat/lng.`);
    }
    if (typeof place.day !== "number" || place.day < 1 || place.day > ADVENTURE_SEED_SPEC.daysPerRoute) {
      throw new Error(`Adventure "${place.name}": day трябва да е 1–${ADVENTURE_SEED_SPEC.daysPerRoute}.`);
    }
    days.add(place.day);
  }

  if (
    !partial &&
    days.size !== ADVENTURE_SEED_SPEC.daysPerRoute
  ) {
    throw new Error(
      `Adventure за ${country}: трябва по 1 спирка на ден (ден 1–${ADVENTURE_SEED_SPEC.daysPerRoute}).`
    );
  }
}

async function enrichAdventurePlace(
  place: TravelSeedAdventurePlace,
  country: string,
  slug: string,
  index: number,
  usedImages: Set<string>
): Promise<AdventurePlace> {
  const lookupTitle = resolveWikiLookupTitle(
    isGenericWikiTitle(place.wiki_title, place.name, place.region, country)
      ? place.name
      : place.wiki_title,
    place.name,
    place.region
  );

  const seedImageUnreliable =
    place.image_url &&
    (place.image_url.includes("Special:FilePath") ||
      place.image_url.includes("/wiki/File:"));

  const seedUrl =
    place.image_url && !seedImageUnreliable && !isBadImageUrl(place.image_url)
      ? place.image_url
      : "";

  const [apiImage, resolved] = await Promise.all([
    resolvePlaceImage(
      {
        placeName: place.name,
        wikiTitle: place.wiki_title,
        city: place.region,
        country,
        commonsFile: place.commons_file,
        avoidUrls: usedImages,
      },
      900
    ),
    resolveWikiExtract(place.name, {
      wikiTitle: lookupTitle,
      city: place.region,
      country,
    }),
  ]);
  const extract = resolved.extract;
  const wikiTitleStored = resolved.wikiTitle;

  let image_url = apiImage || seedUrl;
  if (isBadImageUrl(image_url)) {
    const retry = await resolvePlaceImage(
      {
        placeName: place.name,
        wikiTitle: place.wiki_title,
        city: place.region,
        country,
        commonsFile: place.commons_file,
        preferCommons: true,
        avoidUrls: usedImages,
      },
      900
    );
    image_url = retry && !isBadImageUrl(retry) ? retry : "";
  }
  if (image_url) usedImages.add(image_url);

  if (!isValidMapLocation(place.lat, place.lng, place.name)) {
    throw new Error(
      `Adventure "${place.name}": липсват GPS координати — не се качва.`
    );
  }
  if (isVaguePlace(place.name, place.description, country, place.lat, place.lng)) {
    const hasSeedImage = Boolean(place.image_url?.trim() && !isBadImageUrl(place.image_url));
    const coordsInCountry = isCoordInCountry(place.lat, place.lng, country);
    const namedLandmark = /\b(valley|gorge|canyon|lagoon|pools|monastery|flames|island|thermal|travertines|trails|national park|natural park|nature park|nature reserve|reserve|dune|dunes|klint|cliff|cliffs|fell|fells|fjord|forest tower|sand spit|mountains|sphinx|peak|summit|cave|rock formation)\b/i.test(
      place.name
    );
    if (!(hasSeedImage && (coordsInCountry || namedLandmark))) {
      throw new Error(
        `Adventure "${place.name}" (${country}): зона/регион — нужна е конкретна забележителност.`
      );
    }
  }
  if (!image_url) {
    throw new Error(
      `Adventure "${place.name}" (${country}): няма Wikimedia снимка — не се качва.`
    );
  }

  const seedStory =
    place.description && !isGenericDescription(place.description)
      ? place.description.trim()
      : "";

  const wiki_text = extract || seedStory || place.name;
  const description = extract
    ? shortDescription(extract, place.name)
    : seedStory || place.name;

  return {
    id: `${slug}-adv-${index + 1}`,
    name: place.name,
    country,
    region: place.region,
    lat: place.lat,
    lng: place.lng,
    image_url,
    wiki_title: wikiTitleStored,
    requires_car: place.requires_car !== false,
    tags: place.tags?.length ? place.tags : ["hidden_gem"],
    order_index: place.order_index ?? index,
    day: place.day,
    translations: makeTranslations(
      description,
      wiki_text,
      wikiTitleStored,
      `${place.name}, ${place.region}, ${country}`,
      place.seo_keywords,
      place.seo_phrase,
      adventureMetaFromSeed(place)
    ),
  };
}

export async function enrichAdventureSeed(
  adventure: TravelSeedAdventure,
  country: string,
  options?: { partial?: boolean }
): Promise<AdventureCollection> {
  validateAdventureSeed(adventure, country, options);
  const slug = slugifyCountry(country);

  const sorted = [...adventure.places].sort(
    (a, b) => (a.order_index ?? a.day) - (b.order_index ?? b.day)
  );

  const places: AdventurePlace[] = [];
  const usedImages = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    try {
      places.push(
        await enrichAdventurePlace(sorted[i], country, slug, places.length, usedImages)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[adventure] Skip "${sorted[i].name}": ${msg}`);
    }
    if (process.env.SEQUENTIAL_WIKI === "1" && i < sorted.length - 1) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  if (places.length === 0) {
    throw new Error(`Adventure за ${country}: нито една спирка не мина валидация.`);
  }

  const heroImage = places[0]?.image_url ?? "";

  const maxDay = Math.max(...places.map((p) => p.day), 1);

  return {
    country,
    slug,
    title: adventure.title,
    subtitle: adventure.subtitle,
    heroImage,
    wiki_title: adventure.wiki_title ?? country,
    totalDays: adventure.totalDays ?? maxDay,
    seo: adventure.seo ?? {},
    places,
  };
}

/** Празен adventure блок за seed файл (10 спирки × 10 дни) */
export function emptyAdventureTemplate(country: string): TravelSeedAdventure {
  const places: TravelSeedAdventurePlace[] = Array.from({ length: 10 }, (_, i) => ({
    name: `Stop ${i + 1} Name`,
    wiki_title: "Wikipedia Article Title",
    region: "Region Name",
    lat: 0,
    lng: 0,
    day: i + 1,
    order_index: i,
    requires_car: true,
    tags: ["hidden_gem"],
    seo_phrase: `${country} road trip — stop ${i + 1}`,
    seo_keywords: [`${country} road trip`, `${country} by car`],
  }));

  return {
    title: `${country} Road Trip Adventure`,
    subtitle: `10-day country-wide road trip through ${country} — car required.`,
    wiki_title: country,
    totalDays: ADVENTURE_SEED_SPEC.daysPerRoute,
    seo: {
      title: `${country} Road Trip — 10-Day Adventure Itinerary | Car Travel Guide`,
      description: `Plan a 10-day ${country} road trip with GPS stops, hidden gems, and car-only routes.`,
      intro: `Explore ${country} beyond the cities with this 10-day adventure route. Add stops to your cart and navigate in Google Maps.`,
      keywords: [`${country} road trip`, `${country} by car`, `10 day ${country} tour`],
    },
    places,
  };
}

export function adventureSeedStats(adventure: TravelSeedAdventure) {
  const days = new Set(adventure.places.map((p) => p.day));
  return {
    placeCount: adventure.places.length,
    dayCount: days.size,
    expectedPlaces: ADVENTURE_SEED_SPEC.placesPerCountry,
    expectedDays: ADVENTURE_SEED_SPEC.daysPerRoute,
    isComplete:
      adventure.places.length === ADVENTURE_SEED_SPEC.placesPerCountry &&
      days.size === ADVENTURE_SEED_SPEC.daysPerRoute,
  };
}
