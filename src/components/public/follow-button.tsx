"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { toggleFollowAction } from "@/actions/follows";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  targetUserId: string;
  initiallyFollowing: boolean;
  isSelf?: boolean;
}

export function FollowButton({
  targetUserId,
  initiallyFollowing,
  isSelf = false,
}: Props) {
  const t = useTranslations("myTrip");
  const router = useRouter();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) return null;

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId);
      if (!result.success) {
        if (result.error === "not_signed_in") {
          setError(t("followSignIn"));
        } else {
          setError(t("followError"));
        }
        return;
      }
      setFollowing(result.following);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: following ? PASSPORT.bg : PASSPORT.accent,
          color: following ? PASSPORT.text : "#fff",
          border: `1px solid ${following ? PASSPORT.cardBorder : PASSPORT.accent}`,
        }}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : following ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {following ? t("followFollowing") : t("followCta")}
      </button>
      {error ? (
        <p className="text-[11px]" style={{ color: "#C44B4B" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
