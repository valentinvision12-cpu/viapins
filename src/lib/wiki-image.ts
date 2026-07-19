/**
 * Wikipedia / Wikimedia Commons Image & Text Resolver
 *
 * Every landmark → photo via place name + city + country (Commons search),
 * then Wikipedia pageimage. Works for all countries without manual maps.
 */

import { unstable_cache } from "next/cache";
import {
  hasConflictingGeoSignals,
  resolveVerifiedPlaceImage,
  resolveVerifiedWikiTitle,
  scoreImageGeoMatch,
  verifyPlaceImage,
  type PlaceVerifyContext,
} from "@/lib/place-image-verify";

const WP_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const UA = "ViaPins/1.0 (https://viapins.com)";
const WEEK = 604800;

const BAD_IMAGE =
  /icon|flag|v[ėē]liava|karogs?|karoga|fahne|drapeau|bandiera|bandera|z[áa]szl[oó]|flaga|logo|map|coat|gerb|ģerbonis|seal|diagram|svg|plan|chart|graph|locator|location.?map|relief|sketch|blank|orthophoto|satellite|aerial.?view|openstreetmap|osm-|route.?map|topographic|emblem|banner|placeholder|thumbnail|collage|montage|distribution|outline|boundary|infobox|symbol|pictogram|clip.?art|vector|reflection|nude|naked|erotic|nsfw|porn|fetish|occult|satanic|satan|baphomet|pentagram|\bdemon\b|toilet|bathroom|restroom|\bwc\b|lavatory|urinal|\bsink\b|faucet|selfie|self-portrait|portrait|headshot|close.?up|closeup|mirror.?selfie|blurry|out.?of.?focus|low.?res|pixelated|screenshot|screen.?shot|\bIMG_\d{3,}|\bDSC[_-]?\d{3,}|\bP\d{7,}\b|makeup|hair.?salon|hotel.?room|bedroom|car.?interior|license.?plate|food.?court|restaurant.?interior|pushpin|push.?pin|red.?dot|blue.?dot|marker.?map|dot.?map|highlighted|geographic.?map|political.?map|physical.?map|administrative.?map|counties.?of|provinces.?of|departments.?of|regions.?of|municipalities.?of|location.?in|\bin_[a-z]|_in_[a-z]|carte_|_carte|karte_|_karte|mapa_|_mapa|mappa_|_mappa|lageplan|situation.?plan|floor.?plan|site.?plan|schematic|geo.?map|atlas.?map|island.?map|city.?map|street.?map|road.?map|transport.?map|metro.?map|subway.?map|bus.?map|train.?map|rail.?map|harbour.?map|harbor.?map|port.?map|airport.?map|unesco.?map|heritage.?map|national.?map|country.?map|world.?map|europe.?map|relief.?map|terrain.?map|elevation.?map|contour|isohyet|isotherm/i;

/** Personal / off-topic photos — reject even if landmark search matched weakly */
const OFF_TOPIC_IMAGE =
  /\b(selfie|portrait|headshot|wedding|party|model|makeup|bikini|swimsuit|toilet|bathroom|restroom|lavatory|urinal|mirror|cemetery|graveyard|graves?|tombstone|headstone|burial|funeral|churchyard|necropolis|ossuary|catacomb|mortuary|cremator|war.?grave|memorial.?cross|funerary|charnel|mumm(y|ies)|sarcophag)\b/i;

const ALLOWED_LICENSE =
  /public domain|cc0|cc.?by|creative commons|gfdl|pd-|free art|no restrictions/i;

