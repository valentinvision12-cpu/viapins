import type { RouteCartItem, RouteMode } from "@/lib/context/route-cart-context";

export type CityRouteScope = { mode: "city"; city: string; country: string };
export type AdventureRouteScope = { mode: "adventure"; country: string };
export type RouteScope = CityRouteScope | AdventureRouteScope;

export type BlockReason = "different_city" | "different_country" | "mode_mismatch";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function getItemMode(item: RouteCartItem): RouteMode {
  return item.mode ?? "city";
}

export function getCartScope(items: RouteCartItem[]): RouteScope | null {
  if (items.length === 0) return null;
  const first = items[0];
  const mode = getItemMode(first);
  if (mode === "adventure") {
    return { mode: "adventure", country: first.country };
  }
  return { mode: "city", city: first.city, country: first.country };
}

export function canAddToCart(
  items: RouteCartItem[],
  item: RouteCartItem
): { ok: true } | { ok: false; reason: BlockReason; scope: RouteScope } {
  const itemMode = getItemMode(item);
  const current = getCartScope(items);
  if (!current) return { ok: true };

  if (current.mode !== itemMode) {
    const scope: RouteScope =
      itemMode === "adventure"
        ? { mode: "adventure", country: item.country }
        : { mode: "city", city: item.city, country: item.country };
    return { ok: false, reason: "mode_mismatch", scope };
  }

  if (current.mode === "adventure") {
    if (norm(current.country) !== norm(item.country)) {
      return {
        ok: false,
        reason: "different_country",
        scope: { mode: "adventure", country: item.country },
      };
    }
    return { ok: true };
  }

  if (
    norm(current.city) !== norm(item.city) ||
    norm(current.country) !== norm(item.country)
  ) {
    return {
      ok: false,
      reason: "different_city",
      scope: { mode: "city", city: item.city, country: item.country },
    };
  }
  return { ok: true };
}

export function validateSingleCityRoute(items: RouteCartItem[]): string | null {
  const cityItems = items.filter((i) => getItemMode(i) === "city");
  if (cityItems.length === 0) return "The route is empty.";
  const scope = getCartScope(cityItems)!;
  if (scope.mode !== "city") return null;
  for (const item of cityItems) {
    if (norm(scope.city) !== norm(item.city) || norm(scope.country) !== norm(item.country)) {
      return `Routes must stay within one city. "${item.city}" is a different city.`;
    }
  }
  return null;
}

export function validateAdventureRoute(items: RouteCartItem[]): string | null {
  const advItems = items.filter((i) => getItemMode(i) === "adventure");
  if (advItems.length === 0) return "The adventure route is empty.";
  const country = advItems[0].country;
  for (const item of advItems) {
    if (norm(item.country) !== norm(country)) {
      return `Adventure routes cover one country only. "${item.country}" is a different country.`;
    }
  }
  return null;
}
