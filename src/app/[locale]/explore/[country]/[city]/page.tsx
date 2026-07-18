import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, ArrowLeft, Compass, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDestinationByCityCountry, type DestinationDetail } from "@/actions/get-destinations";
import { getDemoDestination, type DemoDestination } from "@/lib/demo-data";
import { isBadImageUrl } from "@/lib/wiki-image";
import {
  filterPlacesForDisplay,
  filterPlacesWithPhoto,
  pickCityCoverFromPlaces,
  resolveCityCoverFromDb,
} from "@/lib/city-cover";
import { ShareDestinationButton } from "@/components/public/share-destination-button";
import { PlaceCard } from "@/components/public/place-card";
import { NavHeader } from "@/components/public/nav-header";
import { CityProgress } from "@/components/public/city-progress";
import { AdventureLinkBanner } from "@/components/public/adventure-link-banner";
import { CityRelated } from "@/components/public/city-related";
import { buildCitySeo, buildCityPageUrl, getSiteUrl } from "@/lib/seo";
import { buildCityJsonLd } from "@/lib/seo-schema";
import { SITE_NAME } from "@/lib/site-brand";
import { hasAdventureMode } from "@/lib/adventure-data";

function pageShareUrl(locale: string, path: string) {
  const base = getSiteUrl();
  return `${base}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

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

  const heroImage = destination.places[0]?.image_url ?? "";
  const pageUrl = buildCityPageUrl(locale, country, city);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: pageUrl },
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
    const countryName = dbDest.country;
    const resolvedPlaces = filterPlacesForDisplay(dbDest.places);
    destination = { ...dbDest, places: resolvedPlaces };
    heroImage = resolveCityCoverFromDb(
      dbDest.coverImage,
      filterPlacesWithPhoto(dbDest.places)
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

  const jsonLd = buildCityJsonLd({
    city: destination.city,
    country: destination.country,
    locale,
    countrySlug: country,
    citySlug: city,
    heroImage,
    description: seo.description,
    intro: seo.intro,
    keywords: seo.keywords,
    places: destination.places,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <NavHeader />

      <main className="bg-[#F8F6F1]">
        <section className="relative h-[48vh] min-h-[360px] flex items-end">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={`${destination.city}, ${destination.country} — ${seo.h1Subtitle}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.12 0.10 260) 0%, oklch(0.20 0.12 275) 100%)",
              }}
            />
          )}

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
              <MapPin className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
              <span className="text-white/55 text-sm">{destination.country}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-2">
              {destination.city}
            </h1>
            <p className="text-white/70 text-lg md:text-xl mb-5 max-w-2xl">
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
