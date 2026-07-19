"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { PassportProfile } from "@/actions/get-passport-profile";
import { PassportProfileHeader } from "@/components/public/passport-profile-header";
import { PassportSections } from "@/components/public/passport-sections";
import { PassportWorldMap } from "@/components/public/passport-world-map";
import { PassportAchievements } from "@/components/public/passport-achievements";
import {
  PassportIdentityEditor,
  type IdentityEditorValues,
} from "@/components/public/passport-identity-editor";
import { TripInvitesBanner } from "@/components/public/trip-invites-banner";
import { computePassportLevel } from "@/lib/passport-achievements";

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
  const user = profile.user!;

  const placeNames = useMemo(() => {
    const names: string[] = [];
    for (const f of profile.favorites) names.push(f.name);
    for (const r of [...profile.saved, ...profile.visited]) {
      for (const p of r.route_places ?? []) names.push(p.name);
    }
    return names;
  }, [profile.favorites, profile.saved, profile.visited]);

  const achievementInput = {
    countries: profile.stats.countries,
    cities: profile.stats.cities,
    places: profile.stats.places,
    photos: profile.stats.photos,
    routes: profile.stats.routes,
    countriesVisited: profile.stats.countriesVisited,
    placeNames,
  };

  const passportLevel = computePassportLevel(achievementInput);
  const levelLabel = t(passportLevel.labelKey);

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
        level={{
          label: levelLabel,
          emoji: "",
          next: passportLevel.nextKey ? t(passportLevel.nextKey) : undefined,
        }}
        stats={statsItems}
        onEditIdentity={() => setEditOpen(true)}
      />

      <PassportWorldMap
        favorites={profile.favorites}
        visitedRoutes={profile.visited}
        savedRoutes={profile.saved}
      />

      <PassportAchievements input={achievementInput} />

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
      />

      <PassportIdentityEditor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editorInitial}
      />
    </>
  );
}
