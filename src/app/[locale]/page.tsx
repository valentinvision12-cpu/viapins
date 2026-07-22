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
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { buildHomeJsonLd } from "@/lib/seo-schema";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/site-brand";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const siteUrl = getSiteUrl();
  const ogImage = `${siteUrl}${SITE_LOGO_PATH}`;
  const alternates = buildLocaleAlternates("/");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: ["travel guide", "Europe travel", "Asia travel", "landmarks", "route planner", "free travel", "city guide"],
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: alternates.languages,
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${siteUrl}/${locale}`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  const { destinations: allCities, countries: allCountries } =
    await getPublishedHomeData();

  const searchIndex = buildSearchIndex(allCountries, allCities).map((item) => ({
    ...item,
    // Keep covers only for countries (grid); city search can use initials until typed
    coverImage: item.type === "country" ? item.coverImage : "",
  }));
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
          searchIndex={searchIndex}
          cities={allCities}
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
