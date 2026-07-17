import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "./src/i18n/routing";

// Locale-aware routing for all public /{locale}/... paths
const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────────────────
  // Auth-only: no i18n, strict admin check
  if (pathname.startsWith("/admin")) {
    return handleAdminRoute(request);
  }

  // ── API routes ────────────────────────────────────────────────────────────
  // Just refresh the Supabase session so Server Actions can read it
  if (pathname.startsWith("/api/")) {
    return refreshSession(request, NextResponse.next({ request }));
  }

  // ── Public routes ─────────────────────────────────────────────────────────
  // Apply next-intl routing (adds locale prefix, redirects, rewrites)
  // then piggyback session refresh onto the resulting response
  const response = handleI18nRouting(request);
  return refreshSession(request, response);
}

// ---------------------------------------------------------------------------

async function handleAdminRoute(request: NextRequest): Promise<NextResponse> {
  // DEV bypass — пропуска auth проверката когато SKIP_ADMIN_AUTH=true
  if (process.env.SKIP_ADMIN_AUTH === "true") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // Not authenticated → redirect to login
  if (!user && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but not admin → bounce to public site
  if (user && !isLoginPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/en", request.url));
    }
  }

  // Already on login page and authenticated admin → go to dashboard
  if (user && isLoginPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

async function refreshSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Skip when Supabase is not configured — avoids DNS timeout on placeholder URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Silently ignore — session refresh is non-critical for routing
  }

  return response;
}

// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - common image / font extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
