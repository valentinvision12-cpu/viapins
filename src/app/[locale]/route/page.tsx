import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, BookMarked } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NavHeader } from "@/components/public/nav-header";
import { SharedRouteActions } from "@/components/public/shared-route-actions";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { googleMapsPlaceUrl } from "@/lib/place-links";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site-brand";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string }>;
};

interface PlacePreview {
  id: string;
  name: string;
  city: string;
  country: string;
  image_url: string;
  lat: number;
  lng: number;
}

async function getPlacesByIds(ids: string[]): Promise<PlacePreview[]> {
  if (ids.length === 0) return [];

  const results: PlacePreview[] = [];

  // 1. Check demo data
  for (const dest of DEMO_DESTINATIONS) {
    for (const place of dest.places) {
      if (ids.includes(place.id)) {
        results.push({
          id: place.id,
          name: place.name,
          city: dest.city,
          country: dest.country,
          image_url: place.image_url,
          lat: place.lat,
          lng: place.lng,
        });
      }
    }
  }

  // 2. Fetch remaining from Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const demoIds = results.map((r) => r.id);
  const supabaseIds = ids.filter((id) => !demoIds.includes(id));

  if (supabaseIds.length > 0 && supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("places")
        .select("id, name, image_url, lat, lng, destinations(city, country)")
        .in("id", supabaseIds);

      if (data) {
        for (const p of data) {
          const destRaw = p.destinations as
            | { city: string; country: string }
            | { city: string; country: string }[]
            | null;
          const dest = Array.isArray(destRaw) ? destRaw[0] : destRaw;
          results.push({
            id: p.id,
            name: p.name,
            city: dest?.city ?? "",
            country: dest?.country ?? "",
            image_url: p.image_url ?? "",
            lat: Number(p.lat),
            lng: Number(p.lng),
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Return in original order
  return ids.map((id) => results.find((r) => r.id === id)).filter(Boolean) as PlacePreview[];
}

function placeLocationUrl(lat: number, lng: number, name: string, city: string, country: string): string {
  return googleMapsPlaceUrl(lat, lng, name, city, country);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { p } = await searchParams;
  const ids = p ? p.split(",").slice(0, 15) : [];
  const places = await getPlacesByIds(ids);
  const cities = [...new Set(places.map((p) => p.city))].join(", ");

  return {
    title: cities ? `${cities} Route · ${SITE_NAME}` : `Shared Route · ${SITE_NAME}`,
    description: `A curated travel route with ${places.length} landmarks. View, navigate, and clone this route.`,
  };
}

export default async function SharedRoutePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { p } = await searchParams;

  const ids = p ? p.split(",").filter(Boolean).slice(0, 15) : [];
  if (ids.length === 0) notFound();

  const places = await getPlacesByIds(ids);
  if (places.length === 0) notFound();

  const cities = [...new Set(places.map((p) => p.city))];

  return (
    <>
      <NavHeader />
      <main className="min-h-screen pt-20" style={{ background: "oklch(0.12 0.06 252)" }}>
        <div className="container max-w-3xl mx-auto px-6 py-10">

          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to explore
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.72_0.13_82)]/15 border border-[oklch(0.72_0.13_82)]/25 text-[oklch(0.82_0.12_82)] text-xs font-semibold mb-4">
              Shared Route
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {cities.length <= 2 ? cities.join(" & ") : `${places.length} Landmark Route`}
            </h1>
            <div className="flex items-center gap-2 text-white/35 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {places.map((p) => p.city).filter((v, i, a) => a.indexOf(v) === i).join(" → ")}
            </div>
          </div>

          {/* Places list */}
          <div className="space-y-3 mb-8">
            {places.map((place, i) => (
              <div key={place.id} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/4 border border-white/8">
                <div className="w-7 h-7 rounded-full bg-[oklch(0.72_0.13_82)] flex items-center justify-center text-[oklch(0.12_0.008_260)] text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                {place.image_url && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={place.image_url} alt={place.name} fill sizes="48px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{place.name}</p>
                  <p className="text-white/35 text-xs">{place.city}, {place.country}</p>
                </div>
                <a
                  href={placeLocationUrl(place.lat, place.lng, place.name, place.city, place.country)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  className="p-1.5 rounded-lg text-white/25 hover:text-[oklch(0.72_0.13_82)] transition-colors flex-shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <p className="text-white/25 text-xs text-center pb-1">
              Tap 📍 next to any place to open it directly in Google Maps
            </p>
            <SharedRouteActions places={places} locale={locale} />
          </div>
        </div>

        <footer className="border-t border-white/8 py-8 text-center text-white/20 text-xs mt-10"
          style={{ background: "oklch(0.10 0.05 252)" }}>
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </main>
    </>
  );
}
