import type { TravelSeedAdventureSeo } from "./adventure-seed";

export type AdventureTag =
  | "hidden_gem"
  | "monument"
  | "nature"
  | "ruins"
  | "viewpoint"
  | "cave";

export interface AdventurePlace {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  image_url: string;
  wiki_title?: string;
  requires_car: boolean;
  tags: AdventureTag[];
  order_index: number;
  day: number;
  translations: Record<
    string,
    {
      description: string;
      wiki_text: string;
      wiki_title?: string;
      maps_query?: string;
      maps_url?: string;
      seo_keywords?: string[];
      seo_phrase?: string;
    }
  >;
}

export interface AdventureCollection {
  country: string;
  slug: string;
  title: string;
  subtitle: string;
  heroImage: string;
  wiki_title?: string;
  totalDays: number;
  seo?: TravelSeedAdventureSeo;
  published?: boolean;
  places: AdventurePlace[];
}
