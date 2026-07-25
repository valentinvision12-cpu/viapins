import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDiscoveryFeed } from "@/actions/discovery-feed";
import { NavHeader } from "@/components/public/nav-header";
import { DiscoveryFeed } from "@/components/public/discovery-feed";
import { PASSPORT } from "@/lib/luxury-palette";
import { SITE_NAME } from "@/lib/site-brand";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { JsonLd } from "@/lib/schema/JsonLd";
import { generateSchema } from "@/lib/schema";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myTrip" });
  const path = "/discover";
  const pageUrl = `${getSiteUrl()}/${locale}${path}`;
  const alternates = buildLocaleAlternates(path);
  return {
    title: `${t("discoverTitle")} | ${SITE_NAME}`,
    description: t("discoverSubtitle"),
    alternates: { canonical: pageUrl, languages: alternates.languages },
    robots: { index: true, follow: true },
  };
}

export default async function DiscoverPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("myTrip");
  const items = await getDiscoveryFeed(48);
  const jsonLd = generateSchema("collection", {
    locale,
    title: t("discoverTitle"),
    description: t("discoverSubtitle"),
    path: "/discover",
  }).jsonLd;

  return (
    <>
      <JsonLd data={jsonLd} />
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: PASSPORT.bgGradient, color: PASSPORT.text }}
      >
        <div className="container mx-auto max-w-2xl px-6 py-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: PASSPORT.accent }}
          >
            {t("discoverEyebrow")}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            {t("discoverTitle")}
          </h1>
          <p className="mt-2 text-sm" style={{ color: PASSPORT.textMuted }}>
            {t("discoverSubtitle")}
          </p>
          <div className="mt-8">
            <DiscoveryFeed items={items} />
          </div>
        </div>
      </main>
    </>
  );
}
