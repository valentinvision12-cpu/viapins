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
  days?: number;
  memories?: string;
  tips?: string;
  budget?: string;
  visibility?: "private" | "public" | "shared";
  /** True when this trip is shared with me (not owned). */
  shared?: boolean;
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

export const ROUTE_SELECT_FULL =
  "id, title, city, country, route_type, status, travel_date, created_at, route_places, days, memories, tips, budget, visibility";

export const ROUTE_SELECT_LEGACY =
  "id, title, city, country, route_type, status, travel_date, created_at, route_places";

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

  let routesRes = await supabase
    .from("user_routes")
    .select(ROUTE_SELECT_FULL)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (
    routesRes.error &&
    (routesRes.error.message.includes("days") ||
      routesRes.error.message.includes("memories") ||
      routesRes.error.message.includes("visibility"))
  ) {
    routesRes = (await supabase
      .from("user_routes")
      .select(ROUTE_SELECT_LEGACY)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as typeof routesRes;
  }

  const profileRes = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const routes = ((routesRes.data ?? []) as SavedRoute[]).map((r) => ({
    ...r,
    route_type: r.route_type ?? "city",
    days: r.days ?? 0,
    memories: r.memories ?? "",
    tips: r.tips ?? "",
    budget: r.budget ?? "",
    visibility: r.visibility ?? "private",
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
