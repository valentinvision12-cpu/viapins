import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "./src/i18n/routing";
import { adminAuthBypassEnabled } from "./src/lib/site-brand";

// Locale-aware routing for all public /{locale}/... paths
const handleI18nRouting = createMiddleware(routing);

const BLOCKED_PATTERNS = [
  /\.\.(\/|\\)/,                        // path traversal
  /<script/i,                            // inline script injection
  /\bselect\b.+\bfrom\b/i,              // SQL injection
  /\bunion\b.+\bselect\b/i,
  /\bexec\b\s*\(/i,
  /(eval|expression)\s*\(/i,
  /\/wp-(admin|login|content)\//i,       // WordPress probes
  /\/phpmy(admin)?/i,                    // phpMyAdmin probes
  /\.(php|asp|aspx|jsp|cgi)$/i,         // non-JS server probes
  /\/etc\/passwd/i,                      // Unix file traversal
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // SEO / machine-readable endpoints — never locale-prefix these
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemap/") ||
    pathname === "/feed.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/indexnow-key.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Block obvious attack patterns
  const fullUrl = pathname + request.nextUrl.search;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

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

// ---------------------------------------------------------------------------

function checkAdminBasicAuth(request: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  if (!password) return null;

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER?.trim() || "admin";
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const separator = decoded.indexOf(":");
      const user = separator >= 0 ? decoded.slice(0, separator) : decoded;
      const pass = separator >= 0 ? decoded.slice(separator + 1) : "";
      if (user === expectedUser && pass === password) return null;
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ViaPins Admin", charset="UTF-8"',
    },
  });
}

async function handleAdminRoute(request: NextRequest): Promise<NextResponse> {
  const basicAuthResponse = checkAdminBasicAuth(request);
  if (basicAuthResponse) return basicAuthResponse;

  // DEV bypass — only in local development
  if (adminAuthBypassEnabled()) {
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

  // Authenticated but not admin → login with clear error (not public site)
  if (user && !isLoginPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "not_admin");
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already on login page and authenticated admin → honor redirectTo or dashboard
  if (user && isLoginPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      const dest =
        request.nextUrl.searchParams.get("redirectTo") || "/admin";
      const safeDest = dest.startsWith("/admin") ? dest : "/admin";
      return NextResponse.redirect(new URL(safeDest, request.url));
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
     * - SEO endpoints (robots, sitemap, feed, llms, indexnow)
     * - common image / font extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|feed\\.xml|llms\\.txt|indexnow-key\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
