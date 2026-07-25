import { createHash } from "crypto";
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
  type?: "pageview" | "heartbeat" | "leave";
};

const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function sanitizePath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  const path = raw.split("?")[0].split("#")[0].slice(0, 300);
  if (path.startsWith("/admin") || path.startsWith("/api")) return "";
  return path || "/";
}

/** One person ≈ one IP + browser UA. */
function netKeyFromRequest(req: NextRequest, ua: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown";
  return createHash("sha256")
    .update(`${ip}|${ua.slice(0, 80)}`)
    .digest("hex")
    .slice(0, 32);
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

  const type =
    body.type === "heartbeat"
      ? "heartbeat"
      : body.type === "leave"
        ? "leave"
        : "pageview";

  const ua = (req.headers.get("user-agent") || "").slice(0, 240);
  const netKey = netKeyFromRequest(req, ua);

  if (type === "leave") {
    await supabase.from("visitor_presence").delete().eq("session_id", sessionId);
    if (ua) {
      await supabase.from("visitor_presence").delete().eq("user_agent", ua);
    }
    return NextResponse.json({ ok: true });
  }

  const path = sanitizePath(body.path);
  if (!path) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const locale =
    typeof body.locale === "string" ? body.locale.slice(0, 8) : null;
  const referrer =
    typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
  const { countryCode, city } = countryFromHeaders(req.headers);
  const now = new Date().toISOString();

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

  // Drop older duplicate live rows from the same IP+browser (old per-tab ids).
  // Prefer net_key when migration 019 is applied; always also collapse by UA.
  if (ua) {
    await supabase
      .from("visitor_presence")
      .delete()
      .eq("user_agent", ua)
      .neq("session_id", sessionId);
  } else {
    await supabase
      .from("visitor_presence")
      .delete()
      .eq("net_key", netKey)
      .neq("session_id", sessionId);
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
      net_key: netKey,
      last_seen: now,
    },
    { onConflict: "session_id" }
  );

  // If net_key column missing, retry without it so analytics keeps working.
  if (presenceErr?.message?.includes("net_key")) {
    const { error: retryErr } = await supabase.from("visitor_presence").upsert(
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
    if (retryErr) {
      console.error("[analytics/collect] presence", retryErr.message);
    }
  } else if (presenceErr) {
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
