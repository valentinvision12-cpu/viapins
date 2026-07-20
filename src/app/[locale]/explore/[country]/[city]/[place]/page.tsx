import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDestinationByCityCountry } from "@/actions/get-destinations";
import { getDemoDestination } from "@/lib/demo-data";
import { listPublicPlaceReviews } from "@/actions/travel-posts";
import { PlaceCard } from "@/components/public/place-card";
import { NavHeader } from "@/components/public/nav-header";
import { MapsPlaceLink } from "@/components/public/maps-place-link";
import { findPlaceBySlug, placeSlug } from "@/lib/place-slug";
import { getPlaceContent } from "@/lib/content-locale";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";
import { PASSPORT } from "@/lib/luxury-palette";


type PlaceRow = {
  id: string;
  name: string;
  image_url: string;
  lat: number;
  lng: number;
  order_index?: number;
  translations: Record<
    string,
    {
      description?: string;
      wiki_text?: string;
      maps_query?: string;
      maps_url?: string;
    }
  >;
};

type Props = {
  params: Promise<{ locale: string; country: string; city: string; place: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city, place: placeParam } = await params;
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) return {};
  const place = findPlaceBySlug(destination.places as PlaceRow[], placeParam);
  if (!place) return {};

  const title = `${place.name} — ${destination.city}, ${destination.country} | ${SITE_NAME}`;
  const { description } = getPlaceContent(place.translations, locale);
  const desc =
    description?.slice(0, 160) ||
    `Visit ${place.name} in ${destination.city}. Tips, reviews, and nearby places.`;
  const path = `/explore/${country}/${city}/${placeSlug(place.name, place.id)}`;
  const pageUrl = `${getSiteUrl()}/${locale}${path}`;
  const alternates = buildLocaleAlternates(path);

  return {
    title,
    description: desc,
    alternates: { canonical: pageUrl, languages: alternates.languages },
    openGraph: {
      title,
      description: desc,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "article",
      images: place.image_url
        ? [{ url: place.image_url, width: 1200, height: 630, alt: place.name }]
        : [],
    },
  };
}

export default async function PlacePage({ params }: Props) {
  const { locale, country, city, place: placeParam } = await params;
  const t = await getTranslations({ locale, namespace: "placePage" });
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) notFound();

  const place = findPlaceBySlug(destination.places as PlaceRow[], placeParam);
  if (!place) notFound();

  const { description, wiki_text, maps_query, maps_url } = getPlaceContent(
    place.translations,
    locale
  );
  const reviews = await listPublicPlaceReviews(place.id, 24);
  const nearby = destination.places
    .filter((p) => p.id !== place.id)
    .slice(0, 4);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <NavHeader />
      <main className="min-h-screen bg-stone-50 pt-20">
        <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-80">
          {place.image_url ? (
            <Image
              src={place.image_url}
              alt={place.name}
              fill
              className="object-cover"
              priority
              unoptimized={IMAGE_UNOPTIMIZED}
              referrerPolicy={IMAGE_REFERRER_POLICY} />
          ) : (
            <div className="h-full w-full bg-stone-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <div className="container mx-auto max-w-4xl">
              <Link
                href={`/explore/${country}/${city}`}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {destination.city}
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {place.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                <MapPin className="h-3.5 w-3.5" />
                {destination.city}, {destination.country}
              </p>
              {reviews.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-sm text-amber-200">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  {avgRating.toFixed(1)} · {t("reviewsCount", { count: reviews.length })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="mb-6">
            <MapsPlaceLink
              lat={place.lat}
              lng={place.lng}
              name={place.name}
              city={destination.city}
              country={destination.country}
              mapsQuery={maps_query}
              mapsUrl={maps_url}
              translations={place.translations as Record<string, { maps_query?: string; maps_url?: string }>}
              locale={locale}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            />
          </div>

          {description ? (
            <p className="max-w-2xl text-base leading-relaxed text-stone-700">
              {description}
            </p>
          ) : null}
          {(() => {
            const desc = description?.trim() ?? "";
            const wiki = wiki_text?.trim() ?? "";
            if (!wiki) return null;
            if (desc && (wiki === desc || desc.startsWith(wiki) || wiki.startsWith(desc))) {
              return null;
            }
            return (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-500">
                {wiki_text}
              </p>
            );
          })()}

          <section className="mt-10">
            <h2 className="text-lg font-bold text-stone-900">{t("reviewsTitle")}</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">{t("reviewsEmpty")}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {review.authorUsername ? (
                        <Link
                          href={`/traveler/${review.authorUsername}`}
                          className="text-sm font-semibold text-stone-800 hover:underline"
                        >
                          {review.authorName || `@${review.authorUsername}`}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-stone-800">
                          {review.authorName || t("anonymous")}
                        </span>
                      )}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3"
                            style={{
                              color: PASSPORT.accent,
                              fill: i < review.rating ? PASSPORT.accent : "transparent",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="mt-2 font-medium text-stone-900">{review.title}</h3>
                    {review.tip ? (
                      <p className="mt-1 text-sm text-stone-600">{review.tip}</p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-stone-400">{review.date}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {nearby.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-stone-900">
                {t("nearbyTitle")}
              </h2>
              <div className="space-y-4">
                {nearby.map((p, index) => (
                  <div key={p.id}>
                    <Link
                      href={`/explore/${country}/${city}/${placeSlug(p.name, p.id)}`}
                      className="mb-2 inline-block text-sm font-semibold text-stone-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <PlaceCard
                      place={p}
                      locale={locale}
                      city={destination.city}
                      country={destination.country}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
