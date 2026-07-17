"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { DestinationDetail } from "@/actions/get-destinations";
import { pickCityCoverFromPlaces } from "@/lib/city-cover";

async function adminDb(): Promise<SupabaseClient> {
  return (createServiceClient() ?? (await createClient())) as SupabaseClient;
}

export async function getDestinationForAdmin(
  id: string
): Promise<DestinationDetail | null> {
  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("destinations")
    .select(
      `id, city, country, tags, published,
       places(id, name, image_url, lat, lng, order_index, translations)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as {
    id: string;
    city: string;
    country: string;
    tags: string[] | null;
    places?: DestinationDetail["places"];
  };
  const places = (row.places ?? []) as DestinationDetail["places"];
  const sortedPlaces = [...places].sort((a, b) => a.order_index - b.order_index);
  return {
    id: row.id,
    city: row.city,
    country: row.country,
    tags: row.tags ?? [],
    coverImage: pickCityCoverFromPlaces(sortedPlaces),
    seo: {},
    places: sortedPlaces,
  };
}

export async function updatePlaceNameAction(
  placeId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (!name.trim()) return { success: false, error: "Името не може да е празно." };
  try {
    const supabase = await adminDb();
    const { error } = await supabase
      .from("places")
      .update({ name: name.trim() })
      .eq("id", placeId);
    if (error) throw error;
    revalidatePath("/admin/destinations");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при запис.",
    };
  }
}

export async function deletePlaceAction(
  placeId: string,
  destinationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await adminDb();
    const { error } = await supabase.from("places").delete().eq("id", placeId);
    if (error) throw error;
    revalidatePath(`/admin/destinations/${destinationId}`);
    revalidatePath("/admin/destinations");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при изтриване.",
    };
  }
}

const MAPS_LOCALES = ["en", "es", "fr", "de", "it"] as const;

type PlaceTranslations = Record<
  string,
  {
    description?: string;
    wiki_text?: string;
    wiki_title?: string;
    maps_query?: string;
    maps_url?: string;
    [key: string]: unknown;
  }
>;

function mergeMapsIntoTranslations(
  translations: PlaceTranslations,
  mapsUrl: string,
  mapsQuery: string
): PlaceTranslations {
  const next = { ...translations };
  for (const loc of MAPS_LOCALES) {
    const entry = { ...(next[loc] ?? {}) };
    if (mapsUrl) entry.maps_url = mapsUrl;
    else delete entry.maps_url;
    if (mapsQuery) entry.maps_query = mapsQuery;
    else delete entry.maps_query;
    next[loc] = entry;
  }
  return next;
}

export async function updatePlaceMapsAction(
  placeId: string,
  destinationId: string,
  mapsUrl: string,
  mapsQuery: string
): Promise<{ success: boolean; error?: string }> {
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    return { success: false, error: "Линкът трябва да започва с http:// или https://" };
  }

  try {
    const supabase = await adminDb();
    const { data: place, error: fetchError } = await supabase
      .from("places")
      .select("translations")
      .eq("id", placeId)
      .single();

    if (fetchError || !place) {
      return { success: false, error: "Мястото не е намерено." };
    }

    const translations = mergeMapsIntoTranslations(
      (place.translations ?? {}) as PlaceTranslations,
      mapsUrl.trim(),
      mapsQuery.trim()
    );

    const { error } = await supabase
      .from("places")
      .update({ translations })
      .eq("id", placeId);
    if (error) throw error;

    revalidatePath(`/admin/destinations/${destinationId}`);
    revalidatePath("/admin/destinations");
    revalidatePath("/[locale]/explore/[country]/[city]", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при запис.",
    };
  }
}

export async function updateDestinationTagsAction(
  destinationId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await adminDb();
    const { error } = await supabase
      .from("destinations")
      .update({ tags, updated_at: new Date().toISOString() })
      .eq("id", destinationId);
    if (error) throw error;
    revalidatePath(`/admin/destinations/${destinationId}`);
    revalidatePath("/admin/destinations");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка.",
    };
  }
}
