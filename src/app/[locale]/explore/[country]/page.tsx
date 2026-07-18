import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Compass } from "lucide-react";
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
import { CountryGuideStrip } from "@/components/public/country-guide-strip";
import { SITE_NAME } from "@/lib/site-brand";
import { ContinentBadge } from "@/components/public/continent-badge";
import { hasAdventureMode } from "@/lib/adventure-data";
import { getCountryContinent } from "@/lib/country-continents";

function pageShareUrl(locale: string, path: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "https://travel-magazine-six.vercel.app";
  return `${base}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

type Props = {
  params: Promise<{ locale: string; country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country: countrySlug } = await params;
  const country = await getCountryBySlug(countrySlug);
  if (!country) return {};

  const t = await getTranslations({ locale, namespace: "countryPage" });

  return {
    title: t("metaTitle", { country: country.country }),
    description: t("metaDescription", { country: country.country }),
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

  return (
    <>
      <NavHeader />

      <main className="bg-[#F8F6F1]">
        <section className="relative h-[45vh] min-h-[320px] flex items-end overflow-hidden">
          <CountryHeroCover
            country={country.country}
            coverImages={country.coverImages}
            coverImage={country.coverImage}
          />
          <div className="absolute top-6 right-6 z-20">
            <ShareDestinationButton
              url={pageShareUrl(locale, `/explore/${countrySlug}`)}
              title={`${country.country} Travel Guide`}
              description={`Top ${country.cityCount} cities and landmarks`}
              variant="compact"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.06_252)] via-[oklch(0.10_0.06_252)]/50 to-transparent pointer-events-none" />

          <div className="relative z-10 container max-w-7xl mx-auto px-6 pb-10 w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <ContinentBadge continent={continent} variant="hero" />
                <span className="text-white/50 text-sm">·</span>
                <MapPin className="w-4 h-4 text-[oklch(0.72_0.13_82)]" />
                <span className="text-white/70 text-sm font-medium">
                  {tCountry("citiesLabel", { count: country.cityCount })}
                </span>
              </div>
              <h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 32px rgba(0,0,0,0.45)" }}
              >
                {country.country}
              </h1>
              <p className="text-white/80 text-lg md:text-xl mt-3 max-w-xl font-medium drop-shadow-md">
                {tCountry("heroSubtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="container max-w-7xl mx-auto px-6 py-12">
          <CountryGuideStrip cityCount={data.cities.length} />

          {showAdventure && (
            <div className="mb-10">
              <AdventureLinkBanner
                countrySlug={countrySlug}
                countryName={country.country}
                show
              />
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-8">
            <Compass className="w-4.5 h-4.5" style={{ color: "oklch(0.68 0.16 82)" }} />
            <h2 className="text-lg font-bold text-stone-900">
              {tCountry("topCitiesTitle", { count: data.cities.length })}
            </h2>
          </div>

          {/* Mobile: horizontal swipe scroll */}
          <div className="sm:hidden swipe-scroll -mx-6 px-6">
            {data.cities.map((city, i) => (
              <div key={city.id} className="w-[78vw] max-w-[280px]">
                <DestinationCard destination={city} index={i} priority={i < 2} />
              </div>
            ))}
          </div>

          {/* Desktop: regular grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.cities.map((city, i) => (
              <DestinationCard key={city.id} destination={city} index={i} priority={i < 2} />
            ))}
          </div>
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
