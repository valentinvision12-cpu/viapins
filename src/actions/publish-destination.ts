"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { slugify } from "@/lib/utils";
import type { GenerationResult } from "./generate-destination";

export type PublishResult =
  | { success: true; destinationId: string }
  | { success: false; error: string };

export async function publishDestinationAction(
  data: GenerationResult
): Promise<PublishResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl.includes("placeholder")) {
    return {
      success: false,
      error:
        "Supabase не е конфигуриран. Попълни NEXT_PUBLIC_SUPABASE_URL и другите ключове в .env.local и рестартирай сървъра.",
    };
  }

  try {
    const supabase = await createClient();

    // ── Check if destination already exists ──────────────────────────────────
    const { data: existing } = await supabase
      .from("destinations")
      .select("id")
      .ilike("city", data.destination.city)
      .ilike("country", data.destination.country)
      .single();

    let destinationId: string;

    const countrySlug = slugify(data.destination.country);
    const citySlug = slugify(data.destination.city);
    const coverImage =
      data.places.find((p) => p.image_url?.trim())?.image_url?.trim() ?? "";

    const slugFields = {
      country_slug: countrySlug,
      city_slug: citySlug,
      cover_image: coverImage || null,
      place_count: data.places.length,
    };

    if (existing) {
      let { error } = await supabase
        .from("destinations")
        .update({
          tags: data.destination.tags,
          published: true,
          ...slugFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      // Pre-migration schemas may lack slug/cover columns
      if (
        error &&
        (error.message.includes("country_slug") ||
          error.message.includes("cover_image") ||
          error.message.includes("place_count"))
      ) {
        const retry = await supabase
          .from("destinations")
          .update({
            tags: data.destination.tags,
            published: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        error = retry.error;
      }

      if (error) throw error;
      destinationId = existing.id;

      await supabase.from("places").delete().eq("destination_id", existing.id);
    } else {
      let { data: newDest, error } = await supabase
        .from("destinations")
        .insert({
          country: data.destination.country,
          city: data.destination.city,
          tags: data.destination.tags,
          published: true,
          ...slugFields,
        })
        .select("id")
        .single();

      if (
        error &&
        (error.message.includes("country_slug") ||
          error.message.includes("cover_image") ||
          error.message.includes("place_count"))
      ) {
        const retry = await supabase
          .from("destinations")
          .insert({
            country: data.destination.country,
            city: data.destination.city,
            tags: data.destination.tags,
            published: true,
          })
          .select("id")
          .single();
        newDest = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      destinationId = newDest!.id;
    }

    // ── Insert all places ─────────────────────────────────────────────────────
    const { error: placesError } = await supabase.from("places").insert(
      data.places.map((place) => ({
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

    revalidatePath("/admin/destinations");
    revalidatePath("/admin");
    try {
      revalidateTag("destinations");
    } catch {
      /* ignore — cache invalidation must not fail publish */
    }

    return { success: true, destinationId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Грешка при публикуване: ${msg}` };
  }
}
