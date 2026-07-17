#!/usr/bin/env npx tsx
/**
 * Fix broken images, refresh wiki text, fill missing places from seed.
 * Usage: npx tsx scripts/fix-country-places.ts croatia cyprus czech-republic bosnia-and-herzegovina
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  resolvePlaceImage,
  getWikiExtract,
  isBadImageUrl,
} from "../src/lib/wiki-image";
import { enrichPlace, type TravelSeedPlace } from "../src/lib/travel-seed";
import { findReplacementLandmark, getCityCoords } from "../src/lib/wiki-landmark-search";
import { isVaguePlace, isCoordNearCity, cityCenterFromPlaces } from "../src/lib/precise-place-filter";
import { resolveCityCoverFromDb } from "../src/lib/city-cover";

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
  if (!url?.trim() || isBadImageUrl(url)) return false;
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status === 200;
  } catch {
    return false;
  }
}

function slugToCountry(slug: string, seed: { country: string }) {
  return seed.country;
}

async function resolveFreshImage(
  place: { name: string; wiki_title?: string; commons_file?: string },
  city: string,
  country: string,
  avoidUrls: Set<string>
): Promise<string> {
  for (const preferCommons of [true, false]) {
    const img = await resolvePlaceImage(
      {
        placeName: place.name,
        wikiTitle: place.wiki_title,
        city,
        country,
        commonsFile: place.commons_file,
        preferCommons,
        avoidUrls,
      },
      900
    );
    if (img && !isBadImageUrl(img) && !avoidUrls.has(img)) return img;
  }
  return "";
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";
  const microSlugs = new Set(["liechtenstein", "monaco", "north-macedonia", "san-marino"]);

  const slugs = process.argv.slice(2);
  if (!slugs.length) {
    console.error("Usage: npx tsx scripts/fix-country-places.ts croatia ...");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let fixedImages = 0;
  let fixedText = 0;
  let inserted = 0;
  let replaced = 0;

  for (const slug of slugs) {
    if (microSlugs.has(slug)) process.env.RELAX_MICROSTATE = "1";
    else delete process.env.RELAX_MICROSTATE;

    const seedPath = join(process.cwd(), "data", "seeds", `${slug}.json`);
    if (!existsSync(seedPath)) {
      console.warn(`Skip missing seed: ${slug}`);
      continue;
    }
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country;
    console.log(`\n=== ${country} ===`);

    const countryExistingNames = new Set<string>();
    const countryUsedImages = new Set<string>();
    if (microSlugs.has(slug)) {
      const { data: allDests } = await supabase
        .from("destinations")
        .select("id")
        .ilike("country", country);
      for (const d of allDests ?? []) {
        const { data: allPlaces } = await supabase
          .from("places")
          .select("name, image_url")
          .eq("destination_id", d.id);
        for (const p of allPlaces ?? []) {
          countryExistingNames.add(p.name.toLowerCase());
          if (p.image_url) countryUsedImages.add(p.image_url);
        }
      }
    }

    for (const citySeed of seed.cities) {
      const city = citySeed.city;
      const { data: dest } = await supabase
        .from("destinations")
        .select("id, cover_image")
        .ilike("country", country)
        .ilike("city", city)
        .maybeSingle();

      if (!dest) {
        console.warn(`  ⚠ No destination: ${city}`);
        continue;
      }

      const { data: dbPlaces } = await supabase
        .from("places")
        .select("id, name, image_url, order_index, lat, lng, translations")
        .eq("destination_id", dest.id);

      const dbByName = new Map(
        (dbPlaces ?? []).map((p) => [p.name.toLowerCase(), p])
      );
      const seedByName = new Map(
        citySeed.places.map((p: TravelSeedPlace) => [p.name.toLowerCase(), p])
      );

      const usedImages = new Set([
        ...(dbPlaces ?? []).map((p) => p.image_url).filter(Boolean),
        ...countryUsedImages,
      ]);
      const existingNames = new Set([
        ...(dbPlaces ?? []).map((p) => p.name.toLowerCase()),
        ...countryExistingNames,
      ]);

      const cityCoords =
        cityCenterFromPlaces(citySeed.places as TravelSeedPlace[]) ??
        (await getCityCoords(city, country));

      // Replace only vague names or pins far from the city center
      for (const dbp of [...(dbPlaces ?? [])]) {
        const en = (
          dbp.translations as Record<
            string,
            { description?: string; wiki_text?: string }
          >
        )?.en;
        const desc = en?.description?.trim() || "";
        const seedPlace = seedByName.get(dbp.name.toLowerCase());
        const vague = isVaguePlace(
          dbp.name,
          desc,
          country,
          dbp.lat ?? 0,
          dbp.lng ?? 0
        );
        const offCity =
          cityCoords != null &&
          !isCoordNearCity(
            dbp.lat ?? 0,
            dbp.lng ?? 0,
            cityCoords.lat,
            cityCoords.lng,
            country
          );
        if (!vague && !offCity) continue;
        if (!cityCoords) continue;

        const alt = await findReplacementLandmark(city, country, existingNames, usedImages);
        if (!alt) {
          console.warn(`  ⚠ ${city}: no replacement for off-city "${dbp.name}"`);
          continue;
        }
        existingNames.delete(dbp.name.toLowerCase());
        existingNames.add(alt.name.toLowerCase());
        if (dbp.image_url) usedImages.delete(dbp.image_url);
        usedImages.add(alt.image_url);

        let wikiText = "";
        const ext = await getWikiExtract(alt.wikiTitle);
        if (ext) wikiText = ext;

        const translations = { ...(dbp.translations as object) };
        for (const lang of Object.keys(translations)) {
          const t = translations[lang as keyof typeof translations] as Record<string, string>;
          if (wikiText) t.wiki_text = wikiText;
          t.description = wikiText.slice(0, 200) || `${alt.name} — top sight in ${city}.`;
          t.wiki_title = alt.wikiTitle;
        }

        await supabase
          .from("places")
          .update({
            name: alt.name,
            lat: alt.lat,
            lng: alt.lng,
            image_url: alt.image_url,
            translations,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbp.id);
        replaced++;
        console.log(`  ↻ ${city}: ${dbp.name} → ${alt.name} (off-city)`);
        dbp.name = alt.name;
        dbp.lat = alt.lat;
        dbp.lng = alt.lng;
        dbp.image_url = alt.image_url;
        await new Promise((r) => setTimeout(r, 350));
      }

      // Fix existing places — reject maps, missing images, swap if needed
      for (const dbp of dbPlaces ?? []) {
        const seedPlace = seedByName.get(dbp.name.toLowerCase());
        const en = (
          dbp.translations as Record<
            string,
            { description?: string; wiki_text?: string; wiki_title?: string; commons_file?: string }
          >
        )?.en;
        const wikiTitle = en?.wiki_title || seedPlace?.wiki_title || dbp.name;

        const ok = await imageOk(dbp.image_url);
        let newImage = ok ? dbp.image_url : "";
        let placeName = dbp.name;
        let placeLat = dbp.lat;
        let placeLng = dbp.lng;
        let activeWikiTitle = wikiTitle;

        if (!ok) {
          newImage = await resolveFreshImage(
            {
              name: dbp.name,
              wiki_title: wikiTitle,
              commons_file: en?.commons_file || seedPlace?.commons_file,
            },
            city,
            country,
            usedImages
          );
          if (newImage) fixedImages++;
        }

        if (!newImage || isBadImageUrl(newImage)) {
          const alt = await findReplacementLandmark(city, country, existingNames, usedImages);
          if (alt) {
            existingNames.delete(dbp.name.toLowerCase());
            existingNames.add(alt.name.toLowerCase());
            if (dbp.image_url) usedImages.delete(dbp.image_url);
            usedImages.add(alt.image_url);
            placeName = alt.name;
            placeLat = alt.lat;
            placeLng = alt.lng;
            newImage = alt.image_url;
            activeWikiTitle = alt.wikiTitle;
            replaced++;
            fixedImages++;
            console.log(`  ↻ ${city}: ${dbp.name} → ${alt.name}`);
          }
        }

        let wikiText = en?.wiki_text?.trim() || "";
        if (!wikiText || wikiText.length < 80 || placeName !== dbp.name) {
          const ext = await getWikiExtract(activeWikiTitle);
          if (ext) {
            wikiText = ext;
            fixedText++;
          }
        }

        const desc =
          en?.description?.trim() ||
          seedPlace?.description ||
          wikiText.slice(0, 200);

        const imageChanged = newImage && newImage !== dbp.image_url;
        const metaChanged =
          placeName !== dbp.name ||
          placeLat !== dbp.lat ||
          placeLng !== dbp.lng ||
          (wikiText && wikiText !== en?.wiki_text);

        if (imageChanged || metaChanged) {
          const translations = { ...(dbp.translations as object) };
          for (const lang of Object.keys(translations)) {
            const t = translations[lang as keyof typeof translations] as Record<string, string>;
            if (wikiText) t.wiki_text = wikiText;
            if (desc) t.description = desc;
            if (activeWikiTitle) t.wiki_title = activeWikiTitle;
          }
          await supabase
            .from("places")
            .update({
              name: placeName,
              lat: placeLat,
              lng: placeLng,
              image_url: newImage || dbp.image_url,
              translations,
              updated_at: new Date().toISOString(),
            })
            .eq("id", dbp.id);
        } else if (wikiText && wikiText !== en?.wiki_text) {
          const translations = { ...(dbp.translations as object) };
          for (const lang of Object.keys(translations)) {
            const t = translations[lang as keyof typeof translations] as Record<string, string>;
            t.wiki_text = wikiText;
            if (desc) t.description = desc;
          }
          await supabase
            .from("places")
            .update({ translations, updated_at: new Date().toISOString() })
            .eq("id", dbp.id);
        }

        await new Promise((r) => setTimeout(r, 280));
      }

      // Insert missing places from seed
      const existingOrders = new Set((dbPlaces ?? []).map((p) => p.order_index));

      for (const seedPlace of citySeed.places as TravelSeedPlace[]) {
        if (dbByName.has(seedPlace.name.toLowerCase())) continue;

        try {
          const enriched = await enrichPlace(
            { ...seedPlace, image_url: undefined, commons_file: undefined },
            seedPlace.order_index ?? existingOrders.size,
            city,
            country,
            usedImages
          );
          await supabase.from("places").insert({
            destination_id: dest.id,
            name: enriched.name,
            image_url: enriched.image_url,
            lat: enriched.lat,
            lng: enriched.lng,
            order_index: enriched.order_index,
            translations: enriched.translations,
          });
          usedImages.add(enriched.image_url);
          countryUsedImages.add(enriched.image_url);
          existingNames.add(enriched.name.toLowerCase());
          countryExistingNames.add(enriched.name.toLowerCase());
          inserted++;
          console.log(`  + ${city}: ${enriched.name}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`  ✗ skip insert ${city}/${seedPlace.name}: ${msg.slice(0, 80)}`);
        }
        await new Promise((r) => setTimeout(r, 320));
      }

      const { count } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .eq("destination_id", dest.id);

      // Fill remaining slots to 10 with wiki landmarks
      let currentCount = count ?? 0;
      const maxFillAttempts = process.env.RELAX_MICROSTATE === "1" ? 30 : 12;
      let fillAttempts = 0;
      const triedAlts = new Set<string>();
      while (currentCount < 10 && fillAttempts < maxFillAttempts) {
        fillAttempts++;
        const alt = await findReplacementLandmark(city, country, existingNames, usedImages);
        if (!alt) {
          await new Promise((r) =>
            setTimeout(r, process.env.RELAX_MICROSTATE === "1" ? 2500 : 800)
          );
          continue;
        }
        const altKey = alt.name.toLowerCase();
        if (triedAlts.has(altKey) || existingNames.has(altKey)) continue;
        triedAlts.add(altKey);
        try {
          const enriched = await enrichPlace(
            {
              name: alt.name,
              wiki_title: alt.wikiTitle,
              lat: alt.lat,
              lng: alt.lng,
              image_url: alt.image_url,
              order_index: currentCount,
            },
            currentCount,
            city,
            country,
            usedImages
          );
          await supabase.from("places").insert({
            destination_id: dest.id,
            name: enriched.name,
            image_url: enriched.image_url,
            lat: enriched.lat,
            lng: enriched.lng,
            order_index: enriched.order_index,
            translations: enriched.translations,
          });
          existingNames.add(enriched.name.toLowerCase());
          countryExistingNames.add(enriched.name.toLowerCase());
          usedImages.add(enriched.image_url);
          countryUsedImages.add(enriched.image_url);
          inserted++;
          currentCount++;
          fillAttempts = 0;
          console.log(`  + ${city}: ${enriched.name} (auto-fill)`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          existingNames.add(alt.name.toLowerCase());
          console.warn(`  ✗ auto-fill skip ${city}: ${msg.slice(0, 100)}`);
        }
        await new Promise((r) =>
          setTimeout(r, process.env.RELAX_MICROSTATE === "1" ? 1200 : 400)
        );
      }

      const { count: finalCount } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .eq("destination_id", dest.id);
      const mark = finalCount === 10 ? "✓" : "⚠";
      console.log(`  ${mark} ${city}: ${finalCount}/10`);

      const { data: freshPlaces } = await supabase
        .from("places")
        .select("name, image_url, order_index")
        .eq("destination_id", dest.id);
      const cover = resolveCityCoverFromDb(dest.cover_image ?? undefined, freshPlaces ?? []);
      if (cover) {
        await supabase
          .from("destinations")
          .update({ cover_image: cover, updated_at: new Date().toISOString() })
          .eq("id", dest.id);
      }
    }
  }

  console.log(
    `\nDone: ${fixedImages} images, ${fixedText} wiki texts, ${inserted} inserts, ${replaced} replacements\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
