import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsSnapshot } from "@/lib/analytics/stats";
import { adminAuthBypassEnabled } from "@/lib/site-brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertAdmin(): Promise<boolean> {
  if (adminAuthBypassEnabled()) return true;
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
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getAnalyticsSnapshot();
  return NextResponse.json(snapshot);
}
