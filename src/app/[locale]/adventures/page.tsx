import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { NavHeader } from "@/components/public/nav-header";
import { AdventuresHub } from "@/components/public/adventures-hub";
import { getAdventureSummaries } from "@/lib/adventure-data";
import { getCountryDisplayName, getCountryFlagUrl } from "@/lib/country-meta";
import { FEATURED_COUNTRY_ORDER } from "@/lib/featured-countries";
import {
  buildAdventureSubtitle,
  resolveAdventureCoverImage,
  resolveAdventureTotalDays,
} from "@/lib/adventure-hub";
import type { AdventureCardSummary } from "@/components/public/adventure-card-types";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";
import { JsonLd } from "@/lib/schema/JsonLd";
import { generateSchema } from "@/lib/schema";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adventuresHub" });
  const path = "/adventures";
  const pageUrl = `${getSiteUrl()}/${locale}${path}`;
  const alternates = buildLocaleAlternates(path);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: pageUrl, languages: alternates.languages },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function AdventuresPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adventuresHub" });

  const adventureCards: AdventureCardSummary[] = (await getAdventureSummaries())
    .map((a) => {
      const country = getCountryDisplayName(a.country);
      return {
        country,
        slug: a.slug,
        flag: getCountryFlagUrl(country, 80),
        subtitle: buildAdventureSubtitle(country, a.subtitle, a.places),
        stopCount: a.places.length,
        totalDays: resolveAdventureTotalDays(a.totalDays, a.places),
        coverImage: resolveAdventureCoverImage(a.heroImage, a.places),
      };
    })
    .sort((a, b) => {
      const ia = FEATURED_COUNTRY_ORDER.indexOf(
        a.country as (typeof FEATURED_COUNTRY_ORDER)[number]
      );
      const ib = FEATURED_COUNTRY_ORDER.indexOf(
        b.country as (typeof FEATURED_COUNTRY_ORDER)[number]
      );
      const ai = ia === -1 ? 9999 : ia;
      const bi = ib === -1 ? 9999 : ib;
      return ai !== bi ? ai - bi : a.country.localeCompare(b.country);
    });

  const jsonLd = generateSchema("collection", {
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/adventures",
  }).jsonLd;

  return (
    <>
      <JsonLd data={jsonLd} />
      <NavHeader />
      <main>
        <AdventuresHub adventures={adventureCards} />
      </main>
    </>
  );
}
