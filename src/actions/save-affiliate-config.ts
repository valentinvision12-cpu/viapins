"use server";

import fs from "fs";
import path from "path";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const canUseDb = supabaseUrl && !supabaseUrl.includes("placeholder");

  if (canUseDb) {
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").upsert({
      id: 1,
      affiliate_config: normalized,
    });

    if (error) {
      return {
        success: false,
        error: error.message.includes("affiliate_config")
          ? "Липсва колона affiliate_config в Supabase. Пусни migration 016_affiliate_config.sql."
          : error.message,
      };
    }
  } else if (process.env.NODE_ENV === "development") {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2), "utf-8");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not write affiliate-config.json";
      return { success: false, error: message };
    }
  } else {
    return { success: false, error: "Supabase не е конфигуриран за production." };
  }

  revalidateTag("affiliate-config");
  return { success: true };
}
