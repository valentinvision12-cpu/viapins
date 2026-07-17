#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const out = join(process.cwd(), "src/components/public/city-places-map.tsx");

const content = [
  '"use client";',
  "",
  "import { useEffect, useRef, useMemo, useState, useCallback } from \"react\";",
  "import { useTranslations } from \"next-intl\";",
  "import { MapPin, Navigation, ExternalLink, Maximize2, Minimize2, Route } from \"lucide-react\";",
  "import type { MapStop } from \"@/lib/adventure-itinerary\";",
  "import {",
  "  buildGoogleMapsDirUrl,",
  "  googleMapsDirectionsUrl,",
  "  resolveMapsDisplayAddress,",
  "  resolveMapsHref,",
  "} from \"@/lib/place-links\";",
  "import \"leaflet/dist/leaflet.css\";",
  "",
  "export interface CityMapStop extends MapStop {",
  "  city?: string;",
  "  country?: string;",
  "  image_url?: string;",
  "  mapsQuery?: string;",
  "  mapsUrl?: string;",
  "  translations?: Record<",
  "    string,",
  "    {",
  "      maps_query?: string;",
  "      maps_url?: string;",
  "      formatted_address?: string;",
  "      google_place_id?: string;",
  "    }",
  "  >;",
  "}",
  "",
  "interface Props {",
  "  stops: CityMapStop[];",
  "  locale: string;",
  "  city: string;",
  "  country: string;",
  "  className?: string;",
  "}",
  "",
  "function escapeHtml(text: string): string {",
  "  return text",
  "    .replace(/&/g, \"&amp;\")",
  "    .replace(/</g, \"&lt;\")",
  "    .replace(/>/g, \"&gt;\")",
  "    .replace(/\"/g, \"&quot;\");",
  "}",
  "",
  "function markerHtml(index: number, imageUrl?: string): string {",
  "  const ring = \"box-shadow:0 4px 14px rgba(0,0,0,.28)\";",
  "  const photo = imageUrl",
  "    ? `<img src=\"${escapeHtml(imageUrl)}\" alt=\"\" referrerpolicy=\"no-referrer\" style=\"width:100%;height:100%;object-fit:cover\" />`",
  "    : `<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#fdba74,#ea580c);color:#fff;font-size:14px;font-weight:700\">${index + 1}</div>`;",
  "  return `<div style=\"position:relative;width:46px;height:46px\">",
  "    <div style=\"width:46px;height:46px;border-radius:9999px;overflow:hidden;border:3px solid #fff;${ring}\">${photo}</div>",
  "    <div style=\"position:absolute;bottom:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:9999px;background:#ea580c;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff\">${index + 1}</div>",
  "  </div>`;",
  "}",
  "",
  "export function CityPlacesMap({",
  "  stops,",
  "  locale,",
  "  city,",
  "  country,",
  "  className = \"\",",
  "}: Props) {",
  "  const t = useTranslations(\"cityPage\");",
  "  const containerRef = useRef<HTMLDivElement>(null);",
  "  const mapRef = useRef<import(\"leaflet\").Map | null>(null);",
  "  const markersRef = useRef<import(\"leaflet\").Marker[]>([]);",
  "  const [activeId, setActiveId] = useState<string | null>(null);",
  "  const [expanded, setExpanded] = useState(false);",
  "",
  "  const sorted = useMemo(",
  "    () => [...stops].sort((a, b) => a.order_index - b.order_index),",
  "    [stops]",
  "  );",
  "",
  "  useEffect(() => {",
  "    if (sorted.length && !activeId) setActiveId(sorted[0].id);",
  "  }, [sorted, activeId]);",
  "",
  "  const routeUrl = useMemo(",
  "    () =>",
  "      buildGoogleMapsDirUrl(",
  "        sorted.map((s) => ({",
  "          lat: s.lat,",
  "          lng: s.lng,",
  "          name: s.name,",
  "          city: s.city || city,",
  "          country: s.country || country,",
  "          mapsQuery: s.mapsQuery,",
  "          mapsUrl: s.mapsUrl,",
  "        })),",
  "        \"walking\"",
  "      ),",
  "    [sorted, city, country]",
  "  );",
  "",
  "  const focusStop = useCallback((stop: CityMapStop, openPopup = true) => {",
  "    setActiveId(stop.id);",
  "    const map = mapRef.current;",
  "    if (!map) return;",
  "    map.flyTo([stop.lat, stop.lng], Math.max(map.getZoom(), 14), {",
  "      duration: 0.75,",
  "    });",
  "    if (openPopup) {",
  "      const idx = sorted.findIndex((s) => s.id === stop.id);",
  "      markersRef.current[idx]?.openPopup();",
  "    }",
  "  }, [sorted]);",
  "",
  "  useEffect(() => {",
  "    if (!containerRef.current || sorted.length === 0) return;",
  "",
  "    let cancelled = false;",
  "",
  "    (async () => {",
  "      const L = (await import(\"leaflet\")).default;",
  "      if (cancelled || !containerRef.current) return;",
  "",
  "      if (mapRef.current) {",
  "        mapRef.current.remove();",
  "        mapRef.current = null;",
  "      }",
  "      markersRef.current = [];",
  "",
  "      const map = L.map(containerRef.current, {",
  "        scrollWheelZoom:",
  "          typeof window !== \"undefined\" &&",
  "          window.matchMedia(\"(hover: hover) and (pointer: fine)\").matches,",
  "        zoomControl: false,",
  "      });",
  "      mapRef.current = map;",
  "      L.control.zoom({ position: \"topright\" }).addTo(map);",
  "",
  "      L.tileLayer(",
  "        \"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png\",",
  "        {",
  "          attribution:",
  "            '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> &copy; <a href=\"https://carto.com/\">CARTO</a>',",
  "          subdomains: \"abcd\",",
  "          maxZoom: 20,",
  "        }",
  "      ).addTo(map);",
  "",
  "      const latlngs = sorted.map((s) => [s.lat, s.lng] as [number, number]);",
  "      const bounds = L.latLngBounds(latlngs);",
  "",
  "      L.polyline(latlngs, {",
  "        color: \"#ea580c\",",
  "        weight: 4,",
  "        opacity: 0.88,",
  "        lineJoin: \"round\",",
  "        dashArray: \"10 8\",",
  "      }).addTo(map);",
  "",
  "      sorted.forEach((stop, i) => {",
  "        const address = resolveMapsDisplayAddress(stop.translations, locale);",
  "        const mapsHref = resolveMapsHref({",
  "          lat: stop.lat,",
  "          lng: stop.lng,",
  "          name: stop.name,",
  "          city: stop.city || city,",
  "          country: stop.country || country,",
  "          mapsQuery: stop.mapsQuery,",
  "          mapsUrl: stop.mapsUrl,",
  "          translations: stop.translations,",
  "          locale,",
  "        });",
  "        const dirHref = googleMapsDirectionsUrl(",
  "          stop.lat,",
  "          stop.lng,",
  "          stop.name,",
  "          stop.city || city,",
  "          stop.country || country,",
  "          stop.mapsQuery",
  "        );",
  "",
  "        const icon = L.divIcon({",
  "          className: \"city-map-marker\",",
  "          html: markerHtml(i, stop.image_url),",
  "          iconSize: [46, 46],",
  "          iconAnchor: [23, 23],",
  "        });",
  "",
  "        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);",
  "        markersRef.current.push(marker);",
  "",
  "        const thumb = stop.image_url",
  "          ? `<img src=\"${escapeHtml(stop.image_url)}\" alt=\"\" referrerpolicy=\"no-referrer\" style=\"width:100%;height:96px;object-fit:cover;border-radius:10px;margin-bottom:8px\" />`",
  "          : `<div style=\"height:72px;border-radius:10px;margin-bottom:8px;background:linear-gradient(135deg,#fed7aa,#fdba74);display:flex;align-items:center;justify-content:center;color:#9a3412;font-weight:700\">${escapeHtml(stop.name)}</div>`;",
  "",
  "        const popupHtml = `",
  "          <div class=\"city-map-popup\" style=\"min-width:200px;font-family:system-ui,sans-serif\">",
  "            ${thumb}",
  "            <p style=\"margin:0 0 4px;font-weight:700;font-size:14px;color:#1c1917\">${escapeHtml(stop.name)}</p>",
  "            ${address ? `<p style=\"margin:0 0 8px;font-size:11px;color:#78716c;line-height:1.35\">${escapeHtml(address)}</p>` : \"\"}",
  "            <div style=\"display:flex;flex-wrap:wrap;gap:6px\">",
  "              <a href=\"${dirHref}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"font-size:11px;color:#ea580c;font-weight:600;text-decoration:none\">${escapeHtml(t(\"mapNavigate\"))}</a>",
  "              <a href=\"${mapsHref}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"font-size:11px;color:#57534e;text-decoration:none\">${escapeHtml(t(\"mapOpenGoogle\"))}</a>",
  "              <button type=\"button\" data-place-id=\"${stop.id}\" style=\"font-size:11px;color:#57534e;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline\">${escapeHtml(t(\"mapScrollTo\"))}</button>",
  "            </div>",
  "          </div>`;",
  "        marker.bindPopup(popupHtml, { maxWidth: 280, className: \"city-map-popup-wrap\" });",
  "        marker.on(\"click\", () => setActiveId(stop.id));",
  "        marker.on(\"popupopen\", () => {",
  "          setActiveId(stop.id);",
  "          const el = document.querySelector(",
  "            `[data-place-id=\"${stop.id}\"]`",
  "          ) as HTMLButtonElement | null;",
  "          el?.addEventListener(\"click\", () => {",
  "            document",
  "              .getElementById(`place-${stop.id}`)",
  "              ?.scrollIntoView({ behavior: \"smooth\", block: \"center\" });",
  "          });",
  "        });",
  "      });",
  "",
  "      map.fitBounds(bounds.pad(0.14));",
  "    })();",
  "",
  "    return () => {",
  "      cancelled = true;",
  "      if (mapRef.current) {",
  "        mapRef.current.remove();",
  "        mapRef.current = null;",
  "      }",
  "      markersRef.current = [];",
  "    };",
  "  }, [sorted, locale, city, country, t]);",
  "",
  "  if (sorted.length === 0) return null;",
  "",
  "  const shellClass = expanded",
  "    ? \"fixed inset-0 z-[80] bg-stone-950/40 backdrop-blur-sm p-3 md:p-6 flex flex-col\"",
  "    : \"\";",
  "",
  "  return (",
  "    <section",
  "      className={`${shellClass} ${className}`}",
  "      aria-label={t(\"mapTitle\")}",
  "    >",
  "      <div",
  "        className={`${",
  "          expanded ? \"flex-1 flex flex-col max-w-6xl mx-auto w-full\" : \"\"",
  "        }`}",
  "      >",
  "        <div className=\"flex flex-wrap items-center justify-between gap-3 mb-3\">",
  "          <div>",
  "            <h2 className=\"text-lg font-bold text-stone-900\">{t(\"mapTitle\")}</h2>",
  "            <p className=\"text-stone-500 text-sm\">{t(\"mapSubtitle\")}</p>",
  "          </div>",
  "          <div className=\"flex flex-wrap items-center gap-2\">",
  "            <a",
  "              href={routeUrl}",
  "              target=\"_blank\"",
  "              rel=\"noopener noreferrer\"",
  "              className=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm\"",
  "            >",
  "              <Route className=\"w-3.5 h-3.5\" />",
  "              {t(\"mapWalkingRoute\", { count: sorted.length })}",
  "            </a>",
  "            <button",
  "              type=\"button\"",
  "              onClick={() => setExpanded((v) => !v)}",
  "              className=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50\"",
  "            >",
  "              {expanded ? (",
  "                <>",
  "                  <Minimize2 className=\"w-3.5 h-3.5\" />",
  "                  {t(\"mapExitFullscreen\")}",
  "                </>",
  "              ) : (",
  "                <>",
  "                  <Maximize2 className=\"w-3.5 h-3.5\" />",
  "                  {t(\"mapFullscreen\")}",
  "                </>",
  "              )}",
  "            </button>",
  "            <span className=\"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100\">",
  "              {t(\"mapFreeBadge\")}",
  "            </span>",
  "          </div>",
  "        </div>",
  "",
  "        <div className=\"lg:hidden mb-3\">",
  "          <div className=\"flex gap-2.5 overflow-x-auto pb-1 px-0.5 snap-x snap-mandatory map-chip-scroll\">",
  "            {sorted.map((stop, i) => (",
  "              <button",
  "                key={stop.id}",
  "                type=\"button\"",
  "                onClick={() => focusStop(stop)}",
  "                className={`snap-start flex-shrink-0 w-[140px] rounded-2xl border p-2.5 text-left transition-all active:scale-[0.98] ${",
  "                  activeId === stop.id",
  "                    ? \"border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-500/25\"",
  "                    : \"border-stone-200 bg-white text-stone-800 shadow-sm\"",
  "                }`}",
  "              >",
  "                <div className=\"flex items-center gap-2 mb-1.5\">",
  "                  <span",
  "                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${",
  "                      activeId === stop.id ? \"bg-white/25\" : \"bg-orange-100 text-orange-700\"",
  "                    }`}",
  "                  >",
  "                    {i + 1}",
  "                  </span>",
  "                  <MapPin className={`w-3.5 h-3.5 ${activeId === stop.id ? \"text-white/90\" : \"text-orange-400\"}`} />",
  "                </div>",
  "                <span className=\"block text-xs font-semibold leading-snug line-clamp-2\">{stop.name}</span>",
  "              </button>",
  "            ))}",
  "          </div>",
  "        </div>",
  "",
  "        <a",
  "          href={routeUrl}",
  "          target=\"_blank\"",
  "          rel=\"noopener noreferrer\"",
  "          className=\"lg:hidden mb-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-transform\"",
  "        >",
  "          <Route className=\"w-4 h-4\" />",
  "          {t(\"mapWalkingRoute\", { count: sorted.length })}",
  "        </a>",
  "",
  "        <div className=\"grid lg:grid-cols-[minmax(0,260px)_1fr] gap-4\">",
  "          <aside className=\"hidden lg:flex flex-col rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white overflow-hidden max-h-[min(56vh,480px)]\">",
  "            <div className=\"px-4 py-3 border-b border-orange-100/80\">",
  "              <p className=\"text-xs font-semibold uppercase tracking-wide text-orange-700/80\">",
  "                {t(\"mapItinerary\")}",
  "              </p>",
  "              <p className=\"text-sm text-stone-600 mt-0.5\">{t(\"mapSelectPlace\")}</p>",
  "            </div>",
  "            <ol className=\"overflow-y-auto flex-1 p-2 space-y-1\">",
  "              {sorted.map((stop, i) => (",
  "                <li key={stop.id}>",
  "                  <button",
  "                    type=\"button\"",
  "                    onClick={() => focusStop(stop)}",
  "                    className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-all ${",
  "                      activeId === stop.id",
  "                        ? \"bg-orange-500 text-white shadow-md\"",
  "                        : \"hover:bg-orange-50 text-stone-800\"",
  "                    }`}",
  "                  >",
  "                    <span",
  "                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${",
  "                        activeId === stop.id ? \"bg-white/20\" : \"bg-orange-100 text-orange-700\"",
  "                      }`}",
  "                    >",
  "                      {i + 1}",
  "                    </span>",
  "                    <span className=\"min-w-0 flex-1\">",
  "                      <span className=\"block text-sm font-semibold truncate\">{stop.name}</span>",
  "                      {stop.image_url ? (",
  "                        <span className={`block text-[10px] truncate ${activeId === stop.id ? \"text-white/80\" : \"text-stone-400\"}`}>",
  "                          {t(\"mapPhotoReady\")}",
  "                        </span>",
  "                      ) : (",
  "                        <span className={`block text-[10px] truncate ${activeId === stop.id ? \"text-white/80\" : \"text-stone-400\"}`}>",
  "                          {t(\"mapPhotoPending\")}",
  "                        </span>",
  "                      )}",
  "                    </span>",
  "                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${activeId === stop.id ? \"text-white/90\" : \"text-stone-300\"}`} />",
  "                  </button>",
  "                </li>",
  "              ))}",
  "            </ol>",
  "          </aside>",
  "",
  "          <div className=\"relative min-h-[280px]\">",
  "            <div",
  "              ref={containerRef}",
  "              className={`w-full rounded-2xl overflow-hidden border border-orange-200/70 shadow-lg ring-1 ring-black/5 ${",
  "                expanded",
  "                  ? \"h-[min(78dvh,720px)]\"",
  "                  : \"h-[min(62dvh,520px)] sm:h-[min(56vh,480px)]\"",
  "              }`}",
  "            />",
  "            <div className=\"absolute bottom-3 left-3 right-3 pointer-events-none flex justify-between items-end gap-2\">",
  "              <span className=\"inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/95 text-stone-600 shadow border border-stone-100\">",
  "                <Navigation className=\"w-3 h-3 text-orange-500\" />",
  "                {t(\"mapPlaces\", { count: sorted.length })}",
  "              </span>",
  "              <a",
  "                href={routeUrl}",
  "                target=\"_blank\"",
  "                rel=\"noopener noreferrer\"",
  "                className=\"pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-500 text-white shadow lg:hidden\"",
  "              >",
  "                <ExternalLink className=\"w-3 h-3\" />",
  "                {t(\"mapWalkingRouteShort\")}",
  "              </a>",
  "            </div>",
  "          </div>",
  "        </div>",
  "      </div>",
  "    </section>",
  "  );",
  "}",
  "",
].join("\n");

