import type { RouteCartItem } from "@/lib/context/route-cart-context";
import type { AdventurePlace } from "@/lib/adventure-types";

export interface MapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order_index: number;
  day?: number;
  region?: string;
}

export interface AdventureDayGroup {
  day: number;
  places: AdventurePlace[];
}

export function groupAdventureByDay(places: AdventurePlace[]): AdventureDayGroup[] {
  const byDay = new Map<number, AdventurePlace[]>();
  for (const p of places) {
    const list = byDay.get(p.day) ?? [];
    list.push(p);
    byDay.set(p.day, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, dayPlaces]) => ({
      day,
      places: [...dayPlaces].sort((a, b) => a.order_index - b.order_index),
    }));
}

export function sortByRecommendedOrder<T extends { id: string; order_index?: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));
}

export function sortCartAdventureItems(items: RouteCartItem[]): RouteCartItem[] {
  const adv = items.filter((i) => i.mode === "adventure");
  const city = items.filter((i) => i.mode !== "adventure");
  return [...city, ...sortByRecommendedOrder(adv)];
}

/** Project lat/lng into SVG coordinates within a bounding box */
export function projectToSvg(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  width: number,
  height: number,
  padding = 24
): { x: number; y: number } {
  const latSpan = bounds.maxLat - bounds.minLat || 1;
  const lngSpan = bounds.maxLng - bounds.minLng || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const x = padding + ((lng - bounds.minLng) / lngSpan) * innerW;
  const y = padding + ((bounds.maxLat - lat) / latSpan) * innerH;
  return { x, y };
}

export function getBounds(stops: MapStop[]) {
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  return {
    minLat: Math.min(...lats) - 0.15,
    maxLat: Math.max(...lats) + 0.15,
    minLng: Math.min(...lngs) - 0.2,
    maxLng: Math.max(...lngs) + 0.2,
  };
}

/** Nudge SVG pins apart when they overlap on the preview map */
export function spreadSvgPinPositions<T extends { x: number; y: number }>(
  points: T[],
  minDist = 30,
  padding = 14,
  width = 360,
  height = 220
): T[] {
  if (points.length === 0) return [];

  const out = points.map((p) => ({ ...p }));

  // Union-find clusters of overlapping pins
  const parent = out.map((_, i) => i);
  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  function unite(a: number, b: number) {
    parent[find(a)] = find(b);
  }

  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const dist = Math.hypot(out[j].x - out[i].x, out[j].y - out[i].y);
      if (dist < minDist) unite(i, j);
    }
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < out.length; i++) {
    const root = find(i);
    const list = clusters.get(root) ?? [];
    list.push(i);
    clusters.set(root, list);
  }

  // Fan each cluster radially from its centroid
  for (const indices of clusters.values()) {
    if (indices.length < 2) continue;
    const cx =
      indices.reduce((s, idx) => s + out[idx].x, 0) / indices.length;
    const cy =
      indices.reduce((s, idx) => s + out[idx].y, 0) / indices.length;
    const radius = Math.min(
      minDist * (0.85 + indices.length * 0.12),
      Math.min(width, height) / 2 - padding
    );
    indices.forEach((idx, k) => {
      const angle = (2 * Math.PI * k) / indices.length - Math.PI / 2;
      out[idx].x = cx + Math.cos(angle) * radius;
      out[idx].y = cy + Math.sin(angle) * radius;
    });
  }

  // Force-directed refinement
  for (let iter = 0; iter < 24; iter++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist >= minDist) continue;
        const push = dist > 0.1 ? (minDist - dist) / 2 : minDist / 2;
        const nx = dist > 0.1 ? dx / dist : 1;
        const ny = dist > 0.1 ? dy / dist : 0;
        out[i].x -= nx * push;
        out[i].y -= ny * push;
        out[j].x += nx * push;
        out[j].y += ny * push;
      }
    }
  }

  for (const p of out) {
    p.x = Math.min(width - padding, Math.max(padding, p.x));
    p.y = Math.min(height - padding, Math.max(padding, p.y));
  }
  return out;
}

export function adventurePlaceToCartItem(place: AdventurePlace): RouteCartItem {
  return {
    id: place.id,
    name: place.name,
    city: place.region,
    country: place.country,
    region: place.region,
    lat: place.lat,
    lng: place.lng,
    image_url: place.image_url,
    order_index: place.order_index,
    mode: "adventure",
    requires_car: place.requires_car,
    day: place.day,
  };
}