if (
  process.env.NODE_ENV === "development" &&
  process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export interface PlaceImageContext {
  placeName: string;
  wikiTitle?: string;
  city?: string;
  country?: string;
  commonsFile?: string;
  lat?: number;
  lng?: number;
  mapsQuery?: string;
  /** Skip Wikipedia pageimage — use when retrying duplicate images */
  preferCommons?: boolean;
  avoidUrls?: Set<string>;
}

function verifyCtx(ctx: PlaceImageContext): PlaceVerifyContext {
  return {
    placeName: ctx.placeName,
    wikiTitle: ctx.wikiTitle,
    city: ctx.city,
    country: ctx.country,
    lat: ctx.lat,
    lng: ctx.lng,
    mapsQuery: ctx.mapsQuery,
  };
}

async function fetchJSON(url: string, retries = 3): Promise<Record<string, unknown>> {
  const baseDelay = Number(process.env.WIKI_DELAY_MS || 0);
  if (baseDelay > 0) {
    await new Promise((r) => setTimeout(r, baseDelay));
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        ...(typeof process.env.NEXT_RUNTIME === "string"
          ? { next: { revalidate: WEEK } }
          : {}),
      });
      if (res.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        console.warn("[wiki-image] HTTP", res.status, url.slice(0, 90));
        return {};
      }
      return (await res.json()) as Record<string, unknown>;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error(
        "[wiki-image] fetch error:",
        err instanceof Error ? err.message.slice(0, 120) : String(err)
      );
      return {};
    }
  }
  return {};
}

function firstPage(
  data: Record<string, unknown>
): Record<string, unknown> | null {
  const pages = (data as { query?: { pages?: Record<string, unknown> } })
    ?.query?.pages;
  if (!pages || typeof pages !== "object") return null;
  const first = Object.values(pages)[0];
  return first && typeof first === "object"
    ? (first as Record<string, unknown>)
    : null;
}

function decodeImagePath(url: string): string {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname + u.search).replace(/\+/g, " ");
  } catch {
    return url;
  }
}

function isDisambiguation(text: string): boolean {
  return (
    /may refer to/i.test(text) ||
    /can refer to/i.test(text) ||
    text.length < 40
  );
}

function isBadImageCandidate(title: string, url = ""): boolean {
  const hay = `${title} ${decodeImagePath(url)}`.toLowerCase();
  return BAD_IMAGE.test(hay) || OFF_TOPIC_IMAGE.test(hay);
}

/** Reject wide/low-detail assets that are usually locator maps, not landmark photos. */
function isLikelyMapDimensions(width: number, height: number, title: string, url: string): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  const hay = `${title} ${decodeImagePath(url)}`.toLowerCase();
  if (ratio > 2.4 && /map|location|carte|karte|mapa|outline|region|district|province|in_/.test(hay)) {
    return true;
  }
  if (width < 640 && height < 480 && /map|location|svg|dot|marker|pushpin/.test(hay)) {
    return true;
  }
  return false;
}

/** True when URL looks like a map, diagram, or other non-photo asset. */
export function isBadImageUrl(url: string): boolean {
  if (!url.trim()) return true;
  return isBadImageCandidate("", url);
}

