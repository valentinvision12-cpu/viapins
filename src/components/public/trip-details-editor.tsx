"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, NotebookPen, Users, X } from "lucide-react";
import type { SavedRoute } from "@/actions/get-my-routes";
import { updateTripDetailsAction } from "@/actions/update-trip-details";
import {
  inviteTripCollaboratorAction,
  listTripCollaborators,
  removeTripCollaboratorAction,
  type TripCollaborator,
} from "@/actions/trip-collaborators";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  route: SavedRoute;
  open: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

export function TripDetailsEditor({
  route,
  open,
  onClose,
  isOwner = true,
}: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(route.title);
  const [days, setDays] = useState(String((route.days ?? 0) || ""));
  const [budget, setBudget] = useState(route.budget ?? "");
  const [tips, setTips] = useState(route.tips ?? "");
  const [memories, setMemories] = useState(route.memories ?? "");
  const [visibility, setVisibility] = useState<"private" | "public" | "shared">(
    route.visibility ?? "private"
  );
  const [inviteUser, setInviteUser] = useState("");
  const [collaborators, setCollaborators] = useState<TripCollaborator[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  function loadCollaborators() {
    startTransition(async () => {
      const list = await listTripCollaborators(route.id);
      setCollaborators(list);
    });
  }

  function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateTripDetailsAction(route.id, {
        title,
        days: Number(days) || 0,
        budget,
        tips,
        memories,
        visibility,
      });
      if (!result.success) {
        setError(
          result.error === "migration_required"
            ? t("tripDetailsMigrationRequired")
            : t("tripDetailsSaveError")
        );
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 600);
    });
  }

  function invite() {
    setError(null);
    startTransition(async () => {
      const result = await inviteTripCollaboratorAction(route.id, inviteUser);
      if (!result.success) {
        const map: Record<string, string> = {
          user_not_found: t("collabUserNotFound"),
          self: t("collabSelf"),
          not_owner: t("collabNotOwner"),
        };
        setError(map[result.error] ?? t("collabInviteError"));
        return;
      }
      setInviteUser("");
      setVisibility("shared");
      const list = await listTripCollaborators(route.id);
      setCollaborators(list);
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <form
        onSubmit={saveDetails}
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
              {t("tripDetailsEyebrow")}
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <NotebookPen className="h-4 w-4" style={{ color: PASSPORT.accent }} />
              {t("tripDetailsTitle")}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5">
            <X className="h-4 w-4" style={{ color: PASSPORT.textMuted }} />
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("tripFieldTitle")}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
            {t("tripFieldDays")}
            <input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
            />
          </label>
          <label className="block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
            {t("tripFieldBudget")}
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t("tripBudgetPlaceholder")}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
            />
          </label>
        </div>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("tripFieldTips")}
          <textarea
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
          />
        </label>

        <label className="mb-3 block text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
          {t("tripFieldMemories")}
          <textarea
            value={memories}
            onChange={(e) => setMemories(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
          />
        </label>

        {isOwner ? (
          <>
            <fieldset className="mb-4">
              <legend className="mb-1.5 text-xs font-medium" style={{ color: PASSPORT.textSecondary }}>
                {t("tripFieldVisibility")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["private", t("passportVisibility_private")],
                    ["shared", t("passportVisibility_shared")],
                    ["public", t("passportVisibility_public")],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVisibility(value)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      background:
                        visibility === value ? PASSPORT.accentSoft : PASSPORT.bg,
                      color:
                        visibility === value ? PASSPORT.accent : PASSPORT.textMuted,
                      border: `1px solid ${
                        visibility === value
                          ? PASSPORT.accentBorder
                          : PASSPORT.cardBorder
                      }`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div
              className="mb-4 rounded-xl border p-3"
              style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.bg }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Users className="h-3.5 w-3.5" style={{ color: PASSPORT.accent }} />
                  {t("collabTitle")}
                </p>
                <button
                  type="button"
                  onClick={loadCollaborators}
                  className="text-[11px] font-medium"
                  style={{ color: PASSPORT.accent }}
                >
                  {t("collabRefresh")}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={inviteUser}
                  onChange={(e) => setInviteUser(e.target.value)}
                  placeholder={t("collabUsernamePlaceholder")}
                  className="min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-xs outline-none"
                  style={{ borderColor: PASSPORT.cardBorder, background: PASSPORT.card }}
                />
                <button
                  type="button"
                  onClick={invite}
                  disabled={pending || !inviteUser.trim()}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: PASSPORT.accent }}
                >
                  {t("collabInvite")}
                </button>
              </div>
              {collaborators && collaborators.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {collaborators.map((c) => (
                    <li
                      key={c.userId}
                      className="flex items-center justify-between text-xs"
                      style={{ color: PASSPORT.textSecondary }}
                    >
                      <span>
                        @{c.username || "traveler"} · {c.status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await removeTripCollaboratorAction(route.id, c.userId);
                            setCollaborators(
                              (collaborators ?? []).filter((x) => x.userId !== c.userId)
                            );
                            router.refresh();
                          })
                        }
                        className="text-[11px]"
                        style={{ color: "#C44B4B" }}
                      >
                        {t("collabRemove")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </>
        ) : null}

        {error ? (
          <p className="mb-3 text-xs" style={{ color: "#C44B4B" }}>
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mb-3 text-xs" style={{ color: PASSPORT.accent }}>
            {t("tripDetailsSaved")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: PASSPORT.accent }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("tripDetailsSave")}
        </button>
      </form>
    </div>
  );
}
