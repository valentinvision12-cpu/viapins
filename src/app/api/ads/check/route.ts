import { NextResponse } from "next/server";

/** Lightweight probe endpoint used by ad-block detection. */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
