"use client";

export type AvatarUploadErrorCode =
  | "invalidType"
  | "tooLarge"
  | "heicNotSupported"
  | "notSignedIn"
  | "uploadFailed"
  | "storageNotConfigured";

const MAX_BYTES = 3 * 1024 * 1024;

export async function uploadProfileAvatar(file: File): Promise<{
  success: boolean;
  avatarUrl?: string;
  error?: AvatarUploadErrorCode | string;
}> {
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "invalidType" };
  }
  if (file.type === "image/heic" || file.type === "image/heif") {
    return { success: false, error: "heicNotSupported" };
  }
  if (!file.size) return { success: false, error: "invalidType" };
  if (file.size > MAX_BYTES) return { success: false, error: "tooLarge" };

  const formData = new FormData();
  formData.set("avatar", file);

  let res: Response;
  try {
    res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  } catch {
    return { success: false, error: "uploadFailed" };
  }

  let body: { avatarUrl?: string; error?: string; success?: boolean } = {};
  try {
    body = await res.json();
  } catch {
    return { success: false, error: "uploadFailed" };
  }

  if (res.status === 401) return { success: false, error: "notSignedIn" };
  if (res.status === 503) return { success: false, error: "storageNotConfigured" };
  if (!res.ok) return { success: false, error: body.error ?? "uploadFailed" };

  if (body.avatarUrl) {
    return { success: true, avatarUrl: body.avatarUrl };
  }

  return { success: false, error: "uploadFailed" };
}
