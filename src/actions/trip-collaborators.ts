"use server";

import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";

export type TripCollaborator = {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: "viewer" | "editor";
  status: "pending" | "accepted" | "declined";
  isInvitee: boolean;
};

export type CollabResult =
  | { success: true }
  | { success: false; error: string };

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function listTripCollaborators(
  routeId: string
): Promise<TripCollaborator[]> {
  if (!supabaseConfigured()) return [];
  const id = routeId?.trim();
  if (!id) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rows, error } = await supabase
      .from("trip_collaborators")
      .select("user_id, role, status, invited_by")
      .eq("route_id", id);

    if (error || !rows?.length) return [];

    const ids = [...new Set(rows.map((r) => r.user_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    return rows.map((row) => {
      const p = byId.get(row.user_id as string);
      return {
        userId: row.user_id as string,
        username: (p?.username as string | null) ?? null,
        fullName: (p?.full_name as string | null) ?? null,
        avatarUrl: (p?.avatar_url as string | null) ?? null,
        role: (row.role as "viewer" | "editor") || "editor",
        status: (row.status as TripCollaborator["status"]) || "pending",
        isInvitee: row.user_id === user.id,
      };
    });
  } catch {
    return [];
  }
}

export async function inviteTripCollaboratorAction(
  routeId: string,
  username: string
): Promise<CollabResult> {
  if (!supabaseConfigured()) return { success: false, error: "supabase_missing" };
  const id = routeId?.trim();
  const handle = username?.trim().replace(/^@/, "").toLowerCase();
  if (!id || !handle) return { success: false, error: "invalid" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const { data: route } = await supabase
      .from("user_routes")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!route) return { success: false, error: "not_owner" };

    const { data: target } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", handle)
      .maybeSingle();
    if (!target?.id) return { success: false, error: "user_not_found" };
    if (target.id === user.id) return { success: false, error: "self" };

    const { error } = await supabase.from("trip_collaborators").upsert(
      {
        route_id: id,
        user_id: target.id,
        invited_by: user.id,
        role: "editor",
        status: "pending",
      },
      { onConflict: "route_id,user_id" }
    );

    if (error) {
      console.error("[inviteTripCollaboratorAction]", error.message);
      return { success: false, error: "save_failed" };
    }

    // Mark trip as shared for passport clarity
    await supabase
      .from("user_routes")
      .update({ visibility: "shared" })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePassport(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}

export async function respondTripInviteAction(
  routeId: string,
  accept: boolean
): Promise<CollabResult> {
  if (!supabaseConfigured()) return { success: false, error: "supabase_missing" };
  const id = routeId?.trim();
  if (!id) return { success: false, error: "invalid" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    if (!accept) {
      const { error } = await supabase
        .from("trip_collaborators")
        .delete()
        .eq("route_id", id)
        .eq("user_id", user.id);
      if (error) return { success: false, error: "save_failed" };
      revalidatePassport(user.id);
      return { success: true };
    }

    const { error } = await supabase
      .from("trip_collaborators")
      .update({ status: "accepted" })
      .eq("route_id", id)
      .eq("user_id", user.id);

    if (error) return { success: false, error: "save_failed" };
    revalidatePassport(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}

export async function removeTripCollaboratorAction(
  routeId: string,
  targetUserId: string
): Promise<CollabResult> {
  if (!supabaseConfigured()) return { success: false, error: "supabase_missing" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const { error } = await supabase
      .from("trip_collaborators")
      .delete()
      .eq("route_id", routeId)
      .eq("user_id", targetUserId);

    if (error) return { success: false, error: "save_failed" };
    revalidatePassport(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}

/** Pending invites for the signed-in user. */
export async function listMyPendingTripInvites(): Promise<
  {
    routeId: string;
    title: string;
    country: string | null;
    city: string | null;
    ownerUsername: string | null;
  }[]
> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: edges, error } = await supabase
      .from("trip_collaborators")
      .select("route_id, invited_by")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error || !edges?.length) return [];

    const routeIds = edges.map((e) => e.route_id as string);
    const { data: routes } = await supabase
      .from("user_routes")
      .select("id, title, city, country, user_id")
      .in("id", routeIds);

    const ownerIds = [...new Set((routes ?? []).map((r) => r.user_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ownerIds);
    const byOwner = new Map(
      (profiles ?? []).map((p) => [p.id as string, p.username as string | null])
    );

    return (routes ?? []).map((r) => ({
      routeId: r.id as string,
      title: r.title as string,
      country: (r.country as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      ownerUsername: byOwner.get(r.user_id as string) ?? null,
    }));
  } catch {
    return [];
  }
}

/** Accepted shared trips (not owned by me). */
export async function listSharedWithMeRoutes(): Promise<
  {
    id: string;
    title: string;
    city: string | null;
    country: string | null;
    route_type: "city" | "country";
    status: "saved" | "visited";
    travel_date: string | null;
    created_at: string;
    route_places: unknown[];
    days: number;
    memories: string;
    tips: string;
    budget: string;
    visibility: "private" | "public" | "shared";
    shared: true;
  }[]
> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: edges, error } = await supabase
      .from("trip_collaborators")
      .select("route_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    if (error || !edges?.length) return [];

    const routeIds = edges.map((e) => e.route_id as string);
    const { data: routes } = await supabase
      .from("user_routes")
      .select(
        "id, title, city, country, route_type, status, travel_date, created_at, route_places, days, memories, tips, budget, visibility, user_id"
      )
      .in("id", routeIds);

    return (routes ?? [])
      .filter((r) => r.user_id !== user.id)
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
        shared: true as const,
      }));
  } catch {
    return [];
  }
}
