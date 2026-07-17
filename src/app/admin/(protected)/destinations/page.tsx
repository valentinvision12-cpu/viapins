import { Map as MapIcon, Upload, Globe2, Compass, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { getAllDestinationsForAdmin } from "@/actions/get-destinations";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DestinationsActions,
  DeleteDestinationButton,
  DeleteCountryButton,
  ReplaceDestinationButton,
} from "@/components/admin/destinations-actions";

export const metadata = { title: "Дестинации" };

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

type DestinationRow = {
  id: string;
  city: string;
  country: string;
  tags: string[];
  published: boolean;
  created_at: string;
  places_count: number;
};

type CountryGroup = {
  country: string;
  slug: string;
  cities: DestinationRow[];
  totalPlaces: number;
  publishedCount: number;
  adventure: { title: string; stopCount: number; published: boolean } | null;
};

export default async function DestinationsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = !supabaseUrl.includes("placeholder");

  let destinations: DestinationRow[] = [];
  let adventures: Array<{
    country: string;
    slug: string;
    title: string;
    published: boolean;
    stopCount: number;
  }> = [];

  if (isConfigured) {
    destinations = await getAllDestinationsForAdmin();

    const service = createServiceClient();
    if (service) {
      const { data: advData } = await service
        .from("adventure_collections")
        .select("country, slug, title, published, places")
        .order("country");

      adventures = (advData ?? []).map((a) => ({
        country: a.country as string,
        slug: a.slug as string,
        title: a.title as string,
        published: a.published as boolean,
        stopCount: Array.isArray(a.places) ? a.places.length : 0,
      }));
    }
  }

  const groups: CountryGroup[] = [];
  const byCountry = new Map<string, DestinationRow[]>();
  for (const d of destinations) {
    const list = byCountry.get(d.country) ?? [];
    list.push(d);
    byCountry.set(d.country, list);
  }

  const allCountries = new Set([
    ...destinations.map((d) => d.country),
    ...adventures.map((a) => a.country),
  ]);

  for (const country of allCountries) {
    const cities = byCountry.get(country) ?? [];
    const adv = adventures.find((a) => a.country.toLowerCase() === country.toLowerCase());
    groups.push({
      country,
      slug: adv?.slug ?? toSlug(country),
      cities,
      totalPlaces: cities.reduce((n, c) => n + c.places_count, 0),
      publishedCount: cities.filter((c) => c.published).length,
      adventure: adv
        ? { title: adv.title, stopCount: adv.stopCount, published: adv.published }
        : null,
    });
  }

  groups.sort((a, b) => a.country.localeCompare(b.country, "bg"));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <MapIcon className="w-5 h-5 text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Дестинации</h1>
          <span className="text-sm text-gray-400 font-normal ml-1">
            ({groups.length} държави · {destinations.length} града)
          </span>
        </div>
        <Link
          href="/admin/import"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[oklch(0.22_0.07_250)] text-white text-sm font-medium hover:brightness-110 transition-all"
        >
          <Upload className="w-4 h-4" />
          Качи държава
        </Link>
      </div>

      {!isConfigured && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <strong>Supabase не е конфигуриран.</strong> Отиди на{" "}
          <Link href="/admin/settings" className="underline">
            Настройки
          </Link>{" "}
          и попълни ключовете.
        </div>
      )}

      {isConfigured && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Globe2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Няма съдържание на сайта</p>
          <p className="text-sm text-gray-400 mb-6 max-w-md">
            Един клик от Seed Import качва цяла държава — 10 града, 100 места и adventure маршрут.
            Не е нужно да пипаш Supabase ръчно.
          </p>
          <Link
            href="/admin/import"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[oklch(0.22_0.07_250)] text-white text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Seed Import → Публикувай Албания
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {groups.map((group) => (
          <section
            key={group.country}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{group.country}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {group.cities.length} града ·{" "}
                  <Link
                    href={
                      group.cities[0]
                        ? `/admin/destinations/${group.cities[0].id}`
                        : "#"
                    }
                    className="text-blue-600 hover:underline font-medium"
                    title="Виж местата"
                  >
                    {group.totalPlaces} места
                  </Link>
                  {group.adventure ? (
                    <>
                      {" · "}
                      <Link
                        href={`/admin/adventures/${group.slug}`}
                        className="text-orange-600 hover:underline font-medium"
                      >
                        Adventure {group.adventure.stopCount} спирки
                      </Link>
                    </>
                  ) : (
                    <>
                      {" · "}
                      <Link
                        href="/admin/adventures"
                        className="text-orange-500 hover:underline"
                      >
                        + Adventure
                      </Link>
                    </>
                  )}
                  {" · "}
                  {group.publishedCount}/{group.cities.length} публикувани
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {group.adventure ? (
                  <Link
                    href={`/admin/adventures/${group.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 hover:bg-orange-100"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Редактирай Adventure
                  </Link>
                ) : (
                  <Link
                    href="/admin/adventures"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 border border-orange-200 hover:bg-orange-50"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Качи Adventure
                  </Link>
                )}
                {group.cities[0] && (
                  <Link
                    href={`/en/explore/${group.slug}/${toSlug(group.cities[0].city)}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    Сайт
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                )}
                <DeleteCountryButton country={group.country} />
              </div>
            </div>

            {group.cities.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase">
                      Град
                    </th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase">
                      Тагове
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase">
                      Места
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase">
                      Статус
                    </th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.cities.map((dest) => (
                    <tr key={dest.id} className="hover:bg-gray-50/50 group">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/destinations/${dest.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {dest.city}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {dest.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/destinations/${dest.id}`}
                          className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                          title="Редактирай 10-те места"
                        >
                          {dest.places_count}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DestinationsActions
                          destinationId={dest.id}
                          published={dest.published}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/destinations/${dest.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                            title="Редактирай местата"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Редактирай
                          </Link>
                          <ReplaceDestinationButton
                            city={dest.city}
                            country={dest.country}
                          />
                          <DeleteDestinationButton destinationId={dest.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-6 text-sm text-gray-400">
                Само adventure маршрут — няма градове в базата.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
