import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { FavoritePlace } from "@/actions/favorites";
import type { SavedRoute } from "@/actions/get-my-routes";
import {
  ROUTE_SELECT_FULL,
  ROUTE_SELECT_LEGACY,
} from "@/actions/get-my-routes";
import { buildCountryCollections, travelerLevel } from "@/lib/collection-export";
import type { PassportPost } from "@/actions/travel-posts";

export type { PassportPost };

export type PendingTripInvite = {
  routeId: string;
  title: string;
  country: string | null;
  city: string | null;
  ownerUsername: string | null;
};

/** Country-grouped wishlist — mega-prompt Collections (private by default). */
export type PassportCollection = {
  id: string;
  title: string;
  country: string;
  visibility: "private" | "public" | "shared";
  places: FavoritePlace[];
};

function buildPassportCollections(
  favorites: FavoritePlace[],
  meta: Record<string, { visibility: "private" | "public" | "shared"; title: string }> = {}
): PassportCollection[] {
  return buildCountryCollections(favorites).map((c) => {
    const m = meta[c.country];
    return {
      ...c,
      visibility: m?.visibility ?? "private",
      title: m?.title?.trim() || c.title,
    };
  });
}

export type PassportProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string;
  cover_url: string;
  home_country: string;
  interests: string[];
  languages: string[];
};

export type PassportProfileStats = {
  /** Unique countries from favorites + routes */
  countries: number;
  /** Unique cities from favorites + routes */
  cities: number;
  /** Unique place ids discovered (favorites + route stops) */
  places: number;
  /** Unique places that have a photo URL in the user's data */
  photos: number;
  /** Reviews written (travel_posts with rating > 0) */
  reviews: number;
  /** Saved + visited routes count */
  routes: number;
  /** Countries that appear on visited routes only */
  countriesVisited: number;
  followers: number;
  following: number;
};

export type PassportProfile = {
  user: PassportProfileUser | null;
  stats: PassportProfileStats;
  level: { label: string; emoji: string; next?: string };
  /** Planning trips (user_routes status=saved) */
  saved: SavedRoute[];
  /** Completed trips (user_routes status=visited) */
  visited: SavedRoute[];
  /** Saved dream places (user_favorites) */
  favorites: FavoritePlace[];
  /** Favorites grouped by country for Collections tab */
  collections: PassportCollection[];
  /** Social travel posts */
  posts: PassportPost[];
  /** Trips shared with me (accepted collab) */
  sharedWithMe: SavedRoute[];
  /** Pending collab invites */
  pendingInvites: PendingTripInvite[];
};

const EMPTY_STATS: PassportProfileStats = {
  countries: 0,
  cities: 0,
  places: 0,
  photos: 0,
  reviews: 0,
  routes: 0,
  countriesVisited: 0,
  followers: 0,
  following: 0,
};

