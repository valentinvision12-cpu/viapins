import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isBadImageUrl, resolvePlaceImage } from "@/lib/wiki-image";
import { verifyPlaceImage } from "@/lib/place-image-verify";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const force =
    new URL(req.url).searchParams.get("refresh") === "1" ||
    new URL(req.url).searchParams.get("force") === "1";
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ url: "" }, { status: 503 });
  }

  const { data: place, error } = await supabase
    .from("places")
    .select(
      "id, name, image_url, lat, lng, translations, destinations(city, country)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !place) {
    return NextResponse.json({ url: "" }, { status: 404 });
  }

  const destRaw = place.destinations as
    | { city: string; country: string }
    | { city: string; country: string }[]
    | null;
  const dest = Array.isArray(destRaw) ? destRaw[0] : destRaw;
  const city = dest?.city ?? "";
  const country = dest?.country ?? "";
  const en = (
    place.translations as Record<
      string,
      { wiki_title?: string; maps_query?: string }
    > | null
  )?.en;
  const wikiTitle = en?.wiki_title || place.name;

  const verifyCtx = {
    placeName: place.name,
    wikiTitle,
    city,
    country,
    lat: place.lat ?? undefined,
    lng: place.lng ?? undefined,
    mapsQuery: en?.maps_query,
  };

  const current = place.image_url?.trim() ?? "";
  const currentBad =
    !current ||
    isBadImageUrl(current) ||
    !verifyPlaceImage(verifyCtx, current).ok;

  if (current && !force && !currentBad) {
    return NextResponse.json({ url: current });
  }

  const url = await resolvePlaceImage(
    {
      ...verifyCtx,
      preferCommons: false,
    },
    900
  );

  if (url) {
    await supabase
      .from("places")
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json({ url: url || "" });
}
