#!/usr/bin/env npx tsx
/**
 * Refresh place descriptions & wiki stories from Wikipedia (and seed when curated).
 * Usage: npx tsx scripts/refresh-place-stories.ts croatia cyprus czech-republic bosnia-and-herzegovina
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveWikiExtract } from "../src/lib/wiki-image";
import {
  isGenericDescription,
  shortPlaceDescription,
  resolveWikiLookupTitle,
} from "../src/lib/place-description";

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

function loadOverrides() {
  const path = join(process.cwd(), "data", "place-story-overrides.json");
  if (!existsSync(path)) return new Map<string, { wiki_title?: string; description?: string }>();
  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<
    string,
    { wiki_title?: string; description?: string }
  >;
  return new Map(Object.entries(raw));
}

type SeedPlace = {
  name: string;
  wiki_title?: string;
  description?: string;
};

function loadSeedMap(slug: string) {
  const path = join(process.cwd(), "data", "seeds", `${slug}.json`);
  if (!existsSync(path)) return { country: "", map: new Map<string, SeedPlace>() };
  const seed = JSON.parse(readFileSync(path, "utf8"));
  const map = new Map<string, SeedPlace>();
  for (const city of seed.cities || []) {
    for (const p of city.places || []) {
      map.set(`${city.city}::${p.name}`.toLowerCase(), p);
    }
  }
  return { country: seed.country as string, map };
}

function buildStory(
  extract: string,
  seedDesc: string | undefined,
  placeName: string
): { description: string; wiki_text: string } {
  const curated =
    seedDesc && !isGenericDescription(seedDesc) ? seedDesc.trim() : "";

  if (curated) {
    return {
      description: shortPlaceDescription(curated, placeName),
      wiki_text: curated,
    };
  }

  if (extract?.trim()) {
    return {
      description: shortPlaceDescription(extract, placeName),
      wiki_text: extract.trim(),
    };
  }

  return { description: placeName, wiki_text: placeName };
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const slugs = process.argv.slice(2);
  if (!slugs.length) {
    console.error(
      "Usage: npx tsx scripts/refresh-place-stories.ts croatia cyprus ..."
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let updated = 0;
  let skipped = 0;

  const overrides = loadOverrides();

  for (const slug of slugs) {
    const { country, map: seedMap } = loadSeedMap(slug);
    if (!country) {
      console.warn(`Skip missing seed: ${slug}`);
      continue;
    }

    console.log(`\n=== ${country} ===`);

    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", country);

    for (const dest of dests ?? []) {
      const { data: places } = await supabase
        .from("places")
        .select("id, name, translations")
        .eq("destination_id", dest.id);

      for (const place of places ?? []) {
        const en = (
          place.translations as Record<
            string,
            { description?: string; wiki_text?: string; wiki_title?: string }
          >
        )?.en;

        const seedPlace = seedMap.get(`${dest.city}::${place.name}`.toLowerCase());

        const needsUpdate =
          isGenericDescription(en?.description) ||
          isGenericDescription(en?.wiki_text) ||
          !en?.wiki_text?.trim() ||
          en?.description === en?.wiki_text;

        if (!needsUpdate) {
          skipped++;
          continue;
        }

        const overrideKey = `${country}::${dest.city}::${place.name}`;
        const override = overrides.get(overrideKey);

        const { extract, wikiTitle } = await resolveWikiExtract(place.name, {
          wikiTitle: resolveWikiLookupTitle(
            override?.wiki_title || seedPlace?.wiki_title || en?.wiki_title,
            place.name,
            dest.city
          ),
          city: dest.city,
          country,
        });
        const { description, wiki_text } = buildStory(
          extract,
          override?.description || seedPlace?.description,
          place.name
        );

        if (
          description === en?.description &&
          wiki_text === en?.wiki_text &&
          wikiTitle === en?.wiki_title
        ) {
          skipped++;
          continue;
        }

        const translations = { ...(place.translations as object) };
        for (const lang of Object.keys(translations)) {
          const t = translations[lang as keyof typeof translations] as Record<
            string,
            string
          >;
          t.description = description;
          t.wiki_text = wiki_text;
          t.wiki_title = wikiTitle;
        }

        await supabase
          .from("places")
          .update({
            translations,
            updated_at: new Date().toISOString(),
          })
          .eq("id", place.id);

        updated++;
        await new Promise((r) => setTimeout(r, 550));
      }

      console.log(`  ✓ ${dest.city}: stories refreshed`);
    }

    // Adventure collections (JSON places array)
    const { data: advRow } = await supabase
      .from("adventure_collections")
      .select("id, places")
      .ilike("country", country)
      .maybeSingle();

    if (advRow?.places?.length) {
      const places = advRow.places as Array<{
        id?: string;
        name: string;
        wiki_title?: string;
        translations?: Record<
          string,
          { description?: string; wiki_text?: string; wiki_title?: string }
        >;
      }>;

      let advChanged = false;
      for (const place of places) {
        const en = place.translations?.en;
        if (
          !isGenericDescription(en?.description) &&
          !isGenericDescription(en?.wiki_text) &&
          en?.wiki_text &&
          en.wiki_text.length > 80 &&
          en.description !== en.wiki_text
        ) {
          skipped++;
          continue;
        }

        const { extract, wikiTitle } = await resolveWikiExtract(place.name, {
          wikiTitle: place.wiki_title || en?.wiki_title,
          country,
        });
        const { description, wiki_text } = buildStory(
          extract,
          undefined,
          place.name
        );

        const translations = { ...(place.translations ?? {}) };
        for (const lang of ["en", "es", "fr", "de", "it"]) {
          translations[lang] = {
            ...(translations[lang] ?? {}),
            description,
            wiki_text,
            wiki_title: wikiTitle,
          };
        }
        place.translations = translations;
        place.wiki_title = wikiTitle;
        advChanged = true;
        updated++;
        await new Promise((r) => setTimeout(r, 550));
      }

      if (advChanged) {
        await supabase
          .from("adventure_collections")
          .update({ places, updated_at: new Date().toISOString() })
          .eq("id", advRow.id);
      }
      console.log(`  ✓ Adventure route: stories refreshed`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already OK\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