function emptyPassportProfile(): PassportProfile {
  return {
    user: null,
    stats: EMPTY_STATS,
    level: travelerLevel({ countries: 0, places: 0, routes: 0 }),
    saved: [],
    visited: [],
    favorites: [],
    collections: [],
    posts: [],
    sharedWithMe: [],
    pendingInvites: [],
  };
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

function placeKey(place: {
  place_id?: string;
  name?: string;
  city?: string;
}): string {
  if (place.place_id?.trim()) return place.place_id.trim();
  return `${place.name ?? ""}|${place.city ?? ""}`;
}

/** Aggregate identity stats from favorites + routes (unique, not sums). */
function aggregatePassportStats(
  favorites: FavoritePlace[],
  routes: SavedRoute[],
  reviews = 0,
  followCounts: { followers: number; following: number } = {
    followers: 0,
    following: 0,
  }
): PassportProfileStats {
  const countries = new Set<string>();
  const cities = new Set<string>();
  const places = new Set<string>();
  const photos = new Set<string>();
  const countriesVisited = new Set<string>();

  for (const f of favorites) {
    const country = f.country?.trim();
    if (country) countries.add(country);
    if (f.city?.trim() && country) cities.add(`${f.city.trim()}|${country}`);
    const key = placeKey(f);
    if (key) places.add(key);
    if (f.image_url?.trim()) photos.add(key);
  }

  for (const route of routes) {
    const isVisited = route.status === "visited";
    for (const p of route.route_places ?? []) {
      const country = p.country?.trim() || route.country?.trim() || "";
      if (country) {
        countries.add(country);
        if (isVisited) countriesVisited.add(country);
      }
      const city = p.city?.trim() || route.city?.trim() || "";
      if (city && country) cities.add(`${city}|${country}`);
      const key = placeKey(p);
      if (key) places.add(key);
      if (p.image_url?.trim()) photos.add(key);
    }
  }

  return {
    countries: countries.size,
    cities: cities.size,
    places: places.size,
    photos: photos.size,
    reviews,
    routes: routes.length,
    countriesVisited: countriesVisited.size,
    followers: followCounts.followers,
    following: followCounts.following,
  };
}

/**
 * Cookie-free passport load for a known user id (service role preferred).
 */
async function loadPassportProfileForUser(
  userId: string,
  emailFallback: string
): Promise<PassportProfile> {
  const supabase = createServiceClient() ?? (await createClient());

  let profileRes = await supabase
    .from("profiles")
    .select(
      "email, full_name, avatar_url, username, bio, cover_url, home_country, interests, languages"
    )
    .eq("id", userId)
    .maybeSingle();

  // Pre-migration 011: columns may be missing
  if (
    profileRes.error &&
    (profileRes.error.message.includes("username") ||
      profileRes.error.message.includes("bio") ||
      profileRes.error.message.includes("cover_url"))
  ) {
    profileRes = await supabase
      .from("profiles")
      .select("email, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
  }

  const [
    favoritesRes,
    routesResFull,
    postsRes,
    reviewsRes,
    followersRes,
    followingRes,
    collectionMetaRes,
    pendingEdgesRes,
    acceptedEdgesRes,
  ] = await Promise.all([
    supabase
      .from("user_favorites")
      .select("place_id, name, city, country, image_url, lat, lng, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_routes")
      .select(ROUTE_SELECT_FULL)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("travel_posts")
      .select(
        "id, title, tip, rating, city, country, location, photo_urls, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("travel_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("rating", 0),
    supabase
      .from("user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("user_follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
    supabase
      .from("user_collection_meta")
      .select("country, visibility, title")
      .eq("user_id", userId),
    supabase
      .from("trip_collaborators")
      .select("route_id, invited_by")
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("trip_collaborators")
      .select("route_id")
      .eq("user_id", userId)
      .eq("status", "accepted"),
  ]);

  let routesRes = routesResFull;
  if (
    routesRes.error &&
    (routesRes.error.message.includes("days") ||
      routesRes.error.message.includes("memories") ||
      routesRes.error.message.includes("visibility"))
  ) {
    routesRes = (await supabase
      .from("user_routes")
      .select(ROUTE_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })) as typeof routesRes;
  }

  const favorites = (favoritesRes.data ?? []) as FavoritePlace[];
  const routes = ((routesRes.data ?? []) as SavedRoute[]).map((r) => ({
    ...r,
    route_type: r.route_type ?? "city",
    route_places: Array.isArray(r.route_places) ? r.route_places : [],
    days: r.days ?? 0,
    memories: r.memories ?? "",
    tips: r.tips ?? "",
    budget: r.budget ?? "",
    visibility: r.visibility ?? "private",
  }));

  let posts: PassportPost[] = [];
  if (
    !postsRes.error ||
    !(
      postsRes.error.message.includes("travel_posts") ||
      postsRes.error.code === "42P01" ||
      postsRes.error.message.includes("schema cache")
    )
  ) {
    if (!postsRes.error) {
      posts = ((postsRes.data ?? []) as {
        id: string;
        title: string;
        tip: string | null;
        rating: number | null;
        city: string | null;
        country: string | null;
        location: string | null;
        photo_urls: string[] | null;
        created_at: string;
      }[]).map((row) => {
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
      });
    }
  }

  const reviewCount = reviewsRes.error ? 0 : (reviewsRes.count ?? 0);
  const followCounts = {
    followers:
      followersRes.error || followingRes.error ? 0 : (followersRes.count ?? 0),
    following:
      followersRes.error || followingRes.error ? 0 : (followingRes.count ?? 0),
  };

  const collectionMeta: Record<
    string,
    { visibility: "private" | "public" | "shared"; title: string }
  > = {};
  if (!collectionMetaRes.error) {
    for (const row of collectionMetaRes.data ?? []) {
      collectionMeta[String(row.country)] = {
        visibility:
          (row.visibility as "private" | "public" | "shared") || "private",
        title: (row.title as string) || "",
      };
    }
  }

  let pendingInvites: PendingTripInvite[] = [];
  if (!pendingEdgesRes.error && pendingEdgesRes.data?.length) {
    const routeIds = pendingEdgesRes.data.map((e) => e.route_id as string);
    const { data: pendingRoutes } = await supabase
      .from("user_routes")
      .select("id, title, city, country, user_id")
      .in("id", routeIds);
    const ownerIds = [
      ...new Set((pendingRoutes ?? []).map((r) => r.user_id as string)),
    ];
    const { data: ownerProfiles } = ownerIds.length
      ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
      : { data: [] as { id: string; username: string | null }[] };
    const byOwner = new Map(
      (ownerProfiles ?? []).map((p) => [
        p.id as string,
        p.username as string | null,
      ])
    );
    pendingInvites = (pendingRoutes ?? []).map((r) => ({
      routeId: r.id as string,
      title: r.title as string,
      country: (r.country as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      ownerUsername: byOwner.get(r.user_id as string) ?? null,
    }));
  }

  let sharedWithMe: SavedRoute[] = [];
  if (!acceptedEdgesRes.error && acceptedEdgesRes.data?.length) {
    const routeIds = acceptedEdgesRes.data.map((e) => e.route_id as string);
    const { data: sharedRoutes } = await supabase
      .from("user_routes")
      .select(
        "id, title, city, country, route_type, status, travel_date, created_at, route_places, days, memories, tips, budget, visibility, user_id"
      )
      .in("id", routeIds);
    sharedWithMe = (sharedRoutes ?? [])
      .filter((r) => r.user_id !== userId)
      .map((r) => ({
        id: r.id as string,
        title: r.title as string,
        city: (r.city as string | null) ?? null,
        country: (r.country as string | null) ?? null,
        route_type: ((r.route_type as string) || "city") as "city" | "country",
        status: (r.status as "saved" | "visited") || "saved",
        travel_date: (r.travel_date as string | null) ?? null,
        created_at: r.created_at as string,
        route_places: Array.isArray(r.route_places) ? r.route_places : [],
        days: Number(r.days) || 0,
        memories: (r.memories as string) || "",
        tips: (r.tips as string) || "",
        budget: (r.budget as string) || "",
        visibility: ((r.visibility as string) || "shared") as
          | "private"
          | "public"
          | "shared",
      }));
  }

  const saved = routes.filter((r) => r.status === "saved");
  const visited = routes.filter((r) => r.status === "visited");
  const stats = aggregatePassportStats(
    favorites,
    [...routes, ...sharedWithMe],
    reviewCount,
    followCounts
  );
  const level = travelerLevel({
    countries: stats.countries,
    places: stats.places,
    routes: stats.routes,
  });

  const profile = profileRes.data as {
    email?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
    bio?: string | null;
    cover_url?: string | null;
    home_country?: string | null;
    interests?: string[] | null;
    languages?: string[] | null;
  } | null;

  const collections = buildPassportCollections(favorites, collectionMeta);
  return {
    user: {
      id: userId,
      email: profile?.email ?? emailFallback,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      username: profile?.username ?? null,
      bio: profile?.bio ?? "",
      cover_url: profile?.cover_url ?? "",
      home_country: profile?.home_country ?? "",
      interests: profile?.interests ?? [],
      languages: profile?.languages ?? [],
    },
    stats,
    level,
    saved,
    visited,
    favorites,
    collections,
    posts,
    sharedWithMe,
    pendingInvites,
  };
}

/**
 * Single passport fetch: profile + favorites + routes → real stats for Header/Stats.
 * Request-memoized via React cache; cross-request via unstable_cache when service role is set.
 */
export const getPassportProfile = cache(async (): Promise<PassportProfile> => {
  const empty = emptyPassportProfile();
  if (!supabaseConfigured()) return empty;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return empty;

    const loader = async () =>
      loadPassportProfileForUser(user.id, user.email ?? "");

    // Cross-request cache only when service role is available (cookie-free).
    if (createServiceClient()) {
      return unstable_cache(loader, ["passport-profile-v2", user.id], {
        revalidate: 45,
        tags: [`passport-${user.id}`, "passport"],
      })();
    }
    return loader();
  } catch (err) {
    console.error("[getPassportProfile]", err);
    return empty;
  }
});