"use server";

import { createClient } from "@/lib/supabase/server";

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
