/**
 * Build 100/100 seeds for microstates from phase1-input JSON.
 * Usage: node scripts/finish-microstates.mjs [slug...]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { inferPlaceType, visitDurationHours } from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";
import { isVaguePlace } from "./precise-place-filter.mjs";
import { isBadImageUrl } from "./bad-image-filter.mjs";
import { MICROSTATE_CURATED } from "./microstate-curated.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];
const SEASON_WARM = ["spring", "summer", "autumn"];
const SLUGS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["liechtenstein", "monaco", "north-macedonia", "san-marino"];

function normCity(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function wikiTitleFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/wiki\/([^#?]+)/);
  return m ? decodeURIComponent(m[1].replace(/_/g, " ")) : "";
}

function commonsFromImageUrl(url) {
  if (!url?.includes("upload.wikimedia.org")) return "";
  const m = url.match(/\/commons\/[^/]+\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1].replace(/_/g, " ")) : "";
}

function citySeo(name, country) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [`things to do in ${name}`, `${name} ${country} travel guide`, `best places to visit in ${name}`, `${name} landmarks`],
  };
}

function isWikiGarbage(a) {
  const short = a.description_short || "";
  return / — a notable landmark in /.test(short) || / — a must-see landmark on a /.test(short);
}

function okAttraction(a, country, relaxed = false) {
  if (!a?.name?.trim() || / Landmark \d+$/i.test(a.name)) return false;
  if (isWikiGarbage(a) && !relaxed) return false;
  if (isDeathRelatedPlace(a.name, a.description_short || a.description_long)) return false;
  const lat = a.latitude ?? a.lat;
  const lng = a.longitude ?? a.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return false;
  if (relaxed && a.image_url && !isBadImageUrl(a.image_url)) return true;
  if (isVaguePlace(a.name, a.description_short || a.description_long, country, lat, lng)) {
    return Boolean(a.image_url && !isBadImageUrl(a.image_url));
  }
  return true;
}

function matchesCity(a, city) {
  if (normCity(a.city) === normCity(city)) return true;
  const n = (a.name || "").toLowerCase();
  const c = city.toLowerCase();
  return n.includes(c) || (a.description_short || "").toLowerCase().includes(c);
}

/** Curated landmarks for cities that lack enough phase1 data */
const CURATED = {
  liechtenstein: {
    Triesen: [
      { name: "Gasometer Triesen", wiki_title: "Gasometer (Triesen)", lat: 47.1019, lng: 9.5281, wikipedia_url: "https://en.wikipedia.org/wiki/Gasometer_(Triesen)", image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Gasometer_Triesen.jpg" },
      { name: "St. Mamertus Church Triesen", wiki_title: "Triesen", lat: 47.1069, lng: 9.5272, wikipedia_url: "https://en.wikipedia.org/wiki/Triesen", image_url: "https://upload.wikimedia.org/wikipedia/commons/e/ef/View_of_Triesen.jpg" },
      { name: "Lawena Museum", wiki_title: "Lawena Museum", lat: 47.1075, lng: 9.5265, wikipedia_url: "https://en.wikipedia.org/wiki/Lawena_Museum", image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Lawena_Museum_Triesen.jpg" },
    ],
    Ruggell: [
      { name: "St. Fridolin Parish Church Ruggell", wiki_title: "Ruggell", lat: 47.2431, lng: 9.5253, wikipedia_url: "https://en.wikipedia.org/wiki/Ruggell", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Ruggell_Noflerstrasse.jpg" },
      { name: "Ruggeller Riet Nature Reserve", wiki_title: "Ruggeller Riet", lat: 47.256, lng: 9.518, wikipedia_url: "https://en.wikipedia.org/wiki/Ruggeller_Riet", image_url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Ruggeller_Riet.jpg" },
    ],
    Gamprin: [
      { name: "Bendern Parish Church", wiki_title: "Bendern", lat: 47.2167, lng: 9.5033, wikipedia_url: "https://en.wikipedia.org/wiki/Bendern", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Kirchh%C3%BCgel_Bendern.jpg" },
      { name: "Rheinpark Stadium", wiki_title: "Rheinpark Stadion", lat: 47.2183, lng: 9.5022, wikipedia_url: "https://en.wikipedia.org/wiki/Rheinpark_Stadion", image_url: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Rheinpark_Stadion.jpg" },
    ],
    Planken: [
      { name: "St. Anton Parish Church Planken", wiki_title: "Planken", lat: 47.1858, lng: 9.5442, wikipedia_url: "https://en.wikipedia.org/wiki/Planken", image_url: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Planken_Liechtenstein.jpg" },
      { name: "Eschnerberg Viewpoint", wiki_title: "Eschnerberg", lat: 47.178, lng: 9.548, wikipedia_url: "https://en.wikipedia.org/wiki/Eschnerberg", image_url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Vaduz_Castle_Liechtenstein.jpg" },
    ],
  },
  monaco: {
    Fontvieille: [
      { name: "Louis II Stadium", wiki_title: "Stade Louis II", lat: 43.7275, lng: 7.4156, wikipedia_url: "https://en.wikipedia.org/wiki/Stade_Louis_II", image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Stade_Louis_II_Monaco.jpg" },
      { name: "Monaco Heliport", wiki_title: "Monaco Heliport", lat: 43.7258, lng: 7.4194, wikipedia_url: "https://en.wikipedia.org/wiki/Monaco_Heliport", image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Monaco_Heliport.jpg" },
      { name: "Chapelle de la Visitation", wiki_title: "Chapelle de la Visitation (Monaco)", lat: 43.7286, lng: 7.4172, wikipedia_url: "https://en.wikipedia.org/wiki/Chapelle_de_la_Visitation_(Monaco)", image_url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Palais_Princier_de_Monaco.jpg" },
    ],
    Larvotto: [
      { name: "Grimaldi Forum", wiki_title: "Grimaldi Forum", lat: 43.7442, lng: 7.4297, wikipedia_url: "https://en.wikipedia.org/wiki/Grimaldi_Forum", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Grimaldi_Forum.jpg" },
      { name: "Japanese Garden Monaco", wiki_title: "Jardin Japonais (Monaco)", lat: 43.7456, lng: 7.4311, wikipedia_url: "https://en.wikipedia.org/wiki/Japanese_Garden,_Monaco", image_url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Japanese_Garden_Monaco.jpg" },
    ],
    "Jardin Exotique": [
      { name: "Exotic Garden of Monaco", wiki_title: "Jardin Exotique de Monaco", lat: 43.7317, lng: 7.4136, wikipedia_url: "https://en.wikipedia.org/wiki/Jardin_Exotique_de_Monaco", image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Jardin_Exotique_Monaco.jpg" },
    ],
    "Les Moneghetti": [
      { name: "Saint Devota Chapel", wiki_title: "Saint Devota Chapel", lat: 43.7342, lng: 7.4194, wikipedia_url: "https://en.wikipedia.org/wiki/Saint_Devota_Chapel", image_url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Palais_Princier_de_Monaco.jpg" },
    ],
    "La Colle": [
      { name: "Tête de Chien", wiki_title: "Tête de Chien", lat: 43.7325, lng: 7.4011, wikipedia_url: "https://en.wikipedia.org/wiki/T%C3%AAte_de_Chien", image_url: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Monte_Carlo_Casino_historical_facade.jpg" },
    ],
    "Les Révoires": [
      { name: "Museum of Prehistoric Anthropology", wiki_title: "Museum of Prehistoric Anthropology", lat: 43.7314, lng: 7.4142, wikipedia_url: "https://en.wikipedia.org/wiki/Museum_of_Prehistoric_Anthropology", image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Jardin_Exotique_Monaco.jpg" },
    ],
    "Saint Michel": [
      { name: "Saint Michel Chapel Monaco", wiki_title: "Saint Michel Chapel, Monaco", lat: 43.7311, lng: 7.4208, wikipedia_url: "https://en.wikipedia.org/wiki/Saint_Michel_Chapel,_Monaco", image_url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Palais_Princier_de_Monaco.jpg" },
    ],
  },
  "north-macedonia": {
    Bitola: [
      { name: "Heraclea Lyncestis", wiki_title: "Heraclea Lyncestis", lat: 41.0119, lng: 21.3417, wikipedia_url: "https://en.wikipedia.org/wiki/Heraclea_Lyncestis", image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Heraclea_Lyncestis_Bitola.jpg" },
      { name: "Clock Tower Bitola", wiki_title: "Clock Tower (Bitola)", lat: 41.0311, lng: 21.3344, wikipedia_url: "https://en.wikipedia.org/wiki/Clock_Tower_(Bitola)", image_url: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Ambientalna_ulica_Marsal_Tito-Bitola_%2810%29.jpg" },
    ],
    Gostivar: [
      { name: "Church of St. Cyril and Methodius Gostivar", wiki_title: "Gostivar", lat: 41.7961, lng: 20.9086, wikipedia_url: "https://en.wikipedia.org/wiki/Gostivar", image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Gostivar_%28North_Macedonia%29.jpg" },
    ],
    Veles: [
      { name: "Clock Tower Veles", wiki_title: "Veles, North Macedonia", lat: 41.7156, lng: 21.7756, wikipedia_url: "https://en.wikipedia.org/wiki/Veles,_North_Macedonia", image_url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Veles_%28North_Macedonia%29.jpg" },
    ],
    Vinica: [
      { name: "Vinica Fortress", wiki_title: "Vinica, North Macedonia", lat: 41.8828, lng: 22.5092, wikipedia_url: "https://en.wikipedia.org/wiki/Vinica,_North_Macedonia", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Vinica_%28North_Macedonia%29.jpg" },
    ],
    Tetovo: [
      { name: "Painted Mosque", wiki_title: "Painted Mosque, Tetovo", lat: 42.0103, lng: 20.9714, wikipedia_url: "https://en.wikipedia.org/wiki/Painted_Mosque,_Tetovo", image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Šarena_Džamija%2C_Tetovo.jpg" },
      { name: "Arabati Baba Tekke", wiki_title: "Arabati Baba Tekḱe", lat: 42.0156, lng: 20.9639, wikipedia_url: "https://en.wikipedia.org/wiki/Arabati_Baba_Tek%E2%80%99e", image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Arabati_Baba_Tekke.jpg" },
    ],
    Kumanovo: [
      { name: "Church of St. George Kumanovo", wiki_title: "Kumanovo", lat: 42.1322, lng: 21.7144, wikipedia_url: "https://en.wikipedia.org/wiki/Kumanovo", image_url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Kumanovo_City_Hall.jpg" },
      { name: "Kosturnica Memorial", wiki_title: "Kosturnica Memorial", lat: 42.1278, lng: 21.7083, wikipedia_url: "https://en.wikipedia.org/wiki/Kosturnica_Memorial", image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Kosturnica_Memorial.jpg" },
    ],
    Prilep: [
      { name: "Treskavec Monastery", wiki_title: "Treskavec Monastery", lat: 41.3167, lng: 21.5833, wikipedia_url: "https://en.wikipedia.org/wiki/Treskavec_Monastery", image_url: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Treskavec_Monastery.jpg" },
      { name: "Markovi Kuli", wiki_title: "Markovi Kuli", lat: 41.3458, lng: 21.5536, wikipedia_url: "https://en.wikipedia.org/wiki/Markovi_Kuli", image_url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Panorama_of_Prilep%2C_2019.jpg" },
    ],
    Struga: [
      { name: "Church of St. Sophia Struga", wiki_title: "Church of St. Sophia, Ohrid", lat: 41.1781, lng: 20.6786, wikipedia_url: "https://en.wikipedia.org/wiki/Church_of_St._Sophia,_Ohrid", image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Sveta_Sofija_Ohrid.jpg" },
      { name: "Black Drin River Springs", wiki_title: "Black Drin", lat: 41.1775, lng: 20.6778, wikipedia_url: "https://en.wikipedia.org/wiki/Black_Drin", image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Struga_%28North_Macedonia%29.jpg" },
    ],
  },
  "san-marino": {
    Acquaviva: [
      { name: "Church of Saint Ubaldo", wiki_title: "Acquaviva (San Marino)", lat: 43.9453, lng: 12.4181, wikipedia_url: "https://en.wikipedia.org/wiki/Acquaviva_(San_Marino)", image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/San_Marino_Rocca_Guaita.jpg" },
    ],
    Faetano: [
      { name: "Church of San Paolo Faetano", wiki_title: "Faetano", lat: 43.9283, lng: 12.4981, wikipedia_url: "https://en.wikipedia.org/wiki/Faetano", image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/San_Marino_Rocca_Guaita.jpg" },
    ],
    Montegiardino: [
      { name: "University of San Marino", wiki_title: "University of the Republic of San Marino", lat: 43.9056, lng: 12.4811, wikipedia_url: "https://en.wikipedia.org/wiki/University_of_the_Republic_of_San_Marino", image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/San_Marino_Rocca_Guaita.jpg" },
    ],
    Chiesanuova: [
      { name: "Chiesanuova Parish Church", wiki_title: "Chiesanuova", lat: 43.9047, lng: 12.4214, wikipedia_url: "https://en.wikipedia.org/wiki/Chiesanuova", image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/San_Marino_Rocca_Guaita.jpg" },
    ],
    Dogana: [
      { name: "Dogana Border Plaza", wiki_title: "Dogana", lat: 43.9783, lng: 12.4889, wikipedia_url: "https://en.wikipedia.org/wiki/Dogana", image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/San_Marino_Rocca_Guaita.jpg" },
    ],
  },
};

function toPlace(p, cityName, country, idx) {
  const imageUrl = (p.image_url || "").trim();
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.wiki_title || p.name,
    lat: p.latitude ?? p.lat,
    lng: p.longitude ?? p.lng,
    order_index: idx,
    description: p.description_short?.trim() || p.description_long?.slice(0, 220)?.trim() || p.description || p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl && !isBadImageUrl(imageUrl) ? imageUrl : "",
    seo_priority: p.seo_priority_score ?? 92 - idx,
    search_intent: ["informational", "travel_planning"],
    type: inferPlaceType(p.name),
    best_season: SEASON_ALL,
    visit_duration_hours: visitDurationHours(inferPlaceType(p.name)),
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

function toAdventure(p, country, idx) {
  const imageUrl = (p.image_url || "").trim();
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(p.wikipedia_url) || p.name,
    region: p.region || p.city || country,
    lat: p.latitude ?? p.lat,
    lng: p.longitude ?? p.lng,
    day: idx + 1,
    order_index: idx,
    requires_car: true,
    tags: ["nature", "hidden_gem", "adventure", ...SEASON_WARM],
    description: p.description_short || p.description || p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl && !isBadImageUrl(imageUrl) ? imageUrl : "",
    seo_priority: p.seo_priority_score ?? 95 - idx,
    best_season: SEASON_ALL,
    visit_duration_hours: 4,
    type: "nature",
  };
}

function buildSlug(slug) {
  const inputPath = join(ROOT, `data/seeds/${slug}-phase1-input.json`);
  if (!existsSync(inputPath)) throw new Error(`Missing ${inputPath}`);
  const phase1 = JSON.parse(readFileSync(inputPath, "utf8"));
  const country = phase1.country;
  let cityNames = phase1.cities.map((c) => c.name).slice(0, 10);
  if (slug === "north-macedonia") {
    cityNames = ["Skopje", "Ohrid", "Bitola", "Gostivar", "Veles", "Vinica", "Tetovo", "Kumanovo", "Prilep", "Struga"];
  }

  const seen = new Set();
  const relaxed = true;
  const pool = (phase1.attractions || []).filter((a) => {
    const hasRich =
      Boolean(a.id) ||
      (a.description_long || "").trim().length > 30 ||
      Boolean(a.image_url?.trim()) ||
      ((a.seo_priority_score ?? 0) >= 85 && !isWikiGarbage(a));
    return hasRich && okAttraction(a, country, relaxed);
  });
  const byCity = new Map(cityNames.map((c) => [c, []]));

  for (const city of cityNames) {
    const local = pool
      .filter((a) => matchesCity(a, city) && !seen.has(a.name))
      .sort((a, b) => (b.seo_priority_score ?? 0) - (a.seo_priority_score ?? 0));
    for (const a of local.slice(0, 10)) {
      byCity.get(city).push(a);
      seen.add(a.name);
    }
  }

  const spare = pool
    .filter((a) => !seen.has(a.name))
    .sort((a, b) => (b.seo_priority_score ?? 0) - (a.seo_priority_score ?? 0));

  for (const city of cityNames) {
    const list = byCity.get(city);
    while (list.length < 10 && spare.length) {
      list.push(spare.shift());
      seen.add(list[list.length - 1].name);
    }
  }

  const curated = { ...(MICROSTATE_CURATED[slug] || {}), ...(CURATED[slug] || {}) };
  for (const city of cityNames) {
    const list = byCity.get(city);
    const extras = curated[city] || [];
    for (const c of extras) {
      if (list.length >= 10 || seen.has(c.name)) continue;
      list.push({
        ...c,
        description_short: c.description || `${c.name} — ${city}, ${country}.`,
        seo_priority_score: 88,
        keywords: [c.name, city, country],
      });
      seen.add(c.name);
    }
    while (list.length < 10 && spare.length) {
      const a = spare.shift();
      a.city = city;
      list.push(a);
      seen.add(a.name);
    }
  }

  let adv = (phase1.adventure_locations || []).filter((a) => okAttraction(a, country));
  if (adv.length < 10) {
    adv = [...adv, ...pool.filter((a) => !adv.some((x) => x.name === a.name))].slice(0, 10);
  }
  adv = adv.slice(0, 10);

  const existingPath = join(ROOT, `data/seeds/${slug}.json`);
  let heroImage = "";
  try {
    heroImage = JSON.parse(readFileSync(existingPath, "utf8")).adventure?.hero_image || "";
  } catch {}

  const seed = {
    version: 2,
    country,
    published: true,
    cities: cityNames.map((cityName) => ({
      city: cityName,
      tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
      wiki_title: cityName,
      seo: citySeo(cityName, country),
      places: byCity.get(cityName).map((p, i) => toPlace(p, cityName, country, i)),
    })),
    adventure: {
      title: `${country} Scenic Road Trip`,
      subtitle: `Explore ${country} beyond the cities — nature, coastlines, and scenic routes.`,
      wiki_title: country,
      hero_image: heroImage,
      totalDays: 10,
      seo: {
        title: `${country} Road Trip Adventure`,
        description: `Plan a ${country} road trip with GPS stops and scenic routes.`,
        intro: `Explore ${country} beyond the cities with this adventure route.`,
        keywords: [`${country} road trip`, `${country} by car`],
      },
      places: adv.map((p, i) => toAdventure(p, country, i)),
    },
  };

  writeFileSync(join(ROOT, `data/seeds/${slug}.json`), JSON.stringify(seed, null, 2) + "\n");
  const total = seed.cities.reduce((n, c) => n + c.places.length, 0);
  console.log(`\n✓ ${slug}.json: ${total}/100 places, ${seed.adventure.places.length}/10 adv`);
  for (const c of seed.cities) console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
  return total;
}

for (const slug of SLUGS) {
  try {
    buildSlug(slug);
  } catch (e) {
    console.error(`✗ ${slug}:`, e.message);
  }
}
