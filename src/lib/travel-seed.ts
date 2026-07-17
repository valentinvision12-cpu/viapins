/**
 * Travel Seed Format v1
 *
 * СТАНДАРТ ЗА ВСЯКА ДЪРЖАВА (както в SEO промпта):
 *   • 1 държава на файл
 *   • 10 града
 *   • 10 забележителности на град
 *   • = 100 места общо
 *
 * Минимални полета: country, city, name, wiki_title, lat, lng
 * Системата автоматично добавя: снимки, история, SEO (ако липсват)
 */

import { getWikiExtract, resolveWikiExtract, resolvePlaceImage, commonsFileUrl, isBadImageUrl, isGenericWikiTitle } from "./wiki-image";
import { isValidMapLocation } from "./place-links";
import { isVaguePlace, isCoordInCountry } from "./precise-place-filter";
import {
  isGenericDescription,
  shortPlaceDescription,
  resolveWikiLookupTitle,
} from "./place-description";
import {
  emptyAdventureTemplate,
  validateAdventureSeed,
  type TravelSeedAdventure,
} from "./adventure-seed";

const LOCALES = ["en", "es", "fr", "de", "it"] as const;
type Locale = (typeof LOCALES)[number];
type Translations = Record<
  Locale,
  {
    description: string;
    wiki_text: string;
    wiki_title?: string;
    maps_query?: string;
    maps_url?: string;
    google_place_id?: string;
    formatted_address?: string;
    seo_keywords?: string[];
    seo_phrase?: string;
    commons_file?: string;
    seo_priority?: number;
    search_intent?: string[];
    type?: string;
    best_season?: string[];
    visit_duration_hours?: number;
    nearby_places?: string[];
  }
>;

const WC = (f: string) => commonsFileUrl(f, 900);

// ─── Seed schema (input — минимален) ─────────────────────────────────────────

export interface TravelSeedPlace {
  name: string;
  wiki_title: string;
  lat: number;
  lng: number;
  order_index?: number;
  /** По избор — ако липсва, се взима от Wikipedia */
  description?: string;
  /** Long-tail фраза за SEO (показва се в alt text и schema) */
  seo_phrase?: string;
  /** Ключови думи за забележителността */
  seo_keywords?: string[];
  /** По избор — директен URL */
  image_url?: string;
  /** По избор — Wikimedia Commons filename */
  commons_file?: string;
  /** v2 — SEO ranking within city (higher = more important) */
  seo_priority?: number;
  search_intent?: string[];
  type?: string;
  best_season?: string[];
  visit_duration_hours?: number;
  nearby_places?: string[];
  /** Google Maps search label — use when name alone shows a region, not a pin */
  maps_query?: string;
  /** Verified Google Place ID — drives Maps link + exact coords when resolved */
  google_place_id?: string;
  formatted_address?: string;
  maps_url?: string;
}

export interface TravelSeedCitySeo {
  title?: string;
  description?: string;
  intro?: string;
  h1_subtitle?: string;
  keywords?: string[];
}

export interface TravelSeedCity {
  city: string;
  tags?: string[];
  wiki_title?: string;
  /** Long-tail SEO за града — по избор, иначе се генерира автоматично */
  seo?: TravelSeedCitySeo | Record<string, TravelSeedCitySeo>;
  places: TravelSeedPlace[];
}

export interface TravelSeedFile {
  version: 1 | 2;
  country: string;
  cities: TravelSeedCity[];
  /** Country-wide road trip — 10 stops × 10 days, outside cities */
  adventure?: TravelSeedAdventure;
  published?: boolean;
}

// ─── Enriched output (готово за Supabase) ────────────────────────────────────

export interface EnrichedSeedPlace {
  name: string;
  lat: number;
  lng: number;
  order_index: number;
  image_url: string;
  translations: Translations;
}

export interface EnrichedSeedCity {
  city: string;
  tags: string[];
  wiki_title: string;
  seo: TravelSeedCitySeo | Record<string, TravelSeedCitySeo>;
  places: EnrichedSeedPlace[];
}

export interface EnrichedTravelSeed {
  country: string;
  published: boolean;
  cities: EnrichedSeedCity[];
}

// ─── Country data spec (fixed — do not change per country) ───────────────────

