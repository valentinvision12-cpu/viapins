import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { getMyRoutes } from "@/actions/get-my-routes";
import { getFavoritesAction } from "@/actions/favorites";
import { NavHeader } from "@/components/public/nav-header";
import { PassportTabs } from "@/components/public/passport-tabs";
import { PassportLogin } from "@/components/public/passport-login";
import { PassportProfileHeader } from "@/components/public/passport-profile-header";
import { travelerLevel } from "@/lib/collection-export";
import { SITE_NAME } from "@/lib/site-brand";
import { PASSPORT } from "@/lib/luxury-palette";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myTrip" });
  return { title: t("metaTitle") };
}

export default async function MyPassportPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myTrip" });

  const [{ saved, visited, user }, favorites] = await Promise.all([
    getMyRoutes(),
    getFavoritesAction(),
  ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !!supabaseUrl && !supabaseUrl.includes("placeholder");

  const allRoutes = [...saved, ...visited];
  const uniqueCountries = new Set([
    ...favorites.map((f) => f.country),
    ...allRoutes.flatMap((r) => r.route_places.map((p) => p.country)),
  ]).size;
  const totalPlaces =
    favorites.length +
    allRoutes.reduce((n, r) => n + r.route_places.length, 0);
  const level = travelerLevel({
    countries: uniqueCountries,
    places: totalPlaces,
    routes: allRoutes.length,
  });

  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: PASSPORT.bgGradient, color: PASSPORT.text }}
      >
        <div className="container mx-auto max-w-4xl px-6 py-10 sm:py-12">
          {user && isConfigured && (
            <PassportProfileHeader
              email={user.email}
              fullName={user.full_name}
              avatarUrl={user.avatar_url}
              level={level}
              statsLine={t("profileStats", {
                countries: uniqueCountries,
                places: totalPlaces,
                routes: allRoutes.length,
              })}
            />
          )}

          {!user && (
            <div className="mb-10 flex items-center gap-4">
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{
                  background: PASSPORT.accentSoft,
                  border: `1px solid ${PASSPORT.accentBorder}`,
                }}
              >
                <Briefcase className="h-7 w-7" style={{ color: PASSPORT.accent }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: PASSPORT.text }}>
                  {t("title")}
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: PASSPORT.textMuted }}>
                  {t("subtitle")}
                </p>
              </div>
            </div>
          )}

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
            <PassportTabs
              savedRoutes={saved}
              visitedRoutes={visited}
              initialFavorites={favorites}
              locale={locale}
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
