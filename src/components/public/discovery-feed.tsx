"use client";

import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { Star, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FeedItem } from "@/actions/discovery-feed";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  items: FeedItem[];
}

export function DiscoveryFeed({ items }: Props) {
  const t = useTranslations("myTrip");

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border px-6 py-16 text-center"
        style={{
          background: PASSPORT.card,
          borderColor: PASSPORT.cardBorder,
        }}
      >
        <p className="font-semibold" style={{ color: PASSPORT.text }}>
          {t("discoverEmptyTitle")}
        </p>
        <p className="mt-2 text-sm" style={{ color: PASSPORT.textMuted }}>
          {t("discoverEmptyDesc")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: PASSPORT.accent }}
        >
          {t("passportEmptyPostsCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const handle = item.author.username;
        const name =
          item.author.full_name?.trim() || handle || t("discoverAnonymous");
        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border"
            style={{
              background: PASSPORT.card,
              borderColor: PASSPORT.cardBorder,
              boxShadow: PASSPORT.cardShadow,
            }}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: PASSPORT.cardBorder }}>
              <div className="relative h-9 w-9 overflow-hidden rounded-full" style={{ background: PASSPORT.accentSoft }}>
                {item.author.avatar_url ? (
                  <Image
                    src={item.author.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={IMAGE_UNOPTIMIZED}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-4 w-4" style={{ color: PASSPORT.accent }} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {handle ? (
                  <Link
                    href={`/traveler/${handle}`}
                    className="truncate text-sm font-semibold hover:underline"
                    style={{ color: PASSPORT.text }}
                  >
                    {name}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold" style={{ color: PASSPORT.text }}>
                    {name}
                  </p>
                )}
                <p className="text-[11px]" style={{ color: PASSPORT.textMuted }}>
                  {item.fromFollowing ? t("discoverFromFollowing") : t("discoverGlobal")}
                  {item.date ? ` · ${item.date}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4">
              {item.photoUrl ? (
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={item.photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={IMAGE_UNOPTIMIZED}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold" style={{ color: PASSPORT.text }}>
                  {item.title}
                </h2>
                {item.location ? (
                  <p className="mt-0.5 text-xs" style={{ color: PASSPORT.textMuted }}>
                    {item.location}
                  </p>
                ) : null}
                {item.rating > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3"
                        style={{
                          color: PASSPORT.accent,
                          fill: i < item.rating ? PASSPORT.accent : "transparent",
                        }}
                      />
                    ))}
                  </div>
                )}
                {item.tip ? (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: PASSPORT.textSecondary }}>
                    {item.tip}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
