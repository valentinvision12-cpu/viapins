"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PassportProfile } from "@/actions/get-passport-profile";
import { PassportProfileHeader } from "@/components/public/passport-profile-header";
import { PassportSections } from "@/components/public/passport-sections";
import {
  PassportIdentityEditor,
  type IdentityEditorValues,
} from "@/components/public/passport-identity-editor";
import { TripInvitesBanner } from "@/components/public/trip-invites-banner";
import { ChevronDown } from "lucide-react";

interface Props {
  profile: PassportProfile;
  locale: string;
  statsItems: {
    id: string;
    label: string;
    value: string | number;
    hint?: string;
  }[];
}

export function PassportDashboard({ profile, locale, statsItems }: Props) {
  const t = useTranslations("myTrip");
  const [editOpen, setEditOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const user = profile.user!;

  const simplifiedStats = statsItems.filter((s) =>
    ["routes", "places"].includes(s.id)
  );

  const editorInitial: IdentityEditorValues = {
    full_name: user.full_name ?? "",
    username: user.username ?? "",
    bio: user.bio ?? "",
    home_country: user.home_country ?? "",
    interests: user.interests ?? [],
    languages: user.languages ?? [],
    cover_url: user.cover_url ?? "",
  };

  return (
    <>
      <PassportProfileHeader
        email={user.email}
        fullName={user.full_name}
        avatarUrl={user.avatar_url}
        username={user.username}
        bio={user.bio}
        homeCountry={user.home_country || null}
        interests={user.interests}
        languages={user.languages}
        coverImageUrl={user.cover_url || null}
        level={undefined}
        stats={simplifiedStats}
        onEditIdentity={() => setEditOpen(true)}
      />

      <TripInvitesBanner invites={profile.pendingInvites} />

      <PassportSections
        savedRoutes={profile.saved}
        visitedRoutes={profile.visited}
        sharedRoutes={profile.sharedWithMe}
        favorites={profile.favorites}
        collections={profile.collections}
        posts={profile.posts}
        locale={locale}
        username={user.username}
        defaultTab="trips"
        simplified
      />

      <div className="container max-w-3xl mx-auto px-4 pb-12">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="w-full flex items-center justify-between py-3 text-stone-400 hover:text-stone-600 text-sm font-medium border-t border-stone-100"
        >
          {t("passportMore")}
          <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </button>
        {moreOpen && (
          <p className="text-stone-400 text-xs pb-4">
            {t("passportMoreHint")}
          </p>
        )}
      </div>

      <PassportIdentityEditor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editorInitial}
      />
    </>
  );
}
