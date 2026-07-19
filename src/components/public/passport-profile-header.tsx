"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  uploadProfileAvatar,
  type AvatarUploadErrorCode,
} from "@/lib/upload-profile-avatar";
import { LUXURY, PASSPORT } from "@/lib/luxury-palette";

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
      className="relative mb-8 overflow-hidden rounded-[28px] border p-6 sm:p-8"
      style={{
        background: PASSPORT.heroGradient,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      {/* Subtle decorative wash */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
        style={{ background: "rgba(139, 101, 48, 0.14)" }}
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full shadow-md transition-transform hover:scale-[1.02] disabled:opacity-70 sm:h-28 sm:w-28"
          style={{
            boxShadow: `0 0 0 3px ${LUXURY.creamCard}, 0 0 0 5px ${LUXURY.bronzeBorderStrong}`,
          }}
          title={t("avatarChange")}
          aria-label={t("avatarChange")}
        >
          {avatar ? (
            <Image src={avatar} alt={displayName} fill className="object-cover" unoptimized />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${LUXURY.bronze} 0%, ${LUXURY.bronzeHover} 100%)` }}
            >
              <User className="h-10 w-10 text-white/90" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
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

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: PASSPORT.accentSoft,
                color: PASSPORT.accent,
                border: `1px solid ${PASSPORT.accentBorder}`,
              }}
            >
              <span>{level.emoji}</span>
              {level.label}
            </span>
          </div>

          <h1
            className="truncate text-2xl font-black tracking-tight sm:text-3xl"
            style={{ color: PASSPORT.text }}
          >
            {t("profileWelcome", { name: displayName })}
          </h1>

          <p className="mt-1.5 text-sm font-medium" style={{ color: PASSPORT.textSecondary }}>
            {statsLine}
          </p>

          {level.next && (
            <p className="mt-2 text-xs" style={{ color: PASSPORT.textMuted }}>
              {t("profileNextLevel", { level: level.next })}
            </p>
          )}

          <p className="mt-1 text-[11px]" style={{ color: PASSPORT.textMuted }}>
            {t("avatarPhotoHint")}
          </p>

          {message && (
            <p
              className={`mt-2 flex items-center justify-center gap-1 text-xs sm:justify-start ${
                message.type === "ok" ? "text-emerald-600" : "text-red-500"
              }`}
              role="status"
            >
              {message.type === "ok" && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
