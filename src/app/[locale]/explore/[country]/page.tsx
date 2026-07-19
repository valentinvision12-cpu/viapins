import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getCountryBySlug,
  getCitiesByCountrySlug,
} from "@/actions/get-destinations";
import { DestinationCard } from "@/components/public/destination-card";
import { NavHeader } from "@/components/public/nav-header";
import { AdventureLinkBanner } from "@/components/public/adventure-link-banner";
import { CountryHeroCover } from "@/components/public/country-hero-cover";
import { ShareDestinationButton } from "@/components/public/share-destination-button";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/site-brand";
import { ContinentBadge } from "@/components/public/continent-badge";
import { CountryFlag } from "@/components/public/country-flag";
import { hasAdventureMode } from "@/lib/adventure-data";
import { getCountryContinent } from "@/lib/country-continents";
import {
  buildCountryPageUrl,
  buildLocaleAlternates,
  getSiteUrl,
} from "@/lib/seo";
import { buildCountryJsonLd } from "@/lib/seo-schema";

type Props = {
  params: Promise<{ locale: string; country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country: countrySlug } = await params;
  const country = await getCountryBySlug(countrySlug);
  if (!country) return {};

  const t = await getTranslations({ locale, namespace: "countryPage" });
  const title = t("metaTitle", { country: country.country });
  const description = t("metaDescription", { country: country.country });
  const pageUrl = buildCountryPageUrl(locale, countrySlug);
  const alternates = buildLocaleAlternates(`/explore/${countrySlug}`);
  const ogImage = country.coverImage || `${getSiteUrl()}${SITE_LOGO_PATH}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${country.country} travel guide`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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

export default async function ExploreCountryPage({ params }: Props) {
  const { locale, country: countrySlug } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const tCountry = await getTranslations({ locale, namespace: "countryPage" });

  const [country, data, showAdventure] = await Promise.all([
    getCountryBySlug(countrySlug),
    getCitiesByCountrySlug(countrySlug),
    hasAdventureMode(countrySlug),
  ]);

  if (!country || !data) notFound();

  const continent = getCountryContinent(country.country);
  const description = tCountry("metaDescription", { country: country.country });
  const jsonLd = buildCountryJsonLd({
    country: country.country,
    locale,
    countrySlug,
    description,
    coverImage: country.coverImage,
    cities: data.cities.map((c) => ({
      name: c.city,
      slug: c.slug.city,
      coverImage: c.coverImage,
      placeCount: c.placeCount,
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <NavHeader />

      <main className="bg-[#F8F6F1]">
        <section className="relative h-[52vh] min-h-[390px] max-h-[620px] flex items-end overflow-hidden">
          <CountryHeroCover
            country={country.country}
            coverImages={country.coverImages}
            coverImage={country.coverImage}
          />
          <div className="absolute top-24 right-5 sm:right-8 z-20">
            <ShareDestinationButton
              url={buildCountryPageUrl(locale, countrySlug)}
              title={`${country.country} Travel Guide`}
              description={`Top ${country.cityCount} cities and landmarks`}
              variant="compact"
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(12,16,22,.88) 0%, rgba(12,16,22,.55) 46%, rgba(12,16,22,.10) 78%), linear-gradient(0deg, rgba(12,16,22,.92) 0%, transparent 68%)",
            }}
          />

          <div className="relative z-10 container max-w-7xl mx-auto px-5 sm:px-8 pb-10 sm:pb-14 w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <CountryFlag country={country.country} size="md" />
                <ContinentBadge continent={continent} variant="hero" />
                <MapPin className="w-4 h-4 text-[#FF8A57]" />
                <span className="text-white/90 text-sm font-semibold">
                  {tCountry("citiesLabel", { count: country.cityCount })}
                </span>
              </div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-[-0.04em]"
                style={{ textShadow: "0 3px 18px rgba(0,0,0,0.75)" }}
              >
                {country.country}
              </h1>
              <p className="text-white/95 text-base sm:text-lg md:text-xl mt-3 max-w-2xl font-semibold leading-relaxed drop-shadow-md">
                {tCountry("heroSubtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="container max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="mb-7 sm:mb-9">
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-stone-950">
              {tCountry("topCitiesTitle", { count: data.cities.length })}
            </h2>
            <p className="text-base text-stone-600 mt-2 font-medium">
              {tCountry("pickCityDesc")}
            </p>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0 scrollbar-none">
            {data.cities.map((city, i) => (
              <div
                key={city.id}
                className="w-[78vw] max-w-[280px] sm:w-auto sm:max-w-none shrink-0 sm:shrink snap-start"
              >
                <DestinationCard destination={city} index={i} priority={i < 2} />
              </div>
            ))}
          </div>

          {showAdventure && (
            <div className="mt-12 pt-10 border-t border-stone-200/80">
              <AdventureLinkBanner
                countrySlug={countrySlug}
                countryName={country.country}
                show
              />
            </div>
          )}
        </section>

        <footer className="border-t border-stone-200 py-8 text-center bg-[#F8F6F1]">
          <p className="text-stone-400 text-xs">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </main>
    </>
  );
}
