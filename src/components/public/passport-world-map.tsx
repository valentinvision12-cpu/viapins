"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { FavoritePlace } from "@/actions/favorites";
import type { SavedRoute } from "@/actions/get-my-routes";
import { PASSPORT } from "@/lib/luxury-palette";

type MapState = "visited" | "wishlist" | "favorite";

interface Props {
  favorites: FavoritePlace[];
  visitedRoutes: SavedRoute[];
  savedRoutes: SavedRoute[];
}

/**
 * Personal world map — journey through the world.
 * Visited = completed trips · Wishlist = saved places · Favorite = both.
 */
export function PassportWorldMap({
  favorites,
  visitedRoutes,
  savedRoutes,
}: Props) {
  const t = useTranslations("myTrip");

  const countries = useMemo(() => {
    const visited = new Set<string>();
    const wishlist = new Set<string>();

    for (const r of visitedRoutes) {
      for (const p of r.route_places ?? []) {
        const c = (p.country || r.country || "").trim();
        if (c) visited.add(c);
      }
      if (r.country?.trim()) visited.add(r.country.trim());
    }
    for (const f of favorites) {
      const c = f.country?.trim();
      if (c) wishlist.add(c);
    }
    // Planning routes also count toward discovery wishlist
    for (const r of savedRoutes) {
      for (const p of r.route_places ?? []) {
        const c = (p.country || r.country || "").trim();
        if (c && !visited.has(c)) wishlist.add(c);
      }
    }

    const all = new Set([...visited, ...wishlist]);
    const rows: { country: string; state: MapState }[] = [];
    for (const country of [...all].sort((a, b) => a.localeCompare(b))) {
      const isVisited = visited.has(country);
      const isWish = wishlist.has(country);
      let state: MapState = "wishlist";
      if (isVisited && isWish) state = "favorite";
      else if (isVisited) state = "visited";
      rows.push({ country, state });
    }
    return rows;
  }, [favorites, visitedRoutes, savedRoutes]);

  const counts = {
    visited: countries.filter((c) => c.state === "visited").length,
    wishlist: countries.filter((c) => c.state === "wishlist").length,
    favorite: countries.filter((c) => c.state === "favorite").length,
  };

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
      aria-label={t("passportMapTitle")}
    >
      <div
        className="relative px-4 py-4 sm:px-5"
        style={{
          background:
            "linear-gradient(145deg, #1A2E38 0%, #2A4555 50%, #3A5C6E 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(253,251,247,0.35) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(253,251,247,0.35) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            {t("passportMapEyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            {t("passportMapTitle")}
          </h2>
          <p className="mt-1 text-xs text-white/75">{t("passportMapSubtitle")}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-white/90">
            <LegendDot color="#6FCF97" label={t("passportMapVisited")} count={counts.visited} />
            <LegendDot color="#F2C94C" label={t("passportMapWishlist")} count={counts.wishlist} />
            <LegendDot color="#EB5757" label={t("passportMapFavorite")} count={counts.favorite} />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {countries.length === 0 ? (
          <p className="text-sm" style={{ color: PASSPORT.textMuted }}>
            {t("passportMapEmpty")}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {countries.map(({ country, state }) => (
              <li
                key={country}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background:
                    state === "visited"
                      ? "rgba(111,207,151,0.15)"
                      : state === "favorite"
                        ? "rgba(235,87,87,0.12)"
                        : "rgba(242,201,76,0.16)",
                  color: PASSPORT.text,
                  border: `1px solid ${PASSPORT.cardBorder}`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      state === "visited"
                        ? "#6FCF97"
                        : state === "favorite"
                          ? "#EB5757"
                          : "#F2C94C",
                  }}
                />
                {country}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LegendDot({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label} ({count})
    </span>
  );
}
