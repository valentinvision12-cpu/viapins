import { getSiteUrl } from "@/lib/seo";
import { INDEXNOW_BATCH_SIZE, INDEXNOW_ENDPOINT } from "./config";
import { resolveIndexNowKey } from "./prefs";
import type { IndexingChannelResult } from "./types";

function resolveHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "viapins.com";
  }
}

/**
 * Submit URLs to IndexNow (Bing / Yandex / Naver / Seznam, …).
 * Batches at INDEXNOW_BATCH_SIZE.
 */
export async function submitIndexNow(
  urls: string[]
): Promise<IndexingChannelResult> {
  const key = await resolveIndexNowKey();
  if (!key) {
    return { ok: false, error: "INDEXNOW_KEY is not configured" };
  }

  const cleaned = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  if (cleaned.length === 0) {
    return { ok: false, error: "No URLs to submit" };
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const host = resolveHost(siteUrl);
  const keyLocation = `${siteUrl}/indexnow-key.txt`;

  let submitted = 0;
  const errors: string[] = [];

  for (let i = 0; i < cleaned.length; i += INDEXNOW_BATCH_SIZE) {
    const batch = cleaned.slice(i, i + INDEXNOW_BATCH_SIZE);
    const payload = {
      host,
      key,
      keyLocation,
      urlList: batch,
    };

    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      if (res.ok || res.status === 202 || res.status === 204) {
        submitted += batch.length;
      } else {
        errors.push(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (submitted === 0 && errors.length > 0) {
    return { ok: false, submitted: 0, error: errors[0] };
  }

  return {
    ok: errors.length === 0,
    submitted,
    error: errors.length ? errors[0] : undefined,
  };
}

export function isIndexNowConfigured(): boolean {
  return Boolean(process.env.INDEXNOW_KEY?.trim());
}
