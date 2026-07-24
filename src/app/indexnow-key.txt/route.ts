import { NextResponse } from "next/server";
import { resolveIndexNowKey } from "@/lib/search-engines/prefs";

/**
 * IndexNow key file at /indexnow-key.txt
 * Use as keyLocation: `${getSiteUrl()}/indexnow-key.txt`
 */
export async function GET() {
  const key = await resolveIndexNowKey();
  if (!key) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
