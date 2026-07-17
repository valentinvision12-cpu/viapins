"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RouteCartItem } from "@/lib/context/route-cart-context";
import { getCartScope, validateSingleCityRoute, validateAdventureRoute, getItemMode } from "@/lib/route-scope";
import { sortByRecommendedOrder } from "@/lib/adventure-itinerary";

export type SaveRouteResult =
  | { success: true; routeId: string }
  | { success: false; error: string };

export async function saveRouteAction(
  title: string,
  items: RouteCartItem[]
): Promise<SaveRouteResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return { success: false, error: "Supabase не е конфигуриран." };
  }

  const mode = items[0] ? getItemMode(items[0]) : "city";
  const orderedItems =
    mode === "adventure" ? sortByRecommendedOrder(items) : items;

  const scopeError =
    mode === "adventure"
      ? validateAdventureRoute(orderedItems)
      : validateSingleCityRoute(orderedItems);
  if (scopeError) {
    return { success: false, error: scopeError };
  }

  const scope = getCartScope(orderedItems)!;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Не си влязъл в акаунта си." };
  }

  const routePlaces = orderedItems.map((item, idx) => ({
    place_id: item.id,
    name: item.name,
    city: item.region ?? item.city,
    country: item.country,
    image_url: item.image_url,
    lat: item.lat,
    lng: item.lng,
    order: idx,
    visited: false,
    requires_car: item.requires_car ?? false,
    mode: mode,
  }));

  const isAdventure = mode === "adventure";

  const { data, error } = await supabase
    .from("user_routes")
    .insert({
      user_id: user.id,
      title: title.trim() || (isAdventure
        ? `${scope.country} Adventure`
        : `${scope.mode === "city" ? scope.city : ""} Route`),
      city: isAdventure ? null : scope.mode === "city" ? scope.city : null,
      country: scope.country,
      route_type: isAdventure ? "country" : "city",
      route_places: routePlaces,
      status: "saved",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Грешка при запазване." };
  }

  revalidatePath("/my-passport");
  return { success: true, routeId: data.id };
}

export async function markRouteVisitedAction(routeId: string): Promise<{ success: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return { success: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: route } = await supabase
    .from("user_routes")
    .select("route_places")
    .eq("id", routeId)
    .eq("user_id", user.id)
    .single();

  if (!route) return { success: false };

  const places = (route.route_places as { visited?: boolean }[]).map((p) => ({
    ...p,
    visited: true,
  }));

  const { error } = await supabase
    .from("user_routes")
    .update({ status: "visited", route_places: places })
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (!error) revalidatePath("/my-passport");
  return { success: !error };
}

export async function togglePlaceVisitedAction(
  routeId: string,
  placeId: string,
  visited: boolean
): Promise<{ success: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return { success: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: route } = await supabase
    .from("user_routes")
    .select("route_places, status")
    .eq("id", routeId)
    .eq("user_id", user.id)
    .single();

  if (!route) return { success: false };

  type PlaceRow = { place_id: string; visited?: boolean };
  const places = (route.route_places as PlaceRow[]).map((p) =>
    p.place_id === placeId ? { ...p, visited } : p
  );

  const allVisited = places.length > 0 && places.every((p) => p.visited);
  const anyVisited = places.some((p) => p.visited);

  const { error } = await supabase
    .from("user_routes")
    .update({
      route_places: places,
      status: allVisited ? "visited" : anyVisited ? "saved" : "saved",
    })
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (!error) revalidatePath("/my-passport");
  return { success: !error };
}

export async function deleteRouteAction(routeId: string): Promise<{ success: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return { success: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("user_routes")
    .delete()
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (!error) revalidatePath("/my-passport");
  return { success: !error };
}
