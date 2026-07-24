import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitIndexNow } from "@/lib/search-engines";
import { adminAuthBypassEnabled } from "@/lib/site-brand";

type IndexNowBody = {
  urls?: unknown;
};

async function isAuthorized(request: Request): Promise<boolean> {
  if (adminAuthBypassEnabled()) return true;

  const secret =
    process.env.INDEXING_API_SECRET?.trim() ||
    process.env.INDEXNOW_SUBMIT_SECRET?.trim();
  const authHeader = request.headers.get("authorization")?.trim();
  if (secret && authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === secret) return true;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    return Boolean(profile?.is_admin);
  } catch {
    return false;
  }
}

/**
 * POST /api/indexnow
 * Body: { urls: string[] }
 * Auth: Bearer INDEXING_API_SECRET | INDEXNOW_SUBMIT_SECRET, or admin session.
 */
export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IndexNowBody;
  try {
    body = (await request.json()) as IndexNowBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json(
      { error: "urls must be a non-empty string array" },
      { status: 400 }
    );
  }

  const urls = body.urls.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0
  );
  if (urls.length === 0) {
    return NextResponse.json(
      { error: "urls must be a non-empty string array" },
      { status: 400 }
    );
  }

  const result = await submitIndexNow(urls);
  if (!result.ok) {
    const status = result.error?.includes("not configured") ? 503 : 502;
    return NextResponse.json(
      {
        error: result.error ?? "IndexNow submission failed",
        submitted: result.submitted ?? 0,
      },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    submitted: result.submitted ?? urls.length,
  });
}