export const COUNTRY_SEED_SPEC = {
  citiesPerCountry: 10,
  placesPerCity: 10,
  placesPerCountry: 100,
} as const;

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateTravelSeed(data: unknown): TravelSeedFile {
  if (!data || typeof data !== "object") {
    throw new Error("Seed файлът е празен или невалиден.");
  }

  const seed = data as Partial<TravelSeedFile>;

  if (seed.version !== 1 && seed.version !== 2) {
    throw new Error('Seed версията трябва да е 1 или 2. Добави "version": 1');
  }
  if (!seed.country?.trim()) {
    throw new Error('Липсва "country".');
  }
  if (!Array.isArray(seed.cities) || seed.cities.length === 0) {
    throw new Error('Липсва "cities" масив с поне 1 град.');
  }

  if (seed.cities.length !== COUNTRY_SEED_SPEC.citiesPerCountry) {
    throw new Error(
      `${seed.country}: трябват точно ${COUNTRY_SEED_SPEC.citiesPerCountry} града, има ${seed.cities.length}.`
    );
  }

  validateSeedAdventure(seed as TravelSeedFile);

  for (const city of seed.cities) {
    if (!city.city?.trim()) throw new Error("Град без име.");
    if (!Array.isArray(city.places) || city.places.length === 0) {
      throw new Error(`Град "${city.city}" няма места.`);
    }
    const partialOk = process.env.PARTIAL_CITY_IMPORT === "1";
    if (!partialOk && city.places.length !== COUNTRY_SEED_SPEC.placesPerCity) {
      throw new Error(
        `"${city.city}": трябват точно ${COUNTRY_SEED_SPEC.placesPerCity} забележителности, има ${city.places.length}.`
      );
    }
    if (partialOk && city.places.length > COUNTRY_SEED_SPEC.placesPerCity) {
      throw new Error(
        `"${city.city}": твърде много места (${city.places.length}) — max ${COUNTRY_SEED_SPEC.placesPerCity}.`
      );
    }
    for (const place of city.places) {
      if (!place.name?.trim()) throw new Error(`Място без име в ${city.city}.`);
      if (!place.wiki_title?.trim()) {
        throw new Error(`"${place.name}" в ${city.city} няма wiki_title.`);
      }
      if (typeof place.lat !== "number" || typeof place.lng !== "number") {
        throw new Error(`"${place.name}" в ${city.city} няма lat/lng.`);
      }
    }
  }

  return seed as TravelSeedFile;
}

/** Validate optional adventure block when present */
export function validateSeedAdventure(seed: TravelSeedFile): void {
  if (!seed.adventure) {
    throw new Error(
      `${seed.country}: липсва "adventure" секция (10 спирки × 10 дни).`
    );
  }
  validateAdventureSeed(seed.adventure, seed.country);
}

function placeMetaFromSeed(place: TravelSeedPlace): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (place.seo_priority != null) meta.seo_priority = place.seo_priority;
  if (place.search_intent?.length) meta.search_intent = place.search_intent;
  if (place.type) meta.type = place.type;
  if (place.best_season?.length) meta.best_season = place.best_season;
  if (place.visit_duration_hours != null) {
    meta.visit_duration_hours = place.visit_duration_hours;
  }
  if (place.nearby_places?.length) meta.nearby_places = place.nearby_places;
  return meta;
}

function makeTranslations(
  description: string,
  wikiText: string,
  wikiTitle: string,
  mapsQuery: string,
  seoKeywords?: string[],
  seoPhrase?: string,
  commonsFile?: string,
  placeMeta?: Record<string, unknown>
): Translations {
  const entry = {
    description,
    wiki_text: wikiText,
    wiki_title: wikiTitle,
    maps_query: mapsQuery,
    ...(commonsFile ? { commons_file: commonsFile } : {}),
    ...(seoKeywords?.length ? { seo_keywords: seoKeywords } : {}),
    ...(seoPhrase ? { seo_phrase: seoPhrase } : {}),
    ...placeMeta,
  };
  return {
    en: { ...entry },
    es: { ...entry },
    fr: { ...entry },
    de: { ...entry },
    it: { ...entry },
  };
}

