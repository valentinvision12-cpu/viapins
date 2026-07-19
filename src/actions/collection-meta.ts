"use server";

import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";

export type CollectionVisibility = "private" | "public" | "shared";

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function getMyCollectionMeta(): Promise<
  Record<string, { visibility: CollectionVisibility; title: string }>
> {
  if (!supabaseConfigured()) return {};
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from("user_collection_meta")
      .select("country, visibility, title")
      .eq("user_id", user.id);

    if (error) return {};
    const out: Record<string, { visibility: CollectionVisibility; title: string }> =
      {};
    for (const row of data ?? []) {
      out[String(row.country)] = {
        visibility: (row.visibility as CollectionVisibility) || "private",
        title: (row.title as string) || "",
      };
    }
    return out;
  } catch {
    return {};
  }
}

export async function setCollectionVisibilityAction(
  country: string,
  visibility: CollectionVisibility
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseConfigured()) return { success: false, error: "supabase_missing" };
  const c = country?.trim();
  if (!c) return { success: false, error: "invalid" };
  if (!["private", "public", "shared"].includes(visibility)) {
    return { success: false, error: "invalid" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const { error } = await supabase.from("user_collection_meta").upsert(
      {
        user_id: user.id,
        country: c,
        visibility,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,country" }
    );

    if (error) {
      console.error("[setCollectionVisibilityAction]", error.message);
      return { success: false, error: "save_failed" };
    }

    revalidatePassport(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "save_failed" };
  }
}
