#!/usr/bin/env node
/**
 * Precise coordinates via OpenStreetMap Nominatim + seed sync.
 * Fixes wiki_title (city → landmark), maps_query, lat/lng in seeds + Supabase.
 *
 * Usage:
 *   node scripts/resolve-osm-places.mjs --dry-run lithuania
 *   node scripts/resolve-osm-places.mjs --city Panevėžys lithuania
 *   node scripts/resolve-osm-places.mjs lithuania
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const LOCALES = ["en", "es", "fr", "de", "it"];
const DELAY_MS = Number(process.env.OSM_DELAY_MS || 2000);
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "LuxuryTravelMagazine/1.0 (travel-magazine)";

const COUNTRY_BBOX = {
  Lithuania: { minLat: 53.8, maxLat: 56.5, minLng: 20.9, maxLng: 26.9 },
  Latvia: { minLat: 55.6, maxLat: 58.1, minLng: 20.9, maxLng: 28.3 },
  Estonia: { minLat: 57.5, maxLat: 59.7, minLng: 21.7, maxLng: 28.2 },
  Romania: { minLat: 43.6, maxLat: 48.3, minLng: 20.2, maxLng: 29.7 },
  Bulgaria: { minLat: 41.2, maxLat: 44.2, minLng: 22.3, maxLng: 28.6 },
  Greece: { minLat: 34.5, maxLat: 41.8, minLng: 19.3, maxLng: 29.7 },
  Norway: { minLat: 57.9, maxLat: 71.2, minLng: 4.5, maxLng: 31.2 },
  Finland: { minLat: 59.5, maxLat: 70.1, minLng: 20.5, maxLng: 31.6 },
  Poland: { minLat: 49.0, maxLat: 54.9, minLng: 14.1, maxLng: 24.2 },
  Italy: { minLat: 36.6, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 },
  France: { minLat: 41.3, maxLat: 51.1, minLng: -5.2, maxLng: 9.6 },
  Germany: { minLat: 47.2, maxLat: 55.1, minLng: 5.8, maxLng: 15.1 },
  Spain: { minLat: 27.5, maxLat: 43.8, minLng: -18.5, maxLng: 4.5 },
  Turkey: { minLat: 35.8, maxLat: 42.1, minLng: 25.9, maxLng: 44.8 },
  Iceland: { minLat: 63.2, maxLat: 66.6, minLng: -24.5, maxLng: -13.5 },
  Albania: { minLat: 39.6, maxLat: 42.7, minLng: 19.1, maxLng: 21.1 },
  Croatia: { minLat: 42.3, maxLat: 46.6, minLng: 13.4, maxLng: 19.5 },
  Serbia: { minLat: 42.2, maxLat: 46.2, minLng: 18.8, maxLng: 23.0 },
  Hungary: { minLat: 45.7, maxLat: 48.6, minLng: 16.1, maxLng: 22.9 },
  Austria: { minLat: 46.4, maxLat: 49.0, minLng: 9.5, maxLng: 17.2 },
  Czechia: { minLat: 48.5, maxLat: 51.1, minLng: 12.0, maxLng: 18.9 },
  "Czech Republic": { minLat: 48.5, maxLat: 51.1, minLng: 12.0, maxLng: 18.9 },
  Slovakia: { minLat: 47.7, maxLat: 49.6, minLng: 16.8, maxLng: 22.6 },
  Slovenia: { minLat: 45.4, maxLat: 46.9, minLng: 13.3, maxLng: 16.6 },
  Ukraine: { minLat: 44.3, maxLat: 52.4, minLng: 22.1, maxLng: 40.2 },
  Belarus: { minLat: 51.2, maxLat: 56.2, minLng: 23.1, maxLng: 32.8 },
  Moldova: { minLat: 45.4, maxLat: 48.5, minLng: 26.6, maxLng: 30.2 },
  Russia: { minLat: 41.2, maxLat: 82.0, minLng: 19.6, maxLng: 180.0 },
  Portugal: { minLat: 36.9, maxLat: 42.2, minLng: -9.6, maxLng: -6.2 },
  Ireland: { minLat: 51.4, maxLat: 55.4, minLng: -10.5, maxLng: -5.9 },
  "United Kingdom": { minLat: 49.8, maxLat: 60.9, minLng: -8.7, maxLng: 1.8 },
  Netherlands: { minLat: 50.7, maxLat: 53.6, minLng: 3.3, maxLng: 7.2 },
  Belgium: { minLat: 49.5, maxLat: 51.5, minLng: 2.5, maxLng: 6.4 },
  Luxembourg: { minLat: 49.4, maxLat: 50.2, minLng: 5.7, maxLng: 6.5 },
  Switzerland: { minLat: 45.8, maxLat: 47.8, minLng: 5.9, maxLng: 10.5 },
  Denmark: { minLat: 54.5, maxLat: 57.8, minLng: 8.0, maxLng: 15.2 },
  Sweden: { minLat: 55.3, maxLat: 69.1, minLng: 11.0, maxLng: 24.2 },
  Montenegro: { minLat: 41.8, maxLat: 43.6, minLng: 18.4, maxLng: 20.4 },
  "North Macedonia": { minLat: 40.8, maxLat: 42.4, minLng: 20.4, maxLng: 23.0 },
  Kosovo: { minLat: 41.8, maxLat: 43.3, minLng: 20.0, maxLng: 21.8 },
  "Bosnia and Herzegovina": { minLat: 42.5, maxLat: 45.3, minLng: 15.7, maxLng: 19.6 },
  Cyprus: { minLat: 34.5, maxLat: 35.7, minLng: 32.2, maxLng: 34.6 },
  Malta: { minLat: 35.8, maxLat: 36.1, minLng: 14.1, maxLng: 14.6 },
  Andorra: { minLat: 42.4, maxLat: 42.7, minLng: 1.4, maxLng: 1.8 },
  Monaco: { minLat: 43.7, maxLat: 43.8, minLng: 7.4, maxLng: 7.5 },
  "San Marino": { minLat: 43.9, maxLat: 44.0, minLng: 12.4, maxLng: 12.5 },
  Liechtenstein: { minLat: 47.0, maxLat: 47.3, minLng: 9.4, maxLng: 9.7 },
};

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inCountry(lat, lng, country) {
  const b = COUNTRY_BBOX[country];
  if (!b) return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

function cityRadiusKm(country) {
  if (["Liechtenstein", "Monaco", "San Marino", "Andorra"].includes(country)) return 8;
  if (country === "Malta") return 18;
  return 35;
}

function isCityWiki(wiki, city, country) {
  const w = (wiki || "").trim().toLowerCase();
  const c = city.trim().toLowerCase();
  const aliases = new Set([c, ...(CITY_ALIASES[city] ?? []).map((a) => a.toLowerCase())]);
  if ([...aliases].some((a) => w === a || w.startsWith(`${a},`))) return true;
  return w === `${c}, ${country.toLowerCase()}`;
}

function stripParen(name) {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function commonsQuery(commons) {
  if (!commons?.trim()) return null;
  const base = commons
    .split("/")[0]
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+20\d{2}\s*$/i, "")
    .trim();
  return base.length >= 4 ? base : null;
}

function squareStreetQuery(name, city) {
  const m = name.match(/\b([A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+)\s+Square\b/i);
  if (!m) return null;
  return `${m[1]} a., ${city}`;
}

const COUNTRY_CODES = {
  Bulgaria: "bg",
  Lithuania: "lt",
  Latvia: "lv",
  Estonia: "ee",
  Romania: "ro",
  Greece: "gr",
  Norway: "no",
  Finland: "fi",
  Poland: "pl",
  Italy: "it",
  France: "fr",
  Germany: "de",
  Spain: "es",
  Turkey: "tr",
  Iceland: "is",
  Albania: "al",
  Croatia: "hr",
  Serbia: "rs",
  Hungary: "hu",
  Austria: "at",
  "Czech Republic": "cz",
  Slovakia: "sk",
  Slovenia: "si",
  Ukraine: "ua",
  Belarus: "by",
  Moldova: "md",
  Russia: "ru",
  Portugal: "pt",
  Ireland: "ie",
  "United Kingdom": "gb",
  Netherlands: "nl",
  Belgium: "be",
  Luxembourg: "lu",
  Switzerland: "ch",
  Denmark: "dk",
  Sweden: "se",
  Montenegro: "me",
  "North Macedonia": "mk",
  Kosovo: "xk",
  "Bosnia and Herzegovina": "ba",
  Cyprus: "cy",
  Malta: "mt",
  Andorra: "ad",
  Monaco: "mc",
  "San Marino": "sm",
  Liechtenstein: "li",
};

/** Latin / Cyrillic spellings OSM may return instead of the seed city name */
const CITY_ALIASES = {
  Nessebar: ["nesebar", "nessebar", "несебър"],
  Sofia: ["софия"],
  Plovdiv: ["пловдив"],
  Varna: ["варна"],
  Burgas: ["бургас"],
};

