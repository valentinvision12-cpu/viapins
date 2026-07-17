"use server";

import { readFileSync } from "fs";
import { join } from "path";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";
import { demoToSeed } from "@/lib/demo-to-seed";

/** Експортира България от demo-data като Travel Seed JSON */
export async function exportBulgariaSeedAction(): Promise<string> {
  const seed = demoToSeed(DEMO_DESTINATIONS, "Bulgaria");
  return JSON.stringify(seed, null, 2);
}

/** Зарежда Albania seed (10 града × 10 места) от data/seeds/albania.json */
export async function exportAlbaniaSeedAction(): Promise<string> {
  const path = join(process.cwd(), "data", "seeds", "albania.json");
  return readFileSync(path, "utf8");
}
