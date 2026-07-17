"use server";

import { generateDestinationData, type GeneratedDestination } from "@/lib/ai/claude";
import { fetchWikimediaImage, getPlaceholderImageUrl } from "@/lib/apis/unsplash";
import { fetchWikipediaSummaries } from "@/lib/apis/wikipedia";

export interface EnrichedPlace {
  name: string;
  lat: number;
  lng: number;
  wiki_title: string;
  order_index: number;
  image_url: string;
  image_credit: string;
  image_credit_link: string;
  translations: Record<
    "en" | "es" | "fr" | "de" | "it",
    { description: string; wiki_text: string }
  >;
}

export interface GenerationResult {
  destination: GeneratedDestination["destination"];
  places: EnrichedPlace[];
}

export type GenerateActionResult =
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

export async function generateDestinationAction(
  city: string,
  country: string
): Promise<GenerateActionResult> {
  if (!city.trim() || !country.trim()) {
    return { success: false, error: "Моля, въведи град и държава." };
  }

  try {
    // ── Step 1: Claude AI generates 10 landmarks ────────────────────────────
    const aiData = await generateDestinationData(city.trim(), country.trim());

    // ── Steps 2 & 3: Unsplash images + Wikipedia summaries in parallel ──────
    const enrichedPlaces: EnrichedPlace[] = await Promise.all(
      aiData.places.map(async (place, index) => {
        const searchQuery = `${place.name} ${aiData.destination.city}`;

        const [wikimediaPhoto, wikiSummaries] = await Promise.all([
          fetchWikimediaImage(place.wiki_title),
          fetchWikipediaSummaries(place.wiki_title),
        ]);

        const imageUrl =
          wikimediaPhoto?.url ?? getPlaceholderImageUrl(searchQuery);

        const locales = ["en", "es", "fr", "de", "it"] as const;
        const translations = {} as EnrichedPlace["translations"];

        for (const locale of locales) {
          translations[locale] = {
            description: place.translations[locale]?.description ?? "",
            wiki_text: wikiSummaries[locale] ?? "",
          };
        }

        return {
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          wiki_title: place.wiki_title,
          order_index: index,
          image_url: imageUrl,
          image_credit: wikimediaPhoto?.credit ?? "Wikimedia Commons",
          image_credit_link: wikimediaPhoto?.creditLink ?? "https://commons.wikimedia.org",
          translations,
        };
      })
    );

    return {
      success: true,
      data: {
        destination: aiData.destination,
        places: enrichedPlaces,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Неизвестна грешка при генерирането.";
    return { success: false, error: message };
  }
}
