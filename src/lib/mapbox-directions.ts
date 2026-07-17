import { fetchWithTimeout } from "@/lib/utils";

export type DirectionsProfile = "driving" | "walking" | "cycling";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export type RouteGeometry = [number, number][];

export async function fetchMapboxRoute(
  waypoints: LatLngPoint[],
  token: string,
  profile: DirectionsProfile = "driving"
): Promise<RouteGeometry | null> {
  if (waypoints.length < 2 || !token) return null;
  const pts = waypoints.slice(0, 25);
  const coordStr = pts.map((p) => p.lng + "," + p.lat).join(";");
  const url =
    "https://api.mapbox.com/directions/v5/mapbox/" + profile + "/" + encodeURIComponent(coordStr) +
    "?geometries=geojson&overview=full&access_token=" + token;
  try {
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return null;
    const json = await res.json() as {
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    return json?.routes?.[0]?.geometry?.coordinates ?? null;
  } catch {
    return null;
  }
}

export function straightLineGeometry(waypoints: LatLngPoint[]): RouteGeometry {
  return waypoints.map((p) => [p.lng, p.lat]);
}
