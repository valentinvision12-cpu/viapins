"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Star, X } from "lucide-react";
import type { FavoritePlace } from "@/actions/favorites";
import { createTravelPostAction } from "@/actions/travel-posts";
import { PASSPORT } from "@/lib/luxury-palette";

export type PostComposerPlace = {
  place_id: string;
  name: string;
  city: string;
  country: string;
  image_url?: string;
};

interface Props {
  favorites: FavoritePlace[];
  open: boolean;
  onClose: () => void;
  /** Prefill a place (e.g. from PlaceCard review). */
  initialPlace?: PostComposerPlace | null;
}

export function PassportPostComposer({
  favorites,
  open,
  onClose,
  initialPlace = null,
}: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [tip, setTip] = useState("");
  const [rating, setRating] = useState(5);
  const [placeId, setPlaceId] = useState(initialPlace?.place_id ?? "");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selected = useMemo(() => {
    if (initialPlace && (!placeId || placeId === initialPlace.place_id)) {
      return initialPlace;
    }
    const fav = favorites.find((f) => f.place_id === placeId);
    if (!fav) return initialPlace;
    return {
      place_id: fav.place_id,
      name: fav.name,
      city: fav.city,
      country: fav.country,
      image_url: fav.image_url,
    };
  }, [favorites, placeId, initialPlace]);

  if (!open) return null;

  function reset() {
    setTitle("");
    setTip("");
    setRating(5);
    setPlaceId("");
    setVisibility("private");
    setError(null);
    setSaved(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTravelPostAction({
        title,
        tip,
        rating,
        place_id: selected?.place_id ?? placeId,
        city: selected?.city ?? "",
        country: selected?.country ?? "",
        location: selected ? `${selected.name}, ${selected.city}` : "",
        photo_urls: selected?.image_url ? [selected.image_url] : [],
        visibility,
      });
      if (!result.success) {
        const map: Record<string, string> = {
          title_required: t("passportPostErrorTitle"),
          title_too_long: t("passportPostErrorTitle"),
          not_signed_in: t("avatarNotSignedIn"),
          supabase_missing: t("supabaseMissing"),
          save_failed: t("passportPostErrorSave"),
        };
        setError(map[result.error] ?? t("passportPostErrorSave"));
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => handleClose(), 700);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="passport-post-composer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) handleClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-5 shadow-xl"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
          color: PASSPORT.text,
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: PASSPORT.accent }}
            >
              {t("passportTabPosts")}
            </p>
            <h2
              id="passport-post-composer-title"
              className="mt-1 text-lg font-semibold"
            >
              {t("passportPostComposeTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            aria-label={t("passportPostCancel")}
          >
            <X className="h-4 w-4" style={{ color: PASSPORT.textMuted }} />
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("passportPostFieldPlace")}
          {initialPlace ? (
            <p
              className="mt-1 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: PASSPORT.cardBorder,
                background: PASSPORT.bg,
                color: PASSPORT.text,
              }}
            >
              {initialPlace.name} — {initialPlace.city}
            </p>
          ) : (
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                borderColor: PASSPORT.cardBorder,
                background: PASSPORT.bg,
                color: PASSPORT.text,
              }}
            >
              <option value="">{t("passportPostPlaceOptional")}</option>
              {favorites.map((f) => (
                <option key={f.place_id} value={f.place_id}>
                  {f.name} — {f.city}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("passportPostFieldTitle")}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder={t("passportPostTitlePlaceholder")}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{
              borderColor: PASSPORT.cardBorder,
              background: PASSPORT.bg,
              color: PASSPORT.text,
            }}
          />
        </label>

        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
            {t("passportPostFieldRating")}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const n = i + 1;
              const on = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded p-0.5"
                  aria-label={`${n}`}
                >
                  <Star
                    className="h-5 w-5"
                    style={{
                      color: PASSPORT.accent,
                      fill: on ? PASSPORT.accent : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("passportPostFieldTip")}
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            maxLength={800}
            rows={3}
            placeholder={t("passportPostTipPlaceholder")}
            className="mt-1 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{
              borderColor: PASSPORT.cardBorder,
              background: PASSPORT.bg,
              color: PASSPORT.text,
            }}
          />
        </label>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
            {t("passportPostFieldVisibility")}
          </legend>
          <div className="flex gap-2">
            {(
              [
                ["private", t("passportVisibility_private")],
                ["public", t("passportVisibility_public")],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background:
                    visibility === value ? PASSPORT.accentSoft : PASSPORT.bg,
                  color:
                    visibility === value ? PASSPORT.accent : PASSPORT.textMuted,
                  border: `1px solid ${
                    visibility === value ? PASSPORT.accentBorder : PASSPORT.cardBorder
                  }`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="mb-3 text-xs" style={{ color: "#C44B4B" }}>
            {error}
          </p>
        )}
        {saved && (
          <p className="mb-3 text-xs" style={{ color: PASSPORT.accent }}>
            {t("passportPostSaved")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || title.trim().length < 2}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: PASSPORT.accent }}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {t("passportPostSave")}
        </button>
      </form>
    </div>
  );
}
