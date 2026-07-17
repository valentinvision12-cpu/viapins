"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteAdventureByCountry } from "@/lib/adventure-data";

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

export async function deleteCountryAction(country: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: destinations } = await supabase
      .from("destinations")
      .select("id")
      .ilike("country", country);

    const ids = (destinations ?? []).map((d) => d.id);
    if (ids.length > 0) {
      await supabase.from("places").delete().in("destination_id", ids);
      await supabase.from("destinations").delete().in("id", ids);
    }

    await deleteAdventureByCountry(country);

    revalidatePath("/admin/destinations");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/[locale]", "layout");
    revalidatePath(`/[locale]/explore/${toSlug(country)}/adventure`, "page");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при изтриване.",
    };
  }
}
