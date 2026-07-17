"use server";

import { createClient } from "@/lib/supabase/server";

export interface SavedRoute {
  id: string;
  title: string;
  city: string | null;
  country: string | null;
  route_type: "city" | "country";
  status: "saved" | "visited";
  travel_date: string | null;
  created_at: string;
  route_places: {
    place_id: string;
    name: string;
    city: string;
    country: string;
    image_url: string;
    lat: number;
    lng: number;
    order: number;
    visited?: boolean;
  }[];
}

export async function getMyRoutes(): Promise<{
  saved: SavedRoute[];
  visited: SavedRoute[];
  user: { email: string; full_name: string | null; avatar_url: string | null } | null;
}> {
  const empty = { saved: [], visited: [], user: null };
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return empty;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return empty;

  const [routesRes, profileRes] = await Promise.all([
    supabase
      .from("user_routes")
      .select("id, title, city, country, route_type, status, travel_date, created_at, route_places")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("email, full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const routes = ((routesRes.data ?? []) as SavedRoute[]).map((r) => ({
    ...r,
    route_type: r.route_type ?? "city",
  }));
  return {
    saved: routes.filter((r) => r.status === "saved"),
    visited: routes.filter((r) => r.status === "visited"),
    user: profileRes.data
      ? {
          email: profileRes.data.email ?? user.email ?? "",
          full_name: profileRes.data.full_name,
          avatar_url: profileRes.data.avatar_url ?? null,
        }
      : { email: user.email ?? "", full_name: null, avatar_url: null },
  };
}
