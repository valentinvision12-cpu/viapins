"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteDestinationAction(destinationId: string) {
  const supabase = await createClient();

  // Places are deleted automatically via ON DELETE CASCADE
  const { error } = await supabase
    .from("destinations")
    .delete()
    .eq("id", destinationId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/destinations");
  revalidatePath("/admin");
}
