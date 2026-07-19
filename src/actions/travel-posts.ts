"use server";

import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";

/** Place-linked social posts shown on the passport Posts tab. */
export type PassportPost = {
  id: string;
  title: string;
  location: string;
  date: string;
  rating: number;
  tip: string;
  photoCount: number;
};

export type CreateTravelPostInput = {
  place_id?: string;
  title: string;
  tip?: string;
  rating?: number;
  city?: string;
  country?: string;
  location?: string;
  photo_urls?: string[];
  visibility?: "private" | "public";
};

export type TravelPostResult =
  | { success: true; id: string }
  | { success: false; error: string };

type TravelPostRow = {
  id: string;
  title: string;
  tip: string | null;
  rating: number | null;
  city: string | null;
  country: string | null;
  location: string | null;
  photo_urls: string[] | null;
  created_at: string;
};

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

function mapRow(row: TravelPostRow): PassportPost {
  const location =
    row.location?.trim() ||
    [row.city, row.country].filter(Boolean).join(", ") ||
    "";
  return {
    id: row.id,
    title: row.title,
    location,
    date: row.created_at.slice(0, 10),
    rating: Math.max(0, Math.min(5, Number(row.rating) || 0)),
    tip: row.tip?.trim() ?? "",
    photoCount: Array.isArray(row.photo_urls) ? row.photo_urls.length : 0,
  };
}

export async function listMyTravelPosts(): Promise<PassportPost[]> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("travel_posts")
      .select(
        "id, title, tip, rating, city, country, location, photo_urls, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Table missing until migration 012
      if (
        error.message.includes("travel_posts") ||
        error.code === "42P01" ||
        error.message.includes("schema cache")
      ) {
        return [];
      }
      console.error("[listMyTravelPosts]", error.message);
      return [];
    }

    return ((data ?? []) as TravelPostRow[]).map(mapRow);
  } catch (err) {
    console.error("[listMyTravelPosts]", err);
    return [];
  }
}

export async function countMyReviews(): Promise<number> {
  if (!supabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("travel_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("rating", 0);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function createTravelPostAction(
  input: CreateTravelPostInput
): Promise<TravelPostResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }

  const title = input.title?.trim() ?? "";
  if (title.length < 2) {
    return { success: false, error: "title_required" };
  }
  if (title.length > 120) {
    return { success: false, error: "title_too_long" };
  }

  const tip = (input.tip ?? "").trim().slice(0, 800);
  const rating = Math.max(0, Math.min(5, Math.round(Number(input.rating) || 0)));
  const city = (input.city ?? "").trim().slice(0, 120);
  const country = (input.country ?? "").trim().slice(0, 120);
  const location =
    (input.location ?? "").trim().slice(0, 200) ||
    [city, country].filter(Boolean).join(", ");
  const place_id = (input.place_id ?? "").trim().slice(0, 200);
  const visibility = input.visibility === "public" ? "public" : "private";
  const photo_urls = (input.photo_urls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 6);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "not_signed_in" };
    }

    const { data, error } = await supabase
      .from("travel_posts")
      .insert({
        user_id: user.id,
        place_id,
        title,
        tip,
        rating,
        city,
        country,
        location,
        photo_urls,
        visibility,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createTravelPostAction]", error.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true, id: data.id as string };
  } catch (err) {
    console.error("[createTravelPostAction]", err);
    return { success: false, error: "save_failed" };
  }
}

export type PlaceReview = PassportPost & {
  authorUsername: string | null;
  authorName: string | null;
};

/** Public reviews for a place page. */
export async function listPublicPlaceReviews(
  placeId: string,
  limit = 20
): Promise<PlaceReview[]> {
  if (!supabaseConfigured()) return [];
  const id = placeId?.trim();
  if (!id) return [];

  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("travel_posts")
      .select(
        "id, user_id, title, tip, rating, city, country, location, photo_urls, created_at"
      )
      .eq("place_id", id)
      .eq("visibility", "public")
      .gt("rating", 0)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(50, limit)));

    if (error || !rows?.length) return [];

    const authorIds = [...new Set(rows.map((r) => r.user_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", authorIds);
    const byId = new Map(
      (profiles ?? []).map((p) => [p.id as string, p])
    );

    return rows.map((row) => {
      const author = byId.get(row.user_id as string);
      const mapped = mapRow(row as TravelPostRow);
      return {
        ...mapped,
        authorUsername: (author?.username as string | null) ?? null,
        authorName: (author?.full_name as string | null) ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function deleteTravelPostAction(
  postId: string
): Promise<TravelPostResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }
  const id = postId?.trim();
  if (!id) return { success: false, error: "save_failed" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const { error } = await supabase
      .from("travel_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true, id };
  } catch {
    return { success: false, error: "save_failed" };
  }
}
