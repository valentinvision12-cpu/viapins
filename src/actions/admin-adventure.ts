"use server";

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { importAdventureFromSeedFile } from "@/lib/import-country-core";
import type { AdventureCollection } from "@/lib/adventure-types";
import {
  notifySearchEnginesBackground,
  urlsForAdventure,
} from "@/lib/search-engines";

export type AdminAdventureRow = {
  country: string;
  slug: string;
  title: string;
  subtitle: string;
  published: boolean;
  stopCount: number;
  totalDays: number;
};

type AdventureDb = SupabaseClient;

function adventureDb(client: NonNullable<ReturnType<typeof createServiceClient>>): AdventureDb {
  return client as AdventureDb;
}

type AdventureCollectionDbRow = {
  country: string;
  slug: string;
  title: string;
  subtitle: string;
  published: boolean;
  total_days: number | null;
  places: unknown;
  hero_image?: string | null;
  wiki_title?: string | null;
  seo?: AdventureCollection["seo"] | null;
};

export async function getAdventuresForAdmin(): Promise<AdminAdventureRow[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("adventure_collections")
    .select("country, slug, title, subtitle, published, total_days, places")
    .order("country");

  if (error) return [];

  const rows = (data ?? []) as AdventureCollectionDbRow[];
  return rows.map((a) => ({
    country: a.country,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    published: a.published,
    stopCount: Array.isArray(a.places) ? a.places.length : 0,
    totalDays: a.total_days ?? 10,
  }));
}

export async function getAdventureForAdmin(
  slug: string
): Promise<(AdventureCollection & { published: boolean }) | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("adventure_collections")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;

  const row = data as AdventureCollectionDbRow;
  return {
    country: row.country,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    heroImage: row.hero_image ?? "",
    wiki_title: row.wiki_title ?? undefined,
    totalDays: row.total_days ?? 10,
    seo: row.seo ?? {},
    places: (Array.isArray(row.places) ? row.places : []) as AdventureCollection["places"],
    published: row.published,
  };
}

export async function toggleAdventurePublishedAction(
  slug: string,
  currentlyPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) throw new Error("Няма service key");
    const { error } = await adventureDb(supabase)
      .from("adventure_collections")
      .update({ published: !currentlyPublished, updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (error) throw error;
    revalidatePath("/admin/adventures");
    revalidatePath(`/admin/adventures/${slug}`);
    revalidatePath("/");

    try {
      const urls = urlsForAdventure(slug.toLowerCase());
      notifySearchEnginesBackground(urls, {
        source: "toggle-adventure",
        type: currentlyPublished ? "URL_DELETED" : "URL_UPDATED",
      });
    } catch (err) {
      console.error("[indexing] toggle-adventure notify", err);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка",
    };
  }
}

/** Качва adventure от data/seeds/{slug}.json → Supabase */
export async function importAdventureFromSeedAction(
  seedSlug: string
): Promise<{ success: boolean; error?: string; stopCount?: number }> {
  try {
    const path = join(process.cwd(), "data", "seeds", `${seedSlug.toLowerCase()}.json`);
    if (!existsSync(path)) {
      return { success: false, error: `Липсва data/seeds/${seedSlug}.json` };
    }

    const supabase = createServiceClient();
    if (!supabase) throw new Error("Липсва SUPABASE_SERVICE_ROLE_KEY");

    const raw = readFileSync(path, "utf8");
    const result = await importAdventureFromSeedFile(supabase, raw);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/admin/adventures");
    revalidatePath(`/admin/adventures/${result.slug}`);
    revalidatePath("/");
    revalidatePath("/[locale]/adventures", "page");

    try {
      const urls = urlsForAdventure(result.slug.toLowerCase());
      notifySearchEnginesBackground(urls, {
        source: "import-adventure",
        type: "URL_UPDATED",
      });
    } catch (err) {
      console.error("[indexing] import-adventure notify", err);
    }

    return { success: true, stopCount: result.stopCount };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при import",
    };
  }
}

export async function updateAdventureStopNameAction(
  slug: string,
  stopIndex: number,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) throw new Error("Няма service key");

    const { data } = await supabase
      .from("adventure_collections")
      .select("places")
      .eq("slug", slug)
      .single();

    const row = data as { places: unknown } | null;
    if (!row?.places || !Array.isArray(row.places)) {
      return { success: false, error: "Adventure не е намерен." };
    }

    const places = [...row.places];
    if (stopIndex < 0 || stopIndex >= places.length) {
      return { success: false, error: "Невалиден индекс." };
    }
    places[stopIndex] = { ...places[stopIndex], name: name.trim() };

    const { error } = await adventureDb(supabase)
      .from("adventure_collections")
      .update({ places, updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (error) throw error;

    revalidatePath(`/admin/adventures/${slug}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка",
    };
  }
}

export async function updateAdventureStopMapsAction(
  slug: string,
  stopIndex: number,
  mapsUrl: string,
  mapsQuery: string
): Promise<{ success: boolean; error?: string }> {
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    return { success: false, error: "Линкът трябва да започва с http:// или https://" };
  }

  try {
    const supabase = createServiceClient();
    if (!supabase) throw new Error("Няма service key");

    const { data } = await supabase
      .from("adventure_collections")
      .select("places")
      .eq("slug", slug)
      .single();

    const row = data as { places: unknown } | null;
    if (!row?.places || !Array.isArray(row.places)) {
      return { success: false, error: "Adventure не е намерен." };
    }

    const places = [...row.places];
    if (stopIndex < 0 || stopIndex >= places.length) {
      return { success: false, error: "Невалиден индекс." };
    }

    const stop = { ...places[stopIndex] };
    const translations = { ...(stop.translations ?? {}) };
    for (const loc of ["en", "es", "fr", "de", "it"]) {
      const entry = { ...(translations[loc] ?? {}) };
      if (mapsUrl.trim()) entry.maps_url = mapsUrl.trim();
      else delete entry.maps_url;
      if (mapsQuery.trim()) entry.maps_query = mapsQuery.trim();
      else delete entry.maps_query;
      translations[loc] = entry;
    }
    stop.translations = translations;
    places[stopIndex] = stop;

    const { error } = await adventureDb(supabase)
      .from("adventure_collections")
      .update({ places, updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (error) throw error;

    revalidatePath(`/admin/adventures/${slug}`);
    revalidatePath("/[locale]/explore/[country]/adventure", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка",
    };
  }
}
