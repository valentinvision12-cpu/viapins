#!/usr/bin/env npx tsx
/** Audit places missing images or descriptions for given countries */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { isBadImageUrl } from "../src/lib/wiki-image";
import {
  isCoordInCountry,
  isVaguePlace,
} from "../src/lib/precise-place-filter";

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

const checkHttp = process.argv.includes("--http");
const requestedCountries = process.argv
  .slice(2)
  .filter((arg) => arg !== "--http");

async function checkImage(url: string) {
  if (!url?.trim()) return false;
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const issues: {
    country: string;
    city: string;
    name: string;
    id: string;
    problem: string[];
    image_url: string;
    wiki_title?: string;
  }[] = [];

  let destinationsQuery = supabase
    .from("destinations")
    .select("id, city, country")
    .eq("published", true)
    .order("country")
    .order("city");
  if (requestedCountries.length) {
    destinationsQuery = destinationsQuery.in("country", requestedCountries);
  }
  const { data: destinations, error: destinationsError } =
    await destinationsQuery;
  if (destinationsError) throw destinationsError;

  for (const dest of destinations ?? []) {
    const country = dest.country;
    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("id, name, image_url, lat, lng, order_index, translations")
      .eq("destination_id", dest.id)
      .order("order_index");
    if (placesError) throw placesError;

    if ((places ?? []).length !== 10) {
      issues.push({
        country,
        city: dest.city,
        name: "(city total)",
        id: dest.id,
        problem: [`place_count_${(places ?? []).length}`],
        image_url: "",
      });
    }

    const imageCounts = new Map<string, number>();
    const nameCounts = new Map<string, number>();
    for (const place of places ?? []) {
      const image = place.image_url?.trim() ?? "";
      if (image) imageCounts.set(image, (imageCounts.get(image) ?? 0) + 1);
      const name = place.name.trim().toLowerCase();
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }

    for (const p of places ?? []) {
      const en = (
        p.translations as Record<
          string,
          { description?: string; wiki_text?: string; wiki_title?: string }
        >
      )?.en;
      const problems: string[] = [];
      const image = p.image_url?.trim() ?? "";

      if (!image) problems.push("no_image_url");
      else if (isBadImageUrl(image)) problems.push("non_photo_image");
      else if ((imageCounts.get(image) ?? 0) > 1)
        problems.push("duplicate_image");
      else if (checkHttp && !(await checkImage(image)))
        problems.push("broken_image");

      if (
        !Number.isFinite(p.lat) ||
        !Number.isFinite(p.lng) ||
        p.lat === 0 ||
        p.lng === 0
      ) {
        problems.push("missing_coordinates");
      } else if (!isCoordInCountry(p.lat, p.lng, country)) {
        problems.push("outside_country");
      }

      if (isVaguePlace(p.name, en?.description, country, p.lat, p.lng)) {
        problems.push("vague_or_invalid_place");
      }
      if ((nameCounts.get(p.name.trim().toLowerCase()) ?? 0) > 1) {
        problems.push("duplicate_place");
      }
      if (!en?.description?.trim()) problems.push("no_description");
      if (!en?.wiki_text?.trim()) problems.push("no_wiki_text");

      if (problems.length) {
        issues.push({
          country,
          city: dest.city,
          name: p.name,
          id: p.id,
          problem: problems,
          image_url: image,
          wiki_title: en?.wiki_title,
        });
      }
    }
  }

  const outPath = join(process.cwd(), "data", "content-audit.json");
  writeFileSync(outPath, JSON.stringify(issues, null, 2), "utf8");

  const byCountry = new Map<string, number>();
  for (const i of issues) {
    byCountry.set(i.country, (byCountry.get(i.country) ?? 0) + 1);
  }

  console.log(`\nTotal issues: ${issues.length}`);
  for (const [c, n] of byCountry) console.log(`  ${c}: ${n}`);
  console.log(`\nSaved: ${outPath}\n`);

  for (const i of issues.slice(0, 30)) {
    console.log(`${i.country} / ${i.city} / ${i.name}: ${i.problem.join(", ")}`);
  }
  if (issues.length > 30) console.log(`... +${issues.length - 30} more`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