function isAllowedLicense(license: string): boolean {
  if (!license.trim()) return true;
  return ALLOWED_LICENSE.test(license.toLowerCase());
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** City/country wiki used for many places → Wikipedia thumb is usually wrong. */
export function isGenericWikiTitle(
  wikiTitle: string | undefined,
  placeName: string,
  city?: string,
  country?: string
): boolean {
  if (!wikiTitle?.trim()) return true;
  const w = norm(wikiTitle);
  const name = norm(placeName);
  if (w === name) return false;
  if (city && w === norm(city)) return true;
  if (country && w === norm(country)) return true;
  return false;
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function scoreCommonsMatch(
  fileTitle: string,
  placeName: string,
  city?: string,
  country?: string,
  ctx?: PlaceImageContext
): number {
  const title = fileTitle.toLowerCase();
  const words = placeName
    .toLowerCase()
    .split(/[\s,()\-–—]+/)
    .filter((w) => w.length > 2);
  let score = words.reduce((n, w) => (title.includes(w) ? n + 1 : n), 0);
  if (city && title.includes(city.toLowerCase())) score += 2;
  if (country && title.includes(country.toLowerCase())) score += 1;
  if (ctx) {
    score += scoreImageGeoMatch(verifyCtx(ctx), "", fileTitle);
    if (hasConflictingGeoSignals(verifyCtx(ctx), "", fileTitle)) score -= 50;
  }
  return score;
}

/** Direct Commons thumbnail URL (Special:FilePath redirect). */
export function commonsFileUrl(fileName: string, width = 900): string {
  const clean = fileName.replace(/^File:\s*/i, "");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=${width}`;
}

async function getCommonsFileThumb(
  fileName: string,
  thumbSize: number
): Promise<string> {
  const title = fileName.startsWith("File:") ? fileName : `File:${fileName}`;
  if (isBadImageCandidate(title)) return "";

  const p = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: String(Math.max(thumbSize, 1200)),
    format: "json",
  });
  const data = await fetchJSON(`${COMMONS_API}?${p}`);
  const page = firstPage(data);
  const info = (
    (page as { imageinfo?: Record<string, unknown>[] })?.imageinfo ?? []
  )[0] as
    | {
        thumburl?: string;
        url?: string;
        width?: number;
        height?: number;
        extmetadata?: { LicenseShortName?: { value?: string } };
      }
    | undefined;

  if (!info) return "";

  const w = info.width ?? 0;
  const h = info.height ?? 0;
  if (w > 0 && w < 700) return "";
  if (h > 0 && h < 400) return "";
  if (isLikelyMapDimensions(w, h, title, info.thumburl || info.url || "")) return "";

  const license = info.extmetadata?.LicenseShortName?.value ?? "";
  if (license && !isAllowedLicense(license)) return "";

  const url = info.thumburl || info.url || "";
  if (!url || isBadImageCandidate(title, url)) return "";
  return url;
}

function acceptVerifiedImage(
  ctx: PlaceImageContext,
  url: string,
  fileTitle = "",
  avoidUrls?: Set<string>
): boolean {
  if (!url || isBadImageUrl(url) || avoidUrls?.has(url)) return false;
  return verifyPlaceImage(verifyCtx(ctx), url, fileTitle).ok;
}

async function getWikipediaPageImage(
  wikiTitle: string,
  thumbSize: number
): Promise<string> {
  const p = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    pithumbsize: String(thumbSize),
    format: "json",
    titles: wikiTitle,
    redirects: "1",
  });
  const data = await fetchJSON(`${WP_API}?${p}`);
  const page = firstPage(data);
  const thumb = (page as { thumbnail?: { source?: string; width?: number; height?: number } })?.thumbnail;
  const src = thumb?.source;
  if (!src || isBadImageCandidate(wikiTitle, src)) return "";
  if (
    thumb?.width &&
    thumb?.height &&
    isLikelyMapDimensions(thumb.width, thumb.height, wikiTitle, src)
  ) {
    return "";
  }
  return src;
}

async function searchCommonsPhotos(
  query: string,
  thumbSize: number,
  placeName: string,
  city?: string,
  country?: string,
  limit = 16
): Promise<string> {
  const p = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "6",
    srlimit: String(limit),
    format: "json",
  });
  const data = await fetchJSON(`${COMMONS_API}?${p}`);
  const files = (
    (data as { query?: { search?: { title?: string }[] } })?.query?.search ??
    []
  ) as { title?: string }[];

  const candidates: { title: string; score: number }[] = [];
  for (const file of files) {
    const title = file.title ?? "";
    if (!/\.(jpe?g|png|webp)$/i.test(title)) continue;
    if (isBadImageCandidate(title)) continue;
    const score = scoreCommonsMatch(title, placeName, city, country, {
      placeName,
      city,
      country,
    });
    const minScore = placeName.split(/\s+/).length > 1 ? 2 : 3;
    if (score < minScore) continue;
    if (hasConflictingGeoSignals({ placeName, city, country }, "", title)) continue;
    candidates.push({ title, score });
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const { title } of candidates) {
    const url = await getCommonsFileThumb(title, thumbSize);
    if (url) return url;
  }

  return "";
}

/** Country covers: verified Commons file or Wikipedia lead image only — no broad search. */
export async function resolveStrictLandmarkImage(
  wikiTitle: string,
  options?: { commonsFile?: string; thumbSize?: number }
): Promise<string> {
  const thumbSize = Math.max(options?.thumbSize ?? 1400, 1200);
  const title = wikiTitle.trim();
  if (!title) return "";

  if (options?.commonsFile?.trim()) {
    const preset = await getCommonsFileThumb(options.commonsFile, thumbSize);
    if (preset && !isBadImageUrl(preset)) return preset;
  }

  const wikiImg = await getWikipediaPageImage(title, thumbSize);
  if (wikiImg && !isBadImageUrl(wikiImg)) return wikiImg;

  return "";
}

function buildCommonsQueries(ctx: PlaceImageContext): string[] {
  const { placeName, wikiTitle, city, country } = ctx;
  const genericWiki = isGenericWikiTitle(wikiTitle, placeName, city, country);

  return uniqueStrings([
    city && country ? `${placeName} ${city} ${country}` : "",
    country ? `${placeName} ${country}` : "",
    city ? `${placeName} ${city}` : "",
    placeName,
    !genericWiki && wikiTitle && country ? `${wikiTitle} ${country}` : "",
    !genericWiki && wikiTitle ? wikiTitle : "",
  ]);
}

async function _resolvePlaceImage(
  ctx: PlaceImageContext,
  thumbSize: number
): Promise<string> {
  const { placeName, wikiTitle, commonsFile, preferCommons, avoidUrls } = ctx;
  if (!placeName.trim() && !wikiTitle?.trim() && !commonsFile?.trim()) return "";

  const accept = (url: string, fileTitle = "") =>
    acceptVerifiedImage(ctx, url, fileTitle, avoidUrls);

  const verifiedWiki = await resolveVerifiedWikiTitle(verifyCtx(ctx));
  const wikiTitleResolved =
    verifiedWiki && verifiedWiki !== wikiTitle ? verifiedWiki : wikiTitle;

  if (!preferCommons) {
    const verified = await resolveVerifiedPlaceImage(verifyCtx(ctx), thumbSize);
    if (accept(verified)) return verified;
  }

  if (commonsFile?.trim()) {
    const preset = await getCommonsFileThumb(commonsFile, thumbSize);
    const fileTitle = commonsFile.startsWith("File:") ? commonsFile : `File:${commonsFile}`;
    if (accept(preset, fileTitle)) return preset;
  }

  const genericWiki = isGenericWikiTitle(wikiTitleResolved, placeName, ctx.city, ctx.country);
  if (!preferCommons && wikiTitleResolved?.trim() && !genericWiki) {
    const wikiImg = await getWikipediaPageImage(wikiTitleResolved, thumbSize);
    if (accept(wikiImg, wikiTitleResolved)) return wikiImg;
  }

  for (const query of buildCommonsQueries(ctx)) {
    const url = await searchCommonsPhotos(
      query,
      thumbSize,
      placeName,
      ctx.city,
      ctx.country
    );
    if (accept(url)) return url;
  }

  if (wikiTitleResolved?.trim() && genericWiki && !placeName.includes(" ")) {
    return "";
  }

  if (wikiTitleResolved?.trim()) {
    const wikiImg = await getWikipediaPageImage(wikiTitleResolved, thumbSize);
    if (accept(wikiImg, wikiTitleResolved)) return wikiImg;
  }

  return "";
}

export async function resolvePlaceImage(
  ctx: PlaceImageContext,
  thumbSize = 900
): Promise<string> {
  // Don't cache when deduplicating — avoidUrls changes per place in a city list.
  if (ctx.avoidUrls?.size) {
    return _resolvePlaceImage(ctx, thumbSize);
  }

  const key = [
    ctx.placeName,
    ctx.wikiTitle ?? "",
    ctx.city ?? "",
    ctx.country ?? "",
    ctx.commonsFile ?? "",
    ctx.preferCommons ? "1" : "0",
    String(thumbSize),
  ].join("|");

  try {
    return await unstable_cache(
      () => _resolvePlaceImage(ctx, thumbSize),
      ["place-img", key],
      { revalidate: WEEK, tags: ["wiki-images"] }
    )();
  } catch {
    return _resolvePlaceImage(ctx, thumbSize);
  }
}

/** @deprecated Prefer resolvePlaceImage — kept for existing call sites */
export async function getWikiImage(
  wikiTitle: string,
  thumbSize = 900,
  commonsFile?: string,
  placeName?: string,
  city?: string,
  country?: string
): Promise<string> {
  return resolvePlaceImage(
    {
      placeName: placeName ?? wikiTitle,
      wikiTitle,
      city,
      country,
      commonsFile,
    },
    thumbSize
  );
}

async function _getWikiExtract(wikiTitle: string): Promise<string> {
  if (!wikiTitle.trim()) return "";

  const p = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "true",
    explaintext: "true",
    exsentences: "4",
    format: "json",
    titles: wikiTitle,
    redirects: "1",
  });
  const data = await fetchJSON(`${WP_API}?${p}`);
  const page = firstPage(data);
  const extract =
    (page as { extract?: string })?.extract?.trim().replace(/\n+/g, " ") ?? "";
  if (!extract || isDisambiguation(extract)) return "";
  return extract;
}

export async function getWikiExtract(wikiTitle: string): Promise<string> {
  try {
    return await unstable_cache(
      () => _getWikiExtract(wikiTitle),
      ["wiki-ext", wikiTitle],
      { revalidate: WEEK, tags: ["wiki-extracts"] }
    )();
  } catch {
    return _getWikiExtract(wikiTitle);
  }
}

function uniqueTitles(items: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item?.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

async function wikiSearch(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const p = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "5",
    format: "json",
  });
  const data = await fetchJSON(`${WP_API}?${p}`);
  const hits =
    (data as { query?: { search?: { title?: string }[] } })?.query?.search ??
    [];
  return hits.map((h) => h.title ?? "").filter(Boolean);
}

async function wikiOpenSearch(query: string): Promise<string[]> {
  return wikiSearch(query);
}

async function _getWikiRestSummary(wikiTitle: string): Promise<string> {
  if (!wikiTitle.trim()) return "";
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    wikiTitle.replace(/ /g, "_")
  )}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      extract?: string;
      description?: string;
      type?: string;
    };
    if (data.type === "disambiguation") return "";
    const text = (data.extract || data.description || "").trim();
    if (!text || isDisambiguation(text)) return "";
    return text.replace(/\n+/g, " ");
  } catch {
    return "";
  }
}

async function getExtractForTitle(title: string): Promise<string> {
  const fromApi = await _getWikiExtract(title);
  if (fromApi) return fromApi;
  return _getWikiRestSummary(title);
}

function scoreExtract(
  extract: string,
  placeName: string,
  city?: string,
  country?: string
): number {
  let score = Math.min(extract.length, 400);
  const low = extract.toLowerCase();
  if (city && low.includes(city.toLowerCase())) score += 500;
  if (country && low.includes(country.toLowerCase())) score += 200;
  if (city?.toLowerCase() === "kobe" && /\bkyoto\b/i.test(low)) score -= 2500;
  if (city && !low.includes(city.toLowerCase()) && /\b(shrine|temple|museum|park|district)\b/i.test(placeName)) {
    const wrongCities = ["tokyo", "kyoto", "osaka", "nara", "yokohama", "nagoya", "sapporo", "fukuoka", "kanazawa"]
      .filter((c) => c !== city.toLowerCase());
    if (wrongCities.some((c) => low.includes(c))) score -= 1500;
  }
  const nameWords = placeName
    .split(/[\s,\-–—]+/)
    .filter((w) => w.length > 3);
  const matched = nameWords.filter((w) =>
    low.includes(w.toLowerCase())
  ).length;
  score += matched * 120;
  if (nameWords.length && matched === 0) score -= 800;
  if (/\b(song|single|album|band)\b/i.test(extract) && !/\b(song|single|album)\b/i.test(placeName)) {
    score -= 2000;
  }
  return score;
}

function titleMatchesContext(
  title: string,
  placeName: string,
  city?: string,
  country?: string
): boolean {
  const t = title.toLowerCase();
  if (city && t.includes(city.toLowerCase())) return true;
  if (country && t.includes(country.toLowerCase())) return true;
  if (country === "Croatia" && t.includes("croatia")) return true;
  const words = placeName.split(/[\s,\-–—]+/).filter((w) => w.length > 3);
  return words.some((w) => t.includes(w.toLowerCase()));
}

/** Try several titles + Wikipedia search; return best intro extract. */
export async function resolveWikiExtract(
  placeName: string,
  options?: { wikiTitle?: string; city?: string; country?: string }
): Promise<{ extract: string; wikiTitle: string }> {
  const city = options?.city?.trim();
  const country = options?.country?.trim();
  let base = (options?.wikiTitle || placeName).trim();
  base = base.replace(/\.(jpg|jpeg|png|webp)$/i, "").trim();

  // Hard-coded high-value fallbacks for ambiguous short names
  if (/peristil|peristyle/i.test(placeName)) {
    const palace = await getExtractForTitle("Diocletian's Palace");
    if (palace) return { extract: palace, wikiTitle: "Diocletian's Palace" };
  }
  if (placeName.toLowerCase() === "riva" && city?.toLowerCase() === "split") {
    const split = await getExtractForTitle("Split, Croatia");
    if (split) return { extract: split, wikiTitle: "Split, Croatia" };
  }
  if (/kitano-?cho/i.test(placeName) && city?.toLowerCase() === "kobe") {
    for (const title of ["Kitano Ijinkan", "Kitano-chō"]) {
      const extract = await getExtractForTitle(title);
      if (extract && /\bkobe\b/i.test(extract)) {
        return { extract, wikiTitle: title };
      }
    }
  }
  if (/earthquake memorial/i.test(placeName) && city?.toLowerCase() === "kobe") {
    const title =
      "The Great Hanshin-Awaji Earthquake Memorial Disaster Reduction and Human Renovation Institution";
    const extract = await getExtractForTitle(title);
    if (extract) return { extract, wikiTitle: title };
  }

  const candidates = uniqueTitles([
    base,
    placeName,
    `${placeName}, ${city}`,
    `${placeName} (${city})`,
    `${city} ${placeName}`,
    `${placeName}, ${country}`,
  ]);

  if (/meštrović/i.test(placeName) && /gallery/i.test(placeName)) {
    candidates.unshift("Ivan Meštrović Gallery");
  }
  if (/peristil|peristyle/i.test(placeName)) {
    candidates.unshift("Diocletian's Palace");
  }
  if (placeName.toLowerCase() === "riva" && city?.toLowerCase() === "split") {
    candidates.unshift("Split, Croatia");
  }
  if (placeName.length <= 5 && city) {
    candidates.push(`History of ${city}`);
    candidates.push(`${city}, ${country}`);
  }

  const searchQueries = uniqueTitles([
    `${placeName} ${city} ${country}`,
    `${placeName} ${city}`,
    `${placeName} ${country}`,
  ]);

  let best = { extract: "", wikiTitle: candidates[0] || placeName, score: 0 };

  for (const title of candidates.slice(0, 8)) {
    const extract = await getExtractForTitle(title);
    if (!extract) continue;
    const score = scoreExtract(extract, placeName, city, country);
    if (score > best.score) {
      best = { extract, wikiTitle: title, score };
    }
    if (score >= 700) break;
  }

  if (best.score < 400) {
    for (const q of searchQueries) {
      const found = await wikiOpenSearch(q);
      for (const title of found) {
        if (!titleMatchesContext(title, placeName, city, country)) continue;
        if (candidates.some((c) => c.toLowerCase() === title.toLowerCase())) continue;
        candidates.push(title);
        const extract = await getExtractForTitle(title);
        if (!extract) continue;
        const score = scoreExtract(extract, placeName, city, country);
        if (score > best.score) {
          best = { extract, wikiTitle: title, score };
        }
        if (score >= 700) break;
      }
      if (best.score >= 700) break;
    }
  }

  if (best.score < 150) {
    return { extract: "", wikiTitle: candidates[0] || placeName };
  }

  return { extract: best.extract, wikiTitle: best.wikiTitle };
}

type StoredPlace = {
  name?: string;
  image_url: string;
  translations: Record<
    string,
    {
      description: string;
      wiki_text: string;
      wiki_title?: string;
      commons_file?: string;
    }
  >;
};

async function resolveOneStoredPlace<T extends StoredPlace>(
  place: T,
  city: string | undefined,
  country: string | undefined,
  avoidUrls: Set<string>
): Promise<T> {
  const en =
    place.translations.en ??
    Object.values(place.translations).find((t) => t.wiki_title);

  const wiki = en?.wiki_title;
  const commons = en?.commons_file;
  const placeName = place.name ?? wiki ?? "";

  if (place.image_url && !isBadImageUrl(place.image_url)) {
    return { ...place, image_url: place.image_url };
  }

  let image = await resolvePlaceImage({
    placeName,
    wikiTitle: wiki,
    city,
    country,
    commonsFile: commons,
    avoidUrls,
  });

  if (image && isBadImageUrl(image)) image = "";

  if (!image && place.image_url && !isBadImageUrl(place.image_url)) {
    image = place.image_url;
  }

  if (image && avoidUrls.has(image)) {
    const retry = await resolvePlaceImage({
      placeName,
      wikiTitle: wiki,
      city,
      country,
      commonsFile: commons,
      preferCommons: true,
      avoidUrls,
    });
    if (retry) image = retry;
  }

  let extract = "";
  if (wiki && !isGenericWikiTitle(wiki, placeName, city, country)) {
    extract = await getWikiExtract(wiki);
  } else if (wiki) {
    extract = await getWikiExtract(placeName);
  }

  const translations = extract
    ? (Object.fromEntries(
        Object.entries(place.translations).map(([lang, content]) => [
          lang,
          { ...content, wiki_text: extract || content.wiki_text },
        ])
      ) as T["translations"])
    : place.translations;

  return { ...place, image_url: image, translations };
}

/** Resolve images for DB-backed places — works for every city/country. */
export async function resolveStoredPlaces<T extends StoredPlace>(
  places: T[],
  city?: string,
  country?: string
): Promise<T[]> {
  const resolved = await Promise.all(
    places.map((place) =>
      resolveOneStoredPlace(place, city, country, new Set())
    )
  );

  // Second pass: fix duplicate images within the same city
  const dupUrls = new Set<string>();
  const counts = new Map<string, number>();
  for (const p of resolved) {
    if (!p.image_url) continue;
    counts.set(p.image_url, (counts.get(p.image_url) ?? 0) + 1);
  }
  for (const [url, n] of counts) {
    if (n > 1) dupUrls.add(url);
  }

  if (dupUrls.size === 0) return resolved;

  return Promise.all(
    resolved.map(async (place) => {
      if (!place.image_url || !dupUrls.has(place.image_url)) return place;

      const en = place.translations.en ?? Object.values(place.translations)[0];
      const avoid = new Set(
        resolved
          .filter((p) => p.image_url && p !== place)
          .map((p) => p.image_url)
      );

      const retry = await resolvePlaceImage({
        placeName: place.name ?? "",
        wikiTitle: en?.wiki_title,
        city,
        country,
        commonsFile: en?.commons_file,
        preferCommons: true,
        avoidUrls: avoid,
      });

      return retry ? { ...place, image_url: retry } : place;
    })
  );
}

export async function resolveWikiPlaces<
  T extends {
    name?: string;
    wiki_title?: string;
    region?: string;
    country?: string;
    image_url: string;
    translations: Record<string, { description: string; wiki_text: string }>;
  }
>(places: T[]): Promise<T[]> {
  const country = places[0]?.country ?? "";
  const usedUrls = new Set<string>();
  const resolved: T[] = [];

  for (const place of places) {
    const image = await resolvePlaceImage({
      placeName: place.name ?? place.wiki_title ?? "",
      wikiTitle: place.wiki_title,
      city: place.region,
      country: place.country ?? country,
      avoidUrls: usedUrls,
    });

    let finalImage = image;
    if (!finalImage && place.image_url && !isBadImageUrl(place.image_url)) {
      finalImage = place.image_url;
    }

    const wiki = place.wiki_title;
    const extract = wiki ? await getWikiExtract(wiki) : "";

    const translations = Object.fromEntries(
      Object.entries(place.translations).map(([lang, content]) => [
        lang,
        { ...content, wiki_text: extract || content.wiki_text },
      ])
    ) as T["translations"];

    const item = { ...place, image_url: finalImage, translations };
    if (finalImage) usedUrls.add(finalImage);
    resolved.push(item);
  }

  return resolved;
}

export async function resolveWikiImages<
  T extends { name?: string; wiki_title?: string; image_url: string }
>(items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const apiImage = await resolvePlaceImage({
        placeName: item.name ?? item.wiki_title ?? "",
        wikiTitle: item.wiki_title,
      });
      return { ...item, image_url: apiImage || item.image_url };
    })
  );
}