writeFileSync(out, content, "utf8");
console.log("Wrote", out, content.length, "chars");

const apiOut = join(
  process.cwd(),
  "src/app/api/places/[id]/image/route.ts"
);
const apiRoute = [
  'import { NextResponse } from "next/server";',
  'import { createServiceClient } from "@/lib/supabase/service";',
  'import { isBadImageUrl, resolvePlaceImage } from "@/lib/wiki-image";',
  "",
  "export async function GET(",
  "  req: Request,",
  "  { params }: { params: Promise<{ id: string }> }",
  ") {",
  "  const { id } = await params;",
  "  const force =",
  '    new URL(req.url).searchParams.get("refresh") === "1" ||',
  '    new URL(req.url).searchParams.get("force") === "1";',
  "  const supabase = createServiceClient();",
  "",
  "  const { data: place, error } = await supabase",
  '    .from("places")',
  "    .select(",
  '      "id, name, image_url, translations, destinations(city, country)"',
  "    )",
  '    .eq("id", id)',
  "    .maybeSingle();",
  "",
  "  if (error || !place) {",
  '    return NextResponse.json({ url: "" }, { status: 404 });',
  "  }",
  "",
  "  const current = place.image_url?.trim() ?? \"\";",
  "  if (current && !force && !isBadImageUrl(current)) {",
  "    return NextResponse.json({ url: current });",
  "  }",
  "",
  "  const dest = place.destinations as { city: string; country: string } | null;",
  "  const city = dest?.city ?? \"\";",
  "  const country = dest?.country ?? \"\";",
  "  const en = (",
  "    place.translations as Record<string, { wiki_title?: string }> | null",
  "  )?.en;",
  "  const wikiTitle = en?.wiki_title || place.name;",
  "",
  "  const url = await resolvePlaceImage(",
  "    {",
  "      placeName: place.name,",
  "      wikiTitle,",
  "      city,",
  "      country,",
  "      preferCommons: true,",
  "    },",
  "    900",
  "  );",
  "",
  "  if (url) {",
  "    await supabase",
  '      .from("places")',
  '      .update({ image_url: url, updated_at: new Date().toISOString() })',
  '      .eq("id", id);',
  "  }",
  "",
  '  return NextResponse.json({ url: url || "" });',
  "}",
  "",
].join("\n");
writeFileSync(apiOut, apiRoute, "utf8");
console.log("Wrote", apiOut);