function cityAliases(city) {
  const low = city.toLowerCase();
  const extra = CITY_ALIASES[city] ?? [];
  return new Set([low, ...extra.map((s) => s.toLowerCase())]);
}

function hitMatchesCity(hit, city) {
  const aliases = cityAliases(city);
  const display = (hit.display_name || "").toLowerCase();
  for (const a of aliases) {
    if (display.includes(a)) return true;
  }
  const addr = hit.address ?? {};
  const fields = [addr.city, addr.town, addr.village, addr.municipality, addr.county]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  for (const f of fields) {
    for (const a of aliases) {
      if (f.includes(a) || a.includes(f)) return true;
    }
  }
  return false;
}

function scoreHit(hit, place) {
  const blob = `${hit.name || ""} ${hit.display_name || ""}`.toLowerCase();
  const tokens = place.name
    .toLowerCase()
    .replace(/\b(church of|cathedral of|museum|the)\b/gi, "")
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 3);
  let score = 0;
  for (const t of tokens) {
    if (blob.includes(t)) score += 2;
  }
  if (place.wiki_title) {
    for (const t of place.wiki_title
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((w) => w.length > 4)) {
      if (blob.includes(t)) score += 1;
    }
  }
  if (["attraction", "place_of_worship", "museum", "viewpoint"].includes(hit.type)) {
    score += 1;
  }
  return score;
}

