"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePassport } from "@/lib/revalidate-passport";

export interface SaveTourToRouteInput {
  routeId: string;
  items: Array<{
    id: string;
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    image_url: string;
    order_index: number;
    mode?: "city" | "adventure";
    region?: string;
  }>;
}

export type SaveTourResult = 
  | { success: true }
  | { success: false; error: string };

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function saveTourToRouteAction(
  input: SaveTourToRouteInput
): Promise<SaveTourResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }

  const routeId = input.routeId?.trim();
  if (!routeId) {
    return { success: false, error: "invalid_route" };
  }

  if (!Array.isArray(input.items)) {
    return { success: false, error: "invalid_items" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "not_signed_in" };
    }

    // Verify ownership
    const { data: route, error: fetchError } = await supabase
      .from("user_routes")
      .select("id, route_places")
      .eq("id", routeId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !route) {
      return { success: false, error: "route_not_found" };
    }

    // Convert tour items to route place format
    const routePlaces = input.items.map((item, index) => ({
      place_id: item.id,
      name: item.name,
      city: item.city,
      country: item.country,
      lat: item.lat,
      lng: item.lng,
      image_url: item.image_url,
      order: index,
      visited: false,
    }));

    // Update route with new places
    const { error: updateError } = await supabase
      .from("user_routes")
      .update({ route_places: routePlaces })
      .eq("id", routeId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[saveTourToRouteAction]", updateError.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true };
  } catch (err) {
    console.error("[saveTourToRouteAction]", err);
    return { success: false, error: "save_failed" };
  }
}

export async function addTourPlaceToRouteAction(
  routeId: string,
  place: {
    id: string;
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    image_url: string;
  }
): Promise<SaveTourResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }

  const id = routeId?.trim();
  if (!id) {
    return { success: false, error: "invalid_route" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "not_signed_in" };
    }

    // Fetch current route
    const { data: route, error: fetchError } = await supabase
      .from("user_routes")
      .select("route_places")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !route) {
      return { success: false, error: "route_not_found" };
    }

    const currentPlaces = Array.isArray(route.route_places) ? route.route_places : [];
    
    // Check if place already exists
    if (currentPlaces.some((p: any) => p.place_id === place.id)) {
      return { success: true }; // Already added
    }

    // Add new place
    const newPlace = {
      place_id: place.id,
      name: place.name,
      city: place.city,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      image_url: place.image_url,
      order: currentPlaces.length,
      visited: false,
    };

    const updatedPlaces = [...currentPlaces, newPlace];

    const { error: updateError } = await supabase
      .from("user_routes")
      .update({ route_places: updatedPlaces })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[addTourPlaceToRouteAction]", updateError.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true };
  } catch (err) {
    console.error("[addTourPlaceToRouteAction]", err);
    return { success: false, error: "save_failed" };
  }
}

export async function removeTourPlaceFromRouteAction(
  routeId: string,
  placeId: string
): Promise<SaveTourResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }

  const id = routeId?.trim();
  if (!id || !placeId?.trim()) {
    return { success: false, error: "invalid" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "not_signed_in" };
    }

    // Fetch current route
    const { data: route, error: fetchError } = await supabase
      .from("user_routes")
      .select("route_places")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !route) {
      return { success: false, error: "route_not_found" };
    }

    const currentPlaces = Array.isArray(route.route_places) ? route.route_places : [];
    
    // Remove place and re-index order
    const updatedPlaces = currentPlaces
      .filter((p: any) => p.place_id !== placeId)
      .map((p: any, index: number) => ({ ...p, order: index }));

    const { error: updateError } = await supabase
      .from("user_routes")
      .update({ route_places: updatedPlaces })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[removeTourPlaceFromRouteAction]", updateError.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true };
  } catch (err) {
    console.error("[removeTourPlaceFromRouteAction]", err);
    return { success: false, error: "save_failed" };
  }
}
