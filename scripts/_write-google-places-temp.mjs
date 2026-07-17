import { writeFileSync } from "fs";
import { join } from "path";

const content = `/**
 * Google Places API (New) — precise landmark coordinates + place card URL.
 */

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

export type GooglePlaceMatch = {
  placeId: string;
  lat: number;
  lng: number;
  displayName: string;
  formattedAddress: string;
  googleMapsUri: string;
};

export function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    ""
  );
}

function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

type PlacesSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    googleMapsUri?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
};

export async function findGooglePlace(opts: {
  name: string;
  city: string;
  country: string;
  mapsQuery?: string;
  biasLat?: number;
  biasLng?: number;
}): Promise<GooglePlaceMatch | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY in .env.local");
  }

  const textQuery =
    opts.mapsQuery?.trim() ||
    \`\${opts.name}, \${opts.city}, \${opts.country}\`;

  const body: Record<string, unknown> = {
    textQuery,
    languageCode: "en",
    maxResultCount: 1,
  };

  if (
    opts.biasLat != null &&
    opts.biasLng != null &&
    Number.isFinite(opts.biasLat) &&
    Number.isFinite(opts.biasLng)
  ) {
    body.locationBias = {
      circle: {
        center: { latitude: opts.biasLat, longitude: opts.biasLng },
        radius: 12000,
      },
    };
  }

  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(\`Google Places HTTP \${res.status}: \${errText.slice(0, 200)}\`);
  }

  const data = (await res.json()) as PlacesSearchResponse;
  const place = data.places?.[0];
  if (!place?.id || !place.location) return null;

  const lat = place.location.latitude;
  const lng = place.location.longitude;
  if (lat == null || lng == null) return null;

  const placeId = place.id.replace(/^places\\//, "");
  const displayName = place.displayName?.text?.trim() || opts.name;
  const formattedAddress =
    place.formattedAddress?.trim() ||
    \`\${displayName}, \${opts.city}, \${opts.country}\`;

  return {
    placeId,
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    displayName,
    formattedAddress,
    googleMapsUri:
      place.googleMapsUri?.trim() ||
      googleMapsPlaceIdUrl(placeId, displayName),
  };
}

export function googleMapsPlaceIdUrl(placeId: string, label?: string): string {
  const id = placeId.replace(/^places\\//, "");
  const params = new URLSearchParams({ api: "1", query_place_id: id });
  if (label?.trim()) params.set("query", label.trim());
  return \`https://www.google.com/maps/search/?\${params.toString()}\`;
}
`;

writeFileSync(join(process.cwd(), "src/lib/google-places.ts"), content, "utf8");
console.log("written");
