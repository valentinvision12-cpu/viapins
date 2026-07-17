export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function totalRouteKm(points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineKm(points[i], points[i + 1]);
  }
  return total;
}

function nearestNeighborTour(indices: number[], points: LatLng[], start: number): number[] {
  const unvisited = [...indices];
  const tour: number[] = [];
  let current = start;
  unvisited.splice(unvisited.indexOf(current), 1);
  tour.push(current);
  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineKm(points[current], points[unvisited[i]]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    current = unvisited[nearestIdx];
    unvisited.splice(nearestIdx, 1);
    tour.push(current);
  }
  return tour;
}

function twoOptImprove(tour: number[], points: LatLng[], startIdx: number): number[] {
  let improved = true;
  const t = [...tour];
  while (improved) {
    improved = false;
    for (let i = startIdx; i < t.length - 1; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const iPrev = i > 0 ? i - 1 : 0;
        const jNext = j + 1 < t.length ? j + 1 : j;
        const before =
          haversineKm(points[t[iPrev]], points[t[i]]) +
          haversineKm(points[t[j]], points[t[jNext]]);
        const after =
          haversineKm(points[t[iPrev]], points[t[j]]) +
          haversineKm(points[t[i]], points[t[jNext]]);
        if (after < before - 0.001) {
          const segment = t.slice(i, j + 1).reverse();
          for (let k = 0; k < segment.length; k++) {
            t[i + k] = segment[k];
          }
          improved = true;
        }
      }
    }
  }
  return t;
}

export function optimizeRoute<T extends LatLng>(points: T[], fixStart = true): T[] {
  if (points.length <= 2) return [...points];
  const allIdx = points.map((_, i) => i);
  let bestTour: number[] = [];
  let bestDist = Infinity;
  if (fixStart) {
    const tour = nearestNeighborTour(allIdx, points, 0);
    const improved = twoOptImprove(tour, points, 1);
    bestTour = improved;
  } else {
    for (let s = 0; s < points.length; s++) {
      const tour = nearestNeighborTour(allIdx, points, s);
      const improved = twoOptImprove(tour, points, 0);
      const dist = totalRouteKm(improved.map((i) => points[i]));
      if (dist < bestDist) {
        bestDist = dist;
        bestTour = improved;
      }
    }
  }
  return bestTour.map((i) => points[i]);
}

export function formatKm(km: number): string {
  if (km < 1) return Math.round(km * 1000) + " m";
  if (km < 10) return km.toFixed(1) + " km";
  return Math.round(km) + " km";
}