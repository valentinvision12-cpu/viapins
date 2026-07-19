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

/** Single place — opens Google Maps place card */
export function googleMapsPlaceUrl(place: CollectionPlace): string {
  const label = [place.name, place.city, place.country].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    api: "1",
    query: place.lat && place.lng ? `${place.lat},${place.lng}` : label,
  });
  return `https://www.google.com/maps/search/?${params}`;
}

export function printCollection(collection: TravelCollection) {
  openTravelAlbumPdf(collection);
}

function albumStyles() {
  return `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#F7F3EB;color:#1C1409;line-height:1.5}.toolbar{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 20px;background:rgba(253,251,247,.95);border-bottom:1px solid rgba(139,101,48,.2)}.toolbar button,.toolbar a.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:600;font-family:system-ui,sans-serif;cursor:pointer;text-decoration:none;border:none}.btn-primary{background:#8B6530;color:#fff}.btn-secondary{background:#fff;color:#4A3F34;border:1px solid rgba(139,101,48,.25)!important}.album{max-width:720px;margin:0 auto;padding:80px 24px 48px}.cover{text-align:center;padding:48px 32px 40px;margin-bottom:40px;background:linear-gradient(145deg,rgba(139,101,48,.1) 0%,#FDFBF7 55%);border-radius:24px;border:1px solid rgba(139,101,48,.18)}.cover .badge{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8B6530;margin-bottom:16px}.cover h1{font-size:36px;font-weight:900;margin-bottom:8px}.cover .sub{font-size:16px;color:#6B5E52;margin-bottom:24px}.cover-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:360px;margin:0 auto 24px;border-radius:16px;overflow:hidden}.cover-grid img{width:100%;aspect-ratio:1;object-fit:cover;display:block}.cover-meta{font-size:13px;color:#6B5E52}.place{margin-bottom:36px;page-break-inside:avoid;background:#FDFBF7;border-radius:20px;overflow:hidden;border:1px solid rgba(139,101,48,.14);box-shadow:0 4px 20px rgba(28,20,9,.06)}.place-img{position:relative;width:100%;height:280px;background:#E8E0D4}.place-img img{width:100%;height:100%;object-fit:cover;display:block}.place-num{position:absolute;top:16px;left:16px;width:36px;height:36px;border-radius:50%;background:#8B6530;color:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center}.place-body{padding:20px 24px 24px}.place-body h2{font-size:22px;font-weight:800;margin-bottom:4px}.place-body .loc{font-size:14px;color:#6B5E52;margin-bottom:16px}.place-body .coords{font-size:12px;color:#9A8B7A;font-family:monospace;margin-bottom:16px}.maps-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:#1C1409;color:#fff!important;text-decoration:none;font-family:system-ui,sans-serif;font-size:14px;font-weight:600}.route-box{margin-top:40px;padding:24px;text-align:center;background:rgba(139,101,48,.08);border-radius:20px;border:1px solid rgba(139,101,48,.2)}.route-box h3{font-size:18px;margin-bottom:8px}.route-box p{font-size:13px;color:#6B5E52;margin-bottom:16px}.foot{margin-top:48px;padding-top:24px;border-top:1px solid rgba(139,101,48,.15);text-align:center;font-size:12px;color:#9A8B7A}@media print{.toolbar{display:none!important}.album{padding:0;max-width:100%}body{background:#fff}.place{box-shadow:none;break-inside:avoid}}`;
}

function placeAlbumCardHtml(place: CollectionPlace, index: number) {
  const mapsUrl = googleMapsPlaceUrl(place);
  const img = place.image_url
    ? `<img src="${escapeHtml(place.image_url)}" alt="${escapeHtml(place.name)}" loading="lazy" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9A8B7A">No photo</div>`;
  const coords = place.lat && place.lng ? `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}` : "";
  return `<article class="place"><div class="place-img"><span class="place-num">${index + 1}</span>${img}</div><div class="place-body"><h2>${escapeHtml(place.name)}</h2><p class="loc">${escapeHtml(place.city)}${place.country ? `, ${escapeHtml(place.country)}` : ""}</p>${coords ? `<p class="coords">GPS: ${coords}</p>` : ""}<a class="maps-btn" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></div></article>`;
}

