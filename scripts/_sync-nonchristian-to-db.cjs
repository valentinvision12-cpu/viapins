const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const BAD =
  /\b(mosque|masjid|mezquita|d[zž]amij|cami\b|tekke|teqe|synagogue|synagog|gurdwara|pagoda|minaret|shinto|jinja|jingu|tenmangu|inari|vihara|klenteng|mithras|shrine|temple|kul sharif|istiqlal|borobudur|sri mariamman)\b/i;
const CHRISTIAN =
  /\b(church|cathedral|chapel|basilica|monastery|abbey|orthodox|catholic|christian|baptist|lutheran|protestant|anglican|sacred heart)\b/i;

function isBad(name) {
  const n = name || "";
  if (/\b(mosque|mezquita|masjid|synagogue|tekke|džamij|dzamij|cami)\b/i.test(n))
    return true;
  if (CHRISTIAN.test(n) && !/\b(mosque|mezquita|synagogue|tekke|temple)\b/i.test(n))
    return false;
  return BAD.test(n);
}

async function main() {
  loadEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const seedsDir = path.join(process.cwd(), "data", "seeds");
  const argSlugs = process.argv
    .slice(2)
    .map((s) => s.replace(/\.json$/, "").toLowerCase());
  let files = fs
    .readdirSync(seedsDir)
    .filter(
      (f) =>
        f.endsWith(".json") &&
        !/phase1|supplement|input|partial|adventure/i.test(f)
    );
  if (argSlugs.length) {
    files = files.filter((f) =>
      argSlugs.includes(f.replace(/\.json$/, "").toLowerCase())
    );
  }

  let updated = 0;
  let failed = 0;

  for (const file of files) {
    const seed = JSON.parse(
      fs.readFileSync(path.join(seedsDir, file), "utf8")
    );
    console.log("\n=== " + seed.country + " ===");
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", seed.country);

    for (const citySeed of seed.cities || []) {
      const dest = (dests || []).find(
        (d) => d.city.toLowerCase() === String(citySeed.city).toLowerCase()
      );
      if (!dest) continue;

      const { data: dbPlaces } = await supabase
        .from("places")
        .select("id, name, order_index, translations")
        .eq("destination_id", dest.id);

      for (const dbp of dbPlaces || []) {
        if (!isBad(dbp.name)) continue;
        const seedPlace = (citySeed.places || []).find(
          (p) => Number(p.order_index) === Number(dbp.order_index)
        );
        if (!seedPlace || isBad(seedPlace.name)) {
          console.log(
            "  NO_MATCH " +
              citySeed.city +
              " #" +
              dbp.order_index +
              " " +
              dbp.name
          );
          failed++;
          continue;
        }

        const translations = {
          ...(dbp.translations || {}),
          en: {
            ...((dbp.translations && dbp.translations.en) || {}),
            description: seedPlace.description || seedPlace.name,
            seo_phrase: seedPlace.seo_phrase || seedPlace.name,
            wiki_title: seedPlace.wiki_title || seedPlace.name,
          },
        };

        const { error } = await supabase
          .from("places")
          .update({
            name: seedPlace.name,
            lat: seedPlace.lat,
            lng: seedPlace.lng,
            image_url: seedPlace.image_url || null,
            translations,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbp.id);

        if (error) {
          console.log("  FAIL " + dbp.name + ": " + error.message);
          failed++;
        } else {
          console.log(
            "  OK " + citySeed.city + ": " + dbp.name + " -> " + seedPlace.name
          );
          updated++;
        }
      }
    }
  }

  console.log("\n=== remaining ===");
  for (const file of files) {
    const seed = JSON.parse(
      fs.readFileSync(path.join(seedsDir, file), "utf8")
    );
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", seed.country);
    for (const d of dests || []) {
      const { data: places } = await supabase
        .from("places")
        .select("name")
        .eq("destination_id", d.id);
      for (const p of places || []) {
        if (isBad(p.name)) console.log("  STILL " + d.city + " / " + p.name);
      }
    }
  }
  console.log("updated=" + updated + " failed=" + failed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
