import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED } from "@/lib/image-runtime";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getPublicCollection } from "@/actions/get-public-collection";
import { NavHeader } from "@/components/public/nav-header";
import { mapsPinLinkProps } from "@/components/public/maps-place-link";
import { PASSPORT } from "@/lib/luxury-palette";
import { SITE_NAME } from "@/lib/site-brand";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { placeSlug } from "@/lib/place-slug";
import { slugify } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string; username: string; country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, country } = await params;
  const collection = await getPublicCollection(username, country);
  if (!collection) return { title: "Collection" };
  return {
    title: `${collection.title} — @${collection.username} | ${SITE_NAME}`,
    description: `${collection.places.length} saved places in ${collection.country}`,
  };
}

export default async function PublicCollectionPage({ params }: Props) {
  const { username, country } = await params;
  const t = await getTranslations("myTrip");
  const collection = await getPublicCollection(username, country);
  if (!collection) notFound();

  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: PASSPORT.bgGradient, color: PASSPORT.text }}
      >
        <div className="container mx-auto max-w-3xl px-6 py-10">
          <Link
            href={`/traveler/${collection.username}`}
            className="text-sm hover:underline"
            style={{ color: PASSPORT.textMuted }}
          >
            ← @{collection.username}
          </Link>
          <p
            className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: PASSPORT.accent }}
          >
            {t("passportTabCollections")}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {collection.title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: PASSPORT.textMuted }}>
            {t("passportCollectionSubtitle", { count: collection.places.length })}
            {" · "}
            {collection.country}
          </p>

          <div className="mt-8 space-y-3">
            {collection.places.map((place) => {
              const maps = mapsPinLinkProps(
                place.lat,
                place.lng,
                place.name,
                place.city,
                place.country
              );
              const href = `/explore/${slugify(place.country)}/${slugify(place.city)}/${placeSlug(place.name, place.place_id)}`;
              return (
                <article
                  key={place.place_id}
                  className="flex gap-3 overflow-hidden rounded-2xl border p-3"
                  style={{
                    background: PASSPORT.card,
                    borderColor: PASSPORT.cardBorder,
                  }}
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={place.image_url || fallbackImageUrl(place.name)}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={IMAGE_UNOPTIMIZED}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={href}
                      className="font-semibold hover:underline"
                      style={{ color: PASSPORT.text }}
                    >
                      {place.name}
                    </Link>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-xs"
                      style={{ color: PASSPORT.textMuted }}
                    >
                      <MapPin className="h-3 w-3" />
                      {place.city}, {place.country}
                    </p>
                    {maps ? (
                      <a
                        href={maps.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={maps.title}
                        className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                      >
                        Google Maps
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
