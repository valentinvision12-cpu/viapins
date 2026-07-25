"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminAuthBypassEnabled } from "@/lib/site-brand";
import {
  getLinkingBatchState,
  listThinPlaces,
  runInternalLinkingChunk,
  type LinkingBatchState,
  type ThinPlaceRow,
} from "@/lib/seo/seo-growth";
import {
  sampleSchemaByType,
  validateSchemaForUrl,
  type SchemaValidateResult,
} from "@/lib/seo/schema-validate";
import type { SchemaPageType } from "@/lib/schema/types";

export type SeoActionResult<T = undefined> =
  | { success: true; message?: string; data?: T }
  | { success: false; error: string; data?: T };

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
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

export async function getSeoDashboardStateAction(): Promise<{
  linkingBatch: LinkingBatchState;
}> {
  const linkingBatch = await getLinkingBatchState();
  return { linkingBatch };
}

export async function runLinkingBatchChunkAction(opts?: {
  reset?: boolean;
  chunkSize?: number;
}): Promise<SeoActionResult<LinkingBatchState>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const data = await runInternalLinkingChunk({
      reset: opts?.reset,
      chunkSize: opts?.chunkSize,
    });
    revalidatePath("/admin/seo");
    return {
      success: true,
      data,
      message: data.lastMessage ?? data.lastError,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listThinPlacesAction(opts?: {
  limit?: number;
  offset?: number;
}): Promise<
  SeoActionResult<{ items: ThinPlaceRow[]; hasMore: boolean; offset: number }>
> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const data = await listThinPlaces(opts);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function validateSchemaUrlAction(
  urlOrPath: string
): Promise<SeoActionResult<SchemaValidateResult>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const data = await validateSchemaForUrl(urlOrPath);
    if (data.error && !data.jsonLd) {
      return { success: false, error: data.error, data };
    }
    return {
      success: true,
      data,
      message: data.ok ? "JSON-LD валиден" : "JSON-LD с предупреждения",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function validateSchemaSampleAction(
  pageType: SchemaPageType
): Promise<SeoActionResult<SchemaValidateResult>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const data = sampleSchemaByType(pageType);
  return { success: true, data };
}
