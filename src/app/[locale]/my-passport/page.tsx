import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { getPassportProfile } from "@/actions/get-passport-profile";
import { NavHeader } from "@/components/public/nav-header";
import { PassportLogin } from "@/components/public/passport-login";
import { PassportDashboard } from "@/components/public/passport-dashboard";
import { SITE_NAME } from "@/lib/site-brand";
import { PASSPORT } from "@/lib/luxury-palette";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyTrips" });
  return { title: t("title") };
}

export default async function MyPassportPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myTrip" });

  const passport = await getPassportProfile();
  const { user, stats } = passport;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  const passportStats = [
    {
      id: "countries",
      label: t("passportStatCountries"),
      value: stats.countries,
      hint: t("passportStatCountriesHint", { total: 195 }),
    },
    {
      id: "cities",
      label: t("passportStatCities"),
      value: stats.cities,
    },
    {
      id: "places",
      label: t("passportStatPlaces"),
      value: stats.places,
    },
    {
      id: "photos",
      label: t("passportStatPhotos"),
      value: stats.photos,
    },
    {
      id: "reviews",
      label: t("passportStatReviews"),
      value: stats.reviews,
    },
    {
      id: "followers",
      label: t("followFollowers"),
      value: stats.followers,
    },
    {
      id: "following",
      label: t("followFollowingCount"),
      value: stats.following,
    },
  ];

  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: PASSPORT.bgGradient, color: PASSPORT.text }}
      >
        <div className="container mx-auto max-w-6xl px-6 py-10 sm:py-12">
          {!isConfigured ? (
            <div
              className="rounded-2xl border py-20 text-center"
              style={{
                background: PASSPORT.card,
                borderColor: PASSPORT.cardBorder,
                boxShadow: PASSPORT.cardShadow,
              }}
            >
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-stone-200" />
              <p className="mb-2 font-medium" style={{ color: PASSPORT.text }}>
                {t("supabaseMissing")}
              </p>
              <p className="mx-auto max-w-xs text-sm" style={{ color: PASSPORT.textMuted }}>
                {t("supabaseMissingDesc")}
              </p>
            </div>
          ) : !user ? (
            <PassportLogin />
          ) : (
            <PassportDashboard
              profile={passport}
              locale={locale}
              statsItems={passportStats}
            />
          )}
        </div>

        <footer
          className="mt-10 border-t py-8 text-center text-xs"
          style={{ borderColor: PASSPORT.cardBorder, color: PASSPORT.textMuted }}
        >
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </main>
    </>
  );
}
