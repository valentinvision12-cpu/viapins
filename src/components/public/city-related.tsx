import { Link } from "@/i18n/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface RelatedCity {
  city: string;
  country: string;
  emoji: string;
  gradient: string;
  slug: string; // country/city
}

const CITY_RELATIONS: Record<string, RelatedCity[]> = {
  paris: [
    { city: "Rome", country: "Italy", emoji: "🏛️", gradient: "from-[oklch(0.28_0.08_30)] to-[oklch(0.18_0.06_30)]", slug: "italy/rome" },
    { city: "Barcelona", country: "Spain", emoji: "🎨", gradient: "from-[oklch(0.28_0.09_55)] to-[oklch(0.18_0.07_55)]", slug: "spain/barcelona" },
    { city: "Santorini", country: "Greece", emoji: "🌊", gradient: "from-[oklch(0.25_0.10_220)] to-[oklch(0.16_0.08_220)]", slug: "greece/santorini" },
  ],
  rome: [
    { city: "Paris", country: "France", emoji: "🗼", gradient: "from-[oklch(0.28_0.08_275)] to-[oklch(0.18_0.06_275)]", slug: "france/paris" },
    { city: "Barcelona", country: "Spain", emoji: "🎨", gradient: "from-[oklch(0.28_0.09_55)] to-[oklch(0.18_0.07_55)]", slug: "spain/barcelona" },
    { city: "Santorini", country: "Greece", emoji: "🌊", gradient: "from-[oklch(0.25_0.10_220)] to-[oklch(0.16_0.08_220)]", slug: "greece/santorini" },
  ],
  barcelona: [
    { city: "Paris", country: "France", emoji: "🗼", gradient: "from-[oklch(0.28_0.08_275)] to-[oklch(0.18_0.06_275)]", slug: "france/paris" },
    { city: "Rome", country: "Italy", emoji: "🏛️", gradient: "from-[oklch(0.28_0.08_30)] to-[oklch(0.18_0.06_30)]", slug: "italy/rome" },
    { city: "Santorini", country: "Greece", emoji: "🌊", gradient: "from-[oklch(0.25_0.10_220)] to-[oklch(0.16_0.08_220)]", slug: "greece/santorini" },
  ],
  santorini: [
    { city: "Rome", country: "Italy", emoji: "🏛️", gradient: "from-[oklch(0.28_0.08_30)] to-[oklch(0.18_0.06_30)]", slug: "italy/rome" },
    { city: "Paris", country: "France", emoji: "🗼", gradient: "from-[oklch(0.28_0.08_275)] to-[oklch(0.18_0.06_275)]", slug: "france/paris" },
    { city: "Barcelona", country: "Spain", emoji: "🎨", gradient: "from-[oklch(0.28_0.09_55)] to-[oklch(0.18_0.07_55)]", slug: "spain/barcelona" },
  ],
  tokyo: [
    { city: "Paris", country: "France", emoji: "🗼", gradient: "from-[oklch(0.28_0.08_275)] to-[oklch(0.18_0.06_275)]", slug: "france/paris" },
    { city: "New York", country: "USA", emoji: "🗽", gradient: "from-[oklch(0.25_0.08_240)] to-[oklch(0.16_0.06_240)]", slug: "usa/new-york" },
    { city: "Barcelona", country: "Spain", emoji: "🎨", gradient: "from-[oklch(0.28_0.09_55)] to-[oklch(0.18_0.07_55)]", slug: "spain/barcelona" },
  ],
  "new-york": [
    { city: "Tokyo", country: "Japan", emoji: "⛩️", gradient: "from-[oklch(0.28_0.08_15)] to-[oklch(0.18_0.06_15)]", slug: "japan/tokyo" },
    { city: "Paris", country: "France", emoji: "🗼", gradient: "from-[oklch(0.28_0.08_275)] to-[oklch(0.18_0.06_275)]", slug: "france/paris" },
    { city: "Barcelona", country: "Spain", emoji: "🎨", gradient: "from-[oklch(0.28_0.09_55)] to-[oklch(0.18_0.07_55)]", slug: "spain/barcelona" },
  ],
};

interface Props {
  currentCity: string; // lowercase slug, e.g. "paris"
  locale: string;
}

export async function CityRelated({ currentCity, locale }: Props) {
  const related = CITY_RELATIONS[currentCity.toLowerCase()] ?? [];
  if (related.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "cityRelated" });

  return (
    <section className="container max-w-4xl mx-auto px-6 pt-10 pb-14">
      <div className="flex items-center gap-2.5 mb-6">
        <h2 className="text-base font-bold text-stone-800 tracking-tight">{t("title")}</h2>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map((city) => {
          const [countrySlug, citySlug] = city.slug.split("/");
          return (
            <Link
              key={city.slug}
              href={`/explore/${countrySlug}/${citySlug}`}
              locale={locale}
              className="group relative overflow-hidden rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${city.gradient}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              <div className="relative z-10 p-5 min-h-[140px] flex flex-col justify-end">
                <h3
                  className="text-white font-bold text-lg leading-tight"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
                >
                  {city.city}
                </h3>
                <div className="flex items-center gap-1 mt-1 mb-3">
                  <MapPin className="w-3 h-3 text-white/80" />
                  <span className="text-white/85 text-xs font-medium">{city.country}</span>
                </div>
                <div className="flex items-center gap-1 text-white/90 text-xs font-semibold">
                  {t("explore")}
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
