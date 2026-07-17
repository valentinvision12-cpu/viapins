#!/usr/bin/env npx tsx
/**
 * Replace vague zone places in seeds + Supabase with specific landmarks.
 * Usage: npx tsx scripts/fix-vague-places.ts [slug ...]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isVaguePlace, isSpecificLandmark, isCoordNearCity, cityCenterFromPlaces } from "../src/lib/precise-place-filter";
import { enrichPlace, type TravelSeedFile } from "../src/lib/travel-seed";
import { enrichAdventureSeed } from "../src/lib/adventure-seed";
import { resolvePlaceImage, getWikiExtract } from "../src/lib/wiki-image";
import { findReplacementLandmark, getCityCoords } from "../src/lib/wiki-landmark-search";

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

async function wikiLandmark(
  query: string,
  country: string,
  existing: Set<string>
): Promise<{ name: string; wiki_title: string; lat: number; lng: number; image_url: string; description: string } | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise((r) => setTimeout(r, 500 + attempt * 800));
    const qs = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "15",
      prop: "pageimages|coordinates",
      piprop: "thumbnail",
      pithumbsize: "600",
      pilimit: "50",
      colspan: "50",
    });
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${qs}`);
    const text = await res.text();
    if (text.includes("too many requests")) continue;
    let data: { query?: { pages?: Record<string, unknown> } };
    try {
      data = JSON.parse(text);
    } catch {
      continue;
    }
    for (const p of Object.values(data.query?.pages || {}) as Array<{
      title: string;
      coordinates?: { lat: number; lon: number }[];
      thumbnail?: { source: string };
    }>) {
      const title = p.title;
      const key = title.toLowerCase();
      if (existing.has(key)) continue;
      const lat = p.coordinates?.[0]?.lat;
      const lng = p.coordinates?.[0]?.lon;
      if (lat == null || lng == null || !p.thumbnail?.source) continue;
      if (isVaguePlace(title, null, country, lat, lng)) continue;
      if (!isSpecificLandmark(title) && !title.includes(",")) continue;
      const name = title.includes(",") ? title.split(",")[0].trim() : title;
      if (existing.has(name.toLowerCase())) continue;
      return {
        name,
        wiki_title: title,
        lat,
        lng,
        image_url: p.thumbnail.source.replace(/\/\d+px-/, "/800px-"),
        description: `${name} — a top landmark in ${country}.`,
      };
    }
  }
  return null;
}

async function replaceVagueCityPlace(
  country: string,
  city: string,
  oldName: string,
  existing: Set<string>
) {
  const queries = [
    `${oldName} ${city} ${country} landmark`,
    `${city} ${country} cathedral`,
    `${city} ${country} castle`,
    `${city} ${country} museum`,
  ];
  for (const q of queries) {
    const hit = await wikiLandmark(q, country, existing);
    if (hit) return hit;
  }
  return null;
}

async function replaceVagueAdventure(
  country: string,
  oldName: string,
  existing: Set<string>
) {
  const queries = [
    `${country} castle`,
    `${country} cathedral`,
    `${country} monastery`,
    `${country} palace`,
    `${country} fortress`,
    `${oldName} ${country}`,
  ];
  for (const q of queries) {
    const hit = await wikiLandmark(q, country, existing);
    if (hit) return hit;
  }
  return null;
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";

  const argSlugs = process.argv.slice(2);
  const seedDir = join(process.cwd(), "data", "seeds");
  const slugs = argSlugs.length
    ? argSlugs
    : readdirSync(seedDir)
        .filter((f) => f.endsWith(".json") && !f.includes("phase1") && !f.includes("supplement"))
        .map((f) => f.replace(/\.json$/, ""));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let replaced = 0;

  for (const slug of slugs) {
    const seedPath = join(seedDir, `${slug}.json`);
    if (!existsSync(seedPath)) continue;
    const seed = JSON.parse(readFileSync(seedPath, "utf8")) as TravelSeedFile & {
      adventure?: { places: Array<Record<string, unknown>>; hero_image?: string };
    };
    const country = seed.country;
    console.log(`\n=== ${country} (${slug}) ===`);
    const usedNames = new Set<string>();

    for (const citySeed of seed.cities) {
      const cityCoords =
        cityCenterFromPlaces(citySeed.places) ??
        (await getCityCoords(citySeed.city, country));
      for (const p of citySeed.places) {
        const oldName = p.name;
        const vague = isVaguePlace(p.name, p.description, country, p.lat, p.lng);
        const offCity =
          cityCoords &&
          !isCoordNearCity(
            p.lat ?? 0,
            p.lng ?? 0,
            cityCoords.lat,
            cityCoords.lng,
            country
          );
        if (!vague && !offCity) {
          usedNames.add(p.name.toLowerCase());
          continue;
        }
        console.log(
          `  ${vague ? "vague" : "off-city"}: ${citySeed.city} / ${p.name}`
        );
        const rep = await findReplacementLandmark(
          citySeed.city,
          country,
          usedNames,
          new Set<string>()
        );
        if (!rep) {
          console.warn(`    ✗ no replacement`);
          continue;
        }
        Object.assign(p, {
          name: rep.name,
          wiki_title: rep.wikiTitle,
          lat: rep.lat,
          lng: rep.lng,
          image_url: rep.image_url,
          description: `${rep.name} — a top landmark in ${citySeed.city}, ${country}.`,
          commons_file: undefined,
        });
        usedNames.add(rep.name.toLowerCase());
        replaced++;

        const { data: dest } = await supabase
          .from("destinations")
          .select("id")
          .ilike("country", country)
          .ilike("city", citySeed.city)
          .maybeSingle();
        if (!dest) continue;
        const { data: dbp } = await supabase
          .from("places")
          .select("id, order_index")
          .eq("destination_id", dest.id)
          .eq("name", oldName)
          .maybeSingle();
        if (!dbp) continue;
        try {
          const enriched = await enrichPlace(
            p,
            dbp.order_index,
            citySeed.city,
            country,
            new Set()
          );
          await supabase
            .from("places")
            .update({
              name: enriched.name,
              image_url: enriched.image_url,
              lat: enriched.lat,
              lng: enriched.lng,
              translations: enriched.translations,
              updated_at: new Date().toISOString(),
            })
            .eq("id", dbp.id);
          console.log(`    ✓ DB: ${rep.name}`);
        } catch (e) {
          console.warn(`    ✗ DB skip: ${(e as Error).message.slice(0, 60)}`);
        }
      }
    }

    if (seed.adventure?.places) {
      const advNames = new Set(seed.adventure.places.map((p) => p.name.toLowerCase()));
      for (let i = 0; i < seed.adventure.places.length; i++) {
        const p = seed.adventure.places[i] as {
          name: string;
          wiki_title?: string;
          lat: number;
          lng: number;
          description?: string;
          image_url?: string;
          region?: string;
        };
        if (!isVaguePlace(p.name, p.description, country, p.lat, p.lng)) continue;
        console.log(`  vague adventure: ${p.name}`);
        const rep = await replaceVagueAdventure(country, p.name, advNames);
        if (!rep) {
          console.warn(`    ✗ no replacement`);
          continue;
        }
        Object.assign(p, {
          name: rep.name,
          wiki_title: rep.wiki_title,
          lat: rep.lat,
          lng: rep.lng,
          image_url: rep.image_url,
          description: rep.description,
          commons_file: undefined,
        });
        advNames.add(rep.name.toLowerCase());
        replaced++;
      }
    }

    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");

    if (seed.adventure?.places?.some((p) => isVaguePlace(p.name, p.description, country, p.lat, p.lng))) {
      console.warn(`  ⚠ still has vague adventures in seed`);
    } else if (seed.adventure?.places?.length) {
      try {
        const collection = await enrichAdventureSeed(seed.adventure, country, { partial: false });
        await supabase.from("adventure_collections").upsert(
          {
            country: collection.country,
            slug: collection.slug,
            title: collection.title,
            subtitle: collection.subtitle,
            hero_image: collection.heroImage,
            wiki_title: collection.wiki_title ?? null,
            total_days: collection.totalDays,
            seo: collection.seo ?? {},
            places: collection.places,
            published: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );
        console.log(`  ✓ adventure re-imported`);
      } catch (e) {
        console.warn(`  ✗ adventure import: ${(e as Error).message.slice(0, 80)}`);
      }
    }
  }

  console.log(`\nDone: ${replaced} vague places replaced\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
