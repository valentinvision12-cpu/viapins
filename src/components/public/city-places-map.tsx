"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Navigation, ExternalLink, Route, X } from "lucide-react";
import type { MapStop } from "@/lib/adventure-itinerary";
import {
  buildGoogleMapsDirUrl,
  googleMapsDirectionsUrl,
  resolveMapsDisplayAddress,
  resolveMapsHref,
} from "@/lib/place-links";
import { getMapboxToken, MAPBOX_STYLE } from "@/lib/mapbox-config";
import { fetchMapboxRoute, straightLineGeometry } from "@/lib/mapbox-directions";

export interface CityMapStop extends MapStop {
  city?: string;
  country?: string;
  image_url?: string;
  mapsQuery?: string;
  mapsUrl?: string;
  translations?: Record<
    string,
    {
      maps_query?: string;
      maps_url?: string;
      formatted_address?: string;
      google_place_id?: string;
    }
  >;
}

interface Props {
  stops: CityMapStop[];
  locale: string;
  city: string;
  country: string;
  className?: string;
}

function buildMarkerEl(index: number, imageUrl?: string, active = false): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "city-mapbox-marker";
  wrap.style.cursor = "pointer";
  wrap.style.transform = active ? "scale(1.08)" : "scale(1)";
  wrap.style.transition = "transform 0.2s ease";

  const ring = document.createElement("div");
  ring.style.cssText =
    "width:46px;height:46px;border-radius:9999px;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.28);position:relative";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.style.cssText = "width:100%;height:100%;object-fit:cover";
    ring.appendChild(img);
  } else {
    ring.style.background = "linear-gradient(135deg,#fdba74,#ea580c)";
    ring.style.display = "flex";
    ring.style.alignItems = "center";
    ring.style.justifyContent = "center";
    ring.style.color = "#fff";
    ring.style.fontSize = "14px";
    ring.style.fontWeight = "700";
    ring.textContent = String(index + 1);
  }

  const badge = document.createElement("div");
  badge.style.cssText =
    "position:absolute;bottom:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:9999px;background:#ea580c;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff";
  badge.textContent = String(index + 1);
  ring.appendChild(badge);
  wrap.appendChild(ring);
  return wrap;
}

