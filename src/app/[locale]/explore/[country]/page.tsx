import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getCountryBySlug,
  getCitiesByCountrySlug,
} from "@/actions/get-destinations";
import { NavHeader } from "@/components/public/nav-header";
import { CountryHeroCover } from "@/components/public/country-hero-cover";
import { ShareDestinationButton } from "@/components/public/share-destination-button";
import { CountryExploreSplit } from "@/components/public/country-explore-split";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/site-brand";
import { ContinentBadge } from "@/components/public/continent-badge";
import { CountryFlag } from "@/components/public/country-flag";
import { getAdventureCollection } from "@/lib/adventure-data";
import { getCountryContinent } from "@/lib/country-continents";
import { resolveCountryCoverImages } from "@/lib/country-covers";
import { isBadImageUrl } from "@/lib/wiki-image";
import { pickCityCoverFromPlaces } from "@/lib/city-cover";
import {
  buildCountryPageUrl,
  buildLocaleAlternates,
  getSiteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/lib/schema/JsonLd";
import { generateSchema, buildCountryFaqs } from "@/lib/schema";
import { FaqSection } from "@/components/public/faq-section";
import { RelatedContent } from "@/components/public/related-content";
import { AnswerFirstLead } from "@/components/public/answer-first";

type Props = {
  params: Promise<{ locale: string; country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country: countrySlug } = await params;
  const [country, citiesData] = await Promise.all([
    getCountryBySlug(countrySlug),
    getCitiesByCountrySlug(countrySlug),
  ]);
  if (!country) return {};

  const totalPlaces = (citiesData?.cities ?? []).reduce(
    (sum, c) => sum + (c.placeCount ?? 0),
    0
  );
  const indexable = totalPlaces > 0;

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
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
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

  const [country, data, adventure] = await Promise.all([
    getCountryBySlug(countrySlug),
    getCitiesByCountrySlug(countrySlug),
    getAdventureCollection(countrySlug),
  ]);

  if (!country || !data) notFound();

  // Show Road trip tab whenever an adventure collection exists.
  // Never run city "vague place" filters on curated adventure stops —
  // that wiped national parks and hid the road buttons entirely.
  const adventurePlaces = adventure?.places ?? [];
  const showAdventure = Boolean(adventure);
  const adventureCover =
    (adventure?.heroImage?.trim() && !isBadImageUrl(adventure.heroImage)
      ? adventure.heroImage
      : "") ||
    pickCityCoverFromPlaces(adventurePlaces) ||
    "";

  const continent = getCountryContinent(country.country);
  const description = tCountry("metaDescription", { country: country.country });

  // Guaranteed hero: city covers first, then curated country landmarks
  let coverImages = (country.coverImages ?? []).filter(
    (u) => u?.trim() && !isBadImageUrl(u)
  );
  let coverImage =
    (country.coverImage?.trim() && !isBadImageUrl(country.coverImage)
      ? country.coverImage
      : "") || coverImages[0] || "";
  if (!coverImage) {
    const curated = await resolveCountryCoverImages(country.country, 1600);
    coverImages = curated;
    coverImage = curated[0] ?? "";
  }

  const faqs = buildCountryFaqs(country.country);
  const jsonLd = generateSchema("country", {
    country: country.country,
    locale,
    countrySlug,
    description,
    coverImage,
    cities: data.cities.map((c) => ({
      name: c.city,
      slug: c.slug.city,
      coverImage: c.coverImage,
      placeCount: c.placeCount,
    })),
    faqs,
  }).jsonLd;

  const adventureSummary =
    showAdventure && adventure
      ? {
          countrySlug,
          countryName: country.country,
          coverImage: adventureCover,
          totalDays: adventure.totalDays,
          stopCount: adventurePlaces.length,
          subtitle: adventure.subtitle,
        }
      : null;

  const pagePath = `/explore/${countrySlug}`;

  return (
    <>
      <JsonLd data={jsonLd} />

      <NavHeader />

      <main className="bg-[#F8F6F1]">
        <header className="relative h-[52vh] min-h-[390px] max-h-[620px] flex items-end overflow-hidden">
          <CountryHeroCover
            country={country.country}
            coverImages={coverImages}
            coverImage={coverImage}
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
        </header>

        <article>
          <section
            className="container max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-2"
            aria-labelledby="country-explore-heading"
          >
            <h2
              id="country-explore-heading"
              className="text-lg font-bold text-stone-900"
            >
              Explore {country.country}
            </h2>
            <AnswerFirstLead
              heading={`Where to go in ${country.country}?`}
              countryName={country.country}
              facts={[
                `${country.cityCount} cities`,
                showAdventure ? "Road-trip adventure available" : "",
                data.cities[0]?.city
                  ? `Popular start: ${data.cities[0].city}`
                  : "",
              ]}
              existing={faqs[0]?.answer}
            />
          </section>

          <CountryExploreSplit
            countryName={country.country}
            cities={data.cities}
            adventure={adventureSummary}
          />

          <RelatedContent
            locale={locale}
            currentPath={pagePath}
            countrySlug={countrySlug}
            countryName={country.country}
            tags={country.tags}
            limit={5}
            className="container max-w-4xl mx-auto px-6 pt-6 pb-10"
          />

          <FaqSection items={faqs} />
        </article>

        <footer className="border-t border-stone-200 py-8 text-center bg-[#F8F6F1]">
          <p className="text-stone-400 text-xs">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </main>
    </>
  );
}
