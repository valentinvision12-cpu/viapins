"use server";

import { generateDestinationAction } from "@/actions/generate-destination";
import { publishDestinationAction } from "@/actions/publish-destination";
import { revalidatePath } from "next/cache";

export type ReplaceResult =
  | { success: true }
  | { success: false; error: string };

/** Генерира отново Топ 10 за град и заменя в Supabase */
export async function replaceDestinationAction(
  city: string,
  country: string
): Promise<ReplaceResult> {
  const generated = await generateDestinationAction(city, country);
  if (!generated.success) {
    return { success: false, error: generated.error };
  }

  const published = await publishDestinationAction(generated.data);
  if (!published.success) {
    return { success: false, error: published.error };
  }

  revalidatePath("/admin/destinations");
  revalidatePath("/");
  revalidatePath("/[locale]", "layout");

  return { success: true };
}
