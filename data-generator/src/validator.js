import { mapsUrl, slugify, wikipediaUrl, wikidataUrl } from "./utils.js";
import {
  inferPlaceType,
  inferPlaceSeasons,
  inferPlaceCategoryTags,
  inferAdventureSeasons,
  visitDurationHours,
} from "./seasons.js";

/**
 * Required fields for a validated record.
 */
export function validateRecord(raw) {
  if (!raw?.name?.trim()) return { ok: false, reason: "missing name" };
  if (!Number.isFinite(raw.lat) || !Number.isFinite(raw.lng)) {
    return { ok: false, reason: "missing coordinates" };
  }
  if (!raw.wikidata_id && !raw.id) return { ok: false, reason: "missing wikidata id" };
  if (!raw.wikipedia_url && !raw.wikipedia_title) {
    return { ok: false, reason: "missing wikipedia" };
  }
  if (!raw.image_url || !raw.image_license) {
    return { ok: false, reason: "missing CC0/PD image" };
  }
  return { ok: true };
}

export function toAttractionRecord(raw, cityMeta, idx) {
  const wikidata_id = raw.wikidata_id || raw.id;
  const wikiTitle = raw.wikipedia_title;
  const type = raw.type || inferPlaceType(raw.name);
  const best_season = raw.best_season || inferPlaceSeasons(raw.name, type);
  const categoryTags = inferPlaceCategoryTags(raw.name, type);
  return {
    id: `${slugify(cityMeta.slug || cityMeta.name)}-${slugify(raw.name)}`,
    name: raw.name,
    city: cityMeta.name,
    region: raw.region || cityMeta.region || cityMeta.country,
    country: cityMeta.country,
    latitude: raw.lat,
    longitude: raw.lng,
    google_maps_url: mapsUrl(raw.lat, raw.lng),
    wikipedia_url: raw.wikipedia_url || (wikiTitle ? wikipediaUrl(wikiTitle) : null),
    wikidata_id,
    wikidata_url: wikidataUrl(wikidata_id),
    image_url: raw.image_url,
    image_source: raw.image_source || "Wikimedia Commons",
    image_license: raw.image_license,
    commons_file: raw.commons_file || null,
    seo_title: raw.seo_title || null,
    seo_description: raw.seo_description || null,
    type,
    best_season,
    tags: categoryTags,
    visit_duration_hours: visitDurationHours(type),
    order_index: idx,
  };
}

export function toAdventureRecord(raw, idx) {
  const wikidata_id = raw.wikidata_id || raw.id;
  const type = "nature";
  const best_season = inferAdventureSeasons(raw.name);
  return {
    id: `${slugify(raw.country)}-adv-${idx + 1}`,
    name: raw.name,
    region: raw.region || raw.country,
    country: raw.country,
    day: idx + 1,
    latitude: raw.lat,
    longitude: raw.lng,
    google_maps_url: mapsUrl(raw.lat, raw.lng),
    wikipedia_url: raw.wikipedia_url || wikipediaUrl(raw.wikipedia_title),
    wikidata_id,
    wikidata_url: wikidataUrl(wikidata_id),
    image_url: raw.image_url,
    image_source: raw.image_source || "Wikimedia Commons",
    image_license: raw.image_license,
    commons_file: raw.commons_file || null,
    seo_title: raw.seo_title || null,
    seo_description: raw.seo_description || null,
    type,
    best_season,
    tags: ["nature", "hidden_gem", "adventure", ...best_season],
    visit_duration_hours: 4,
    requires_car: true,
    order_index: idx,
  };
}

export function toCityRecord(city, countryName) {
  return {
    name: city.name,
    slug: slugify(city.name),
    region: city.region || countryName,
    country: countryName,
    latitude: city.lat,
    longitude: city.lng,
    google_maps_url: mapsUrl(city.lat, city.lng),
    wikipedia_url: city.wikipedia_url || (city.wikipedia_title ? wikipediaUrl(city.wikipedia_title) : null),
    wikidata_id: city.id,
    wikidata_url: wikidataUrl(city.id),
  };
}

/**
 * Pick N valid items from candidates + pool, resolving images as needed.
 */
export async function selectValidItems(candidates, pool, count, resolveImageFn, usedIds = new Set()) {
  const selected = [];
  const queue = [...candidates, ...pool];

  for (const item of queue) {
    if (selected.length >= count) break;
    if (usedIds.has(item.id)) continue;

    const img = await resolveImageFn(item);
    if (!img) continue;

    const enriched = {
      ...item,
      ...img,
      wikidata_id: item.id,
      wikipedia_url: item.wikipedia_title ? wikipediaUrl(item.wikipedia_title) : null,
    };

    const check = validateRecord(enriched);
    if (!check.ok) continue;

    usedIds.add(item.id);
    selected.push(enriched);
  }

  return { selected, usedIds };
}