export function buildTravelAlbumHtml(collection: TravelCollection): string {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const coverImages = collection.places.map((p) => p.image_url).filter(Boolean).slice(0, 3);
  const coverGrid =
    coverImages.length > 0
      ? `<div class="cover-grid">${coverImages.map((src) => `<img src="${escapeHtml(src!)}" alt="" />`).join("")}</div>`
      : "";
  const routeUrl = googleMapsRouteUrl(collection.places);
  const placesHtml = collection.places.map((p, i) => placeAlbumCardHtml(p, i)).join("");
  const routeBlock =
    collection.places.length > 1
      ? `<div class="route-box"><h3>Full route — ${collection.places.length} stops</h3><p>All places in order, ready for navigation</p><a class="maps-btn" href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer">Open route in Google Maps</a></div>`
      : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(collection.title)} — Travel Album</title><style>${albumStyles()}</style></head><body><div class="toolbar"><button type="button" class="btn-primary" onclick="window.print()">Save as PDF</button><a class="btn-secondary btn" href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer">Open route in Maps</a></div><div class="album"><header class="cover"><p class="badge">Private travel album</p><h1>${escapeHtml(collection.title)}</h1><p class="sub">${escapeHtml(collection.subtitle ?? `${collection.places.length} saved places`)}</p>${coverGrid}<p class="cover-meta">Exported ${date} · ${SITE_NAME}</p></header>${placesHtml}${routeBlock}<footer class="foot">${SITE_NAME} · Personal collection · ${date}</footer></div><script>window.addEventListener("load",function(){var imgs=document.querySelectorAll(".place-img img,.cover-grid img"),pending=imgs.length;if(!pending)return;function done(){if(--pending===0)setTimeout(function(){window.print()},400)}imgs.forEach(function(img){if(img.complete)done();else{img.addEventListener("load",done);img.addEventListener("error",done)}})})</script></body></html>`;
}

export function openTravelAlbumPdf(collection: TravelCollection) {
  const html = buildTravelAlbumHtml(collection);
  const win = window.open("", "_blank");
  if (!win) {
    downloadTravelAlbumHtml(collection);
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function downloadTravelAlbumHtml(collection: TravelCollection) {
  downloadBlob(`${safeFilename(collection.title)}-album.html`, buildTravelAlbumHtml(collection), "text/html;charset=utf-8");
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

/** Mega-prompt Collections: country groups, private by default */
export function buildCountryCollections<T extends CollectionPlace>(
  places: T[]
): Array<{
  id: string;
  title: string;
  country: string;
  visibility: "private" | "public" | "shared";
  places: T[];
}> {
  const byCountry = groupPlacesByCountry(places);
  return [...byCountry.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([country, list]) => ({
      id: `collection-${country.toLowerCase().replace(/\s+/g, "-")}`,
      title: `My ${country}`,
      country,
      visibility: "private" as const,
      places: list,
    }));
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

export function buildCollectionShareText(collection: TravelCollection): string {
  const lines = [
    collection.title,
    collection.subtitle ?? `${collection.places.length} places`,
    "",
  ];

  collection.places.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name} — ${p.city}, ${p.country}`);
    if (p.lat && p.lng) {
      lines.push(`   ${googleMapsPlaceUrl(p)}`);
    }
    lines.push("");
  });

  if (collection.places.length > 1) {
    lines.push(`Full route: ${googleMapsRouteUrl(collection.places)}`);
    lines.push("");
  }

  lines.push(`— ${SITE_NAME}`);
  return lines.join("\n").trim();
}

export async function shareCollectionNative(
  collection: TravelCollection,
  exploreUrl?: string
): Promise<"shared" | "unsupported" | "cancelled"> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return "unsupported";
  }

  const text = buildCollectionShareText(collection);
  try {
    await navigator.share({
      title: collection.title,
      text,
      url: exploreUrl,
    });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

export async function copyCollectionShareText(collection: TravelCollection): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildCollectionShareText(collection));
    return true;
  } catch {
    return false;
  }
}

export function whatsAppShareUrl(collection: TravelCollection): string {
  return `https://wa.me/?text=${encodeURIComponent(buildCollectionShareText(collection))}`;
}
