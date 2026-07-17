import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_BYTES = 3 * 1024 * 1024;
const AVATAR_VARIANTS = ["jpg", "jpeg", "png", "webp"] as const;

function normalizeContentType(type: string, fileName: string): string {
  const t = (type || "").toLowerCase();
  if (t === "image/jpg") return "image/jpeg";
  if (t.startsWith("image/")) return t;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionFor(contentType: string, fileName: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && AVATAR_VARIANTS.includes(fromName as (typeof AVATAR_VARIANTS)[number])) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
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

  const admin = createServiceClient();
  if (admin) {
    const { error: upsertError } = await admin.from("profiles").upsert({
      id: userId,
      email: email ?? null,
      avatar_url: avatarUrl,
    });
    if (!upsertError) return null;
    return upsertError.message;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    email: email ?? null,
    avatar_url: avatarUrl,
  });

  return insertError?.message ?? updateError.message;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "notSignedIn" }, { status: 401 });
  }

  const formData = await request.formData();
  const raw = formData.get("avatar");
  let file: File | null = null;
  if (raw instanceof File && raw.size > 0) file = raw;
  else if (raw instanceof Blob && raw.size > 0) {
    file = new File([raw], "avatar.jpg", { type: raw.type || "image/jpeg" });
  }

  if (!file) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 });
  }

  if (file.type === "image/heic" || file.type === "image/heif") {
    return NextResponse.json({ error: "heicNotSupported" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "tooLarge" }, { status: 400 });
  }

  const contentType = normalizeContentType(file.type, file.name);
  const ext = extensionFor(contentType, file.name);
  const path = `${user.id}/avatar.${ext}`;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ error: "storageNotConfigured" }, { status: 503 });
  }

  await admin.storage
    .from("avatars")
    .remove(AVATAR_VARIANTS.map((e) => `${user.id}/avatar.${e}`));

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("avatars").upload(path, buffer, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const profileError = await persistAvatarUrl(supabase, user.id, user.email, avatarUrl);
  if (profileError) {
    return NextResponse.json({ error: profileError }, { status: 500 });
  }

  return NextResponse.json({ success: true, avatarUrl });
}