async function fetchWikiAndWikidataCoords(wikiTitle, country) {
  const title = wikiTitle?.trim();
  if (!title) return null;

  const url =
    "https://en.wikipedia.org/w/api.php?action=query&prop=coordinates|pageprops&format=json&colimit=1&titles=" +
    encodeURIComponent(title);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing) return null;

  const c = page.coordinates?.[0];
  if (c?.lat != null && c?.lon != null) {
    const lat = roundCoord(c.lat);
    const lng = roundCoord(c.lon);
    if (inCountry(lat, lng, country)) {
      return {
        lat,
        lng,
        formattedAddress: `${page.title}, ${country}`,
        query: `wikipedia:${title}`,
        source: "wikipedia",
      };
    }
  }

  const wdId = page.pageprops?.wikibase_item;
  if (!wdId) return null;
  await sleep(350);
  const wdRes = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${wdId}`,
    { headers: { "User-Agent": UA } }
  );
  if (!wdRes.ok) return null;
  const wdData = await wdRes.json();
  const coord = wdData.entities?.[wdId]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  if (!coord?.latitude || !coord?.longitude) return null;
  const lat = roundCoord(coord.latitude);
  const lng = roundCoord(coord.longitude);
  if (!inCountry(lat, lng, country)) return null;
  return {
    lat,
    lng,
    formattedAddress: `${page.title}, ${country}`,
    query: `wikidata:${wdId}`,
    source: "wikidata",
  };
}

function buildQueries(place, city, country) {
  const seen = new Set();
  const out = [];
  const add = (q) => {
    const t = q.trim();
    if (!t || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    out.push(t);
  };

  const short = stripParen(place.name);
  const commons = commonsQuery(place.commons_file);
  const mapsQuery = place.maps_query?.trim() || `${place.name}, ${city}, ${country}`;

  add(mapsQuery);
  if (city === "Nessebar") add(mapsQuery.replace(/Nessebar/g, "Nesebar"));
  if (/old town/i.test(place.name)) {
    add(`${place.name}, ${country}`);
    if (country === "Bulgaria" && /nessebar|nesebar/i.test(city)) add("Старият Несебър");
  }
  if (/windmill|mill|мелница/i.test(place.name)) {
    add(`Old ${city} Windmill, Bulgaria`);
    add(`Old Nesebar Windmill, Bulgaria`);
    add(`Мелницата, Nesebar, Bulgaria`);
  }
  if (/church|cathedral|chapel|mosque|basilica/i.test(place.name)) {
    add(`${place.name}, ${city}`);
    if (place.wiki_title && !isCityWiki(place.wiki_title, city, country)) {
      add(`${place.wiki_title}`);
      add(`${place.wiki_title}, ${country}`);
    }
    const saint = place.name.match(
      /(?:Church|Cathedral|Chapel) of (?:the )?(?:Saint|St\.?)\s+(.+)/i
    );
    if (saint) {
      const s = saint[1].trim();
      add(`Saint ${s} ${city}`);
      add(`St ${s} ${city}`);
      add(`${s}, ${city}`);
      if (country === "Bulgaria") add(`Свети ${s} Несебър`);
    }
  }
  if (/museum|gallery|monument|fortress|castle|palace/i.test(place.name)) {
    add(`${place.name}, ${city}, ${country}`);
    if (place.name.includes("Archaeological Museum")) {
      add(`Archaeological Museum, ${city}`);
      add(`Archaeological Museum Mesembria ${city}`);
    }
  }
  if (short !== place.name) add(`${short}, ${city}, ${country}`);
  if (commons) {
    add(`${commons}, ${city}`);
    add(`${commons}, ${city}, ${country}`);
  }
  if (place.wiki_title && !isCityWiki(place.wiki_title, city, country)) {
    add(`${place.wiki_title}, ${city}, ${country}`);
  }
  add(`${place.name}, ${city}`);
  add(`${short} ${city}`);
  const sq = squareStreetQuery(place.name, city);
  if (sq) {
    add(`${sq}, ${country}`);
    add(sq);
  }

  return out;
}

async function nominatimSearch(query, city, country, cityCenter, place) {
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  const cc = COUNTRY_CODES[country];
  if (cc) url.searchParams.set("countrycodes", cc);

  let data = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (res.status === 429) {
      const wait = DELAY_MS * (attempt + 2);
      console.warn(`  … OSM rate limit, wait ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    data = await res.json();
    break;
  }
  if (!data) return null;
  if (!data?.length) return null;

  let best = null;
  let bestScore = -1;

  for (const hit of data) {
    const lat = roundCoord(Number(hit.lat));
    const lng = roundCoord(Number(hit.lon));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (!inCountry(lat, lng, country)) continue;
    if (!hitMatchesCity(hit, city)) continue;

    if (
      cityCenter &&
      haversineKm(lat, lng, cityCenter.lat, cityCenter.lng) > cityRadiusKm(country)
    ) {
      continue;
    }

    const score = scoreHit(hit, place || { name: query.split(",")[0] || query });
    if (score > bestScore) {
      bestScore = score;
      best = hit;
    }
  }

  if (!best) return null;

  return {
    lat: roundCoord(Number(best.lat)),
    lng: roundCoord(Number(best.lon)),
    formattedAddress: best.display_name || query,
    query,
    source: "osm",
  };
}

