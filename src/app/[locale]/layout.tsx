import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { LocaleProvider } from "@/components/locale-provider";
import { RouteCartProvider } from "@/lib/context/route-cart-context";
import { FavoritesProvider } from "@/lib/context/favorites-context";
import { AffiliateProvider } from "@/components/public/trip-extras-section";
import { RouteCart } from "@/components/public/route-cart";
import { RouteCartAlert } from "@/components/public/route-cart-alert";
import { CommandPalette } from "@/components/public/command-palette";
import { AdBlockProvider } from "@/components/public/adblock-detector";
import { GuardianAgent } from "@/components/public/guardian-agent";
import { MobileBottomNav } from "@/components/public/mobile-bottom-nav";
import { getAffiliateConfig } from "@/lib/affiliates-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    other: { locale },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const affiliateConfig = await getAffiliateConfig();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleProvider locale={locale}>
        <AdBlockProvider>
          <GuardianAgent>
            <AffiliateProvider config={affiliateConfig}>
              <RouteCartProvider>
                <FavoritesProvider>
                  {children}
                  <RouteCartAlert />
                  <RouteCart />
                  <CommandPalette />
                  <MobileBottomNav />
                </FavoritesProvider>
              </RouteCartProvider>
            </AffiliateProvider>
          </GuardianAgent>
        </AdBlockProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
