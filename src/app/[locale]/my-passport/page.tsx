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
      <main className="min-h-screen pt-20 text-white" style={{ background: "linear-gradient(145deg, #1C1409 0%, #2C1E0E 40%, #1A1510 100%)" }}>
        <div className="container max-w-4xl mx-auto px-6 py-12">
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
            <div className="flex items-center gap-4 mb-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: "rgba(154,123,79,0.25)", border: "1px solid rgba(154,123,79,0.3)" }}
              >
                <Briefcase className="w-7 h-7" style={{ color: "#E8C99B" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                <p className="text-white/60 text-sm mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
          )}

          {!isConfigured ? (
            <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl">
              <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/80 font-medium mb-2">{t("supabaseMissing")}</p>
              <p className="text-white/55 text-sm max-w-xs mx-auto">{t("supabaseMissingDesc")}</p>
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

        <footer className="border-t border-white/10 py-8 text-center text-white/35 text-xs mt-10">
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </main>
    </>
  );
}