async function resolvePlace(place, city, country, cityCenter) {
  if (place.wiki_title && !isCityWiki(place.wiki_title, city, country)) {
    const wiki = await fetchWikiAndWikidataCoords(place.wiki_title, country);
    await sleep(400);
    if (wiki) return wiki;
  }

  for (const q of buildQueries(place, city, country)) {
    const match = await nominatimSearch(q, city, country, cityCenter, place);
    await sleep(DELAY_MS);
    if (match) return match;
  }

  return null;
}

function coordKey(lat, lng) {
  return `${roundCoord(lat)},${roundCoord(lng)}`;
}

/** Re-resolve places that share identical coords within a city. */
async function splitDuplicateCoords(places, city, country, cityCenter) {
  const groups = new Map();
  for (const p of places) {
    const k = coordKey(p.lat, p.lng);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }

  let fixed = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const place of group) {
      if (!place.wiki_title || isCityWiki(place.wiki_title, city, country)) continue;
      const wiki = await fetchWikiAndWikidataCoords(place.wiki_title, country);
      await sleep(400);
      if (wiki && coordKey(wiki.lat, wiki.lng) !== coordKey(place.lat, place.lng)) {
        console.log(
          `  ↻ split dup ${city} / ${place.name}\n    ${place.lat},${place.lng} → ${wiki.lat}, ${wiki.lng} (${wiki.source})`
        );
        place.lat = wiki.lat;
        place.lng = wiki.lng;
        fixed++;
        continue;
      }
      const match = await resolvePlace(place, city, country, cityCenter);
      if (match && coordKey(match.lat, match.lng) !== coordKey(place.lat, place.lng)) {
        console.log(
          `  ↻ split dup ${city} / ${place.name}\n    → ${match.lat}, ${match.lng} (${match.source || "osm"})`
        );
        place.lat = match.lat;
        place.lng = match.lng;
        fixed++;
      }
    }
  }
  return fixed;
}