if (process.argv.includes("--write-refresh-script")) {
  const refreshOut = join(process.cwd(), "scripts/refresh-place-images.ts");
  const refresh = `#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function imageOk(url: string): Promise<boolean> {
  if (!url.trim() || isBadImageUrl(url)) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "LuxuryTravelMagazine/1.0" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const args = process.argv.slice(2);
  const badOnly = args.includes("--bad-only");
  const slugs = args.filter((a) => !a.startsWith("--"));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const slug of slugs) {
    const seedPath = join(process.cwd(), "data", "seeds", \`\${slug}.json\`);
    if (!existsSync(seedPath)) {
      console.warn(\`Skip \${slug}: no seed\`);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    console.log(\`\\n=== \${country} (\${slug}) ===\`);

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city as string;
      const { data: dest } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();
      if (!dest) continue;

      const { data: dbPlaces } = await supabase
        .from("places")
        .select("id, name, image_url, translations")
        .eq("destination_id", dest.id);

      const seedByName = new Map(
        (citySeed.places ?? []).map((p: { name: string }) => [
          p.name.toLowerCase(),
          p,
        ])
      );

      for (const dbp of dbPlaces ?? []) {
        const seedPlace = seedByName.get(dbp.name.toLowerCase()) as
          | {
              wiki_title?: string;
              commons_file?: string;
              image_url?: string;
            }
          | undefined;

        const en = (dbp.translations as Record<string, { wiki_title?: string }>)
          ?.en;
        const wikiTitle = en?.wiki_title || seedPlace?.wiki_title || dbp.name;
        const current = dbp.image_url?.trim() ?? "";
        const currentBad =
          !current || isBadImageUrl(current) || !(await imageOk(current));

        if (badOnly && !currentBad) continue;

        let newUrl = "";

        if (
          seedPlace?.image_url &&
          !isBadImageUrl(seedPlace.image_url) &&
          (await imageOk(seedPlace.image_url))
        ) {
          newUrl = seedPlace.image_url;
        }

        if (!newUrl) {
          newUrl = await resolvePlaceImage(
            {
              placeName: dbp.name,
              wikiTitle,
              city,
              country,
              commonsFile: seedPlace?.commons_file,
              preferCommons: true,
            },
            900
          );
        }

        if (!newUrl || newUrl === current) {
          if (currentBad) {
            console.warn(\`  x \${city} / \${dbp.name}: no better image\`);
          }
          continue;
        }

        const { error } = await supabase
          .from("places")
          .update({ image_url: newUrl, updated_at: new Date().toISOString() })
          .eq("id", dbp.id);

        if (error) console.warn(\`  x \${dbp.name}: \${error.message}\`);
        else console.log(\`  ok \${city} / \${dbp.name}\`);

        await new Promise((r) =>
          setTimeout(r, Number(process.env.WIKI_DELAY_MS || 400))
        );
      }
    }
  }

  console.log("\\nDone.\\n");
}

main();
`;
  writeFileSync(refreshOut, refresh, "utf8");
  console.log("Wrote", refreshOut);
}
