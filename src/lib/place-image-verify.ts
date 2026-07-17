/**
 * Verify that a landmark photo matches the intended place (city + country).
 * Rejects homonyms — e.g. Hagia Sophia (Istanbul) for Saint Sofia Church (Sofia, Bulgaria).
 *
 * Uses free sources: Wikipedia article match, OSM Nominatim, filename/geo signals.
 * Optional Google Places photo when GOOGLE_MAPS_API_KEY is set.
 */

const UA = "ViaPins/1.0 (https://viapins.com)";

export interface PlaceVerifyContext {
  placeName: string;
  wikiTitle?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  mapsQuery?: string;
  googlePlaceId?: string;
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  Turkey: ["turkey", "türkiye", "turkiye", "istanbul", "constantinople", "ayasofya", "ayasofa"],
  Bulgaria: ["bulgaria", "bulgarian", "sofia", "plovdiv", "varna"],
  Greece: ["greece", "greek", "athens", "thessaloniki"],
  Italy: ["italy", "italian", "rome", "roma", "milan", "venice"],
  France: ["france", "french", "paris"],
  Germany: ["germany", "german", "berlin", "munich"],
  Spain: ["spain", "spanish", "madrid", "barcelona"],
  Russia: ["russia", "russian", "moscow", "st petersburg"],
  Ukraine: ["ukraine", "ukrainian", "kyiv", "kiev", "lviv"],
  Japan: ["japan", "japanese", "tokyo", "osaka", "kyoto"],
  "United States": ["usa", "united states", "new york", "california"],
  "United Kingdom": ["uk", "united kingdom", "england", "london"],
};

const HOMONYM_RULES: {
  match: (ctx: PlaceVerifyContext) => boolean;
  reject: RegExp;
  allowIf?: RegExp;
}[] = [
  {
    match: (c) =>
      c.country === "Bulgaria" &&
      !!c.city?.toLowerCase().includes("sofia") &&
      /sophia|sofia church|st\.?\s*sophia|saint\s*sophia|sveta\s*sofia/i.test(c.placeName),
    reject: /\b(istanbul|constantinople|turkey|türkiye|turkiye|ayasofya|ayasofa)\b|hagia[\s_-]?sophia/i,
    allowIf: /\b(bulgaria|bulgarian|sofia|sveta|basilica_of_hagia_sofia)\b/i,
  },
  {
    match: (c) =>
      c.country === "Turkey" &&
      /hagia\s*sophia|ayasofya/i.test(c.placeName),
    reject: /\b(bulgaria|bulgarian|sofia,? bulgaria)\b/i,
    allowIf: /\b(istanbul|turkey|constantinople|ayasofya)\b/i,
  },
  {
    match: (c) =>
      c.country !== "Turkey" &&
      /hagia\s*sophia|ayasofya/i.test(c.placeName) &&
      !/bulgaria|sofia/i.test(`${c.city} ${c.country}`),
    reject: /\b(istanbul|constantinople|turkey|türkiye)\b/i,
  },
];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function decodePath(url: string): string {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname + u.search).replace(/\+/g, " ");
  } catch {
    return url;
  }
}

function haystack(url: string, fileTitle = ""): string {
  return `${fileTitle} ${decodePath(url)}`.toLowerCase();
}

export function hasConflictingGeoSignals(
  ctx: PlaceVerifyContext,
  url: string,
  fileTitle = ""
): boolean {
  const hay = haystack(url, fileTitle);
  const country = ctx.country?.trim();
  if (!country) return false;

  for (const rule of HOMONYM_RULES) {
    if (!rule.match(ctx)) continue;
    if (!rule.reject.test(hay)) continue;
    if (rule.allowIf?.test(hay)) continue;
    return true;
  }

  for (const [otherCountry, terms] of Object.entries(COUNTRY_ALIASES)) {
    if (otherCountry === country) continue;
    const hit = terms.some((t) => {
      if (t.length < 4) return new RegExp(`\\b${t}\\b`, "i").test(hay);
      return hay.includes(t);
    });
    if (!hit) continue;

    const ourTerms = COUNTRY_ALIASES[country] ?? [norm(country)];
    const hasOurGeo = ourTerms.some((t) => hay.includes(t));
    if (!hasOurGeo) return true;
  }

  return false;
}

export function scoreImageGeoMatch(
  ctx: PlaceVerifyContext,
  url: string,
  fileTitle = ""
): number {
  const hay = haystack(url, fileTitle);
  let score = 0;

  if (ctx.country && hay.includes(norm(ctx.country))) score += 3;
  if (ctx.city && hay.includes(norm(ctx.city))) score += 4;

  const words = ctx.placeName
    .toLowerCase()
    .split(/[\s,()\-–—]+/)
    .filter((w) => w.length > 3);
  score += words.filter((w) => hay.includes(w)).length;

  if (hasConflictingGeoSignals(ctx, url, fileTitle)) score -= 20;

  return score;
}

