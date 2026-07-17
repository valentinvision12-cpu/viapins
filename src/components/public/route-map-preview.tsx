"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MapStop } from "@/lib/adventure-itinerary";
import { getBounds, projectToSvg, spreadSvgPinPositions } from "@/lib/adventure-itinerary";

interface Props {
  stops: MapStop[];
  activeIds?: Set<string>;
  width?: number;
  height?: number;
  className?: string;
}

export function RouteMapPreview({
  stops,
  activeIds,
  width = 360,
  height = 220,
  className = "",
}: Props) {
  const t = useTranslations("routePreview");
  const sorted = useMemo(
    () => [...stops].sort((a, b) => a.order_index - b.order_index),
    [stops]
  );

  const { bounds, points, polyline } = useMemo(() => {
    const b = getBounds(sorted);
    const rawPts = sorted.map((s) => ({
      ...s,
      ...projectToSvg(s.lat, s.lng, b, width, height),
    }));
    const pts = spreadSvgPinPositions(rawPts, 30, 14, width, height);
    const line = rawPts.map((p) => `${p.x},${p.y}`).join(" ");
    return { bounds: b, points: pts, polyline: line };
  }, [sorted, width, height]);

  if (sorted.length === 0) return null;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-amber-50/40 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Route map preview"
      >
        {/* Subtle grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`h-${f}`}
            x1={0}
            y1={height * f}
            x2={width}
            y2={height * f}
            stroke="rgba(154,123,79,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Route line */}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke="rgba(234,88,12,0.45)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {/* Stops */}
        {points.map((p, i) => {
          const active = !activeIds || activeIds.has(p.id);
          const num = i + 1;
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 11 : 8}
                fill={active ? "#ea580c" : "#d6d3d1"}
                stroke="white"
                strokeWidth={2}
                opacity={active ? 1 : 0.5}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={active ? 9 : 8}
                fontWeight="bold"
                fill="white"
              >
                {num}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-white/75 backdrop-blur-sm border-t border-orange-100/80">
        <p className="text-[10px] text-stone-500 text-center">
          {t("stopsHint", { count: sorted.length })}
        </p>
      </div>
    </div>
  );
}