function cityCenterFromPlaces(places) {
  const valid = places.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0)
  );
  if (valid.length < 2) return null;
  return {
    lat: valid.reduce((s, p) => s + p.lat, 0) / valid.length,
    lng: valid.reduce((s, p) => s + p.lng, 0) / valid.length,
  };
}

function slugToSeedPath(slug) {
  return join(process.cwd(), "data", "seeds", `${slug}.json`);
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const seedOnly = argv.includes("--seed-only");
  const cityIdx = argv.indexOf("--city");
  const cityFilter = cityIdx >= 0 ? argv[cityIdx + 1] : null;
  const slugs = argv.filter((a) => !a.startsWith("--") && a !== cityFilter);
  return { dryRun, seedOnly, cityFilter, slugs };
}

async function syncSeed(slug, cityFilter, dryRun, onPlace) {
  const seedPath = slugToSeedPath(slug);
  if (!existsSync(seedPath)) return { updated: 0, failed: 0 };

  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const country = seed.country;
  let updated = 0;
  let failed = 0;
  let changed = false;

  for (const citySeed of seed.cities ?? []) {
    if (cityFilter && citySeed.city.toLowerCase() !== cityFilter.toLowerCase()) continue;

    const city = citySeed.city;
    const cityCenter = cityCenterFromPlaces(citySeed.places ?? []);

    for (const place of citySeed.places ?? []) {
      if (isCityWiki(place.wiki_title, city, country) && place.name !== city) {
        place.wiki_title = place.name;
        changed = true;
      }

      const mapsQuery =
        place.maps_query?.trim() || `${place.name}, ${city}, ${country}`;
      if (!place.maps_query?.trim()) {
        place.maps_query = mapsQuery;
        changed = true;
      }

      try {
        const match = await resolvePlace(place, city, country, cityCenter);
        if (!match) {
          console.warn(`  ⚠ seed no match: ${city} / ${place.name}`);
          failed++;
          continue;
        }

        console.log(
          `  ✓ seed ${city} / ${place.name}\n    ${match.formattedAddress}\n    ${place.lat},${place.lng} → ${match.lat}, ${match.lng}`
        );

        place.lat = match.lat;
        place.lng = match.lng;
        updated++;
        changed = true;

        if (onPlace) await onPlace({ city, place, match, country });
      } catch (err) {
        console.warn(`  ✗ seed ${city} / ${place.name}: ${err.message}`);
        failed++;
      }
    }

    const split = await splitDuplicateCoords(citySeed.places ?? [], city, country, cityCenter);
    if (split > 0) {
      updated += split;
      changed = true;
    }
  }

  if (changed && !dryRun) {
    writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
    console.log(`  Saved ${slug}.json`);
  }

  return { updated, failed };
}

