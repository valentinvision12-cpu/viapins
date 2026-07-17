import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase Auth redirects:
 * - Magic Link email confirmation
 * - OAuth provider callbacks (Google, etc.)
 *
 * After session exchange, redirect to /my-passport (or a custom next= param).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/my-passport";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the locale-prefixed target
      const locale = request.cookies.get("NEXT_LOCALE")?.value ?? "en";
      return NextResponse.redirect(`${origin}/${locale}${next}`);
    }
  }

  // Auth failed — redirect home with error indicator
  return NextResponse.redirect(`${origin}/en?auth_error=true`);
}
