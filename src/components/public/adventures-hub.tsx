"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search, Compass, Car, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AdventureCardSummary } from "@/components/public/adventure-card-types";
import { CountryFlag } from "@/components/public/country-flag";
import { FEATURED_ADVENTURE_SLUGS } from "@/lib/adventure-hub";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";

interface Props {
  adventures: AdventureCardSummary[];
}

export function AdventuresHub({ adventures }: Props) {
  const t = useTranslations("adventuresHub");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adventures;
    return adventures.filter(
      (a) =>
        a.country.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [adventures, query]);

  const isSearching = query.trim().length > 0;

  const featured = useMemo(() => {
    if (isSearching) return [];
    const bySlug = new Map(adventures.map((a) => [a.slug.toLowerCase(), a]));
    return FEATURED_ADVENTURE_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (a): a is AdventureCardSummary => Boolean(a)
    );
  }, [adventures, isSearching]);

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <section className="relative px-6 pt-28 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-[#F8F6F1]" />
        <div className="relative container max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-700 text-xs font-bold mb-4">
            <Car className="w-3.5 h-3.5" />
            {t("badge")}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-stone-600 text-base max-w-lg mx-auto mb-8">{t("subtitle")}</p>

          <div
            className="rounded-2xl p-2 shadow-lg max-w-xl mx-auto"
            style={{
              background: "#FDFBF7",
              border: "1px solid rgba(154,123,79,0.25)",
            }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl pl-12 pr-4 py-3.5 text-base outline-none bg-transparent text-stone-800"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-6xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t("empty")}</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-14">
                <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight mb-2">
                  {t("featuredTitle")}
                </h2>
                <p className="text-sm text-stone-500 mb-6">{t("featuredHint")}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((adv) => (
                    <AdventureHubCard key={`featured-${adv.slug}`} adventure={adv} featured />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
                    {isSearching ? t("searchResultsTitle") : t("allDestinationsTitle")}
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    {filtered.length} {t("countriesCount")}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((adv) => (
                  <AdventureHubCard key={`all-${adv.slug}`} adventure={adv} />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-800 underline"
          >
            {t("backToCities")}
          </Link>
        </div>
      </section>
    </div>
  );
}

function AdventureHubCard({
  adventure,
  featured = false,
}: {
  adventure: AdventureCardSummary;
  featured?: boolean;
}) {
  const t = useTranslations("adventuresHub");
  const fallback = fallbackImageUrl(`${adventure.country}-road-trip`, 1000, 720);
  const [imgSrc, setImgSrc] = useState(adventure.coverImage || fallback);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(adventure.coverImage || fallback);
    setImgFailed(false);
  }, [adventure.coverImage, adventure.country, fallback]);

  const heightClass = featured ? "h-56 sm:h-64" : "h-44 sm:h-48";

  return (
    <Link
      href={`/explore/${adventure.slug}/adventure`}
      className="group flex flex-col rounded-2xl overflow-hidden border-2 border-orange-200/70 bg-white hover:border-orange-400 hover:shadow-xl transition-all"
    >
      <div className={`relative w-full ${heightClass} overflow-hidden bg-gradient-to-br from-[#3a2a1a] to-[#6a4a2a]`}>
        {!imgFailed ? (
          <Image
            src={imgSrc}
            alt={`${adventure.country} road trip`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy={IMAGE_REFERRER_POLICY}
            unoptimized={IMAGE_UNOPTIMIZED}
            onError={() => {
              if (imgSrc.includes("picsum.photos")) {
                setImgFailed(true);
                return;
              }
              setImgSrc(fallback);
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
        <span className="absolute top-3 right-3 z-10">
          <CountryFlag country={adventure.country} size="md" />
        </span>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-stone-900 group-hover:text-orange-800 transition-colors">
          {adventure.country}
        </h3>
        <p className="text-stone-500 text-sm mt-2 leading-relaxed line-clamp-2 flex-grow">
          {adventure.subtitle}
        </p>
        <p className="text-orange-600 text-xs font-semibold mt-4 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {adventure.stopCount} {t("stops")} · {adventure.totalDays} {t("days")}
        </p>
      </div>
    </Link>
  );
}
