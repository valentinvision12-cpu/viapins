"use server";

import fs from "fs";
import path from "path";
import { revalidateTag } from "next/cache";
import type { AffiliateConfig } from "@/lib/affiliates";

const CONFIG_PATH = path.join(process.cwd(), "affiliate-config.json");

export async function saveAffiliateConfig(
  config: AffiliateConfig
): Promise<{ success: boolean; error?: string }> {
  const normalized: AffiliateConfig = {
    ...config,
    min_places: Math.max(1, Math.min(20, config.min_places || 2)),
    partners: [...config.partners].sort((a, b) => a.sort_order - b.sort_order),
  };

  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write affiliate-config.json:", e);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.from("site_settings").upsert({
        id: 1,
        affiliate_config: normalized,
      });
    } catch {
      // file save is enough for dev
    }
  }

  revalidateTag("affiliate-config");

  return { success: true };
}
