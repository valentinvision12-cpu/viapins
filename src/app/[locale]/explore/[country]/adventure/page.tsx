import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Car, Compass, Mountain } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAdventureCollection } from "@/lib/adventure-data";
import { getCountryDisplayName } from "@/lib/country-meta";
import { CountryHeroCover } from "@/components/public/country-hero-cover";
import { isBadImageUrl } from "@/lib/wiki-image";
import { filterPlacesForDisplay, pickCityCoverFromPlaces } from "@/lib/city-cover";
import { NavHeader } from "@/components/public/nav-header";
import { AdventureRoutePlanner } from "@/components/public/adventure-route-planner";
import { AdventurePlaceCard } from "@/components/public/adventure-place-card";
import { AdventureProgress } from "@/components/public/adventure-progress";
import { getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";

type Props = {
  params: Promise<{ locale: string; country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country } = await params;
  const collection = await getAdventureCollection(country);
  if (!collection) return {};

  const t = await getTranslations({ locale, namespace: "meta" });
  const seo = collection.seo;
  const title = seo?.title ?? `${collection.title}${t("separator")}${t("defaultTitle")}`;
  const description = seo?.description ?? collection.subtitle;
  const pageUrl = `${getSiteUrl()}/${locale}/explore/${country}/adventure`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "article",
      images: collection.heroImage ? [{ url: collection.heroImage }] : [],
    },
  };
}

export default async function AdventurePage({ params }: Props) {
  const { locale, country } = await params;
  const t = await getTranslations({ locale, namespace: "adventure" });

  const raw = await getAdventureCollection(country);
  if (!raw) notFound();

  const resolvedPlaces = filterPlacesForDisplay(raw.places);
  const heroImage =
    raw.heroImage?.trim() ||
    pickCityCoverFromPlaces(resolvedPlaces) ||
    "";

  const collection = { ...raw, places: resolvedPlaces, country: getCountryDisplayName(raw.country) };
  const coverImages = [
    ...new Set(
      [heroImage, ...resolvedPlaces.map((p) => p.image_url)].filter(
        (url) => url?.trim() && !isBadImageUrl(url)
      )
    ),
  ].slice(0, 3);

  return (
    <>
      <NavHeader />
      <AdventureProgress country={collection.country} totalPlaces={collection.places.length} />

      <main className="min-h-screen bg-[#F8F6F1]">
        {/* Hero */}
        <section className="relative h-[42vh] min-h-[280px] max-h-[420px] overflow-hidden">
          <CountryHeroCover
            country={collection.country}
            coverImages={coverImages}
            coverImage={coverImages[0] ?? heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 pointer-events-none" />

          <div className="relative z-10 h-full container max-w-4xl mx-auto px-6 flex flex-col justify-end pb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/55 hover:text-white text-sm mb-4 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backHome")}
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/25 border border-orange-400/30 text-orange-100 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                Adventure
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs">
                <Car className="w-3.5 h-3.5" />
                {t("carRequired")}
              </span>
            </div>

            <h1 className="text-white font-black text-3xl sm:text-4xl tracking-tight mb-1">
              {collection.country}
            </h1>
            <p className="text-white/65 text-sm sm:text-base max-w-xl leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="flex items-center gap-4 mt-4 text-white/50 text-xs">
              <span className="inline-flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5" />
                {collection.places.length} {t("stops")}
              </span>
            </div>
          </div>
        </section>

        {/* Info strip */}
        <section className="border-b border-orange-100 bg-orange-50/50">
          <div className="container max-w-4xl mx-auto px-6 py-4">
            <p className="text-stone-600 text-sm leading-relaxed">
              {collection.seo?.intro ?? t("infoStrip")}
            </p>
          </div>
        </section>

        {/* Curated route planner + map */}
        <AdventureRoutePlanner
          places={collection.places}
          country={collection.country}
          totalDays={collection.totalDays}
          locale={locale}
        />

        {/* Places detail list */}
        <section className="container max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-stone-800 font-bold text-lg mb-2 flex items-center gap-2">
            <Compass className="w-5 h-5 text-orange-500" />
            {t("allStopsDetail")}
          </h2>
          <p className="text-stone-400 text-sm mb-6">{t("allStopsHint")}</p>
          <div className="space-y-5">
            {collection.places
              .slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((place, i) => (
              <AdventurePlaceCard
                key={place.id}
                place={place}
                locale={locale}
                index={i}
                stopNumber={place.order_index + 1}
              />
            ))}
          </div>
        </section>

        <footer className="border-t border-stone-200 py-8 text-center text-stone-300 text-xs">
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </main>
    </>
  );
}
