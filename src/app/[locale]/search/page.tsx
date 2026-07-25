import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NavHeader } from "@/components/public/nav-header";
import { SearchResultsGrid } from "@/components/public/search-results-grid";
import { getPublishedHomeData } from "@/actions/get-destinations";
import { buildSearchIndex } from "@/lib/search-index";
import { buildLocaleAlternates, getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site-brand";
import { LUXURY } from "@/lib/luxury-palette";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const t = await getTranslations({ locale, namespace: "home" });
  const title = query
    ? `${t("searchResultsTitle")}: ${query}`
    : `${t("searchResultsTitle")} | ${SITE_NAME}`;
  const description = query
    ? `Search results for "${query}" on ${SITE_NAME} — cities, countries, and travel guides.`
    : `Search destinations, cities, and travel guides on ${SITE_NAME}.`;
  const path = "/search";
  const pageUrl = `${getSiteUrl()}/${locale}${path}${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const alternates = buildLocaleAlternates(path);

  return {
    title,
    description,
    alternates: {
      canonical: `${getSiteUrl()}/${locale}${path}`,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    robots: query
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  await params;
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const t = await getTranslations("home");
  const { countries, destinations } = await getPublishedHomeData();
  const searchIndex = buildSearchIndex(countries, destinations);

  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: LUXURY.cream, color: LUXURY.text }}
      >
        <div className="container mx-auto max-w-3xl px-6 py-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: LUXURY.bronze }}
          >
            {SITE_NAME}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            {t("searchResultsTitle")}
          </h1>
          <form method="get" className="mt-6">
            <label className="sr-only" htmlFor="q">
              {t("searchResultsTitle")}
            </label>
            <div className="flex gap-2">
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder={t("searchEmpty")}
                className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: LUXURY.bronzeBorder,
                  background: LUXURY.creamCard,
                  color: LUXURY.text,
                }}
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: LUXURY.text }}
              >
                Search
              </button>
            </div>
          </form>
          {!query ? (
            <p className="mt-8 text-sm" style={{ color: LUXURY.textMuted }}>
              {t("searchEmpty")}{" "}
              <Link href="/" className="underline underline-offset-2">
                {SITE_NAME}
              </Link>
            </p>
          ) : null}
        </div>
        {query ? (
          <SearchResultsGrid items={searchIndex} query={query} />
        ) : null}
      </main>
    </>
  );
}
