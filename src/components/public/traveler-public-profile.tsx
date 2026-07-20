"use client";

import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { FolderOpen, MapPin, Star, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PublicTraveler } from "@/actions/follows";
import { FollowButton } from "@/components/public/follow-button";
import { PASSPORT, LUXURY } from "@/lib/luxury-palette";
import { slugify } from "@/lib/utils";

interface Props {
  traveler: PublicTraveler;
}

export function TravelerPublicProfile({ traveler }: Props) {
  const t = useTranslations("myTrip");
  const displayName =
    traveler.full_name?.trim() || traveler.username || "Traveler";

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-2xl border"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
          boxShadow: PASSPORT.cardShadow,
        }}
      >
        <div
          className="relative h-36 sm:h-44"
          style={{
            background: traveler.cover_url
              ? undefined
              : `linear-gradient(135deg, ${LUXURY.bronze} 0%, ${PASSPORT.accent} 100%)`,
          }}
        >
          {traveler.cover_url ? (
            <Image
              src={traveler.cover_url}
              alt=""
              fill
              className="object-cover"
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
          ) : null}
        </div>
        <div className="relative px-5 pb-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div
                className="relative -mt-12 h-20 w-20 overflow-hidden rounded-full sm:-mt-14 sm:h-24 sm:w-24"
                style={{
                  boxShadow: `0 0 0 4px ${PASSPORT.card}`,
                }}
              >
                {traveler.avatar_url ? (
                  <Image
                    src={traveler.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: PASSPORT.accentSoft }}
                  >
                    <User className="h-8 w-8" style={{ color: PASSPORT.accent }} />
                  </div>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1
                  className="truncate text-2xl font-black tracking-tight"
                  style={{ color: PASSPORT.text }}
                >
                  {displayName}
                </h1>
                <p className="text-sm" style={{ color: PASSPORT.textMuted }}>
                  @{traveler.username}
                </p>
              </div>
            </div>
            <FollowButton
              targetUserId={traveler.id}
              initiallyFollowing={traveler.isFollowing}
              isSelf={traveler.isSelf}
            />
          </div>

          {traveler.bio ? (
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: PASSPORT.textSecondary }}
            >
              {traveler.bio}
            </p>
          ) : null}

          <div
            className="mt-4 flex flex-wrap gap-4 text-sm"
            style={{ color: PASSPORT.textMuted }}
          >
            {traveler.home_country ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {traveler.home_country}
              </span>
            ) : null}
            <span>
              <strong style={{ color: PASSPORT.text }}>{traveler.followers}</strong>{" "}
              {t("followFollowers")}
            </span>
            <span>
              <strong style={{ color: PASSPORT.text }}>{traveler.following}</strong>{" "}
              {t("followFollowingCount")}
            </span>
          </div>
        </div>
      </section>

      {traveler.publicCollections.length > 0 ? (
        <section>
          <h2
            className="mb-3 text-sm font-bold uppercase tracking-[0.14em]"
            style={{ color: PASSPORT.accent }}
          >
            {t("passportTabCollections")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {traveler.publicCollections.map((c) => (
              <Link
                key={c.country}
                href={`/traveler/${traveler.username}/collection/${slugify(c.country)}`}
                className="rounded-2xl border p-4 transition-opacity hover:opacity-90"
                style={{
                  background: PASSPORT.card,
                  borderColor: PASSPORT.cardBorder,
                }}
              >
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: PASSPORT.text }}>
                  <FolderOpen className="h-4 w-4" style={{ color: PASSPORT.accent }} />
                  {c.title}
                </p>
                <p className="mt-1 text-xs" style={{ color: PASSPORT.textMuted }}>
                  {t("passportCollectionSubtitle", { count: c.placeCount })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em]" style={{ color: PASSPORT.accent }}>
          {t("passportTabPosts")}
        </h2>
        {traveler.publicPosts.length === 0 ? (
          <p className="text-sm" style={{ color: PASSPORT.textMuted }}>
            {t("travelerNoPublicPosts")}
          </p>
        ) : (
          <div className="space-y-3">
            {traveler.publicPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border p-4"
                style={{
                  background: PASSPORT.card,
                  borderColor: PASSPORT.cardBorder,
                }}
              >
                <h3 className="font-semibold" style={{ color: PASSPORT.text }}>
                  {post.title}
                </h3>
                <p className="mt-1 text-xs" style={{ color: PASSPORT.textMuted }}>
                  {[post.location, post.date].filter(Boolean).join(" · ")}
                </p>
                {post.rating > 0 && (
                  <div className="mt-1.5 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3"
                        style={{
                          color: PASSPORT.accent,
                          fill: i < post.rating ? PASSPORT.accent : "transparent",
                        }}
                      />
                    ))}
                  </div>
                )}
                {post.tip ? (
                  <p className="mt-2 text-sm" style={{ color: PASSPORT.textSecondary }}>
                    {post.tip}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
