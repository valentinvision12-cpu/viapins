"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, ExternalLink, X, Car } from "lucide-react";
import type { AdventurePlace } from "@/lib/adventure-types";
import {
  buildGoogleMapsDirUrl,
  resolveMapsHref,
} from "@/lib/place-links";
import { getMapboxToken, MAPBOX_STYLE } from "@/lib/mapbox-config";
import { fetchMapboxRoute, straightLineGeometry } from "@/lib/mapbox-directions";

function buildMarkerEl(index: number, imageUrl?: string, active = false): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cursor = "pointer";
  wrap.style.transform = active ? "scale(1.08)" : "scale(1)";
  wrap.style.transition = "transform 0.2s ease";

  const ring = document.createElement("div");
  ring.style.cssText =
    "width:46px;height:46px;border-radius:9999px;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.28);position:relative";

  if (imageUrl?.trim()) {
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

function AdventureMapboxCanvas({
  places,
  activeId,
  onSelect,
  className = "",
}: {
  places: AdventurePlace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || places.length === 0) return;
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
        center: [places[0].lng, places[0].lat],
        zoom: 8,
      });
    } catch {
      return;
    }
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => {});

    map.on("load", async () => {
      try {
        const routeCoords =
          (await fetchMapboxRoute(places, token, "driving")) ??
          straightLineGeometry(places);

        if (!map.getSource("adv-route")) {
          map.addSource("adv-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeCoords },
            },
          });
          map.addLayer({
            id: "adv-route",
            type: "line",
            source: "adv-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FF5A5F",
              "line-width": 4,
              "line-opacity": 0.8,
            },
          });
        }

        const bounds = new mapboxgl.LngLatBounds();
        places.forEach((stop, i) => {
          bounds.extend([stop.lng, stop.lat]);
          const el = buildMarkerEl(i, stop.image_url, stop.id === activeId);
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          el.addEventListener("click", () => onSelect(stop.id));
          markersRef.current.push(marker);
        });
        map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 });
      } catch {
        /* Non-fatal map overlay failure */
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [places, onSelect]);

  useEffect(() => {
    if (!activeId || !mapRef.current) return;
    const stop = places.find((s) => s.id === activeId);
    if (!stop) return;
    places.forEach((s, i) => {
      const el = markersRef.current[i]?.getElement();
      if (el) el.style.transform = s.id === activeId ? "scale(1.08)" : "scale(1)";
    });
    mapRef.current.flyTo({
      center: [stop.lng, stop.lat],
      zoom: Math.max(mapRef.current.getZoom(), 9),
      duration: 500,
    });
  }, [activeId, places]);

  if (!getMapboxToken()) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-500 text-sm ${className}`}>
        Mapbox token missing
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

interface Props {
  places: AdventurePlace[];
  country: string;
  locale?: string;
  activeIds?: Set<string>;
  activeId?: string | null;
  onActiveChange?: (id: string) => void;
  className?: string;
}

export function AdventureRouteMap({
  places,
  country,
  locale = "en",
  activeIds,
  activeId: controlledActiveId,
  onActiveChange,
  className = "",
}: Props) {
  const t = useTranslations("adventure");
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);

  const activeId = controlledActiveId ?? internalActiveId;
  const setActiveId = useCallback(
    (id: string) => {
      if (onActiveChange) onActiveChange(id);
      else setInternalActiveId(id);
    },
    [onActiveChange]
  );

  const sorted = useMemo(
    () => [...places].sort((a, b) => a.order_index - b.order_index),
    [places]
  );

  useEffect(() => {
    if (sorted.length && !activeId) setActiveId(sorted[0].id);
  }, [sorted, activeId, setActiveId]);

  const activeStop = sorted.find((s) => s.id === activeId) ?? sorted[0];

  const routeUrl = useMemo(
    () =>
      buildGoogleMapsDirUrl(
        sorted.map((s) => {
          const tr = s.translations?.[locale] ?? s.translations?.en;
          return {
            lat: s.lat,
            lng: s.lng,
            name: s.name,
            city: s.region,
            country: s.country || country,
            mapsQuery: tr?.maps_query,
            mapsUrl: tr?.maps_url,
          };
        }),
        "driving"
      ),
    [sorted, country, locale]
  );

  const focusStop = useCallback(
    (id: string) => {
      setActiveId(id);
      document.getElementById(`adventure-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [setActiveId]
  );

  if (sorted.length === 0) return null;

  const inCart = (id: string) => !activeIds || activeIds.has(id);

  const detailPanel = activeStop ? (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-lg overflow-hidden">
      {activeStop.image_url && (
        <div className="relative h-24 w-full">
          <Image src={activeStop.image_url} alt={activeStop.name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="p-3">
        <p className="font-bold text-stone-900 text-sm">{activeStop.name}</p>
        <p className="text-orange-600 text-xs font-medium mt-0.5">{t("mapDayBadge", { day: activeStop.day })}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <a
            href={buildGoogleMapsDirUrl(
              [
                {
                  lat: activeStop.lat,
                  lng: activeStop.lng,
                  name: activeStop.name,
                  city: activeStop.region,
                  country: activeStop.country || country,
                  mapsQuery: activeStop.translations?.[locale]?.maps_query,
                  mapsUrl: activeStop.translations?.[locale]?.maps_url,
                },
              ],
              "driving"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold"
          >
            <Navigation className="w-3 h-3" />
            {t("mapNavigate")}
          </a>
          <a
            href={resolveMapsHref({
              lat: activeStop.lat,
              lng: activeStop.lng,
              name: activeStop.name,
              city: activeStop.region,
              country: activeStop.country || country,
              translations: activeStop.translations,
              locale,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 text-xs font-semibold"
          >
            <ExternalLink className="w-3 h-3" />
            {t("mapOpenGoogle")}
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-bold text-stone-900">{t("mapTitle")}</h3>
          <p className="text-stone-500 text-[11px]">{t("mapSubtitle")}</p>
        </div>
      </div>

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory map-chip-scroll">
        {sorted.map((stop, i) => (
          <button
            key={stop.id}
            type="button"
            onClick={() => focusStop(stop.id)}
            className={`snap-start flex-shrink-0 w-[132px] rounded-xl border p-2 text-left transition-all active:scale-[0.98] ${
              activeId === stop.id
                ? "border-orange-400 bg-orange-500 text-white shadow-md"
                : inCart(stop.id)
                  ? "border-orange-200 bg-white text-stone-800 shadow-sm"
                  : "border-stone-200 bg-stone-50 text-stone-500 opacity-80"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-orange-100 text-orange-700">
                {i + 1}
              </span>
              <span className="text-[9px] font-semibold uppercase opacity-80">
                {t("dayLabel", { day: stop.day })}
              </span>
            </div>
            <span className="block text-[10px] font-semibold leading-snug line-clamp-2">{stop.name}</span>
          </button>
        ))}
      </div>

      <a
        href={routeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-xs shadow-md active:scale-[0.99]"
      >
        <Car className="w-4 h-4" />
        {t("mapDrivingRoute", { count: sorted.length })}
      </a>

      <div className="lg:hidden space-y-2">
        {detailPanel}
        <button
          type="button"
          onClick={() => setMobileMapOpen(true)}
          className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white font-bold text-sm shadow-xl"
        >
          <span aria-hidden>📍</span>
          {t("mapFab")}
        </button>
      </div>

      <div className="hidden lg:block relative min-h-[280px] space-y-2">
        <AdventureMapboxCanvas
          places={sorted}
          activeId={activeId}
          onSelect={focusStop}
          className="w-full h-[min(48vh,360px)] rounded-2xl overflow-hidden border border-orange-200/70 shadow-md ring-1 ring-black/5"
        />
        {detailPanel}
      </div>

      {mobileMapOpen && (
        <div className="fixed inset-0 z-[90] bg-stone-950/50 lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
            <h3 className="font-bold text-sm">{t("mapTitle")}</h3>
            <button type="button" onClick={() => setMobileMapOpen(false)} className="p-2 rounded-xl border" aria-label={t("mapClose")}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <AdventureMapboxCanvas
              places={sorted}
              activeId={activeId}
              onSelect={focusStop}
              className="w-full h-full"
            />
          </div>
          <div className="p-3 bg-white border-t max-h-[40vh] overflow-y-auto">{detailPanel}</div>
        </div>
      )}
    </div>
  );
}
