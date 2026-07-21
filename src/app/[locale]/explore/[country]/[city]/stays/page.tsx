import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDestinationByCityCountry } from "@/actions/get-destinations";
import { getDemoDestination } from "@/lib/demo-data";
import { NavHeader } from "@/components/public/nav-header";
import { StaysCityPanel } from "@/components/public/place-card";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";

type Props = {
  params: Promise<{ locale: string; country: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, city } = await params;
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) return {};

  const t = await getTranslations({ locale, namespace: "stays" });
  const title = t("metaTitle", {
    city: destination.city,
    country: destination.country,
  });
  const description = t("metaDescription", {
    city: destination.city,
    country: destination.country,
  });
  const path = `/explore/${country}/${city}/stays`;
  const pageUrl = `${getSiteUrl()}/${locale}${path}`;
  const alternates = buildLocaleAlternates(path);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: pageUrl, languages: alternates.languages },
    robots: { index: true, follow: true },
  };
}

export default async function StaysCityPage({ params }: Props) {
  const { locale, country, city } = await params;
  const t = await getTranslations({ locale, namespace: "stays" });
  const destination =
    (await getDestinationByCityCountry(country, city)) ??
    getDemoDestination(country, city);
  if (!destination) notFound();

  const anchor = destination.places[0];

  return (
    <>
      <NavHeader />
      <main className="min-h-screen bg-stone-50 pt-20 pb-16">
        <div className="container mx-auto max-w-2xl px-6 py-8">
          <Link
            href={`/explore/${country}/${city}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCity", { city: destination.city })}
          </Link>

          <StaysCityPanel
            city={destination.city}
            country={destination.country}
            countrySlug={country}
            lat={anchor?.lat}
            lng={anchor?.lng}
          />
        </div>
      </main>
    </>
  );
}
