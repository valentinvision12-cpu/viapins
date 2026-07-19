"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { PassportPost } from "@/actions/travel-posts";

export type FollowResult =
  | { success: true; following: boolean }
  | { success: false; error: string };

export type PublicTraveler = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string;
  cover_url: string;
  home_country: string;
  interests: string[];
  languages: string[];
  followers: number;
  following: number;
  isFollowing: boolean;
  isSelf: boolean;
  publicPosts: PassportPost[];
  publicCollections: { country: string; title: string; placeCount: number }[];
};

type CachedPublicTraveler = Omit<PublicTraveler, "isFollowing" | "isSelf">;

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  if (!supabaseConfigured() || !userId) {
    return { followers: 0, following: 0 };
  }
  try {
    const supabase = await createClient();
    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("user_follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);
    if (followersRes.error || followingRes.error) {
      return { followers: 0, following: 0 };
    }
    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    };
  } catch {
    return { followers: 0, following: 0 };
  }
}

export async function toggleFollowAction(
  targetUserId: string
): Promise<FollowResult> {
  if (!supabaseConfigured()) {
    return { success: false, error: "supabase_missing" };
  }
  const target = targetUserId?.trim();
  if (!target) return { success: false, error: "invalid" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };
    if (user.id === target) return { success: false, error: "self" };

    const { data: existing } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", target)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", target);
      if (error) return { success: false, error: "save_failed" };
      revalidatePassport(user.id);
      revalidateTag("discovery-feed");
      return { success: true, following: false };
    }

    const { error } = await supabase.from("user_follows").insert({
      follower_id: user.id,
      following_id: target,
    });
    if (error) return { success: false, error: "save_failed" };
    revalidatePassport(user.id);
    revalidateTag("discovery-feed");
    return { success: true, following: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}

async function fetchPublicTravelerCached(
  handle: string
): Promise<CachedPublicTraveler | null> {
  const supabase = createServiceClient() ?? (await createClient());

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, cover_url, home_country, interests, languages"
    )
    .ilike("username", handle)
    .maybeSingle();

  if (error || !profile?.username) return null;

  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("user_follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", profile.id),
  ]);

  const counts = {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };

  const [{ data: posts }, { data: collectionMeta }] = await Promise.all([
    supabase
      .from("travel_posts")
      .select(
        "id, title, tip, rating, city, country, location, photo_urls, created_at"
      )
      .eq("user_id", profile.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_collection_meta")
      .select("country, title, visibility")
      .eq("user_id", profile.id)
      .eq("visibility", "public"),
  ]);

  const publicPosts: PassportPost[] = (posts ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    location:
      (row.location as string)?.trim() ||
      [row.city, row.country].filter(Boolean).join(", "),
    date: String(row.created_at).slice(0, 10),
    rating: Number(row.rating) || 0,
    tip: (row.tip as string) ?? "",
    photoCount: Array.isArray(row.photo_urls) ? row.photo_urls.length : 0,
  }));

  const publicCollections: PublicTraveler["publicCollections"] = [];
  for (const m of collectionMeta ?? []) {
    const country = String(m.country);
    const { count } = await supabase
      .from("user_favorites")
      .select("place_id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("country", country);
    publicCollections.push({
      country,
      title: (m.title as string)?.trim() || `My ${country}`,
      placeCount: count ?? 0,
    });
  }

  return {
    id: profile.id as string,
    username: profile.username as string,
    full_name: (profile.full_name as string | null) ?? null,
    avatar_url: (profile.avatar_url as string | null) ?? null,
    bio: (profile.bio as string) ?? "",
    cover_url: (profile.cover_url as string) ?? "",
    home_country: (profile.home_country as string) ?? "",
    interests: (profile.interests as string[]) ?? [],
    languages: (profile.languages as string[]) ?? [],
    followers: counts.followers,
    following: counts.following,
    publicPosts,
    publicCollections,
  };
}

export async function getPublicTraveler(
  username: string
): Promise<PublicTraveler | null> {
  if (!supabaseConfigured()) return null;
  const handle = username?.trim().toLowerCase();
  if (!handle) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();

    const cached = await unstable_cache(
      async () => fetchPublicTravelerCached(handle),
      ["public-traveler-v1", handle],
      { revalidate: 60, tags: [`traveler-${handle}`, "travelers"] }
    )();

    if (!cached) return null;

    let isFollowing = false;
    if (viewer && viewer.id !== cached.id) {
      const { data: edge } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", cached.id)
        .maybeSingle();
      isFollowing = !!edge;
    }

    return {
      ...cached,
      isFollowing,
      isSelf: viewer?.id === cached.id,
    };
  } catch (err) {
    console.error("[getPublicTraveler]", err);
    return null;
  }
}

export async function listFollowingIds(): Promise<string[]> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    if (error) return [];
    return (data ?? []).map((r) => r.following_id as string);
  } catch {
    return [];
  }
}