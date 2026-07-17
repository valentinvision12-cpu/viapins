#!/usr/bin/env npx tsx
/**
 * Apply curated stories from data/place-story-overrides.json to Supabase.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveWikiExtract } from "../src/lib/wiki-image";
import {
  isGenericDescription,
  shortPlaceDescription,
} from "../src/lib/place-description";

type Override = { wiki_title?: string; description?: string };

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function buildStory(
  override: Override,
  placeName: string,
  city: string,
  country: string
): Promise<{ description: string; wiki_text: string; wiki_title: string }> {
  if (override.description && !isGenericDescription(override.description)) {
    const text = override.description.trim();
    return {
      description: shortPlaceDescription(text, placeName),
      wiki_text: text,
      wiki_title: override.wiki_title || placeName,
    };
  }

  const { extract, wikiTitle } = await resolveWikiExtract(placeName, {
    wikiTitle: override.wiki_title,
    city,
    country,
  });

  if (extract) {
    return {
      description: shortPlaceDescription(extract, placeName),
      wiki_text: extract,
      wiki_title: wikiTitle,
    };
  }

  throw new Error(`No story for ${placeName}`);
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const overrides = JSON.parse(
    readFileSync(join(process.cwd(), "data", "place-story-overrides.json"), "utf8")
  ) as Record<string, Override>;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let updated = 0;
  let failed = 0;

  for (const [key, override] of Object.entries(overrides)) {
    const [country, city, name] = key.split("::");
    const { data: dest } = await sb
      .from("destinations")
      .select("id")
      .ilike("country", country)
      .eq("city", city)
      .maybeSingle();

    if (!dest) {
      console.warn(`⚠ No destination: ${key}`);
      failed++;
      continue;
    }

    const { data: place } = await sb
      .from("places")
      .select("id, translations")
      .eq("destination_id", dest.id)
      .eq("name", name)
      .maybeSingle();

    if (!place) {
      console.warn(`⚠ No place: ${key}`);
      failed++;
      continue;
    }

    try {
      const story = await buildStory(override, name, city, country);
      const translations = { ...(place.translations as object) };
      for (const lang of Object.keys(translations)) {
        const t = translations[lang as keyof typeof translations] as Record<string, string>;
        t.description = story.description;
        t.wiki_text = story.wiki_text;
        t.wiki_title = story.wiki_title;
      }

      await sb
        .from("places")
        .update({ translations, updated_at: new Date().toISOString() })
        .eq("id", place.id);

      updated++;
      console.log(`✓ ${city} / ${name}`);
    } catch (err) {
      failed++;
      console.warn(`✗ ${key}:`, err instanceof Error ? err.message : err);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