function StopDetailPanel({
  stop,
  index,
  locale,
  city,
  country,
  t,
  onScrollToPlace,
}: {
  stop: CityMapStop;
  index: number;
  locale: string;
  city: string;
  country: string;
  t: ReturnType<typeof useTranslations>;
  onScrollToPlace?: () => void;
}) {
  const address = resolveMapsDisplayAddress(stop.translations, locale);
  const mapsHref = resolveMapsHref({
    lat: stop.lat,
    lng: stop.lng,
    name: stop.name,
    city: stop.city || city,
    country: stop.country || country,
    mapsQuery: stop.mapsQuery,
    mapsUrl: stop.mapsUrl,
    translations: stop.translations,
    locale,
  });
  const dirHref = googleMapsDirectionsUrl(
    stop.lat,
    stop.lng,
    stop.name,
    stop.city || city,
    stop.country || country,
    stop.mapsQuery
  );

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-lg overflow-hidden">
      {stop.image_url && (
        <div className="relative h-28 w-full">
          <Image
            src={stop.image_url}
            alt={stop.name}
            fill
            className="object-cover"
            unoptimized
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-stone-900 text-sm leading-snug">{stop.name}</h3>
            {address && <p className="text-stone-500 text-xs mt-0.5 line-clamp-2">{address}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <a
            href={dirHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            {t("mapNavigate")}
          </a>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("mapOpenGoogle")}
          </a>
          {onScrollToPlace && (
            <button
              type="button"
              onClick={onScrollToPlace}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-500 text-xs font-medium hover:text-stone-800 underline-offset-2 hover:underline"
            >
              {t("mapScrollTo")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MapboxCanvas({
  stops,
  activeId,
  onSelect,
  className = "",
  interactive = true,
}: {
  stops: CityMapStop[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || stops.length === 0) return;

    const token = getMapboxToken();
    if (!token) return;

    mapboxgl.accessToken = token;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markersRef.current = [];

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: [stops[0].lng, stops[0].lat],
        zoom: 12,
        attributionControl: true,
        interactive,
      });
    } catch {
      return;
    }
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => {
      /* Mapbox tile/style errors are non-fatal — avoid bubbling to Guardian */
    });

    map.on("load", async () => {
      try {
        if (stops.length > 1) {
          const routeCoords =
            (await fetchMapboxRoute(stops, token, "walking")) ??
            straightLineGeometry(stops);

          if (map.getSource("route-line")) return;

          map.addSource("route-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeCoords },
            },
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FF5A5F",
              "line-width": 4,
              "line-opacity": 0.8,
            },
          });
        }

        const bounds = new mapboxgl.LngLatBounds();
        stops.forEach((stop, i) => {
          bounds.extend([stop.lng, stop.lat]);
          const el = buildMarkerEl(i, stop.image_url, stop.id === activeId);
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelect(stop.id);
          });
          markersRef.current.push(marker);
        });

        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
      } catch {
        /* Route layer or markers failed — map still usable */
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [stops, interactive, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    const stop = stops.find((s) => s.id === activeId);
    if (!stop) return;

    stops.forEach((s, i) => {
      const el = markersRef.current[i]?.getElement();
      if (el) el.style.transform = s.id === activeId ? "scale(1.08)" : "scale(1)";
    });

    map.flyTo({
      center: [stop.lng, stop.lat],
      zoom: Math.max(map.getZoom(), 14),
      duration: 750,
    });
  }, [activeId, stops]);

  if (!getMapboxToken()) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-500 text-sm ${className}`}>
        Mapbox token missing — set NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

export function CityPlacesMap({ stops, locale, city, country, className = "" }: Props) {
  const t = useTranslations("cityPage");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  const sorted = useMemo(
    () => [...stops].sort((a, b) => a.order_index - b.order_index),
    [stops]
  );

  useEffect(() => {
    if (sorted.length && !activeId) setActiveId(sorted[0].id);
  }, [sorted, activeId]);

  const activeStop = sorted.find((s) => s.id === activeId) ?? sorted[0];
  const activeIndex = sorted.findIndex((s) => s.id === activeStop?.id);

  const routeUrl = useMemo(
    () =>
      buildGoogleMapsDirUrl(
        sorted.map((s) => ({
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          city: s.city || city,
          country: s.country || country,
          mapsQuery: s.mapsQuery,
          mapsUrl: s.mapsUrl,
        })),
        "walking"
      ),
    [sorted, city, country]
  );

  const focusStop = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const scrollToPlace = useCallback((id: string) => {
    document.getElementById(`place-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setMobileMapOpen(false);
  }, []);

  if (sorted.length === 0) return null;

  return (
    <section className={className} aria-label={t("mapTitle")}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">{t("mapTitle")}</h2>
          <p className="text-stone-500 text-sm">{t("mapSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Route className="w-3.5 h-3.5" />
            {t("mapWalkingRoute", { count: sorted.length })}
          </a>
        </div>
      </div>

      {/* Mobile: list-first layout */}
      <div className="lg:hidden space-y-3">
        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory map-chip-scroll">
          {sorted.map((stop, i) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => focusStop(stop.id)}
              className={`snap-start flex-shrink-0 w-[140px] rounded-2xl border p-2.5 text-left transition-all active:scale-[0.98] ${
                activeId === stop.id
                  ? "border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : "border-stone-200 bg-white text-stone-800 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeId === stop.id ? "bg-white/25" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {i + 1}
                </span>
                <MapPin className={`w-3.5 h-3.5 ${activeId === stop.id ? "text-white/90" : "text-orange-400"}`} />
              </div>
              <span className="block text-xs font-semibold leading-snug line-clamp-2">{stop.name}</span>
            </button>
          ))}
        </div>

        {activeStop && (
          <StopDetailPanel
            stop={activeStop}
            index={activeIndex}
            locale={locale}
            city={city}
            country={country}
            t={t}
            onScrollToPlace={() => scrollToPlace(activeStop.id)}
          />
        )}

        <button
          type="button"
          onClick={() => setMobileMapOpen(true)}
          className="fixed bottom-24 right-4 z-50 lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-500/30 active:scale-95 transition-transform"
          aria-label={t("mapFab")}
        >
          <span aria-hidden>📍</span>
          {t("mapFab")}
        </button>
      </div>

      {/* Desktop: sidebar + map */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,260px)_1fr] gap-4">
        <aside className="flex flex-col rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white overflow-hidden max-h-[min(56vh,480px)]">
          <div className="px-4 py-3 border-b border-orange-100/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/80">
              {t("mapItinerary")}
            </p>
            <p className="text-sm text-stone-600 mt-0.5">{t("mapSelectPlace")}</p>
          </div>
          <ol className="overflow-y-auto flex-1 p-2 space-y-1">
            {sorted.map((stop, i) => (
              <li key={stop.id}>
                <button
                  type="button"
                  onClick={() => focusStop(stop.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-all ${
                    activeId === stop.id
                      ? "bg-orange-500 text-white shadow-md"
                      : "hover:bg-orange-50 text-stone-800"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeId === stop.id ? "bg-white/20" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold truncate">{stop.name}</span>
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${activeId === stop.id ? "text-white/90" : "text-stone-300"}`} />
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="relative min-h-[280px] flex flex-col gap-3">
          <MapboxCanvas
            stops={sorted}
            activeId={activeId}
            onSelect={focusStop}
            className="w-full h-[min(56vh,480px)] rounded-2xl overflow-hidden border border-orange-200/70 shadow-lg ring-1 ring-black/5"
          />
          {activeStop && (
            <StopDetailPanel
              stop={activeStop}
              index={activeIndex}
              locale={locale}
              city={city}
              country={country}
              t={t}
              onScrollToPlace={() => scrollToPlace(activeStop.id)}
            />
          )}
        </div>
      </div>

      {/* Mobile full-screen map overlay */}
      {mobileMapOpen && (
        <div className="fixed inset-0 z-[90] bg-stone-950/50 backdrop-blur-sm lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200">
            <h3 className="font-bold text-stone-900">{t("mapTitle")}</h3>
            <button
              type="button"
              onClick={() => setMobileMapOpen(false)}
              className="p-2 rounded-xl border border-stone-200 text-stone-600"
              aria-label={t("mapClose")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative min-h-0">
            <MapboxCanvas
              stops={sorted}
              activeId={activeId}
              onSelect={focusStop}
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {activeStop && (
            <div className="p-3 bg-white border-t border-stone-200 max-h-[42vh] overflow-y-auto">
              <StopDetailPanel
                stop={activeStop}
                index={activeIndex}
                locale={locale}
                city={city}
                country={country}
                t={t}
                onScrollToPlace={() => scrollToPlace(activeStop.id)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
