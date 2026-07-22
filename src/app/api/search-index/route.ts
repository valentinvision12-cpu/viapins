import { NextResponse } from "next/server";
import { getPublishedHomeData } from "@/actions/get-destinations";
import { buildSearchIndex } from "@/lib/search-index";

export const revalidate = 300;

/** Lightweight destination index for the Cmd+K command palette. */
export async function GET() {
  try {
    const { countries, cities } = await getPublishedHomeData();
    const items = buildSearchIndex(countries, cities).map((item) => ({
      type: item.type,
      name: item.name,
      country: item.country,
      slug: item.slug,
      subtitle: item.subtitle,
      flagUrl: item.flagUrl ?? null,
      coverImage: item.type === "city" ? item.coverImage || null : null,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/search-index]", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
