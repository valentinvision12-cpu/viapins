"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import {
  notifySearchEnginesBackground,
  urlsForCityPage,
  urlsForDestination,
} from "@/lib/search-engines";

export async function togglePublishedAction(
  destinationId: string,
  currentValue: boolean
) {
  const supabase = await createClient();

  const { data: dest } = await supabase
    .from("destinations")
    .select("id, country, city, country_slug, city_slug, places(id, name)")
    .eq("id", destinationId)
    .maybeSingle();

  const nextPublished = !currentValue;

  const { error } = await supabase
    .from("destinations")
    .update({ published: nextPublished, updated_at: new Date().toISOString() })
    .eq("id", destinationId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/destinations");
  revalidatePath("/admin");

  try {
    if (!dest) return;

    const countrySlug =
      (dest as { country_slug?: string | null }).country_slug?.trim() ||
      slugify((dest as { country: string }).country);
    const citySlug =
      (dest as { city_slug?: string | null }).city_slug?.trim() ||
      slugify((dest as { city: string }).city);

    if (!countrySlug || !citySlug) return;

    if (nextPublished) {
      const places = (
        dest as { places?: Array<{ id: string; name: string }> | null }
      ).places;
      const urls = urlsForDestination({
        countrySlug,
        citySlug,
        placeNames: (places ?? []).map((p) => p.name),
        placeIds: (places ?? []).map((p) => p.id),
      });
      notifySearchEnginesBackground(urls, {
        source: "toggle-published",
        type: "URL_UPDATED",
      });
    } else {
      const urls = urlsForCityPage(countrySlug, citySlug);
      notifySearchEnginesBackground(urls, {
        source: "toggle-unpublished",
        type: "URL_DELETED",
      });
    }
  } catch (err) {
    console.error("[indexing] toggle-published notify", err);
  }
}