export function verifyPlaceImage(
  ctx: PlaceVerifyContext,
  url: string,
  fileTitle = ""
): { ok: boolean; reason?: string } {
  if (!url.trim()) return { ok: false, reason: "empty" };
  if (hasConflictingGeoSignals(ctx, url, fileTitle)) {
    return { ok: false, reason: "conflicting_geo" };
  }
  return { ok: true };
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function resolveVerifiedWikiTitle(
  ctx: PlaceVerifyContext
): Promise<string> {
  const { placeName, city, country, wikiTitle } = ctx;
  const candidates = [
    wikiTitle,
    placeName,
    `${placeName}, ${city}`,
    `${placeName} (${city})`,
    `${placeName}, ${country}`,
    city && country ? `${placeName} ${city} ${country}` : "",
  ].filter((t): t is string => !!t?.trim());

  for (const title of candidates) {
    const exists = await wikiArticleExists(title);
    if (!exists) continue;
    const ok = await wikiArticleMatchesPlace(title, placeName, city, country);
    if (ok) return title;
  }

  const q = [placeName, city, country].filter(Boolean).join(" ");
  const p = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: q,
    srlimit: "8",
    format: "json",
  });
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${p}`);
  const hits =
    (data as { query?: { search?: { title?: string }[] } })?.query?.search ??
    [];

  for (const hit of hits) {
    const title = hit.title ?? "";
    if (!title) continue;
    if (await wikiArticleMatchesPlace(title, placeName, city, country)) {
      return title;
    }
  }

  return wikiTitle?.trim() || placeName;
}

async function wikiArticleExists(title: string): Promise<boolean> {
  const p = new URLSearchParams({
    action: "query",
    titles: title,
    format: "json",
    redirects: "1",
  });
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${p}`);
  const pages = (data as { query?: { pages?: Record<string, { missing?: string }> } })
    ?.query?.pages;
  if (!pages) return false;
  const page = Object.values(pages)[0];
  return !page?.missing;
}

async function wikiArticleMatchesPlace(
  wikiTitle: string,
  placeName: string,
  city?: string,
  country?: string
): Promise<boolean> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    wikiTitle.replace(/ /g, "_")
  )}`;
  const data = (await fetchJson(url)) as {
    extract?: string;
    description?: string;
    type?: string;
    title?: string;
  };
  if (data.type === "disambiguation") return false;
  const text = `${data.extract ?? ""} ${data.description ?? ""} ${data.title ?? ""}`.toLowerCase();
  if (!text.trim()) return false;

  if (country && !text.includes(country.toLowerCase())) {
    if (city && !text.includes(city.toLowerCase())) return false;
  }

  const nameWords = placeName
    .split(/[\s,\-–—]+/)
    .filter((w) => w.length > 3)
    .map((w) => w.toLowerCase());
  const matched = nameWords.filter((w) => text.includes(w)).length;
  if (nameWords.length > 0 && matched === 0) return false;

  return true;
}

export async function getVerifiedWikiPageImage(
  wikiTitle: string,
  thumbSize = 900
): Promise<{ url: string; fileTitle: string } | null> {
  const p = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail|name",
    pithumbsize: String(thumbSize),
    titles: wikiTitle,
    redirects: "1",
    format: "json",
  });
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${p}`);
  const pages = (data as { query?: { pages?: Record<string, unknown> } })?.query
    ?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as {
    missing?: string;
    thumbnail?: { source?: string };
    pageimage?: string;
  };
  if (page?.missing) return null;
  const url = page.thumbnail?.source ?? "";
  const fileTitle = page.pageimage ? `File:${page.pageimage}` : "";
  if (!url) return null;
  return { url, fileTitle };
}

export async function getOsmWikiTitle(
  lat: number,
  lng: number,
  name: string,
  city?: string,
  country?: string
): Promise<string | null> {
  const q = [name, city, country].filter(Boolean).join(", ");
  const p = new URLSearchParams({
    q,
    format: "json",
    limit: "3",
    addressdetails: "1",
    extratags: "1",
  });
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    p.set("lat", String(lat));
    p.set("lon", String(lng));
  }

  const data = (await fetchJson(
    `https://nominatim.openstreetmap.org/search?${p}`
  )) as unknown as {
    extratags?: { wikipedia?: string; wikidata?: string };
    namedetails?: { name?: string };
    display_name?: string;
  }[];

  if (!Array.isArray(data) || data.length === 0) return null;

  for (const hit of data) {
    const wiki = hit.extratags?.wikipedia;
    if (!wiki) continue;
    const title = wiki.replace(/^en:/, "").trim();
    if (title) return title;
  }
  return null;
}

export async function getGooglePlacePhotoUrl(
  ctx: PlaceVerifyContext
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return null;

  const textQuery =
    ctx.mapsQuery?.trim() ||
    `${ctx.placeName}, ${ctx.city ?? ""}, ${ctx.country ?? ""}`.replace(/,\s*,/g, ",");

  const body: Record<string, unknown> = {
    textQuery,
    languageCode: "en",
    maxResultCount: 1,
  };

  if (ctx.lat != null && ctx.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: ctx.lat, longitude: ctx.lng },
        radius: 8000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.photos,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: { photos?: { name?: string }[]; displayName?: { text?: string } }[];
  };
  const photoName = data.places?.[0]?.photos?.[0]?.name;
  if (!photoName) return null;

  const mediaRes = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1200&key=${apiKey}`,
    { redirect: "follow" }
  );
  if (!mediaRes.ok) return null;
  return mediaRes.url;
}

export async function resolveVerifiedPlaceImage(
  ctx: PlaceVerifyContext,
  thumbSize = 900
): Promise<string> {
  let wikiTitle = await resolveVerifiedWikiTitle(ctx);

  if (ctx.lat != null && ctx.lng != null) {
    const osmWiki = await getOsmWikiTitle(
      ctx.lat,
      ctx.lng,
      ctx.placeName,
      ctx.city,
      ctx.country
    );
    if (osmWiki && (await wikiArticleMatchesPlace(osmWiki, ctx.placeName, ctx.city, ctx.country))) {
      wikiTitle = osmWiki;
    }
  }

  const wikiImg = await getVerifiedWikiPageImage(wikiTitle, thumbSize);
  if (wikiImg) {
    const check = verifyPlaceImage(ctx, wikiImg.url, wikiImg.fileTitle);
    if (check.ok) return wikiImg.url;
  }

  const googleUrl = await getGooglePlacePhotoUrl(ctx);
  if (googleUrl) return googleUrl;

  return "";
}