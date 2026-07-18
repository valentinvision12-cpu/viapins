import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { LocaleProvider } from "@/components/locale-provider";
import { RouteCartProvider } from "@/lib/context/route-cart-context";
import { FavoritesProvider } from "@/lib/context/favorites-context";
import { RouteCart } from "@/components/public/route-cart";
import { RouteCartAlert } from "@/components/public/route-cart-alert";
import { AdBlockProvider } from "@/components/public/adblock-detector";
import { GuardianAgent } from "@/components/public/guardian-agent";
import { MobileBottomNav } from "@/components/public/mobile-bottom-nav";

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

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleProvider locale={locale}>
        <AdBlockProvider>
          <GuardianAgent>
            <RouteCartProvider>
              <FavoritesProvider>
                {children}
                <RouteCartAlert />
                <RouteCart />
                <MobileBottomNav />
              </FavoritesProvider>
            </RouteCartProvider>
          </GuardianAgent>
        </AdBlockProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
