/** Haversine distance in km between two WGS84 points. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function centroid<T extends { lat: number; lng: number }>(places: T[]): {
  lat: number;
  lng: number;
} {
  const n = places.length;
  return {
    lat: places.reduce((s, p) => s + p.lat, 0) / n,
    lng: places.reduce((s, p) => s + p.lng, 0) / n,
  };
}

/**
 * Drop GPS outliers so city maps only show pins in the same area.
 * Keeps places within a tight radius of the cluster (compact old towns).
 */
export function filterPlacesWithinMapCluster<
  T extends { lat: number; lng: number },
>(places: T[], options?: { maxKm?: number }): T[] {
  if (places.length <= 2) return places;

  const center = centroid(places);
  const withDist = places.map((p) => ({
    place: p,
    km: distanceKm(center, p),
  }));
  const sorted = [...withDist].sort((a, b) => a.km - b.km);
  const median = sorted[Math.floor(sorted.length / 2)]?.km ?? 0;
  const cap = options?.maxKm ?? 6;
  const threshold = Math.min(cap, Math.max(1.2, median * 2.5 + 0.4));

  const kept = withDist.filter((x) => x.km <= threshold).map((x) => x.place);
  return kept.length >= 2 ? kept : places;
}
