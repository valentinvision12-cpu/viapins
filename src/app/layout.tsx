import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  SITE_METADATA_TEMPLATE,
  SITE_METADATA_TITLE,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/site-brand";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FDFBF7",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://viapins.com"
  ),
  title: {
    template: SITE_METADATA_TEMPLATE,
    default: SITE_METADATA_TITLE,
  },
  description:
    "Discover the world's most breathtaking destinations. Build personalised GPS routes and explore travel smarter.",
  keywords: [
    "travel guide",
    "travel itinerary",
    "GPS route planner",
    "things to do",
    "landmarks",
    "attractions",
    "travel map",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: SITE_LOGO_PATH,
    apple: SITE_LOGO_PATH,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Discover & Plan Travel Routes`,
    description:
      "Discover the world's most breathtaking destinations. Build personalised GPS routes and explore smarter.",
    images: [{ url: SITE_LOGO_PATH, width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Discover & Plan Travel Routes`,
    description:
      "Discover the world's most breathtaking destinations. Build personalised GPS routes and explore smarter.",
    images: [SITE_LOGO_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
