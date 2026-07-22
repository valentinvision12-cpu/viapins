"use client";

import { useState } from "react";
import type { PassportProfile } from "@/actions/get-passport-profile";
import { PassportProfileHeader } from "@/components/public/passport-profile-header";
import { PassportSections } from "@/components/public/passport-sections";
import {
  PassportIdentityEditor,
  type IdentityEditorValues,
} from "@/components/public/passport-identity-editor";
import { TripInvitesBanner } from "@/components/public/trip-invites-banner";

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
  const [editOpen, setEditOpen] = useState(false);
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
        locale={locale}
        username={user.username}
        defaultTab="trips"
        simplified
      />

      <PassportIdentityEditor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editorInitial}
      />
    </>
  );
}
