import { revalidatePath, revalidateTag } from "next/cache";

/** Invalidate cached passport + related public surfaces after mutations. */
export function revalidatePassport(userId?: string | null) {
  if (userId) {
    revalidateTag(`passport-${userId}`);
  }
  revalidateTag("passport");
  revalidateTag("discovery-feed");
  revalidatePath("/[locale]/my-passport", "page");
  revalidatePath("/[locale]/discover", "page");
  revalidatePath("/[locale]/traveler", "layout");
}
