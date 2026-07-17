#!/usr/bin/env npx tsx
/** Fix Vienna landmarks: Hofburg image + replace Kunsthistorisches with Karlskirche */
import { readFileSync, existsSync } from "fs";
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

const HOFBURG = {
  name: "Hofburg Palace",
  image_url:
    "https://upload.wikimedia.org/wikipedia/commons/4/4f/Wien_-_Michaelertrakt_der_Hofburg.JPG",
  lat: 48.206,
  lng: 16.365,
  order_index: 1,
  translations: {
    en: {
      description:
        "Imperial palace complex in Vienna — former Habsburg residence and seat of power.",
      wiki_text:
        "The Hofburg is the former principal imperial palace of the Habsburg dynasty in Vienna.",
      wiki_title: "Hofburg",
      commons_file: "Wien - Michaelertrakt der Hofburg.JPG",
    },
  },
};

const KARLSKIRCHE = {
  name: "Karlskirche",
  image_url:
    "https://upload.wikimedia.org/wikipedia/commons/a/a4/Wien_-_Karlskirche.JPG",
  lat: 48.1984,
  lng: 16.3717,
  order_index: 6,
  translations: {
    en: {
      description:
        "Baroque church on Karlsplatz — one of Vienna's finest landmarks with a grand green dome.",
      wiki_text:
        "Karlskirche is a Baroque church on Karlsplatz in Vienna, dedicated to Saint Charles Borromeo.",
      wiki_title: "Karlskirche, Vienna",
      commons_file: "Wien - Karlskirche.JPG",
    },
  },
};

async function main() {
  loadEnvLocal();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .ilike("country", "Austria")
    .ilike("city", "Vienna")
    .maybeSingle();

  if (!dest) {
    console.error("Vienna destination not found");
    process.exit(1);
  }

  const { data: places } = await supabase
    .from("places")
    .select("id, name, order_index")
    .eq("destination_id", dest.id);

  const byName = new Map((places ?? []).map((p) => [p.name.toLowerCase(), p]));

  // Remove Kunsthistorisches Museum
  const kh = byName.get("kunsthistorisches museum");
  if (kh) {
    await supabase.from("places").delete().eq("id", kh.id);
    console.log("✓ Removed Kunsthistorisches Museum");
  }

  // Upsert Hofburg
  const hofburg = byName.get("hofburg palace");
  if (hofburg) {
    await supabase
      .from("places")
      .update({
        image_url: HOFBURG.image_url,
        lat: HOFBURG.lat,
        lng: HOFBURG.lng,
        translations: HOFBURG.translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hofburg.id);
    console.log("✓ Updated Hofburg Palace");
  } else {
    await supabase.from("places").insert({
      destination_id: dest.id,
      ...HOFBURG,
    });
    console.log("✓ Inserted Hofburg Palace");
  }

  // Upsert Karlskirche
  const karl = byName.get("karlskirche");
  if (karl) {
    await supabase
      .from("places")
      .update({
        image_url: KARLSKIRCHE.image_url,
        lat: KARLSKIRCHE.lat,
        lng: KARLSKIRCHE.lng,
        translations: KARLSKIRCHE.translations,
        order_index: KARLSKIRCHE.order_index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", karl.id);
    console.log("✓ Updated Karlskirche");
  } else {
    await supabase.from("places").insert({
      destination_id: dest.id,
      ...KARLSKIRCHE,
    });
    console.log("✓ Inserted Karlskirche");
  }

  const { count } = await supabase
    .from("places")
    .select("id", { count: "exact", head: true })
    .eq("destination_id", dest.id);

  console.log(`\nVienna now has ${count} places`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
