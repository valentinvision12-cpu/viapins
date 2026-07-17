import { NextRequest, NextResponse } from "next/server";

// ── In-memory rate limiter ────────────────────────────────────────────────────
// For production, replace with Upstash Redis + @upstash/ratelimit
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  maxRequests: 30,       // 30 requests …
  windowMs: 60 * 1000,  // … per minute per IP
};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }

  if (entry.count >= RATE_LIMIT.maxRequests) return true;

  entry.count++;
  return false;
}

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Identify client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Лимитът на заявките е достигнат. Опитайте след малко." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
        },
      }
    );
  }

  // Parse body
  let body: { text: string | string[]; targetLang: string; sourceLang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Невалидно тяло на заявката." },
      { status: 400 }
    );
  }

  const { text, targetLang, sourceLang = "en" } = body;

  if (!text || !targetLang) {
    return NextResponse.json(
      { error: "Задължителни полета: text, targetLang." },
      { status: 400 }
    );
  }

  // No-op if source == target
  if (targetLang === sourceLang) {
    return NextResponse.json({ translatedText: text });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    console.warn(
      "[translate] GOOGLE_TRANSLATE_API_KEY not set — returning original text."
    );
    return NextResponse.json(
      { error: "Услугата за превод не е конфигурирана." },
      { status: 503 }
    );
  }

  const texts: string[] = Array.isArray(text) ? text : [text];

  try {
    const googleRes = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: texts,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
      }
    );

    if (!googleRes.ok) {
      const errBody = await googleRes.text();
      console.error("[translate] Google API error:", googleRes.status, errBody);
      throw new Error(`Google Translate API: ${googleRes.status}`);
    }

    const data = await googleRes.json();
    const translations: string[] = data.data.translations.map(
      (t: { translatedText: string }) => t.translatedText
    );

    return NextResponse.json(
      {
        translatedText: Array.isArray(text) ? translations : translations[0],
      },
      {
        headers: {
          // Cache identical translations for 1 hour at CDN level
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("[translate] Translation failed:", err);
    return NextResponse.json(
      { error: "Преводът неуспя. Опитайте отново." },
      { status: 500 }
    );
  }
}

// Only POST is allowed on this route
export function GET() {
  return NextResponse.json({ error: "Методът не е разрешен." }, { status: 405 });
}
