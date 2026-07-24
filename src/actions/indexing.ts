"use server";

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminAuthBypassEnabled } from "@/lib/site-brand";
import {
  indexingStatusSnapshot,
  notifyEntireSite,
  notifySearchEngines,
  saveIndexingPrefs,
  saveIndexNowKeyToDb,
  type IndexingPrefs,
  type NotifyResult,
} from "@/lib/search-engines";

export type ActionResult =
  | { success: true; message?: string; key?: string; result?: NotifyResult }
  | { success: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (adminAuthBypassEnabled()) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Не сте влезли" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return { ok: false, error: "Нямате админ права" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Auth грешка" };
  }
}

function setEnvKey(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  return regex.test(content) ? content.replace(regex, line) : `${content}\n${line}`;
}

function writeEnvKeys(pairs: Record<string, string>): { success: true } | { success: false; error: string } {
  const envPath = join(process.cwd(), ".env.local");
  let current = "";
  try {
    current = readFileSync(envPath, "utf-8");
  } catch {
    current = "";
  }

  let updated = current;
  for (const [key, value] of Object.entries(pairs)) {
    updated = setEnvKey(updated, key, value);
  }

  try {
    writeFileSync(envPath, updated, "utf-8");
    return { success: true };
  } catch {
    return { success: false, error: "Неуспешно записване на .env.local" };
  }
}

export async function getIndexingAdminStateAction() {
  // Never block the admin page on a full-site URL scan.
  return indexingStatusSnapshot({ skipUrlCount: true });
}

export async function saveIndexingPrefsAction(
  prefs: Partial<IndexingPrefs>
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const result = await saveIndexingPrefs(prefs);
  if (!result.success) {
    return { success: false, error: result.error ?? "Грешка" };
  }
  revalidatePath("/admin/indexing");
  return { success: true, message: "Настройките са записани" };
}

export async function saveIndexNowKeyAction(opts: {
  key?: string;
  generate?: boolean;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  let key = (opts.key ?? "").trim();
  if (opts.generate || !key) {
    key = crypto.randomUUID();
  }

  // IndexNow keys: hex or UUID-like; keep alphanumeric + dashes
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
    return {
      success: false,
      error: "Ключът трябва да е 8–128 символа (букви, цифри, тире)",
    };
  }

  const written = writeEnvKeys({ INDEXNOW_KEY: key });
  // Always persist to DB too (works on Vercel; env write is local-only)
  const db = await saveIndexNowKeyToDb(key);
  if (!written.success && !db.success) {
    return {
      success: false,
      error: db.error ?? written.error ?? "Неуспешен запис",
    };
  }

  process.env.INDEXNOW_KEY = key;
  revalidatePath("/admin/indexing");
  revalidatePath("/indexnow-key.txt");

  return {
    success: true,
    key,
    message: written.success
      ? "INDEXNOW_KEY записан (.env.local + DB). Рестартирай локалния сървър."
      : "INDEXNOW_KEY записан в DB (Vercel-ready). За production Google ключовете сложи в Vercel Env.",
  };
}

export async function generateIndexNowKeyAction(): Promise<ActionResult> {
  return saveIndexNowKeyAction({ generate: true });
}

export async function saveGoogleIndexingCredentialsAction(opts: {
  serviceAccountJson: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const raw = opts.serviceAccountJson.trim();
  if (!raw) {
    return { success: false, error: "Постави service account JSON" };
  }

  let parsed: {
    client_email?: string;
    private_key?: string;
  };
  try {
    parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
  } catch {
    return { success: false, error: "Невалиден JSON" };
  }

  const email = parsed.client_email?.trim();
  const privateKey = parsed.private_key?.trim();
  if (!email || !privateKey) {
    return {
      success: false,
      error: "JSON трябва да съдържа client_email и private_key",
    };
  }

  // Escape newlines for .env.local single-line value
  const escapedKey = privateKey.replace(/\r?\n/g, "\\n");

  const written = writeEnvKeys({
    GOOGLE_INDEXING_CLIENT_EMAIL: email,
    GOOGLE_INDEXING_PRIVATE_KEY: `"${escapedKey}"`,
  });
  if (!written.success) return written;

  process.env.GOOGLE_INDEXING_CLIENT_EMAIL = email;
  process.env.GOOGLE_INDEXING_PRIVATE_KEY = privateKey;
  revalidatePath("/admin/indexing");

  return {
    success: true,
    message:
      "Google credentials записани. Рестартирай сървъра. Добави service account като Owner в Search Console.",
  };
}

export async function submitUrlsAction(urls: string[]): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { success: false, error: "Няма URL-и" };
  }

  try {
    const result = await notifySearchEngines(cleaned, {
      force: true,
      source: "admin-manual",
    });
    revalidatePath("/admin/indexing");
    return {
      success: true,
      result,
      message: `Изпратени ${result.urlCount} URL-а`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function submitEntireSiteAction(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const result = await notifyEntireSite({
      force: true,
      source: "admin-entire-site",
    });
    revalidatePath("/admin/indexing");
    return {
      success: true,
      result,
      message: `Целият сайт: ${result.urlCount} URL-а (Google е ограничен заради квота)`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
