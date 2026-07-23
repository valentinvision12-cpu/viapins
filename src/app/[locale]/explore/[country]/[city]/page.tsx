import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { getTranslations } from "next-intl/server";
import { MapPin, ArrowLeft, Compass, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDestinationByCityCountry, type DestinationDetail } from "@/actions/get-destinations";
import { getDemoDestination, type DemoDestination } from "@/lib/demo-data";
import {
  filterPlacesForDisplay,
  filterPlacesWithPhoto,
  pickCityCoverFromPlaces,
  resolveCityCoverFromDb,
} from "@/lib/city-cover";
import { ensurePlacesHaveImages } from "@/lib/ensure-place-images";
import { fallbackImageUrl } from "@/lib/fallback-image";
import { ShareDestinationButton } from "@/components/public/share-destination-button";
import { PlaceCard } from "@/components/public/place-card";
import { NavHeader } from "@/components/public/nav-header";
import { CityProgress } from "@/components/public/city-progress";
import { AdventureLinkBanner } from "@/components/public/adventure-link-banner";
import { CityRelated } from "@/components/public/city-related";
import { buildCitySeo, buildCityPageUrl, buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { JsonLd } from "@/lib/schema/JsonLd";
import { generateSchema, buildCityFaqs } from "@/lib/schema";
import { SITE_NAME } from "@/lib/site-brand";
import { hasAdventureMode } from "@/lib/adventure-data";

function pageShareUrl(locale: string, path: string) {
  const base = getSiteUrl();
  return `${base}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Keep city guides fresh after seed/DB landmark swaps (maps → real photos). */
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; country: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city } = await params;
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) return {};

  const seo = buildCitySeo({
    city: destination.city,
    country: destination.country,
    placeCount: destination.places.length,
    locale,
    seo: "seo" in destination ? destination.seo : undefined,
    topPlaceNames: destination.places.map((p) => p.name),
  });

  const heroImage =
    ("coverImage" in destination && destination.coverImage) ||
    destination.places[0]?.image_url ||
    "";
  const pageUrl = buildCityPageUrl(locale, country, city);
  const alternates = buildLocaleAlternates(`/explore/${country}/${city}`);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: pageUrl,
      languages: alternates.languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "article",
      images: heroImage
        ? [
            {
              url: heroImage,
              width: 1200,
              height: 630,
              alt: `${destination.city}, ${destination.country} travel guide`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: heroImage ? [heroImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const TAG_COLORS: Record<string, string> = {
  winter: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  spring: "bg-pink-500/20 text-pink-200 border-pink-400/30",
  summer: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  autumn: "bg-orange-500/20 text-orange-200 border-orange-400/30",
};

export default async function ExploreCityPage({ params }: Props) {
  const { locale, country, city } = await params;
  const tCity = await getTranslations({ locale, namespace: "cityPage" });
  const tGuides = await getTranslations({ locale, namespace: "cityGuides" });
  const tStays = await getTranslations({ locale, namespace: "stays" });

  const rawDestination = await getDestinationByCityCountry(country, city).then(
    (d) => d ?? getDemoDestination(country, city)
  );
  if (!rawDestination) notFound();

  let destination = rawDestination;
  let heroImage = "";

  if ("wiki_title" in rawDestination) {
    const demo = rawDestination as DemoDestination;
    const countryName = demo.country;
    const places = filterPlacesForDisplay(demo.places);
    const resolvedHero =
      demo.cityImage ||
      pickCityCoverFromPlaces(filterPlacesWithPhoto(demo.places)) ||
      "";

    destination = { ...demo, cityImage: resolvedHero, places };
    heroImage = resolvedHero;
  } else {
    const dbDest = rawDestination as DestinationDetail;
    const resolvedPlaces = await ensurePlacesHaveImages(
      filterPlacesForDisplay(dbDest.places),
      dbDest.city,
      dbDest.country
    );
    destination = { ...dbDest, places: resolvedPlaces };
    heroImage = resolveCityCoverFromDb(
      dbDest.coverImage,
      filterPlacesWithPhoto(resolvedPlaces)
    );
  }

  const seo = buildCitySeo({
    city: destination.city,
    country: destination.country,
    placeCount: destination.places.length,
    locale,
    seo: "seo" in destination ? destination.seo : undefined,
    topPlaceNames: destination.places.map((p) => p.name),
  });

  const jsonLd = generateSchema("city", {
    city: destination.city,
    country: destination.country,
    locale,
    countrySlug: country,
    citySlug: city,
    heroImage,
    description: seo.description,
    intro: seo.intro,
    keywords: seo.keywords,
    places: destination.places.map((place) => {
      const withMeta = place as typeof place & {
        category?: string;
        type?: string;
        tags?: string[];
        slug?: string;
      };
      return {
        id: place.id,
        name: place.name,
        slug: withMeta.slug,
        lat: place.lat,
        lng: place.lng,
        image_url: place.image_url,
        translations: place.translations,
        seoKeywords: (place.translations?.en as { seo_keywords?: string[] } | undefined)?.seo_keywords,
        category: withMeta.category ?? withMeta.type,
        type: withMeta.type,
        tags: withMeta.tags,
      };
    }),
    faqs: buildCityFaqs(destination.city, destination.country),
  }).jsonLd;

  return (
    <>
      <JsonLd data={jsonLd} />

      <NavHeader />

      <main className="bg-[#F8F6F1]">
        <section className="relative h-[48vh] min-h-[360px] flex items-end">
          <Image
            src={
              heroImage ||
              fallbackImageUrl(`${destination.city}-${destination.country}`)
            }
            alt={`${destination.city}, ${destination.country} - ${seo.h1Subtitle}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized={IMAGE_UNOPTIMIZED}
            referrerPolicy={IMAGE_REFERRER_POLICY}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.06_252)] via-[oklch(0.10_0.06_252)]/50 to-transparent" />

          <div className="absolute top-6 right-6 z-20">
            <ShareDestinationButton
              url={pageShareUrl(locale, `/explore/${country}/${city}`)}
              title={`${destination.city}, ${destination.country}`}
              description={seo.h1Subtitle}
              variant="compact"
            />
          </div>

          <div className="relative z-10 container max-w-7xl mx-auto px-6 pb-12 w-full">
            <Link
              href={`/explore/${country}`}
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {destination.country}
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[oklch(0.78_0.14_75)]" />
              <span className="text-white/90 text-sm font-medium drop-shadow-sm">
                {destination.country}
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-2"
              style={{ textShadow: "0 3px 18px rgba(0,0,0,0.7)" }}
            >
              {destination.city}
            </h1>
            <p
              className="text-white/95 text-lg md:text-xl mb-5 max-w-2xl font-medium"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
            >
              {seo.h1Subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {destination.tags.map((tag) => (
                <span
                  key={tag}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                    TAG_COLORS[tag.toLowerCase()] ??
                    "bg-white/10 text-white/60 border-white/10"
                  }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-white/8 text-white/50 border-white/10">
                <Compass className="w-3 h-3" />
                {tCity("landmarksBadge", { count: destination.places.length })}
              </span>
            </div>
          </div>
        </section>

        <CityProgress city={destination.city} totalPlaces={destination.places.length} />

        <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-10">
          <AdventureLinkBanner
            countrySlug={country}
            countryName={destination.country}
            show={await hasAdventureMode(country)}
          />

          <p className="text-stone-600 text-base leading-relaxed mb-8 max-w-3xl">
            {seo.intro}
          </p>

          <div className="mb-8 flex flex-wrap gap-2">
            {(
              [
                "things-to-do",
                "3-day-itinerary",
                "hidden-gems",
              ] as const
            ).map((slug) => (
              <Link
                key={slug}
                href={`/explore/${country}/${city}/guide/${slug}`}
                className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-amber-300 hover:text-amber-800"
              >
                {tGuides(`${slug}.chipLabel`)}
              </Link>
            ))}
            <Link
              href={`/explore/${country}/${city}/stays`}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-amber-300 hover:text-amber-800"
            >
              {tStays("cityLink", { city: destination.city })}
            </Link>
          </div>

          <div className="flex items-center gap-2.5 mb-6">
            <Compass
              className="w-4.5 h-4.5"
              style={{ color: "oklch(0.68 0.16 82)" }}
            />
            <h2 className="text-lg font-bold text-stone-900">
              {tCity("landmarksTitle", { count: destination.places.length })}
            </h2>
            <span className="text-stone-400 text-sm">
              — {tCity("landmarksHint")}
            </span>
          </div>

          <div className="space-y-4">
            {destination.places.map((place, i) => (
              <PlaceCard
                key={place.id}
                place={place}
                locale={locale}
                city={destination.city}
                country={destination.country}
                index={i}
              />
            ))}
          </div>
        </section>

        <div className="border-t border-stone-100">
          <CityRelated currentCity={city} locale={locale} />
        </div>

        <footer className="border-t border-stone-200 py-8 text-center bg-[#F8F6F1]">
          <p className="text-stone-400 text-xs">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </main>
    </>
  );
}
