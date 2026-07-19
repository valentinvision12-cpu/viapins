"use server";

import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";

export type TripDetailsInput = {
  days?: number;
  memories?: string;
  tips?: string;
  budget?: string;
  visibility?: "private" | "public" | "shared";
  title?: string;
};

export type TripDetailsResult =
  | { success: true }
  | { success: false; error: string };

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function updateTripDetailsAction(
  routeId: string,
  input: TripDetailsInput
): Promise<TripDetailsResult> {
  if (!supabaseConfigured()) return { success: false, error: "supabase_missing" };
  const id = routeId?.trim();
  if (!id) return { success: false, error: "invalid" };

  const days = Math.max(0, Math.min(365, Math.round(Number(input.days) || 0)));
  const memories = (input.memories ?? "").trim().slice(0, 4000);
  const tips = (input.tips ?? "").trim().slice(0, 2000);
  const budget = (input.budget ?? "").trim().slice(0, 120);
  const visibility =
    input.visibility === "public" || input.visibility === "shared"
      ? input.visibility
      : "private";
  const title = input.title?.trim().slice(0, 120);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const patch: Record<string, unknown> = {
      days,
      memories,
      tips,
      budget,
      visibility,
    };
    if (title) patch.title = title;

    // Owner path
    let { error } = await supabase
      .from("user_routes")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    // Collaborator editor fallback (RLS allows update without user_id match)
    if (error) {
      const retry = await supabase.from("user_routes").update(patch).eq("id", id);
      error = retry.error;
    }

    if (error) {
      // Columns missing until migration 015
      if (
        error.message.includes("days") ||
        error.message.includes("memories") ||
        error.message.includes("budget") ||
        error.message.includes("visibility")
      ) {
        return { success: false, error: "migration_required" };
      }
      console.error("[updateTripDetailsAction]", error.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}
