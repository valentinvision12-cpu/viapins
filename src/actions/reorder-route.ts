"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function reorderRouteAction(
  routeId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return { success: false, error: "Supabase не е конфигуриран." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Не си влязъл." };

  const { data: route } = await supabase
    .from("user_routes")
    .select("route_places")
    .eq("id", routeId)
    .eq("user_id", user.id)
    .single();

  if (!route) return { success: false, error: "Маршрутът не е намерен." };

  // Build lookup map for O(1) access
  const placeMap = new Map<string, (typeof route.route_places)[0]>();
  for (const p of route.route_places as (typeof route.route_places)[0][]) {
    placeMap.set(p.place_id, p);
  }

  const reordered = orderedIds
    .map((id, idx) => {
      const p = placeMap.get(id);
      if (!p) return null;
      return { ...p, order: idx };
    })
    .filter(Boolean);

  const { error } = await supabase
    .from("user_routes")
    .update({ route_places: reordered })
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/my-passport");
  return { success: true };
}
