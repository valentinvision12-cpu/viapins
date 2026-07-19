"use server";

import { revalidatePassport } from "@/lib/revalidate-passport";
import { createClient } from "@/lib/supabase/server";
import {
  isValidUsername,
  normalizeUsername,
  PASSPORT_INTERESTS,
} from "@/lib/passport-identity";

export type PassportProfileUpdate = {
  full_name?: string;
  username?: string;
  bio?: string;
  home_country?: string;
  interests?: string[];
  languages?: string[];
  cover_url?: string;
};

export async function updatePassportIdentityAction(
  input: PassportProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const username = input.username != null ? normalizeUsername(input.username) : undefined;
  if (username !== undefined && username.length > 0 && !isValidUsername(username)) {
    return { success: false, error: "Invalid username" };
  }

  const interests = (input.interests ?? [])
    .map((i) => i.trim().toLowerCase())
    .filter((i) =>
      (PASSPORT_INTERESTS as readonly string[]).includes(i)
    )
    .slice(0, 9);

  const languages = (input.languages ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name !== undefined) {
    payload.full_name = input.full_name.trim().slice(0, 80) || null;
  }
  if (username !== undefined) {
    payload.username = username.length ? username : null;
  }
  if (input.bio !== undefined) {
    payload.bio = input.bio.trim().slice(0, 280);
  }
  if (input.home_country !== undefined) {
    payload.home_country = input.home_country.trim().slice(0, 80);
  }
  if (input.interests !== undefined) payload.interests = interests;
  if (input.languages !== undefined) payload.languages = languages;
  if (input.cover_url !== undefined) {
    payload.cover_url = input.cover_url.trim().slice(0, 2000);
  }

  let { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  // Pre-migration schema: retry without new columns
  if (
    error &&
    (error.message.includes("username") ||
      error.message.includes("bio") ||
      error.message.includes("cover_url") ||
      error.message.includes("home_country") ||
      error.message.includes("interests") ||
      error.message.includes("languages"))
  ) {
    const legacy: Record<string, unknown> = {};
    if (payload.full_name !== undefined) legacy.full_name = payload.full_name;
    const retry = await supabase.from("profiles").update(legacy).eq("id", user.id);
    error = retry.error;
    if (!error) {
      return {
        success: false,
        error: "Run migration 011_profile_passport_identity.sql in Supabase",
      };
    }
  }

  if (error) {
    if (error.message.includes("profiles_username_unique") || error.code === "23505") {
      return { success: false, error: "Username taken" };
    }
    return { success: false, error: error.message };
  }

  revalidatePassport(user.id);
  return { success: true };
}

function readUploadFile(formData: FormData): File | null {
  const raw = formData.get("avatar");
  if (raw instanceof File && raw.size > 0) return raw;
  if (raw instanceof Blob && raw.size > 0) {
    const name =
      raw instanceof File && raw.name ? raw.name : "avatar.jpg";
    return new File([raw], name, { type: raw.type || "image/jpeg" });
  }
  return null;
}

async function persistAvatarUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined,
  avatarUrl: string
): Promise<string | null> {
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (!updateError) return null;

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    email: email ?? null,
    avatar_url: avatarUrl,
  });

  return insertError?.message ?? updateError.message;
}

export async function updateProfileAvatarAction(
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const file = readUploadFile(formData);
  if (!file) return { success: false, error: "No file" };
  if (file.size > 3 * 1024 * 1024) return { success: false, error: "Max 3 MB" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type || "image/jpeg";
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  await supabase.storage
    .from("avatars")
    .remove(["jpg", "jpeg", "png", "webp"].map((e) => `${user.id}/avatar.${e}`));

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType });

  let avatarUrl: string;

  if (uploadError) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    if (dataUrl.length > 900_000) {
      return { success: false, error: uploadError.message };
    }
    avatarUrl = dataUrl;
  } else {
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  const profileError = await persistAvatarUrl(supabase, user.id, user.email, avatarUrl);
  if (profileError) return { success: false, error: profileError };

  return { success: true, avatarUrl };
}
