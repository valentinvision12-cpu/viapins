/**
 * Adventure collections — всичко идва от Supabase (като градовете).
 * Качва се през Admin → Seed Import, не от отделни файлове.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AdventureCollection, AdventurePlace } from "./adventure-types";

type AdventureRow = {
  country: string;
  slug: string;
  title: string;
  subtitle: string;
  hero_image: string | null;
  wiki_title: string | null;
  total_days: number;
  seo: AdventureCollection["seo"];
  places: AdventurePlace[];
  published: boolean;
};

function mapRow(row: AdventureRow): AdventureCollection {
  return {
    country: row.country,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    heroImage: row.hero_image ?? "",
    wiki_title: row.wiki_title ?? undefined,
    totalDays: row.total_days,
    seo: row.seo ?? {},
    published: row.published,
    places: row.places ?? [],
  };
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !!url && !url.includes("placeholder");
}

export async function getAdventureCollection(
  countrySlug: string,
  { includeUnpublished = false } = {}
): Promise<AdventureCollection | null> {
  if (!supabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("adventure_collections")
    .select("*")
    .eq("slug", countrySlug.toLowerCase());

  if (!includeUnpublished) {
    query = query.eq("published", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return mapRow(data as AdventureRow);
}

export async function hasAdventureMode(countrySlug: string): Promise<boolean> {
  const c = await getAdventureCollection(countrySlug);
  return c !== null && c.places.length > 0;
}

export async function getAdventureCountrySlugs(): Promise<string[]> {
  if (!supabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("adventure_collections")
    .select("slug")
    .eq("published", true);

  return (data ?? []).map((r) => r.slug as string);
}

export async function getAdventureSummaries(): Promise<
  Pick<
    AdventureCollection,
    "country" | "slug" | "title" | "subtitle" | "totalDays" | "places" | "heroImage"
  >[]
> {
  if (!supabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("adventure_collections")
    .select("country, slug, title, subtitle, total_days, places, hero_image")
    .eq("published", true);

  return (data ?? []).map((row) => ({
    country: row.country as string,
    slug: row.slug as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    totalDays: row.total_days as number,
    places: (row.places as AdventurePlace[]) ?? [],
    heroImage: (row.hero_image as string | null) ?? "",
  }));
}

/** Записва adventure в Supabase (извиква се от seed import) */
export async function saveAdventureCollection(
  collection: AdventureCollection,
  published = true
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("adventure_collections").upsert(
    {
      country: collection.country,
      slug: collection.slug,
      title: collection.title,
      subtitle: collection.subtitle,
      hero_image: collection.heroImage,
      wiki_title: collection.wiki_title ?? null,
      total_days: collection.totalDays,
      seo: collection.seo ?? {},
      places: collection.places,
      published,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );
  if (error) throw error;
}

export async function deleteAdventureByCountry(country: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("adventure_collections")
    .delete()
    .ilike("country", country);
  if (error) throw error;
}

export type { AdventureCollection, AdventurePlace, AdventureTag } from "./adventure-types";
