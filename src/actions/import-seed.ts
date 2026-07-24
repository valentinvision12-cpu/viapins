"use server";



import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { seedStats, validateTravelSeed } from "@/lib/travel-seed";

import { adventureSeedStats } from "@/lib/adventure-seed";

import { importCountrySeed } from "@/lib/import-country-core";

import { readFileSync } from "fs";

import { join } from "path";

import { slugify } from "@/lib/utils";

import {
  notifyEntireSiteBackground,
  notifySearchEnginesBackground,
  urlsForCountry,
} from "@/lib/search-engines";



export type ImportSeedResult =
  | {
      success: true;
      imported: number;
      total: number;
      country?: string;
      stats: ReturnType<typeof seedStats>;
      adventure?: ReturnType<typeof adventureSeedStats>;
      cities: { city: string; placeCount: number; destinationId: string }[];
    }
  | { success: false; error: string };



/**

 * Импортира цяла държава от Travel Seed JSON → Supabase.

 * Изискване: 10 града × 10 забележителности = 100 места.

 */

export async function importSeedAction(

  rawJson: string

): Promise<ImportSeedResult> {

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {

    return {

      success: false,

      error:

        "Supabase не е конфигуриран. Попълни .env.local и рестартирай сървъра.",

    };

  }



  const supabase = await createClient();

  const result = await importCountrySeed(supabase, rawJson);



  if (result.success) {

    revalidatePath("/admin/destinations");

    revalidatePath("/admin");

    revalidatePath("/");

    revalidatePath("/[locale]", "layout");

    revalidatePath("/[locale]/explore/[country]/adventure", "page");

    try {
      const countrySlug = slugify(result.country || result.stats.country);
      if (countrySlug) {
        void urlsForCountry(countrySlug)
          .then((urls) => {
            notifySearchEnginesBackground(urls, {
              source: "import-seed",
              type: "URL_UPDATED",
            });
          })
          .catch(() => {
            notifyEntireSiteBackground({ source: "import-seed-fallback" });
          });
      } else {
        notifyEntireSiteBackground({ source: "import-seed" });
      }
    } catch (err) {
      console.error("[indexing] import-seed notify", err);
    }

    return {

      success: true,

      imported: result.imported,

      total: result.total,

      country: result.country,

      stats: result.stats,

      adventure: result.adventure,

      cities: result.cities,

    };

  }



  return result;

}



/** Качва data/seeds/{slug}.json — използва се от admin и Cursor agent */

export async function importCountryBySlugAction(

  slug: string

): Promise<ImportSeedResult> {

  try {

    const path = join(

      process.cwd(),

      "data",

      "seeds",

      `${slug.toLowerCase().replace(/\.json$/, "")}.json`

    );

    const raw = readFileSync(path, "utf8");

    return importSeedAction(raw);

  } catch {

    return { success: false, error: `Липсва data/seeds/${slug}.json` };

  }

}



/** Един клик: зарежда data/seeds/albania.json и публикува на сайта */

export async function importAlbaniaQuickAction(): Promise<ImportSeedResult> {

  return importCountryBySlugAction("albania");

}



/** Само валидация + статистика (без импорт) */

export async function previewSeedAction(rawJson: string) {

  try {

    const parsed = JSON.parse(rawJson) as unknown;

    const seed = validateTravelSeed(parsed);

    return {

      success: true as const,

      stats: seedStats(seed),

      adventure: seed.adventure ? adventureSeedStats(seed.adventure) : undefined,

    };

  } catch (err) {

    return {

      success: false as const,

      error: err instanceof Error ? err.message : "Невалиден JSON.",

    };

  }

}


