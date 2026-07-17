"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SiteSettingsPayload {
  hero_titles: Record<string, string>;
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export async function updateSettingsAction(payload: SiteSettingsPayload) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_titles: payload.hero_titles,
      social_links: payload.social_links,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/en");
  revalidatePath("/es");
  revalidatePath("/fr");
  revalidatePath("/de");
  revalidatePath("/it");
}
