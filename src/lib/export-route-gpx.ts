import { SITE_NAME } from "@/lib/site-brand";
import type { RouteCartItem } from "@/lib/context/route-cart-context";
import type { RouteScope } from "@/lib/route-scope";
import type { SavedRoute } from "@/actions/get-my-routes";

export interface GpxRouteStop {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  order_index: number;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeFilename(title: string) {
  return title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "route";
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function cartMatchesSavedRoute(scope: RouteScope | null, route: SavedRoute): boolean {
  if (!scope) return false;
  const isAdventure = route.route_type === "country";
  if (isAdventure) {
    return scope.mode === "adventure" && norm(scope.country) === norm(route.country ?? "");
  }
  return (
    scope.mode === "city" &&
    norm(scope.city) === norm(route.city ?? "") &&
    norm(scope.country) === norm(route.country ?? "")
  );
}

/** Saved route places + any new stops still in the visitor's trip cart */
export function buildRouteGpxStops(
  route: SavedRoute,
  orderedPlaceIds: { place_id: string; name: string; city: string }[],
  cartItems: RouteCartItem[] = [],
  cartScope: RouteScope | null = null
): GpxRouteStop[] {
  const byId = new Map(route.route_places.map((p) => [p.place_id, p]));

  const base: GpxRouteStop[] = orderedPlaceIds
    .map((row, idx) => {
      const full = byId.get(row.place_id);
      if (!full?.lat || !full?.lng) return null;
      return {
        name: row.name,
        city: row.city,
        country: full.country,
        lat: full.lat,
        lng: full.lng,
        order_index: idx,
      };
    })
    .filter((p): p is GpxRouteStop => p !== null);

  if (!cartMatchesSavedRoute(cartScope, route)) return base;

  const savedIds = new Set(orderedPlaceIds.map((p) => p.place_id));
  const extras = cartItems
    .filter((i) => !savedIds.has(i.id) && i.lat && i.lng)
    .map((i, idx) => ({
      name: i.name,
      city: i.region ?? i.city,
      country: i.country,
      lat: i.lat,
      lng: i.lng,
      order_index: base.length + idx,
    }));

  return [...base, ...extras];
}

export function exportRouteGpxFromStops(stops: GpxRouteStop[], title: string) {
  const sorted = [...stops].sort((a, b) => a.order_index - b.order_index);
  const pts = sorted.filter((p) => p.lat && p.lng);

  const wpts = pts
    .map(
      (p) =>
        `  <wpt lat="${p.lat}" lon="${p.lng}">\n    <name>${escapeXml(p.name)}</name>\n    <desc>${escapeXml(`${p.city}, ${p.country}`)}</desc>\n    <sym>Flag, Blue</sym>\n  </wpt>`
    )
    .join("\n");

  const trkpts = pts
    .map((p) => `      <trkpt lat="${p.lat}" lon="${p.lng}"><name>${escapeXml(p.name)}</name></trkpt>`)
    .join("\n");

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${SITE_NAME}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(title)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
${wpts}
  <trk>
    <name>${escapeXml(title)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

  downloadBlob(`${safeFilename(title)}.gpx`, gpx, "application/gpx+xml");
}

/** @deprecated use exportRouteGpxFromStops + buildRouteGpxStops */
export function exportRouteGpx(items: RouteCartItem[], title: string) {
  exportRouteGpxFromStops(
    items.map((p, idx) => ({
      name: p.name,
      city: p.region ?? p.city,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      order_index: p.order_index ?? idx,
    })),
    title
  );
}
