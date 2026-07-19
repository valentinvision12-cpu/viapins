"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { Camera, Check, Loader2, MapPin, Pencil, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  uploadProfileAvatar,
  type AvatarUploadErrorCode,
} from "@/lib/upload-profile-avatar";
import { LUXURY, PASSPORT } from "@/lib/luxury-palette";
import { PassportStats, type PassportStatItem } from "@/components/public/passport-stats";
import { cn } from "@/lib/utils";

interface Props {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  level: { label: string; emoji: string; next?: string };
  username?: string | null;
  bio?: string | null;
  homeCountry?: string | null;
  interests?: string[];
  languages?: string[];
  coverImageUrl?: string | null;
  stats: PassportStatItem[];
  statsTitle?: string;
  onEditIdentity?: () => void;
}

export function PassportProfileHeader({
  email,
  fullName,
  avatarUrl,
  level,
  username,
  bio,
  homeCountry,
  interests = [],
  languages = [],
  coverImageUrl,
  stats,
  statsTitle,
  onEditIdentity,
}: Props) {
  const t = useTranslations("myTrip");
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = fullName?.trim() || email.split("@")[0];
  const realUsername = username?.trim() || "";
  const handle =
    realUsername ||
    `@${displayName.toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 18) || "traveler"}`;

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
    <header className="mb-8 space-y-4">
      {/* ── Passport cover + identity ── */}
      <div
        className="relative overflow-hidden rounded-[28px]"
        style={{
          border: `1px solid ${PASSPORT.cardBorder}`,
          boxShadow: PASSPORT.cardShadow,
          background: PASSPORT.card,
        }}
      >
        {/* Cover plane */}
        <div className="relative h-[148px] sm:h-[176px] overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, #1A2E38 0%, #2A4555 42%, #3A5C6E 72%, #8B6530 160%)",
              }}
            />
          )}

          {/* Map grid wash */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: [
                "linear-gradient(rgba(253,251,247,0.35) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(253,251,247,0.35) 1px, transparent 1px)",
              ].join(","),
              backgroundSize: "48px 48px",
            }}
          />

          {/* Soft vignette */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(26,46,56,0.15) 0%, transparent 40%, rgba(26,46,56,0.55) 100%)",
            }}
          />

          {/* Passport mark */}
          <div className="absolute left-5 top-5 sm:left-6 sm:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
              ViaPins
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-white/90">
              Travel Passport
            </p>
          </div>

          {/* Level + edit */}
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-5 sm:top-5">
            {onEditIdentity ? (
              <button
                type="button"
                onClick={onEditIdentity}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-opacity hover:opacity-90"
                style={{
                  background: "rgba(253, 251, 247, 0.2)",
                  border: "1px solid rgba(253, 251, 247, 0.35)",
                }}
              >
                <Pencil className="h-3 w-3" />
                {t("passportIdentityEditShort")}
              </button>
            ) : null}
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md"
              style={{
                background: "rgba(253, 251, 247, 0.16)",
                border: "1px solid rgba(253, 251, 247, 0.28)",
              }}
            >
              {level.label}
            </span>
          </div>
        </div>

        {/* Identity row */}
        <div className="relative px-5 pb-6 pt-0 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar — overlaps cover */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "group relative -mt-12 h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-full sm:-mt-14 sm:h-[104px] sm:w-[104px]",
                "transition-transform hover:scale-[1.02] disabled:opacity-70"
              )}
              style={{
                boxShadow: `0 0 0 4px ${PASSPORT.card}, 0 0 0 5px ${LUXURY.bronzeBorderStrong}`,
              }}
              title={t("avatarChange")}
              aria-label={t("avatarChange")}
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized={IMAGE_UNOPTIMIZED}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background: `linear-gradient(145deg, ${LUXURY.bronze} 0%, ${LUXURY.bronzeHover} 100%)`,
                  }}
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

            <div className="min-w-0 flex-1 pt-1 sm:pb-1">
              <h1
                className="truncate text-[1.65rem] font-black tracking-tight sm:text-[2rem]"
                style={{ color: PASSPORT.text }}
              >
                {displayName}
              </h1>
              {realUsername ? (
                <Link
                  href={`/traveler/${realUsername}`}
                  className="mt-0.5 inline-block text-sm font-medium hover:underline"
                  style={{ color: PASSPORT.textMuted }}
                >
                  @{realUsername}
                </Link>
              ) : (
                <p
                  className="mt-0.5 text-sm font-medium"
                  style={{ color: PASSPORT.textMuted }}
                >
                  {handle}
                </p>
              )}

              <p
                className="mt-3 max-w-xl text-sm leading-relaxed"
                style={{ color: PASSPORT.textSecondary }}
              >
                {bio?.trim() || t("passportBioPlaceholder")}
              </p>

              {/* Meta chips — design only */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {homeCountry ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: PASSPORT.accentSoft,
                      color: PASSPORT.accent,
                      border: `1px solid ${PASSPORT.accentBorder}`,
                    }}
                  >
                    <MapPin className="h-3 w-3" />
                    {homeCountry}
                  </span>
                ) : null}

                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: LUXURY.creamDeep,
                      color: PASSPORT.textSecondary,
                      border: `1px solid ${PASSPORT.cardBorder}`,
                    }}
                  >
                    {lang}
                  </span>
                ))}

                {interests.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: "transparent",
                      color: PASSPORT.textMuted,
                      border: `1px dashed ${PASSPORT.cardBorder}`,
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>

              {level.next ? (
                <p className="mt-3 text-xs" style={{ color: PASSPORT.textMuted }}>
                  {t("profileNextLevel", { level: level.next })}
                </p>
              ) : null}

              {message ? (
                <p
                  className={`mt-2 flex items-center gap-1 text-xs ${
                    message.type === "ok" ? "text-emerald-600" : "text-red-500"
                  }`}
                  role="status"
                >
                  {message.type === "ok" && (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  {message.text}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats stamps ── */}
      <PassportStats items={stats} title={statsTitle ?? t("passportStatsTitle")} />
    </header>
  );
}
