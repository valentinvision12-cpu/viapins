#!/usr/bin/env npx tsx
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl, resolvePlaceImage } from "../src/lib/wiki-image";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function imageOk(url: string): Promise<boolean> {
  if (!url.trim() || isBadImageUrl(url)) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "LuxuryTravelMagazine/1.0" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const args = process.argv.slice(2);
  const badOnly = args.includes("--bad-only");
  const checkHttp = args.includes("--check-http");
  const requestedSlugs = args.filter((a) => !a.startsWith("--"));
  const seedDir = join(process.cwd(), "data", "seeds");
  const slugs = requestedSlugs.length
    ? requestedSlugs
    : readdirSync(seedDir)
        .filter(
          (file) =>
            file.endsWith(".json") &&
            !file.includes("phase1") &&
            !file.includes("supplement") &&
            !file.includes("partial") &&
            !file.includes("patch")
        )
        .map((file) => file.replace(/\.json$/, ""));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const slug of slugs) {
    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.warn(`Skip ${slug}: no seed`);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    console.log(`\n=== ${country} (${slug}) ===`);

    for (const citySeed of seed.cities ?? []) {
      const city = citySeed.city as string;
      const { data: dest } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();
      if (!dest) continue;

      const { data: dbPlaces } = await supabase
        .from("places")
        .select("id, name, image_url, translations")
        .eq("destination_id", dest.id)
        .order("order_index");

      const seedByName = new Map(
        (citySeed.places ?? []).map((p: { name: string }) => [
          p.name.toLowerCase(),
          p,
        ])
      );

      const usedImages = new Set<string>();

      for (const dbp of dbPlaces ?? []) {
        const seedPlace = seedByName.get(dbp.name.toLowerCase()) as
          | {
              wiki_title?: string;
              commons_file?: string;
              image_url?: string;
            }
          | undefined;

        const en = (dbp.translations as Record<string, { wiki_title?: string }>)
          ?.en;
        const wikiTitle = en?.wiki_title || seedPlace?.wiki_title || dbp.name;
        const current = dbp.image_url?.trim() ?? "";
        const currentBad =
          !current ||
          isBadImageUrl(current) ||
          usedImages.has(current) ||
          (checkHttp && !(await imageOk(current)));

        if (badOnly && !currentBad) {
          usedImages.add(current);
          continue;
        }

        let newUrl = "";

        if (
          seedPlace?.image_url &&
          !isBadImageUrl(seedPlace.image_url) &&
          !usedImages.has(seedPlace.image_url) &&
          (!checkHttp || (await imageOk(seedPlace.image_url)))
        ) {
          newUrl = seedPlace.image_url;
        }

        if (!newUrl) {
          newUrl = await resolvePlaceImage(
            {
              placeName: dbp.name,
              wikiTitle,
              city,
              country,
              commonsFile: seedPlace?.commons_file,
              preferCommons: true,
              avoidUrls: usedImages,
            },
            900
          );
        }

        if (!newUrl || isBadImageUrl(newUrl) || usedImages.has(newUrl)) {
          if (currentBad) {
            console.warn(`  x ${city} / ${dbp.name}: no better image`);
          }
          if (current && !usedImages.has(current)) usedImages.add(current);
          continue;
        }

        if (newUrl === current) {
          usedImages.add(current);
          continue;
        }

        const { error } = await supabase
          .from("places")
          .update({ image_url: newUrl, updated_at: new Date().toISOString() })
          .eq("id", dbp.id);

        if (error) console.warn(`  x ${dbp.name}: ${error.message}`);
        else {
          usedImages.add(newUrl);
          console.log(`  ok ${city} / ${dbp.name}`);
        }

        await new Promise((r) =>
          setTimeout(r, Number(process.env.WIKI_DELAY_MS || 400))
        );
      }
    }
  }

  console.log("\nDone.\n");
}

main();
