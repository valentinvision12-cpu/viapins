/** Client-side collection export — scales without server load */

import { SITE_NAME } from "./site-brand";

export interface CollectionPlace {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  image_url?: string;
}

export interface TravelCollection {
  title: string;
  subtitle?: string;
  country?: string;
  places: CollectionPlace[];
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

function safeFilename(title: string) {
  return title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "collection";
}

export function exportCollectionJson(collection: TravelCollection) {
  const payload = {
    exported_at: new Date().toISOString(),
    title: collection.title,
    subtitle: collection.subtitle,
    country: collection.country,
    place_count: collection.places.length,
    places: collection.places,
  };
  downloadBlob(
    `${safeFilename(collection.title)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
}

export function exportCollectionGpx(collection: TravelCollection) {
  const pts = collection.places.filter((p) => p.lat && p.lng);
  const wpts = pts
    .map(
      (p, i) =>
        `  <wpt lat="${p.lat}" lon="${p.lng}">\n    <name>${escapeXml(p.name)}</name>\n    <desc>${escapeXml(`${p.city}, ${p.country}`)}</desc>\n    <sym>Flag, Blue</sym>\n  </wpt>`
    )
    .join("\n");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${SITE_NAME}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(collection.title)}</name>
    <desc>${escapeXml(collection.subtitle ?? "")}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
${wpts}
</gpx>`;
  downloadBlob(`${safeFilename(collection.title)}.gpx`, gpx, "application/gpx+xml");
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Google Maps directions — up to 10 stops */
export function googleMapsRouteUrl(places: CollectionPlace[]): string {
  const valid = places.filter((p) => p.lat && p.lng);
  if (!valid.length) return "https://www.google.com/maps";
  if (valid.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${valid[0].lat},${valid[0].lng}`;
  }
  const slice = valid.slice(0, 10);
  const origin = `${slice[0].lat},${slice[0].lng}`;
  const destination = `${slice[slice.length - 1].lat},${slice[slice.length - 1].lng}`;
  const waypoints =
    slice.length > 2
      ? slice
          .slice(1, -1)
          .map((p) => `${p.lat},${p.lng}`)
          .join("|")
      : "";
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params}`;
}

export function printCollection(collection: TravelCollection) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const rows = collection.places
    .map(
      (p, i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:32px">${i + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">
            <strong>${escapeHtml(p.name)}</strong><br/>
            <span style="color:#666;font-size:13px">${escapeHtml(p.city)}, ${escapeHtml(p.country)}</span>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#888">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</td>
        </tr>`
    )
    .join("");

  win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(collection.title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .sub { color: #666; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  .foot { margin-top: 32px; font-size: 12px; color: #999; text-align: center; }
  @media print { body { margin: 20px; } }
</style></head><body>
  <h1>${escapeHtml(collection.title)}</h1>
  <p class="sub">${escapeHtml(collection.subtitle ?? `${collection.places.length} landmarks`)}</p>
  <table><thead><tr><th>#</th><th>Landmark</th><th>GPS</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="foot">${SITE_NAME} · ${new Date().toLocaleDateString()}</p>
  <script>window.onload=()=>{window.print();}</script>
</body></html>`);
  win.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Group favorites into country collections */
export function groupPlacesByCountry<T extends CollectionPlace>(places: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const p of places) {
    const key = p.country.trim();
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return map;
}

export function travelerLevel(stats: {
  countries: number;
  places: number;
  routes: number;
}): { label: string; emoji: string; next?: string } {
  if (stats.countries >= 15) return { label: "Globe Master", emoji: "🌍" };
  if (stats.countries >= 8) return { label: "Continental Explorer", emoji: "✈️", next: "15 countries → Globe Master" };
  if (stats.countries >= 3) return { label: "Regional Collector", emoji: "🧭", next: "8 countries → Continental Explorer" };
  if (stats.places >= 5) return { label: "Curious Traveler", emoji: "📍", next: "3 countries → Regional Collector" };
  return { label: "New Explorer", emoji: "🌱", next: "Save 5 places to level up" };
}
