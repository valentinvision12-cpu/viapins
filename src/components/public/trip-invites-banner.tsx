"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Users } from "lucide-react";
import type { PendingTripInvite } from "@/actions/get-passport-profile";
import { respondTripInviteAction } from "@/actions/trip-collaborators";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  invites: PendingTripInvite[];
}

export function TripInvitesBanner({ invites }: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!invites.length) return null;

  return (
    <section
      className="mb-6 rounded-2xl border p-4"
      style={{
        background: PASSPORT.accentSoft,
        borderColor: PASSPORT.accentBorder,
      }}
    >
      <p
        className="mb-3 flex items-center gap-2 text-sm font-semibold"
        style={{ color: PASSPORT.accent }}
      >
        <Users className="h-4 w-4" />
        {t("collabPendingTitle", { count: invites.length })}
      </p>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li
            key={invite.routeId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: PASSPORT.text }}>
                {invite.title}
              </p>
              <p className="text-[11px]" style={{ color: PASSPORT.textMuted }}>
                {invite.ownerUsername
                  ? t("collabFromUser", { user: invite.ownerUsername })
                  : t("collabFromTraveler")}
                {invite.city || invite.country
                  ? ` · ${[invite.city, invite.country].filter(Boolean).join(", ")}`
                  : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await respondTripInviteAction(invite.routeId, true);
                    router.refresh();
                  })
                }
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: PASSPORT.accent }}
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("collabAccept")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await respondTripInviteAction(invite.routeId, false);
                    router.refresh();
                  })
                }
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ borderColor: PASSPORT.cardBorder, color: PASSPORT.textMuted }}
              >
                {t("collabDecline")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
