"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listFollowingIds } from "@/actions/follows";

export type FeedItem = {
  id: string;
  title: string;
  tip: string;
  rating: number;
  location: string;
  date: string;
  photoUrl: string | null;
  author: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  fromFollowing: boolean;
};

type PublicFeedRow = Omit<FeedItem, "fromFollowing">;

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

async function fetchPublicFeedRows(take: number): Promise<PublicFeedRow[]> {
  const supabase = createServiceClient() ?? (await createClient());

  const { data: rows, error } = await supabase
    .from("travel_posts")
    .select(
      "id, user_id, title, tip, rating, city, country, location, photo_urls, created_at"
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(take);

  if (error || !rows?.length) return [];

  const authorIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", authorIds);

  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        id: p.id as string,
        username: (p.username as string | null) ?? null,
        full_name: (p.full_name as string | null) ?? null,
        avatar_url: (p.avatar_url as string | null) ?? null,
      },
    ])
  );

  return rows.map((row) => {
    const photos = Array.isArray(row.photo_urls) ? row.photo_urls : [];
    return {
      id: row.id as string,
      title: row.title as string,
      tip: (row.tip as string) ?? "",
      rating: Number(row.rating) || 0,
      location:
        (row.location as string)?.trim() ||
        [row.city, row.country].filter(Boolean).join(", "),
      date: String(row.created_at).slice(0, 10),
      photoUrl: (photos[0] as string) || null,
      author: byId.get(row.user_id as string) ?? {
        id: row.user_id as string,
        username: null,
        full_name: null,
        avatar_url: null,
      },
    };
  });
}

function getCachedPublicFeedRows(take: number) {
  return unstable_cache(
    async () => fetchPublicFeedRows(take),
    ["discovery-public-posts-v1", String(take)],
    { revalidate: 60, tags: ["discovery-feed"] }
  )();
}

/** Public discovery feed — following first, then global public posts. */
export async function getDiscoveryFeed(limit = 40): Promise<FeedItem[]> {
  if (!supabaseConfigured()) return [];
  const take = Math.max(1, Math.min(80, limit));

  try {
    const followingIds = await listFollowingIds();
    const rows = await getCachedPublicFeedRows(take);
    if (!rows.length) return [];

    const followingSet = new Set(followingIds);
    const items: FeedItem[] = rows.map((row) => ({
      ...row,
      fromFollowing: followingSet.has(row.author.id),
    }));

    items.sort((a, b) => {
      if (a.fromFollowing !== b.fromFollowing) {
        return a.fromFollowing ? -1 : 1;
      }
      return b.date.localeCompare(a.date);
    });

    return items;
  } catch (err) {
    console.error("[getDiscoveryFeed]", err);
    return [];
  }
}