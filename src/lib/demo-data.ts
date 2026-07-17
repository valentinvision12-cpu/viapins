/**
 * Demo destinations — fallback when Supabase has no published data.
 * Add real destinations via Admin panel → they will appear automatically.
 */

export interface DemoPlace {
  id: string;
  name: string;
  image_url: string;
  wiki_title?: string;
  lat: number;
  lng: number;
  order_index: number;
  translations: {
    en: { description: string; wiki_text: string };
    es: { description: string; wiki_text: string };
    fr: { description: string; wiki_text: string };
    de: { description: string; wiki_text: string };
    it: { description: string; wiki_text: string };
  };
}

export interface DemoDestination {
  id: string;
  city: string;
  country: string;
  tags: string[];
  cityImage: string;
  wiki_title?: string;
  places: DemoPlace[];
}

export const DEMO_DESTINATIONS: DemoDestination[] = [];

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

export function getDemoDestination(
  countrySlug: string,
  citySlug: string
): DemoDestination | null {
  return (
    DEMO_DESTINATIONS.find(
      (d) => toSlug(d.country) === countrySlug && toSlug(d.city) === citySlug
    ) ?? null
  );
}
