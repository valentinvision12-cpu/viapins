"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePublishedAction(
  destinationId: string,
  currentValue: boolean
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("destinations")
    .update({ published: !currentValue, updated_at: new Date().toISOString() })
    .eq("id", destinationId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/destinations");
  revalidatePath("/admin");
}
