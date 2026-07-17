#!/usr/bin/env npx tsx
/** Resolve correct Wikimedia URLs and patch Vienna places missing images */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

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

const FIXES: Record<
  string,
  { commons_files: string[]; wiki_title?: string }
> = {
  "Schönbrunn Palace": {
    commons_files: ["Schloss Schönbrunn Wien 2014.jpg"],
    wiki_title: "Schönbrunn Palace",
  },
  "Hofburg Palace": {
    commons_files: [
      "Hofburg Vienna Jan 2006.jpg",
      "Wien Hofburg Neue Burg.jpg",
      "Michaelerplatz Wien.jpg",
      "Wien - Hofburg (2).JPG",
    ],
    wiki_title: "Hofburg",
  },
  Karlskirche: {
    commons_files: [
      "Wien Karlskirche 2008.jpg",
      "Vienna - Karlskirche.jpg",
      "Karlskirche Wien bei Nacht.jpg",
      "Wien - Karlskirche.JPG",
    ],
    wiki_title: "Karlskirche, Vienna",
  },
};

async function resolveCommonsUrl(fileNames: string[]): Promise<{ url: string; file: string }> {
  for (const fileName of fileNames) {
    const title = fileName.startsWith("File:") ? fileName : `File:${fileName}`;
    const p = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|thumburl",
      iiurlwidth: "960",
      format: "json",
    });
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`);
    const data = await res.json();
    const page = Object.values(data.query?.pages ?? {})[0] as {
      missing?: boolean;
      imageinfo?: { thumburl?: string; url?: string }[];
    };
    if (page?.missing) continue;
    const info = page?.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (url) return { url, file: fileName };
  }
  throw new Error(`No URL for any of: ${fileNames.join(", ")}`);
}

async function resolveWikiThumb(wikiTitle: string): Promise<string> {
  const p = new URLSearchParams({
    action: "query",
    titles: wikiTitle,
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "960",
    format: "json",
    redirects: "1",
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${p}`);
  const data = await res.json();
  const page = Object.values(data.query?.pages ?? {})[0] as {
    thumbnail?: { source?: string };
  };
  const url = page?.thumbnail?.source;
  if (!url) throw new Error(`No Wikipedia image for ${wikiTitle}`);
  return url;
}

async function resolvePlaceImage(
  cfg: { commons_files: string[]; wiki_title?: string }
): Promise<{ url: string; file: string }> {
  try {
    return await resolveCommonsUrl(cfg.commons_files);
  } catch {
    if (!cfg.wiki_title) throw new Error("No commons or wiki title");
    const url = await resolveWikiThumb(cfg.wiki_title);
    return { url, file: "" };
  }
}

async function check(url: string) {
  const r = await fetch(url, { method: "HEAD" });
  return r.status;
}

async function main() {
  loadEnvLocal();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resolved: Record<string, { image_url: string; commons_file: string }> =
    {};

  for (const [name, cfg] of Object.entries(FIXES)) {
    const { url: image_url, file: commons_file } = await resolvePlaceImage(cfg);
    const status = await check(image_url);
    console.log(`${name}: ${status}`, image_url.slice(0, 90));
    if (status !== 200) throw new Error(`Bad URL for ${name}`);
    resolved[name] = { image_url, commons_file: cfg.commons_file };
    await new Promise((r) => setTimeout(r, 400));
  }

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", "Austria")
    .ilike("city", "Vienna")
    .maybeSingle();

  if (!dest) throw new Error("Vienna not found");

  for (const [name, { image_url, commons_file }] of Object.entries(resolved)) {
    const { data: places } = await supabase
      .from("places")
      .select("id, translations")
      .eq("destination_id", dest.id)
      .eq("name", name);

    const place = places?.[0];
    if (!place) {
      console.warn(`Skip DB (not found): ${name}`);
      continue;
    }

    const translations = { ...(place.translations as Record<string, unknown>) };
    for (const lang of Object.keys(translations)) {
      const t = translations[lang] as Record<string, unknown>;
      translations[lang] = { ...t, commons_file };
    }

    await supabase
      .from("places")
      .update({
        image_url,
        translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", place.id);

    console.log(`✓ DB updated: ${name}`);
  }

  // Patch seed files
  const seedPath = join(process.cwd(), "data", "seeds", "austria.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const vienna = seed.cities.find(
    (c: { city: string }) => c.city === "Vienna"
  );
  for (const place of vienna.places) {
    const fix = resolved[place.name];
    if (fix) {
      place.image_url = fix.image_url;
      place.commons_file = fix.commons_file;
    }
  }
  writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf8");
  console.log("✓ austria.json updated");

  const suppPath = join(
    process.cwd(),
    "data",
    "seeds",
    "austria-landmarks-supplement.json"
  );
  const supp = JSON.parse(readFileSync(suppPath, "utf8"));
  for (const place of supp.Vienna) {
    const fix = resolved[place.name];
    if (fix) {
      place.image_url = fix.image_url;
      place.commons_file = fix.commons_file;
    }
  }
  writeFileSync(suppPath, JSON.stringify(supp, null, 2), "utf8");
  console.log("✓ supplement updated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