function shortDescription(text: string, fallback: string): string {
  return shortPlaceDescription(text, fallback);
}

export async function enrichPlace(
  place: TravelSeedPlace,
  index: number,
  city: string,
  country: string,
  usedImages: Set<string>,
  options?: { trustSeed?: boolean }
): Promise<EnrichedSeedPlace> {
  const trustSeed = options?.trustSeed === true;
  if (place.image_url && !isBadImageUrl(place.image_url)) {
    usedImages.add(place.image_url);
  }

  const seedImageUnreliable =
    place.image_url &&
    (place.image_url.includes("Special:FilePath") ||
      place.image_url.includes("/wiki/File:"));

  const lookupTitle = resolveWikiLookupTitle(
    isGenericWikiTitle(place.wiki_title, place.name, city, country)
      ? place.name
      : place.wiki_title,
    place.name,
    city
  );

  const seedUrl =
    place.image_url && !seedImageUnreliable && !isBadImageUrl(place.image_url)
      ? place.image_url
      : "";

  const [apiImage, resolved] = await Promise.all([
    seedUrl ? Promise.resolve("") : resolvePlaceImage(
          {
            placeName: place.name,
            wikiTitle: place.wiki_title,
            city,
            country,
            commonsFile: place.commons_file,
            avoidUrls: usedImages,
          },
          900
        ),
    resolveWikiExtract(place.name, {
      wikiTitle: lookupTitle,
      city,
      country,
    }),
  ]);
  const extract = resolved.extract;
  const wikiTitleStored = resolved.wikiTitle;

  let image_url =
    seedUrl ||
    (place.commons_file && !seedImageUnreliable && !isBadImageUrl(WC(place.commons_file))
      ? WC(place.commons_file)
      : "") ||
    apiImage;

  if (isBadImageUrl(image_url)) {
    const retry = await resolvePlaceImage(
      {
        placeName: place.name,
        wikiTitle: place.wiki_title,
        city,
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
      `"${place.name}" (${city}): липсват GPS координати — не се качва.`
    );
  }
  if (
    !trustSeed &&
    isVaguePlace(place.name, place.description, country, place.lat, place.lng) &&
    process.env.RELAX_MICROSTATE !== "1"
  ) {
    const hasSeedImage = Boolean(place.image_url?.trim() && !isBadImageUrl(place.image_url));
    const coordsInCountry = isCoordInCountry(place.lat, place.lng, country);
    const namedLandmark = /\b(museum|castle|cathedral|mosque|monastery|tower|palace|theatre|theater|library|fortress|ruins|basilica|amphitheatre|amphitheater|open air|underground|cistern|bazaar|clock|gate|bridge|viewpoint|monks valley|valley|trail|trails|sunset point|cave| gorge|canyon|waterfall|national park|church|chapel|stadium|forum|garden|casino|port|heliport|memorial|statue|observatory|aquarium|gallery|market|square|station|university|fort|lighthouse|dam|reservoir|park|parc|area|river|harbor|harbour|esker|rapids|brewery|spa|water park|airport|district|quarter|old town|citadel|neighbourhood|neighborhood|bay|promenade|nature park|reserve|ski)\b/i.test(
      place.name
    );
    if (!(hasSeedImage && (coordsInCountry || namedLandmark))) {
      throw new Error(
        `"${place.name}" (${city}, ${country}): зона/регион — нужна е конкретна забележителност.`
      );
    }
  }
  if (!image_url || isBadImageUrl(image_url)) {
    throw new Error(
      `"${place.name}" (${city}, ${country}): няма Wikimedia снимка — не се качва.`
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

  const mapsQuery = place.maps_query?.trim() || `${place.name}, ${city}, ${country}`;
  const googleMeta = {
    ...(place.google_place_id?.trim()
      ? { google_place_id: place.google_place_id.trim() }
      : {}),
    ...(place.formatted_address?.trim()
      ? { formatted_address: place.formatted_address.trim() }
      : {}),
    ...(place.maps_url?.trim() ? { maps_url: place.maps_url.trim() } : {}),
  };

  return {
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    order_index: place.order_index ?? index,
    image_url,
    translations: makeTranslations(
      description,
      wiki_text,
      wikiTitleStored,
      place.formatted_address?.trim() || mapsQuery,
      place.seo_keywords,
      place.seo_phrase,
      place.commons_file,
      { ...placeMetaFromSeed(place), ...googleMeta }
    ),
  };
}

async function enrichPlacesSequential(
  places: TravelSeedPlace[],
  city: string,
  country: string,
  trustSeed = false
) {
  const usedImages = new Set<string>();
  const out: EnrichedSeedPlace[] = [];
  for (let i = 0; i < places.length; i++) {
    try {
      out.push(
        await enrichPlace(places[i], i, city, country, usedImages, { trustSeed })
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[seed] Skip "${places[i].name}" (${city}): ${msg}`);
    }
    if (process.env.SEQUENTIAL_WIKI === "1" && i < places.length - 1) {
      const delay = Number(process.env.WIKI_DELAY_MS || 350);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  if (out.length === 0) {
    throw new Error(`"${city}": нито едно място не мина валидация (GPS + Wikimedia).`);
  }
  return out;
}

/** Обогатява целия seed с Wikipedia снимки и история */
function shouldTrustTravelSeed(seed: TravelSeedFile): boolean {
  if (process.env.TRUST_SEED === "1") return true;
  const places = seed.cities.flatMap((c) => c.places ?? []);
  if (places.length < 90) return false;
  const withImage = places.filter((p) => p.image_url?.trim()).length;
  return withImage >= Math.floor(places.length * 0.85);
}

export async function enrichTravelSeed(
  seed: TravelSeedFile,
  onProgress?: (msg: string) => void
): Promise<EnrichedTravelSeed> {
  const enrichedCities: EnrichedSeedCity[] = [];
  const trustSeed = shouldTrustTravelSeed(seed);
  if (trustSeed) onProgress?.(`  ✓ trust seed images (${seed.country})`);

  for (const city of seed.cities) {
    onProgress?.(`Обогатяване: ${city.city}...`);

    const places = await enrichPlacesSequential(
      city.places,
      city.city,
      seed.country,
      trustSeed
    );

    enrichedCities.push({
      city: city.city,
      tags: city.tags ?? ["spring", "summer"],
      wiki_title: city.wiki_title ?? city.city,
      seo: city.seo ?? {},
      places,
    });
  }

  return {
    country: seed.country,
    published: seed.published !== false,
    cities: enrichedCities,
  };
}

/** Статистика за preview преди импорт */
export function seedStats(seed: TravelSeedFile) {
  const placeCount = seed.cities.reduce((n, c) => n + c.places.length, 0);
  const isComplete =
    seed.cities.length === COUNTRY_SEED_SPEC.citiesPerCountry &&
    placeCount === COUNTRY_SEED_SPEC.placesPerCountry &&
    seed.cities.every(
      (c) => c.places.length === COUNTRY_SEED_SPEC.placesPerCity
    );

  return {
    country: seed.country,
    cityCount: seed.cities.length,
    placeCount,
    expectedCities: COUNTRY_SEED_SPEC.citiesPerCountry,
    expectedPlaces: COUNTRY_SEED_SPEC.placesPerCountry,
    isComplete,
    cities: seed.cities.map((c) => ({
      city: c.city,
      places: c.places.length,
      isComplete: c.places.length === COUNTRY_SEED_SPEC.placesPerCity,
    })),
  };
}

/** Празен шаблон за копиране */
export function emptySeedTemplate(country: string): TravelSeedFile {
  return {
    version: 1,
    country,
    cities: [
      {
        city: "City Name",
        tags: ["spring", "summer"],
        wiki_title: "City Name",
        seo: {
          title: "Top 10 Things to Do in City Name, Country",
          description: "Long-tail meta description for Google.",
          intro: "Intro paragraph visible on the city page.",
          keywords: ["things to do in City Name", "City Name travel guide"]
        },
        places: [
          {
            name: "Landmark Name",
            wiki_title: "Landmark Wikipedia Title",
            lat: 0,
            lng: 0,
            seo_phrase: "Landmark Name — things to do in City Name, Country",
            seo_keywords: ["Landmark Name City Name", "visit Landmark Name"]
          },
        ],
      },
    ],
    adventure: emptyAdventureTemplate(country),
  };
}
