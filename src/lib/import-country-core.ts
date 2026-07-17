/**
 * Споделена логика за импорт на държава → Supabase.
 * Използва се от admin UI, server actions и CLI script (Cursor agent).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enrichTravelSeed,
  seedStats,
  validateTravelSeed,
  type EnrichedSeedCity,
  type TravelSeedFile,
} from "@/lib/travel-seed";
import { pickCityCoverFromPlaces } from "@/lib/city-cover";
import {
  enrichAdventureSeed,
  adventureSeedStats,
} from "@/lib/adventure-seed";
import type { AdventureCollection } from "@/lib/adventure-types";

export type ImportCountryResult =
  | {
      success: true;
      imported: number;
      total: number;
      country: string;
      stats: ReturnType<typeof seedStats>;
      adventure?: ReturnType<typeof adventureSeedStats>;
      cities: { city: string; placeCount: number; destinationId: string }[];
    }
  | { success: false; error: string };

async function upsertDestination(
  supabase: SupabaseClient,
  country: string,
  city: EnrichedSeedCity,
  published: boolean
): Promise<{ destinationId: string }> {
  const { city: cityName, tags, places, seo } = city;

  const { data: existing } = await supabase
    .from("destinations")
    .select("id")
    .ilike("city", cityName)
    .ilike("country", country)
    .maybeSingle();

  let destinationId: string;

  const baseFields = {
    tags,
    published,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { count: existingCount } = await supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("destination_id", existing.id);

    if (
      (existingCount ?? 0) > 0 &&
      places.length < 10 &&
      places.length < (existingCount ?? 0)
    ) {
      console.warn(
        `  ⚠ ${cityName}: skip import ${places.length}/${existingCount} places — would lose data`
      );
      return { destinationId: existing.id };
    }

    let { error } = await supabase
      .from("destinations")
      .update({ ...baseFields, seo })
      .eq("id", existing.id);

    if (error?.code === "PGRST204" && error.message?.includes("seo")) {
      ({ error } = await supabase
        .from("destinations")
        .update(baseFields)
        .eq("id", existing.id));
    }
    if (error) throw error;
    destinationId = existing.id;
    await supabase.from("places").delete().eq("destination_id", existing.id);
  } else {
    let { data: newDest, error } = await supabase
      .from("destinations")
      .insert({ country, city: cityName, tags, seo, published })
      .select("id")
      .single();

    if (error?.code === "PGRST204" && error.message?.includes("seo")) {
      ({ data: newDest, error } = await supabase
        .from("destinations")
        .insert({ country, city: cityName, tags, published })
        .select("id")
        .single());
    }
    if (error) throw error;
    destinationId = newDest!.id;
  }

  const { error: placesError } = await supabase.from("places").insert(
    places.map((place) => ({
      destination_id: destinationId,
      name: place.name,
      translations: place.translations,
      image_url: place.image_url,
      lat: place.lat,
      lng: place.lng,
      order_index: place.order_index,
    }))
  );
  if (placesError) throw placesError;

  const coverImage = pickCityCoverFromPlaces(
    places.map((p) => ({
      name: p.name,
      image_url: p.image_url,
      order_index: p.order_index,
    }))
  );
  if (coverImage) {
    const { error: coverErr } = await supabase
      .from("destinations")
      .update({ cover_image: coverImage, updated_at: new Date().toISOString() })
      .eq("id", destinationId);
    if (coverErr?.code !== "PGRST204") {
      if (coverErr) throw coverErr;
    }
  }

  return { destinationId };
}

export async function saveAdventureCollection(
  supabase: SupabaseClient,
  collection: AdventureCollection,
  published: boolean,
  options?: { strict?: boolean }
): Promise<void> {
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
  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("adventure_collections")) {
      const msg =
        "Липсва таблица adventure_collections. Пусни supabase/migrations/006_adventure_collections.sql в Supabase SQL Editor.";
      if (options?.strict) throw new Error(msg);
      console.warn(`[import] ${msg}`);
      return;
    }
    throw error;
  }
}

export type ImportAdventureResult =
  | { success: true; country: string; slug: string; stopCount: number }
  | { success: false; error: string };

/** Качва само adventure секция от seed файл → adventure_collections */
export async function importAdventureFromSeedFile(
  supabase: SupabaseClient,
  rawJson: string,
  onProgress?: (msg: string) => void
): Promise<ImportAdventureResult> {
  let seed: TravelSeedFile;
  try {
    seed = validateTravelSeed(JSON.parse(rawJson) as unknown);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Невалиден JSON.",
    };
  }

  if (!seed.adventure) {
    return {
      success: false,
      error: `${seed.country}: липсва "adventure" секция в seed файла.`,
    };
  }

  try {
    onProgress?.(`Adventure: ${seed.country}…`);
    const collection = await enrichAdventureSeed(seed.adventure, seed.country);
    await saveAdventureCollection(supabase, collection, seed.published !== false, {
      strict: true,
    });
    return {
      success: true,
      country: collection.country,
      slug: collection.slug,
      stopCount: collection.places.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Грешка при import.";
    if (msg.includes("adventure_collections") || msg.includes("PGRST205")) {
      return {
        success: false,
        error:
          "Липсва таблица adventure_collections. Пусни supabase/migrations/006_adventure_collections.sql в SQL Editor.",
      };
    }
    return { success: false, error: msg };
  }
}

export async function importCountrySeed(
  supabase: SupabaseClient,
  rawJson: string,
  onProgress?: (msg: string) => void
): Promise<ImportCountryResult> {
  let seed: TravelSeedFile;
  try {
    seed = validateTravelSeed(JSON.parse(rawJson) as unknown);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Невалиден JSON.",
    };
  }

  try {
    onProgress?.(`Обогатяване: ${seed.country}…`);
    const stats = seedStats(seed);
    const advStats = seed.adventure
      ? adventureSeedStats(seed.adventure)
      : undefined;
    const enriched = await enrichTravelSeed(seed, onProgress);

    const cities: { city: string; placeCount: number; destinationId: string }[] =
      [];

    for (const city of enriched.cities) {
      onProgress?.(`Запис: ${city.city}…`);
      const { destinationId } = await upsertDestination(
        supabase,
        enriched.country,
        city,
        enriched.published
      );
      cities.push({
        city: city.city,
        placeCount: city.places.length,
        destinationId,
      });
    }

    if (seed.adventure) {
      onProgress?.("Adventure маршрут…");
      const collection = await enrichAdventureSeed(
        seed.adventure,
        enriched.country
      );
      await saveAdventureCollection(supabase, collection, enriched.published);
    }

    return {
      success: true,
      imported: cities.length,
      total: stats.cityCount,
      country: enriched.country,
      stats,
      adventure: advStats,
      cities,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Грешка при импорт.";
    console.error("[import-country-core]", err);
    return { success: false, error: msg };
  }
}
