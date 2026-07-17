"use server";

import { createClient } from "@/lib/supabase/server";

export interface FavoritePlace {
  place_id: string;
  name: string;
  city: string;
  country: string;
  image_url: string;
  lat: number;
  lng: number;
  created_at?: string;
}

export async function getFavoritesAction(): Promise<FavoritePlace[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_favorites")
    .select("place_id, name, city, country, image_url, lat, lng, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as FavoritePlace[];
}

export async function addFavoriteAction(
  place: Omit<FavoritePlace, "created_at">
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("user_favorites").upsert({
    user_id: user.id,
    place_id: place.place_id,
    name: place.name,
    city: place.city,
    country: place.country,
    image_url: place.image_url,
    lat: place.lat,
    lng: place.lng,
  }, { onConflict: "user_id,place_id" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeFavoriteAction(
  placeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("place_id", placeId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
