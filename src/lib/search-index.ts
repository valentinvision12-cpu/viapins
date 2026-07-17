import type { CountryCard, DestinationCard, SearchResultItem } from "@/actions/get-destinations";

export function buildSearchIndex(
  countries: CountryCard[],
  cities: DestinationCard[]
): SearchResultItem[] {
  const items: SearchResultItem[] = countries.map((c) => ({
    type: "country" as const,
    name: c.country,
    country: c.country,
    slug: { country: c.slug },
    coverImage: c.coverImage,
    subtitle: `${c.cityCount} cities`,
    flag: c.flag,
    flagUrl: c.flagUrl,
  }));

  for (const d of cities) {
    items.push({
      type: "city",
      name: d.city,
      country: d.country,
      slug: d.slug,
      coverImage: d.coverImage,
      subtitle: d.country,
    });
  }
  return items;
}

export function filterSearchResults(
  items: SearchResultItem[],
  query: string
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q)
  );
}
