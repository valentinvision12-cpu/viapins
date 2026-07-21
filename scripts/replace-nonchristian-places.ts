#!/usr/bin/env npx tsx
/**
 * Replace mosques, synagogues, tekkes, and non-Christian temples in main seeds.
 * Usage:
 *   npx tsx scripts/replace-nonchristian-places.ts [--dry-run] [--import] [slug ...]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { findReplacementLandmark, getCityCoords } from "../src/lib/wiki-landmark-search";
import { enrichPlace } from "../src/lib/travel-seed";

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

const BAD_NAME =
  /\b(mosque|masjid|džamij|dzamij|synagogue|synagoge|tekke|teqe|minaret|bektashi)\b|Mosque–Cathedral|Mosque-Cathedral|Temple of All Religions|Temple of Debod|Temple of Artemis|Temple of Trajan|Temple of Olympian|Temple of Apollo|Temple of Augustus|Temple of Isis|Temple of Cybele|Temple of Mithras|Altar of Zeus|Sanctuary of Athena/i;

const ALLOW_NAME =
  /Church of Sant Miquel de la Mosquera|Romanian Athenaeum|Apollo Palace|Apollonia Archaeological/i;

function isBadPlace(name: string) {
  if (ALLOW_NAME.test(name)) return false;
  return BAD_NAME.test(name);
}

function isBadReplacement(name: string) {
  return (
    isBadPlace(name) ||
    /\b(cemetery|grave|tomb|mosque|synagogue|tekke|temple of)\b/i.test(name)
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.SEQUENTIAL_WIKI = "1";
  process.env.WIKI_DELAY_MS = process.env.WIKI_DELAY_MS || "700";

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const doImport = args.includes("--import");
  const slugs = args.filter((a) => !a.startsWith("--"));

  const seedsDir = join(process.cwd(), "data", "seeds");
  let files = readdirSync(seedsDir).filter(
    (f) =>
      f.endsWith(".json") &&
      !f.includes("phase") &&
      !f.includes("supplement") &&
      !f.includes("input") &&
      !f.includes("adventure") &&
      !f.includes("user-patch")
  );
  if (slugs.length) {
    const set = new Set(slugs.map((s) => s.replace(/\.json$/, "").toLowerCase()));
    files = files.filter((f) => set.has(f.replace(/\.json$/, "").toLowerCase()));
  }

  const supabase = doImport
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : null;

  let totalReplaced = 0;
  let totalFailed = 0;

  for (const file of files) {
    const seedPath = join(seedsDir, file);
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    const country = seed.country as string;
    let fileChanged = false;
    console.log(`\n=== ${country} (${file}) ===`);

    for (const citySeed of seed.cities || []) {
      const city = citySeed.city as string;
      const places = citySeed.places || [];
      const existing = new Set(
        places.map((p: { name: string }) => p.name.toLowerCase())
      );
      const badIdx: number[] = [];
      for (let i = 0; i < places.length; i++) {
        if (isBadPlace(places[i].name)) badIdx.push(i);
      }
      if (!badIdx.length) continue;

      let center: { lat: number; lng: number } | null = null;
      try {
        center = await getCityCoords(city, country);
      } catch {
        /* ignore */
      }

      for (const i of badIdx) {
        const old = places[i];
        console.log(`  ${city}: replace "${old.name}"`);
        if (dryRun) {
          totalReplaced++;
          continue;
        }

        let hit: Awaited<ReturnType<typeof findReplacementLandmark>> = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          await sleep(400 + attempt * 400);
          hit = await findReplacementLandmark(city, country, existing, center);
          if (hit && !isBadReplacement(hit.name)) break;
          if (hit) existing.add(hit.name.toLowerCase());
          hit = null;
        }

        if (!hit) {
          console.log(`    FAIL: no replacement`);
          totalFailed++;
          continue;
        }

        const oldName = old.name as string;
        places[i] = {
          ...old,
          name: hit.name,
          wiki_title: hit.wiki_title,
          lat: hit.lat,
          lng: hit.lng,
          description:
            hit.description || `${hit.name} — a landmark in ${city}, ${country}.`,
          seo_phrase: `${hit.name}: Guide to ${city}, ${country}`,
          seo_keywords: [hit.name, city, country, "landmarks", "travel"],
          type: /church|cathedral|chapel|monastery|abbey/i.test(hit.name)
            ? "church"
            : /museum|gallery/i.test(hit.name)
              ? "museum"
              : /park|lake|beach|garden|canyon|waterfall/i.test(hit.name)
                ? "nature"
                : "landmark",
          image_url: hit.image_url || undefined,
        };
        delete places[i].commons_file;
        existing.add(hit.name.toLowerCase());
        existing.delete(oldName.toLowerCase());

        for (const p of places) {
          if (!p.nearby_places) continue;
          p.nearby_places = p.nearby_places
            .map((n: string) =>
              n.toLowerCase() === oldName.toLowerCase() ? hit!.name : n
            )
            .filter((n: string) => !isBadPlace(n));
        }

        console.log(`    -> ${hit.name}`);
        totalReplaced++;
        fileChanged = true;

        if (supabase) {
          const { data: dest } = await supabase
            .from("destinations")
            .select("id")
            .ilike("country", country)
            .ilike("city", city)
            .maybeSingle();
          if (!dest) {
            console.log(`    DB skip: no destination ${city}`);
            continue;
          }
          let dbId: string | null = null;
          let orderIndex = old.order_index ?? i;
          const { data: dbPlace } = await supabase
            .from("places")
            .select("id, order_index")
            .eq("destination_id", dest.id)
            .eq("name", oldName)
            .maybeSingle();
          if (dbPlace) {
            dbId = dbPlace.id;
            orderIndex = dbPlace.order_index;
          } else {
            const { data: byOrder } = await supabase
              .from("places")
              .select("id, order_index")
              .eq("destination_id", dest.id)
              .eq("order_index", orderIndex)
              .maybeSingle();
            if (byOrder) {
              dbId = byOrder.id;
              orderIndex = byOrder.order_index;
            }
          }
          if (!dbId) {
            console.log(`    DB skip: place not found`);
            continue;
          }
          try {
            const used = new Set<string>();
            const enriched = await enrichPlace(
              places[i],
              orderIndex,
              city,
              country,
              used
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
              .eq("id", dbId);
            console.log(`    DB updated`);
          } catch (e) {
            console.log(`    DB enrich fail: ${String(e).slice(0, 100)}`);
          }
        }
      }
    }

    for (const p of seed.adventure?.places || []) {
      if (!isBadPlace(p.name)) continue;
      console.log(`  adventure: replace "${p.name}"`);
      if (dryRun) {
        totalReplaced++;
        continue;
      }
      const existing = new Set(
        (seed.adventure.places || []).map((x: { name: string }) =>
          x.name.toLowerCase()
        )
      );
      const hit = await findReplacementLandmark(country, country, existing, null);
      if (!hit || isBadReplacement(hit.name)) {
        console.log(`    FAIL adventure`);
        totalFailed++;
        continue;
      }
      p.name = hit.name;
      p.wiki_title = hit.wiki_title;
      p.lat = hit.lat;
      p.lng = hit.lng;
      p.description = hit.description;
      p.image_url = hit.image_url;
      delete p.commons_file;
      fileChanged = true;
      totalReplaced++;
      console.log(`    -> ${hit.name}`);
    }

    if (fileChanged && !dryRun) {
      writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
      console.log(`  saved ${file}`);
    }
  }

  console.log(
    `\nDone. replaced=${totalReplaced} failed=${totalFailed} dryRun=${dryRun}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
