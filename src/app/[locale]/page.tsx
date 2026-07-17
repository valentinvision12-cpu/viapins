import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HomeExplore } from "@/components/public/home-explore";
import {
  getPublishedHomeData,
} from "@/actions/get-destinations";
import { buildSearchIndex } from "@/lib/search-index";
import { Link } from "@/i18n/navigation";
import { NavHeader } from "@/components/public/nav-header";
import { LUXURY } from "@/lib/luxury-palette";
import { getSiteUrl } from "@/lib/seo";
import { buildHomeJsonLd } from "@/lib/seo-schema";
import { SITE_NAME } from "@/lib/site-brand";
import { TOP_COUNTRIES_HOME } from "@/lib/featured-countries";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = getSiteUrl();
  return {
    title: t("defaultTitle"),
    description: t("defaultDescription"),
    alternates: { canonical: `${siteUrl}/${locale}` },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      url: `${siteUrl}/${locale}`,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  const { destinations: allCities, countries: allCountries } =
    await getPublishedHomeData();

  const heroCountries = allCountries.slice(0, TOP_COUNTRIES_HOME);
  const searchIndex = buildSearchIndex(allCountries, allCities);
  const jsonLd = buildHomeJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <NavHeader />

      <main>
        <HomeExplore
          countries={allCountries}
          heroCountries={heroCountries}
          searchIndex={searchIndex}
          inspireCities={allCities}
        />

        <footer
          className="border-t py-8 px-6 text-center"
          style={{ background: LUXURY.creamDeep, borderColor: LUXURY.bronzeBorder }}
        >
          <p className="text-xs" style={{ color: LUXURY.textMuted }}>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SITE_NAME}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/terms" className="text-stone-400 hover:text-stone-700 text-xs transition-colors">
              Terms
            </Link>
            <span className="text-stone-300">·</span>
            <Link href="/privacy" className="text-stone-400 hover:text-stone-700 text-xs transition-colors">
              Privacy
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
