/** Mapbox GL access token — set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local */
export function getMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
}

export const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";
