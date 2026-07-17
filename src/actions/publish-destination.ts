"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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

    if (existing) {
      // Update existing destination
      const { error } = await supabase
        .from("destinations")
        .update({ tags: data.destination.tags, published: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) throw error;
      destinationId = existing.id;

      // Delete old places and re-insert fresh ones
      await supabase.from("places").delete().eq("destination_id", existing.id);
    } else {
      // Insert new destination
      const { data: newDest, error } = await supabase
        .from("destinations")
        .insert({
          country: data.destination.country,
          city: data.destination.city,
          tags: data.destination.tags,
          published: true,
        })
        .select("id")
        .single();

      if (error) throw error;
      destinationId = newDest.id;
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

    return { success: true, destinationId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Грешка при публикуване: ${msg}` };
  }
}