async function syncDb(slug, cityFilter, dryRun) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let countryQuery = supabase
    .from("destinations")
    .select("id, city, country")
    .order("country")
    .order("city");

  if (slug) {
    const seedPath = slugToSeedPath(slug);
    if (existsSync(seedPath)) {
      const seed = JSON.parse(readFileSync(seedPath, "utf8"));
      countryQuery = countryQuery.ilike("country", seed.country);
    } else {
      countryQuery = countryQuery.ilike("country", `%${slug.replace(/-/g, " ")}%`);
    }
  }

  const { data: dests, error: destErr } = await countryQuery;
  if (destErr) throw destErr;

  const filtered = (dests ?? []).filter(
    (d) => !cityFilter || d.city.toLowerCase() === cityFilter.toLowerCase()
  );

  console.log(`\n→ DB OSM geocode: ${filtered.length} cities${dryRun ? " (dry-run)" : ""}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const dest of filtered) {
    const { data: places } = await supabase
      .from("places")
      .select("id, name, lat, lng, translations")
      .eq("destination_id", dest.id)
      .order("order_index");

    const cityCenter = cityCenterFromPlaces(places ?? []);

    for (const place of places ?? []) {
      const trans = place.translations ?? {};
      const en = trans.en ?? {};

      const seedPlace = {
        name: place.name,
        wiki_title: en.wiki_title || place.name,
        commons_file: en.commons_file,
        maps_query: en.maps_query?.trim() || `${place.name}, ${dest.city}, ${dest.country}`,
      };

      if (isCityWiki(seedPlace.wiki_title, dest.city, dest.country)) {
        seedPlace.wiki_title = place.name;
      }

      try {
        const match = await resolvePlace(seedPlace, dest.city, dest.country, cityCenter);

        if (!match) {
          console.warn(`  ⚠ db no match: ${dest.city} / ${place.name}`);
          failed++;
          continue;
        }

        const translations = { ...trans };
        for (const loc of LOCALES) {
          translations[loc] = {
            ...(translations[loc] ?? {}),
            formatted_address: match.formattedAddress,
            maps_query: `${place.name}, ${dest.city}, ${dest.country}`,
            wiki_title: seedPlace.wiki_title,
            osm_resolved: "1",
          };
        }

        console.log(
          `  ✓ db ${dest.city} / ${place.name}\n    ${match.formattedAddress}\n    ${match.lat}, ${match.lng}`
        );

        if (!dryRun) {
          const { error } = await supabase
            .from("places")
            .update({
              lat: match.lat,
              lng: match.lng,
              translations,
              updated_at: new Date().toISOString(),
            })
            .eq("id", place.id);
          if (error) throw error;
        }

        updated++;
      } catch (err) {
        console.warn(`  ✗ ${dest.city} / ${place.name}: ${err.message}`);
        failed++;
      }
    }
  }

  return { updated, skipped, failed };
}

async function main() {
  loadEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const { dryRun, seedOnly, cityFilter, slugs } = parseArgs(process.argv.slice(2));

  if (!slugs.length) {
    console.error("Usage: node scripts/resolve-osm-places.mjs [--dry-run] [--seed-only] [--city City] lithuania");
    process.exit(1);
  }

  for (const slug of slugs) {
    console.log(`\n=== ${slug} ===`);
    const seedStats = await syncSeed(slug, cityFilter, dryRun);
    console.log(`  Seed: ${seedStats.updated} updated, ${seedStats.failed} failed`);

    if (!seedOnly && !dryRun) {
      console.log(`  → sync seed → DB`);
      execSync(`node scripts/sync-country-places-db.mjs ${slug}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } else if (!seedOnly) {
      const dbStats = await syncDb(slug, cityFilter, dryRun);
      console.log(
        `  DB: ${dbStats.updated} updated, ${dbStats.skipped} skipped, ${dbStats.failed} failed`
      );
    }
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
