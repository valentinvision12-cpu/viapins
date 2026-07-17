import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectTo = request.headers.get("referer")?.includes("/admin")
    ? "/admin/login"
    : "/en";

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
