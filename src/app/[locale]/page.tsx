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

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = getSiteUrl();
  const ogImage = `${siteUrl}/og-image.png`;
  return {
    title: t("defaultTitle"),
    description: t("defaultDescription"),
    keywords: ["travel guide", "Europe travel", "Asia travel", "landmarks", "route planner", "free travel", "city guide"],
    alternates: {
      canonical: `${siteUrl}/en`,
      languages: { "en": `${siteUrl}/en`, "x-default": `${siteUrl}/en` },
    },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      url: `${siteUrl}/${locale}`,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
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
          searchIndex={searchIndex}
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
