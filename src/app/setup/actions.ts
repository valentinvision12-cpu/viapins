"use server";

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

export async function saveSupabaseKeys(formData: FormData) {
  const url = (formData.get("url") as string).trim();
  const anon = (formData.get("anon") as string).trim();
  const service = (formData.get("service") as string).trim();

  if (!url || !anon || !service) {
    return { success: false, error: "Всички полета са задължителни" };
  }

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return { success: false, error: "URL-ът трябва да изглежда като https://xxxx.supabase.co" };
  }

  const envPath = join(process.cwd(), ".env.local");

  let current = "";
  try { current = readFileSync(envPath, "utf-8"); } catch { current = ""; }

  // Replace or append each key
  function setKey(content: string, key: string, value: string): string {
    const regex = new RegExp(`^${key}=.*$`, "m");
    return regex.test(content)
      ? content.replace(regex, `${key}=${value}`)
      : content + `\n${key}=${value}`;
  }

  let updated = current;
  updated = setKey(updated, "NEXT_PUBLIC_SUPABASE_URL", url);
  updated = setKey(updated, "NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
  updated = setKey(updated, "SUPABASE_SERVICE_ROLE_KEY", service);

  try {
    writeFileSync(envPath, updated, "utf-8");
    return { success: true };
  } catch {
    return { success: false, error: "Неуспешно записване на .env.local" };
  }
}
