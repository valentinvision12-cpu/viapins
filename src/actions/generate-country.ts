"use server";

import {
  generateCountryCitiesList,
  generateCityPlacesSeed,
  generateAdventureSeedBlock,
  type CountryCityOutline,
} from "@/lib/ai/claude-country";
import type { TravelSeedCity } from "@/lib/travel-seed";
import type { TravelSeedAdventure } from "@/lib/adventure-seed";
import { importSeedAction, type ImportSeedResult } from "@/actions/import-seed";
import type { TravelSeedFile } from "@/lib/travel-seed";

type Ok<T> = { success: true } & T;
type Fail = { success: false; error: string };

export async function generateCountryCitiesAction(
  country: string
): Promise<Ok<{ cities: CountryCityOutline[] }> | Fail> {
  if (!country.trim()) return { success: false, error: "Въведи име на държава." };
  try {
    const cities = await generateCountryCitiesList(country.trim());
    return { success: true, cities };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при генериране на градове.",
    };
  }
}

export async function generateCitySeedAction(
  city: string,
  country: string
): Promise<Ok<{ citySeed: TravelSeedCity }> | Fail> {
  try {
    const citySeed = await generateCityPlacesSeed(city.trim(), country.trim());
    return { success: true, citySeed };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : `Грешка при ${city}.`,
    };
  }
}

export async function generateCountryAdventureAction(
  country: string
): Promise<Ok<{ adventure: TravelSeedAdventure }> | Fail> {
  try {
    const adventure = await generateAdventureSeedBlock(country.trim());
    return { success: true, adventure };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при adventure.",
    };
  }
}

/** Качва готов seed на сайта (Supabase + Wikipedia обогатяване) */
export async function uploadCountrySeedAction(
  seed: TravelSeedFile
): Promise<ImportSeedResult> {
  return importSeedAction(JSON.stringify(seed));
}

export type { CountryCityOutline, TravelSeedFile };
