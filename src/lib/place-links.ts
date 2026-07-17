/**
 * Google Maps — open the place card (photo + address + red pin).
 *
 * Priority: admin maps_url → Google place_id → maps_query search.
 * Coordinates in DB drive the on-site map pin; Google link opens the place card.
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-action
 */

export function googleMapsPlaceIdUrl(placeId: string, label?: string): string {
  const id = placeId.replace(/^places\//, "");
  const params = new URLSearchParams({ api: "1", query_place_id: id });
  if (label?.trim()) params.set("query", label.trim());
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Embedded Google Map preview (no API key) — center + zoom. */
export function googleMapsEmbedUrl(
  lat: number,
  lng: number,
  zoom = 14,
  hl = "en"
): string {
  const params = new URLSearchParams({
    q: `${lat},${lng}`,
    z: String(zoom),
    hl,
    output: "embed",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export type MapsTravelMode = "walking" | "driving";

export function validCoord(lat: number, lng: number): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) && !(la === 0 && ln === 0);
}

function placeLabel(name?: string, city?: string, country?: string): string {
  return [name, city, country].filter(Boolean).join(", ").trim();
}

/** Best label for Google Maps search — stored query or "Name, City, Country". */
export function resolveMapsQuery(
  name?: string,
  city?: string,
  country?: string,
  mapsQuery?: string,
  translations?: Record<string, { maps_query?: string; maps_url?: string }>,
  locale?: string
): string {
  const fromTrans = readMapsOverride(translations, locale);
  if (fromTrans.formatted_address) return fromTrans.formatted_address;
  const fromLocale =
    (locale && translations?.[locale]?.maps_query) ||
    translations?.en?.maps_query;
  if (fromLocale?.trim()) return fromLocale.trim();
  if (mapsQuery?.trim()) return mapsQuery.trim();
  return placeLabel(name, city, country);
}

export type MapsTranslation = {
  maps_query?: string;
  maps_url?: string;
  google_place_id?: string;
  formatted_address?: string;
};

export function resolveMapsDisplayAddress(
  translations?: Record<string, MapsTranslation>,
  locale?: string,
  fallback?: string
): string | undefined {
  const fromTrans = readMapsOverride(translations, locale);
  return fromTrans.formatted_address || fromTrans.maps_query || fallback;
}

export function readMapsOverride(
  translations?: Record<string, MapsTranslation>,
  _locale?: string
): MapsTranslation {
  const entry = translations?.en ?? Object.values(translations ?? {})[0] ?? {};
  return {
    maps_url: entry.maps_url?.trim() || undefined,
    maps_query: entry.maps_query?.trim() || undefined,
    google_place_id: entry.google_place_id?.trim() || undefined,
    formatted_address: entry.formatted_address?.trim() || undefined,
  };
}

export function isValidGoogleMapsLink(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname.includes("google.") || u.hostname === "maps.app.goo.gl") &&
      (u.pathname.includes("/maps") || u.hostname === "maps.app.goo.gl")
    );
  } catch {
    return false;
  }
}

/** Final href — direct admin override, place_id, then search query. */
export function resolveMapsHref(opts: {
  lat: number;
  lng: number;
  name?: string;
  city?: string;
  country?: string;
  mapsQuery?: string;
  mapsUrl?: string;
  googlePlaceId?: string;
  translations?: Record<string, { maps_query?: string; maps_url?: string; google_place_id?: string }>;
  locale?: string;
}): string {
  const fromTrans = readMapsOverride(opts.translations, opts.locale);
  const direct = (opts.mapsUrl || fromTrans.maps_url || "").trim();
  if (direct && isValidGoogleMapsLink(direct)) return direct;

  const placeId = (opts.googlePlaceId || fromTrans.google_place_id || "").trim();
  if (placeId) {
    return googleMapsPlaceIdUrl(
      placeId,
      resolveMapsQuery(
        opts.name,
        opts.city,
        opts.country,
        opts.mapsQuery || fromTrans.maps_query,
        opts.translations,
        opts.locale
      )
    );
  }

  const label = resolveMapsQuery(
    opts.name,
    opts.city,
    opts.country,
    opts.mapsQuery || fromTrans.maps_query,
    opts.translations,
    opts.locale
  ).trim();
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  }
  return "https://www.google.com/maps";
}

/**
 * Google Maps place card — name search shows photo, address, and red pin.
 * Coordinates are used only for validation, never in the URL query.
 */
export function googleMapsPlaceUrl(
  lat: number,
  lng: number,
  name?: string,
  city?: string,
  country?: string,
  mapsQuery?: string,
  mapsUrl?: string
): string {
  return resolveMapsHref({
    lat,
    lng,
    name,
    city,
    country,
    mapsQuery,
    mapsUrl,
  });
}

export function googleMapsPinUrl(
  lat: number,
  lng: number,
  name?: string,
  city?: string,
  country?: string,
  mapsQuery?: string,
  mapsUrl?: string
): string {
  return googleMapsPlaceUrl(lat, lng, name, city, country, mapsQuery, mapsUrl);
}

export function googleMapsDirectionsUrl(
  lat: number,
  lng: number,
  _name?: string,
  _city?: string,
  _country?: string,
  _mapsQuery?: string
): string {
  if (!validCoord(lat, lng)) return "https://www.google.com/maps";
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function isValidMapLocation(
  lat: number,
  lng: number,
  name?: string
): boolean {
  return Boolean(name?.trim()) && validCoord(lat, lng);
}

export function buildGoogleMapsDirUrl(
  stops: {
    lat: number;
    lng: number;
    name?: string;
    city?: string;
    country?: string;
    mapsQuery?: string;
    mapsUrl?: string;
  }[],
  mode: MapsTravelMode = "walking"
): string {
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) {
    const s = stops[0];
    return googleMapsPlaceUrl(
      s.lat,
      s.lng,
      s.name,
      s.city,
      s.country,
      s.mapsQuery,
      s.mapsUrl
    );
  }

  const labeled = stops.filter(
    (s) => isValidMapLocation(s.lat, s.lng, s.name) || s.mapsQuery
  );
  if (labeled.length === 0) return "https://www.google.com/maps";
  if (labeled.length === 1) {
    const s = labeled[0];
    return googleMapsPlaceUrl(
      s.lat,
      s.lng,
      s.name,
      s.city,
      s.country,
      s.mapsQuery,
      s.mapsUrl
    );
  }

  const coordStops = labeled.filter((s) => validCoord(s.lat, s.lng));
  if (coordStops.length === 0) return "https://www.google.com/maps";
  if (coordStops.length === 1) {
    const s = coordStops[0];
    return googleMapsDirectionsUrl(s.lat, s.lng);
  }

  const coords = coordStops.map((s) => `${s.lat},${s.lng}`);
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }
  return url;
}

export function wikipediaUrl(wikiTitle: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(
    wikiTitle.trim().replace(/ /g, "_")
  )}`;
}
