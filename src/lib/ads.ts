"use server";

import fs from "fs";
import path from "path";

export interface AdConfig {
  sticky_footer: string;
  sticky_sidebar: string;
  floating_video: string;
  smart_header: string;
}

const EMPTY: AdConfig = {
  sticky_footer: "",
  sticky_sidebar: "",
  floating_video: "",
  smart_header: "",
};

const CONFIG_PATH = path.join(process.cwd(), "ads-config.json");

function parseAdScripts(raw: unknown): AdConfig {
  if (!raw || typeof raw !== "object") return EMPTY;
  const scripts = raw as Record<string, string>;
  return {
    sticky_footer: scripts.sticky_footer ?? "",
    sticky_sidebar: scripts.sticky_sidebar ?? "",
    floating_video: scripts.floating_video ?? "",
    smart_header: scripts.smart_header ?? "",
  };
}

export async function getAdConfig(): Promise<AdConfig> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...EMPTY, ...JSON.parse(raw) };
    }
  } catch {
    // fall through to Supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return EMPTY;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("ad_scripts")
      .eq("id", 1)
      .single();

    if (!data) return EMPTY;
    return parseAdScripts(data.ad_scripts);
  } catch {
    return EMPTY;
  }
}

export async function saveAdConfig(
  config: Partial<AdConfig>
): Promise<{ success: boolean; error?: string }> {
  const merged: AdConfig = { ...EMPTY, ...config };

  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write ads-config.json:", e);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.from("site_settings").upsert({
        id: 1,
        ad_scripts: merged,
      });
    } catch {
      // Supabase not configured — file save is enough for dev
    }
  }

  return { success: true };
}
