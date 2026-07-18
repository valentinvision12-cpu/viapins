import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase Auth redirects:
 * - Magic Link email confirmation
 * - OAuth provider callbacks (Google, etc.)
 *
 * After session exchange, redirect to /my-passport (or a custom next= param).
 */
const LOCALES = ["en", "es", "fr", "de", "it"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/my-passport";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const locale = request.cookies.get("NEXT_LOCALE")?.value ?? "en";

      // If next already has a locale prefix (e.g. /en/my-passport), use it as-is.
      // Otherwise prepend the current locale.
      const hasLocalePrefix = LOCALES.some((l) => rawNext === `/${l}` || rawNext.startsWith(`/${l}/`));
      const destination = hasLocalePrefix ? rawNext : `/${locale}${rawNext.startsWith("/") ? rawNext : `/${rawNext}`}`;

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/en?auth_error=true`);
}
