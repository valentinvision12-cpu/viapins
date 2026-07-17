import type { DemoDestination } from "./demo-data";
import type { TravelSeedFile } from "./travel-seed";

/** Конвертира demo-data → Travel Seed JSON (за експорт/шаблон) */
export function demoToSeed(
  destinations: DemoDestination[],
  country?: string
): TravelSeedFile {
  const filtered = country
    ? destinations.filter(
        (d) => d.country.toLowerCase() === country.toLowerCase()
      )
    : destinations;

  if (filtered.length === 0) {
    throw new Error(`Няма дестинации за "${country ?? "всички"}".`);
  }

  return {
    version: 1,
    country: filtered[0].country,
    cities: filtered.map((d) => ({
      city: d.city,
      tags: d.tags,
      wiki_title: d.wiki_title ?? d.city,
      places: d.places.map((p, i) => ({
        name: p.name,
        wiki_title: p.wiki_title ?? p.name,
        lat: p.lat,
        lng: p.lng,
        order_index: p.order_index ?? i,
        description: p.translations.en?.description,
      })),
    })),
  };
}
