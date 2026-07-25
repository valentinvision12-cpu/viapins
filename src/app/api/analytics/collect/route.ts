import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { countryFromHeaders } from "@/lib/analytics/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  sessionId?: string;
  path?: string;
  locale?: string;
  referrer?: string;
  type?: "pageview" | "heartbeat";
};

const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function sanitizePath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  const path = raw.split("?")[0].split("#")[0].slice(0, 300);
  if (path.startsWith("/admin") || path.startsWith("/api")) return "";
  return path || "/";
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!SESSION_RE.test(sessionId)) {
    return NextResponse.json({ ok: false, error: "bad session" }, { status: 400 });
  }

  const path = sanitizePath(body.path);
  if (!path) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const locale =
    typeof body.locale === "string" ? body.locale.slice(0, 8) : null;
  const referrer =
    typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
  const type = body.type === "heartbeat" ? "heartbeat" : "pageview";
  const { countryCode, city } = countryFromHeaders(req.headers);
  const ua = (req.headers.get("user-agent") || "").slice(0, 240);
  const now = new Date().toISOString();

  // Preserve existing geo when edge headers are missing (e.g. local dev).
  let resolvedCountry = countryCode;
  let resolvedCity = city;
  if (!resolvedCountry) {
    const { data: existing } = await supabase
      .from("visitor_presence")
      .select("country_code, city")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (existing?.country_code) resolvedCountry = existing.country_code;
    if (!resolvedCity && existing?.city) resolvedCity = existing.city;
  }

  const { error: presenceErr } = await supabase.from("visitor_presence").upsert(
    {
      session_id: sessionId,
      path,
      locale,
      country_code: resolvedCountry,
      city: resolvedCity,
      referrer,
      user_agent: ua || null,
      last_seen: now,
    },
    { onConflict: "session_id" }
  );

  if (presenceErr) {
    console.error("[analytics/collect] presence", presenceErr.message);
  }

  if (type === "pageview") {
    const { error: viewErr } = await supabase.from("page_views").insert({
      session_id: sessionId,
      path,
      locale,
      country_code: resolvedCountry,
      city: resolvedCity,
      referrer,
      created_at: now,
    });
    if (viewErr) {
      console.error("[analytics/collect] page_view", viewErr.message);
    }
  }

  return NextResponse.json({ ok: true });
}
