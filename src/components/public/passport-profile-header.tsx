"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  uploadProfileAvatar,
  type AvatarUploadErrorCode,
} from "@/lib/upload-profile-avatar";

interface Props {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  level: { label: string; emoji: string; next?: string };
  statsLine: string;
}

export function PassportProfileHeader({
  email,
  fullName,
  avatarUrl,
  level,
  statsLine,
}: Props) {
  const t = useTranslations("myTrip");
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = fullName?.trim() || email.split("@")[0];

  function errorText(code: AvatarUploadErrorCode | string): string {
    const known: Record<AvatarUploadErrorCode, string> = {
      invalidType: t("avatarInvalidType"),
      tooLarge: t("avatarTooLarge"),
      heicNotSupported: t("avatarHeicNotSupported"),
      notSignedIn: t("avatarNotSignedIn"),
      uploadFailed: t("avatarUploadError"),
      storageNotConfigured: t("avatarStorageNotConfigured"),
    };
    return known[code as AvatarUploadErrorCode] ?? t("avatarUploadError");
  }

  async function handleFile(file: File) {
    setMessage(null);
    setUploading(true);
    const result = await uploadProfileAvatar(file);
    setUploading(false);

    if (result.success && result.avatarUrl) {
      setAvatar(result.avatarUrl);
      setMessage({ type: "ok", text: t("avatarUploadSuccess") });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setMessage({
      type: "err",
      text: errorText(result.error ?? "uploadFailed"),
    });
  }

  return (
    <div
      className="relative mb-8 p-6 rounded-[34px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl"
    >
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/20 shadow-md group disabled:opacity-70"
          title={t("avatarChange")}
          aria-label={t("avatarChange")}
        >
          {avatar ? (
            <Image src={avatar} alt={displayName} fill className="object-cover" unoptimized />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "oklch(0.68 0.16 82)" }}
            >
              <User className="w-9 h-9 text-white/90" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg">{level.emoji}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-200/80">
              {level.label}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white truncate">
            {t("profileWelcome", { name: displayName })}
          </h1>
          <p className="text-white/70 text-sm mt-1">{statsLine}</p>
          <p className="text-white/45 text-xs mt-1">{t("avatarPhotoHint")}</p>
          {level.next && (
            <p className="text-white/45 text-xs mt-1.5">
              {t("profileNextLevel", { level: level.next })}
            </p>
          )}
          {message && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${
                message.type === "ok" ? "text-emerald-300" : "text-red-300"
              }`}
              role="status"
            >
              {message.type === "ok" && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
