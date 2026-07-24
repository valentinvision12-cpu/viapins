import { createSign } from "crypto";
import type { IndexingChannelResult, IndexingNotifyType } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Strip wrapping quotes from .env
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

export function getGoogleIndexingCredentials(): {
  clientEmail: string;
  privateKey: string;
} | null {
  const jsonRaw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as {
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch {
      /* fall through to discrete env vars */
    }
  }

  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.trim();
  if (!clientEmail || !privateKeyRaw) return null;

  return {
    clientEmail,
    privateKey: normalizePrivateKey(privateKeyRaw),
  };
}

export function isGoogleIndexingConfigured(): boolean {
  return getGoogleIndexingCredentials() !== null;
}

async function getAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `Token HTTP ${res.status}`
    );
  }
  return data.access_token;
}

/**
 * Publish URL_UPDATED / URL_DELETED notifications via Google Indexing API.
 * Callers should cap volume (~200/day).
 */
export async function submitGoogleIndexing(
  urls: string[],
  type: IndexingNotifyType = "URL_UPDATED",
  cap?: number
): Promise<IndexingChannelResult> {
  const creds = getGoogleIndexingCredentials();
  if (!creds) {
    return { ok: false, error: "Google Indexing credentials not configured" };
  }

  const cleaned = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  if (cleaned.length === 0) {
    return { ok: false, error: "No URLs to submit" };
  }

  const limited = typeof cap === "number" ? cleaned.slice(0, cap) : cleaned;

  let token: string;
  try {
    token = await getAccessToken(creds.clientEmail, creds.privateKey);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  let submitted = 0;
  const errors: string[] = [];

  for (const url of limited) {
    try {
      const res = await fetch(INDEXING_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, type }),
      });
      if (res.ok) {
        submitted += 1;
      } else {
        const text = await res.text().catch(() => "");
        errors.push(`HTTP ${res.status}: ${text.slice(0, 160)}`);
        // Stop early on quota / auth failures
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          break;
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      break;
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
