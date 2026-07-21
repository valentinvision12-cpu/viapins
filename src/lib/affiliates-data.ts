import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import {
  DEFAULT_AFFILIATE_CONFIG,
  parseAffiliateConfig,
  type AffiliateConfig,
} from "@/lib/affiliates";

const CONFIG_PATH = path.join(process.cwd(), "affiliate-config.json");

async function loadAffiliateConfigUncached(): Promise<AffiliateConfig> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return parseAffiliateConfig(JSON.parse(raw));
    }
  } catch {
    // fall through
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return DEFAULT_AFFILIATE_CONFIG;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("affiliate_config")
      .eq("id", 1)
      .single();

    if (!data?.affiliate_config) return DEFAULT_AFFILIATE_CONFIG;
    return parseAffiliateConfig(data.affiliate_config);
  } catch {
    return DEFAULT_AFFILIATE_CONFIG;
  }
}

export const getAffiliateConfig = unstable_cache(
  loadAffiliateConfigUncached,
  ["affiliate-config"],
  { revalidate: 120, tags: ["affiliate-config"] }
);
