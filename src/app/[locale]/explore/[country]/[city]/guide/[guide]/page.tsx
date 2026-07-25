import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDestinationByCityCountry } from "@/actions/get-destinations";
import { getDemoDestination } from "@/lib/demo-data";
import { NavHeader } from "@/components/public/nav-header";
import { PlaceCard } from "@/components/public/place-card";
import { isCityGuideSlug } from "@/lib/city-guides";
import { placeSlug } from "@/lib/place-slug";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";
import { JsonLd } from "@/lib/schema/JsonLd";
import { generateSchema } from "@/lib/schema";
import { RelatedContent } from "@/components/public/related-content";
import { AnswerFirstLead } from "@/components/public/answer-first";
import { LinkedProse } from "@/components/public/linked-prose";

type Props = {
  params: Promise<{
    locale: string;
    country: string;
    city: string;
    guide: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city, guide } = await params;
  if (!isCityGuideSlug(guide)) return {};
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) return {};

  const t = await getTranslations({ locale, namespace: "cityGuides" });
  const title = t(`${guide}.metaTitle`, {
    city: destination.city,
    country: destination.country,
  });
  const description = t(`${guide}.metaDescription`, {
    city: destination.city,
    country: destination.country,
  });
  const path = `/explore/${country}/${city}/guide/${guide}`;
  const pageUrl = `${getSiteUrl()}/${locale}${path}`;
  const alternates = buildLocaleAlternates(path);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: pageUrl, languages: alternates.languages },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "article",
    },
  };
}

export default async function CityGuidePage({ params }: Props) {
  const { locale, country, city, guide } = await params;
  if (!isCityGuideSlug(guide)) notFound();

  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) notFound();

  const t = await getTranslations({ locale, namespace: "cityGuides" });
  const places = [...destination.places].sort(
    (a, b) => a.order_index - b.order_index
  );

  const selected =
    guide === "hidden-gems"
      ? places.slice(Math.max(0, places.length - 5))
      : guide === "3-day-itinerary"
        ? places.slice(0, Math.min(9, places.length))
        : places;

  const dayChunks =
    guide === "3-day-itinerary"
      ? [selected.slice(0, 3), selected.slice(3, 6), selected.slice(6, 9)]
      : null;

  const title = t(`${guide}.title`, { city: destination.city });
  const description = t(`${guide}.intro`, {
    city: destination.city,
    country: destination.country,
    count: selected.length,
  });
  const heroImage =
    ("coverImage" in destination && destination.coverImage) ||
    selected[0]?.image_url ||
    destination.places[0]?.image_url ||
    "";
  const updatedAt =
    "updated_at" in destination && typeof destination.updated_at === "string"
      ? destination.updated_at
      : new Date().toISOString();

  const jsonLd = generateSchema("guide", {
    locale,
    country: destination.country,
    city: destination.city,
    countrySlug: country,
    citySlug: city,
    guideSlug: guide,
    title,
    description,
    heroImage: heroImage || undefined,
    datePublished: updatedAt,
    dateModified: updatedAt,
    places: selected.map((place) => ({
      id: place.id,
      name: place.name,
      image_url: place.image_url,
      lat: place.lat,
      lng: place.lng,
    })),
  }).jsonLd;

  const pagePath = `/explore/${country}/${city}/guide/${guide}`;

  return (
    <>
      <JsonLd data={jsonLd} />
      <NavHeader />
      <main className="min-h-screen bg-stone-50 pt-20">
        <article className="container mx-auto max-w-4xl px-6 py-10">
          <header>
            <Link
              href={`/explore/${country}/${city}`}
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {destination.city}
            </Link>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-900">
              {title}
            </h1>
            <LinkedProse
              text={description}
              currentPath={pagePath}
              locale={locale}
              maxLinks={4}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600"
            />
          </header>

          {dayChunks ? (
            <div className="mt-10 space-y-10">
              {dayChunks.map((chunk, dayIdx) =>
                chunk.length === 0 ? null : (
                  <section key={dayIdx} aria-labelledby={`guide-day-${dayIdx + 1}`}>
                    <h2
                      id={`guide-day-${dayIdx + 1}`}
                      className="mb-2 text-lg font-bold text-stone-900"
                    >
                      {t("dayLabel", { day: dayIdx + 1 })}
                    </h2>
                    <AnswerFirstLead
                      heading={t("dayLabel", { day: dayIdx + 1 })}
                      cityName={destination.city}
                      countryName={destination.country}
                      facts={[
                        `${chunk.length} stops`,
                        chunk[0]?.name ? `Begin at ${chunk[0].name}` : "",
                      ]}
                    />
                    <div className="mt-4 space-y-4">
                      {chunk.map((place, i) => (
                        <div key={place.id}>
                          <Link
                            href={`/explore/${country}/${city}/${placeSlug(place.name, place.id)}`}
                            className="mb-2 inline-block text-sm font-semibold text-stone-700 hover:underline"
                          >
                            {place.name}
                          </Link>
                          <PlaceCard
                            place={place}
                            locale={locale}
                            city={destination.city}
                            country={destination.country}
                            index={i}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              )}
            </div>
          ) : (
            <section className="mt-10" aria-labelledby="guide-stops-heading">
              <h2
                id="guide-stops-heading"
                className="mb-2 text-lg font-bold text-stone-900"
              >
                Highlights
              </h2>
              <AnswerFirstLead
                heading={`Top places for ${title}`}
                cityName={destination.city}
                countryName={destination.country}
                facts={[
                  `${selected.length} curated places`,
                  selected[0]?.name ? `Don't miss ${selected[0].name}` : "",
                ]}
              />
              <div className="mt-4 space-y-4">
                {selected.map((place, i) => (
                  <div key={place.id}>
                    <Link
                      href={`/explore/${country}/${city}/${placeSlug(place.name, place.id)}`}
                      className="mb-2 inline-block text-sm font-semibold text-stone-700 hover:underline"
                    >
                      {place.name}
                    </Link>
                    <PlaceCard
                      place={place}
                      locale={locale}
                      city={destination.city}
                      country={destination.country}
                      index={i}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <RelatedContent
            locale={locale}
            currentPath={pagePath}
            countrySlug={country}
            citySlug={city}
            countryName={destination.country}
            cityName={destination.city}
            tags={"tags" in destination ? destination.tags : undefined}
            limit={5}
            className="mt-12 border-t border-stone-200 pt-10"
          />
        </article>

        <footer className="border-t border-stone-200 py-8 text-center">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </main>
    </>
  );
}
