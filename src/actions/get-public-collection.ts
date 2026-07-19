"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { FavoritePlace } from "@/actions/favorites";
import { slugify } from "@/lib/utils";

export type PublicCollection = {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  country: string;
  title: string;
  places: FavoritePlace[];
};

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

async function fetchPublicCollection(
  handle: string,
  slug: string
): Promise<PublicCollection | null> {
  const supabase = createServiceClient() ?? (await createClient());

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .ilike("username", handle)
    .maybeSingle();
  if (!profile?.id || !profile.username) return null;

  const { data: metaRows } = await supabase
    .from("user_collection_meta")
    .select("country, title, visibility")
    .eq("user_id", profile.id)
    .eq("visibility", "public");

  const meta = (metaRows ?? []).find(
    (m) => slugify(String(m.country)) === slug
  );
  if (!meta) return null;

  const country = String(meta.country);
  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("place_id, name, city, country, image_url, lat, lng, created_at")
    .eq("user_id", profile.id)
    .eq("country", country)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPublicCollection]", error.message);
    return null;
  }

  return {
    username: profile.username as string,
    fullName: (profile.full_name as string | null) ?? null,
    avatarUrl: (profile.avatar_url as string | null) ?? null,
    country,
    title: (meta.title as string)?.trim() || `My ${country}`,
    places: (favorites ?? []) as FavoritePlace[],
  };
}

export async function getPublicCollection(
  username: string,
  countrySlug: string
): Promise<PublicCollection | null> {
  if (!supabaseConfigured()) return null;
  const handle = username?.trim().toLowerCase();
  const slug = countrySlug?.trim().toLowerCase();
  if (!handle || !slug) return null;

  try {
    return await unstable_cache(
      async () => fetchPublicCollection(handle, slug),
      ["public-collection-v1", handle, slug],
      { revalidate: 120, tags: ["public-collections"] }
    )();
  } catch (err) {
    console.error("[getPublicCollection]", err);
    return null;
  }
}