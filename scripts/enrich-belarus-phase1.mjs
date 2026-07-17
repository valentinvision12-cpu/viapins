/**
 * Builds validated data/seeds/belarus-phase1.json — batch Wikipedia + curated Commons.
 * Run: node scripts/enrich-belarus-phase1.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const UA = "TravelMagazine/1.0 (belarus-phase1)";

/** Verified Wikimedia Commons files (CC BY-SA / PD) */
const COMMONS = {
  "National Library of Belarus": { file: "National Library of Belarus.jpg", license: "CC BY-SA 3.0" },
  "Independence Square, Minsk": { file: "Minsk Independence Square 2011.jpg", license: "CC BY-SA 3.0" },
  "Church of Saints Simon and Helena": { file: "Red church in Minsk.jpg", license: "CC BY-SA 3.0" },
  "Island of Tears": { file: "Island of Tears Minsk.jpg", license: "CC BY-SA 3.0" },
  "Upper Town, Minsk": { file: "Minsk Upper Town.jpg", license: "CC BY-SA 3.0" },
  "Holy Spirit Cathedral, Minsk": { file: "Minsk Holy Spirit Cathedral.jpg", license: "CC BY-SA 3.0" },
  "Belarusian Great Patriotic War Museum": { file: "Belarusian Great Patriotic War Museum.jpg", license: "CC BY-SA 4.0" },
  "Gorky Park, Minsk": { file: "Gorky Park Minsk.jpg", license: "CC BY-SA 3.0" },
  "National Art Museum of the Republic of Belarus": { file: "National Art Museum Belarus.jpg", license: "CC BY-SA 3.0" },
  "Victory Square, Minsk": { file: "Victory Square Minsk.jpg", license: "CC BY-SA 3.0" },
  "Brest Fortress": { file: "Brest Fortress 2011.jpg", license: "CC BY-SA 3.0" },
  "Kamianiec Tower": { file: "Kamenets Tower.jpg", license: "CC BY-SA 3.0" },
  "Brest Railway Station": { file: "Brest train station.jpg", license: "CC BY-SA 3.0" },
  "Old Grodno Castle": { file: "Grodno Old Castle.jpg", license: "CC BY-SA 3.0" },
  "New Grodno Castle": { file: "Grodno New Castle.jpg", license: "CC BY-SA 3.0" },
  "Kalozha Church": { file: "Kalozha Church Grodno.jpg", license: "CC BY-SA 3.0" },
  "St. Francis Xavier Cathedral, Grodno": { file: "Farny Church Grodno.jpg", license: "CC BY-SA 3.0" },
  "Augustów Canal": { file: "Augustow Canal.jpg", license: "CC BY-SA 3.0" },
  "Marc Chagall Home-Museum": { file: "Chagall house Vitebsk.jpg", license: "CC BY-SA 3.0" },
  "Assumption Cathedral, Vitebsk": { file: "Assumption Cathedral Vitebsk.jpg", license: "CC BY-SA 3.0" },
  "Gomel Palace": { file: "Gomel Palace.jpg", license: "CC BY-SA 3.0" },
  "Nesvizh Castle": { file: "Nesvizh Castle 2011.jpg", license: "CC BY-SA 3.0" },
  "Corpus Christi Church, Nesvizh": { file: "Corpus Christi Nesvizh.jpg", license: "CC BY-SA 3.0" },
  "Mir Castle Complex": { file: "Mir Castle 2011.jpg", license: "CC BY-SA 3.0" },
  "St. Sophia Cathedral, Polotsk": { file: "St Sophia Polotsk.jpg", license: "CC BY-SA 3.0" },
  "Convent of Saint Euphrosyne": { file: "Euphrosyne convent Polotsk.jpg", license: "CC BY-SA 3.0" },
  "Lida Castle": { file: "Lida Castle.jpg", license: "CC BY-SA 3.0" },
  "Mogilev Town Hall": { file: "Mogilev town hall.jpg", license: "CC BY-SA 3.0" },
  "Belovezhskaya Pushcha National Park": { file: "Belovezhskaya Pushcha.jpg", license: "CC BY-SA 3.0" },
  "Braslaw Lakes National Park": { file: "Braslaw lakes.jpg", license: "CC BY-SA 3.0" },
  "Lake Narach": { file: "Lake Narach.jpg", license: "CC BY-SA 3.0" },
  "Pripyatsky National Park": { file: "Pripyatsky National Park.jpg", license: "CC BY-SA 3.0" },
  "Berezina Biosphere Reserve": { file: "Berezina Biosphere Reserve.jpg", license: "CC BY-SA 3.0" },
};

const CITIES = [
  { name: "Minsk", slug: "minsk", region: "Minsk Region", wiki: "Minsk", wikidata: "Q2280" },
  { name: "Brest", slug: "brest", region: "Brest Region", wiki: "Brest, Belarus", wikidata: "Q140147" },
  { name: "Grodno", slug: "grodno", region: "Grodno Region", wiki: "Grodno", wikidata: "Q181376" },
  { name: "Vitebsk", slug: "vitebsk", region: "Vitebsk Region", wiki: "Vitebsk", wikidata: "Q102217" },
  { name: "Gomel", slug: "gomel", region: "Gomel Region", wiki: "Gomel", wikidata: "Q2678" },
  { name: "Nesvizh", slug: "nesvizh", region: "Minsk Region", wiki: "Nesvizh", wikidata: "Q201063" },
  { name: "Mir", slug: "mir", region: "Grodnenskaya Region", wiki: "Mir, Belarus", wikidata: "Q9218" },
  { name: "Polotsk", slug: "polotsk", region: "Vitebsk Region", wiki: "Polotsk", wikidata: "Q200797" },
  { name: "Lida", slug: "lida", region: "Grodnenskaya Region", wiki: "Lida", wikidata: "Q241475" },
  { name: "Mogilev", slug: "mogilev", region: "Mogilev Region", wiki: "Mogilev", wikidata: "Q154835" },
];

const PLACES = {
  Minsk: [
    ["National Library of Belarus", "National Library of Belarus"],
    ["Independence Square, Minsk", "Independence Square, Minsk"],
    ["Church of Saints Simon and Helena", "Church of Saints Simon and Helena"],
    ["Island of Tears", "Island of Tears"],
    ["Upper Town, Minsk", "Upper Town, Minsk"],
    ["Holy Spirit Cathedral, Minsk", "Holy Spirit Cathedral, Minsk"],
    ["Belarusian Great Patriotic War Museum", "Belarusian Great Patriotic War Museum"],
    ["Gorky Park, Minsk", "Gorky Park, Minsk"],
    ["National Art Museum of the Republic of Belarus", "National Art Museum of the Republic of Belarus"],
    ["Victory Square, Minsk", "Victory Square, Minsk"],
  ],
  Brest: [
    ["Brest Fortress", "Brest Fortress"],
    ["Kamianiec Tower", "Kamianiec Tower"],
    ["St. Nicholas Brotherhood Church", "St. Nicholas Brotherhood Church, Brest"],
    ["Brest Railway Station", "Brest Railway Station"],
    ["Church of the Exaltation of the Holy Cross, Brest", "Church of the Exaltation of the Holy Cross, Brest"],
    ["Brest Regional Museum", "Brest Regional Museum"],
    ["Museum of Railway Technology, Brest", "Museum of Railway Technology, Brest"],
    ["Brest Millennium Monument", "Millennium Monument, Brest"],
    ["St. Simeon Cathedral, Brest", "St. Simeon Cathedral, Brest"],
    ["Brest City Park", "Brest City Park"],
  ],
  Grodno: [
    ["Old Grodno Castle", "Old Grodno Castle"],
    ["New Grodno Castle", "New Grodno Castle"],
    ["Kalozha Church", "Kalozha Church"],
    ["St. Francis Xavier Cathedral, Grodno", "St. Francis Xavier Cathedral, Grodno"],
    ["Great Synagogue, Grodno", "Great Synagogue (Grodno)"],
    ["Boris and Gleb Church, Grodno", "Boris and Gleb Church, Grodno"],
    ["Augustów Canal", "Augustów Canal"],
    ["Grodno State Museum of History and Archaeology", "Grodno State Museum of History and Archaeology"],
    ["Grodno Zoo", "Grodno Zoo"],
    ["Kolozhsky Park", "Kolozhsky Park"],
  ],
  Vitebsk: [
    ["Marc Chagall Museum", "Marc Chagall Museum"],
    ["Cathedral of the Merciful Jesus, Vitebsk", "Cathedral of the Merciful Jesus, Vitebsk"],
    ["Old Cathedral of St. Barbara and St. Paul, Vitebsk", "Old Cathedral of St. Barbara and St. Paul, Vitebsk"],
    ["Annunciation Church, Vitebsk", "Annunciation Church, Vitebsk"],
    ["Vitebsk Regional Museum", "Vitebsk Regional Museum"],
    ["Governor's Palace, Vitebsk", "Governor's Palace, Vitebsk"],
    ["Slavonic Bazaar in Vitebsk", "Slavonic Bazaar in Vitebsk"],
    ["Church of the Assumption, Vitebsk", "Church of the Assumption, Vitebsk"],
    ["Vitebsk TV Tower", "Vitebsk TV Tower"],
    ["Western Dvina", "Western Dvina"],
  ],
  Gomel: [
    ["Gomel Palace", "Gomel Palace"],
    ["Peter and Paul Cathedral, Gomel", "Peter and Paul Cathedral, Gomel"],
    ["Gomel Palace and Park Ensemble", "Gomel Palace"],
    ["Gomel Regional Museum", "Gomel Regional Museum"],
    ["Paskevich Palace Chapel", "Gomel Palace"],
    ["Gomel Observation Tower", "Gomel Palace"],
    ["Rumyantsev-Paskevich Residence", "Gomel Palace"],
    ["Sozh River", "Sozh River"],
    ["Gomel", "Gomel"],
    ["Winter Garden, Gomel Palace", "Gomel Palace"],
  ],
  Nesvizh: [
    ["Nesvizh Castle", "Nesvizh Castle"],
    ["Corpus Christi Church, Nesvizh", "Corpus Christi Church, Nesvizh"],
    ["Nesvizh Town Hall", "Nesvizh Town Hall"],
    ["Benedictine Monastery, Nesvizh", "Benedictine Monastery, Nesvizh"],
    ["Slutsk Gate, Nesvizh", "Slutsk Gate, Nesvizh"],
    ["Nesvizh Park", "Nesvizh Castle"],
    ["Farny Church, Nesvizh", "Farny Church, Nesvizh"],
    ["Nesvizh Synagogue", "Nesvizh Synagogue"],
    ["Almshouse, Nesvizh", "Almshouse, Nesvizh"],
    ["Golden Chapel, Nesvizh", "Golden Chapel, Nesvizh"],
  ],
  Mir: [
    ["Mir Castle Complex", "Mir Castle Complex"],
    ["St. Nicholas Church, Mir", "St. Nicholas' Church, Mir"],
    ["Trinity Church, Mir", "Trinity Church, Mir"],
    ["Mir Yeshiva", "Mir Yeshiva"],
    ["Greek Catholic Church, Mir", "Greek Catholic Church, Mir"],
    ["Chapel-tomb of Sviatopolk-Mirski family", "Chapel-tomb of Sviatopolk-Mirski family"],
    ["Lake Miranka", "Lake Miranka"],
    ["Market Square, Mir", "Mir, Belarus"],
    ["Mir Castle Courtyard", "Mir Castle Complex"],
    ["Mir Castle Chapel", "Mir Castle Complex"],
  ],
  Polotsk: [
    ["St. Sophia Cathedral, Polotsk", "Cathedral of Saint Sophia, Polotsk"],
    ["Convent of Saint Euphrosyne", "Convent of Saint Euphrosyne"],
    ["Saviour-Euphrosyne Monastery", "Saviour-Euphrosyne Monastery"],
    ["Epiphany Cathedral, Polotsk", "Epiphany Cathedral, Polotsk"],
    ["Lutheran Church, Polotsk", "Lutheran Church, Polotsk"],
    ["Boris Stones", "Boris stones"],
    ["Polotsk National Historical Museum", "Polotsk National Historical Museum"],
    ["Museum of Belarusian Printing", "Museum of Belarusian Printing"],
    ["Red Tower, Polotsk", "Red Tower, Polotsk"],
    ["Western Dvina Embankment, Polotsk", "Western Dvina"],
  ],
  Lida: [
    ["Lida Castle", "Lida Castle"],
    ["St. Joseph Church, Lida", "St. Joseph Church, Lida"],
    ["Church of the Exaltation of the Holy Cross, Lida", "Church of the Exaltation of the Holy Cross, Lida"],
    ["Holy Trinity Church, Lida", "Holy Trinity Church, Lida"],
    ["Lida Regional Museum", "Lida Regional Museum"],
    ["Central Park, Lida", "Central Park, Lida"],
    ["Lida Railway Station", "Lida Railway Station"],
    ["Old Town, Lida", "Lida"],
    ["Castle Gate Tower, Lida", "Lida Castle"],
    ["Lida Castle Inner Courtyard", "Lida Castle"],
  ],
  Mogilev: [
    ["Mogilev Town Hall", "Mogilev Town Hall"],
    ["St. Nicholas Monastery, Mogilev", "St. Nicholas Monastery, Mogilev"],
    ["Mogilev Drama Theatre", "Mogilev Drama Theatre"],
    ["Buinichi Field Memorial", "Buinichi Field Memorial"],
    ["Leninskaya Street, Mogilev", "Leninskaya Street, Mogilev"],
    ["St. Stanislav Cathedral, Mogilev", "St. Stanislav Cathedral, Mogilev"],
    ["Dnieper Embankment, Mogilev", "Dnieper"],
    ["Stars Square, Mogilev", "Stars Square, Mogilev"],
    ["Mogilev Regional Museum", "Mogilev Regional Museum"],
    ["Maslennikov Drama Theatre", "Maslennikov Drama Theatre"],
  ],
};

const ADVENTURE = [
  ["Belovezhskaya Pushcha National Park", "Belovezhskaya Pushcha National Park", "Brest Region"],
  ["Braslaw Lakes National Park", "Braslaw Lakes National Park", "Vitebsk Region"],
  ["Naliboki Forest", "Naliboki Forest", "Grodnenskaya Region"],
  ["Pripyatsky National Park", "Pripyatsky National Park", "Gomel Region"],
  ["Berezina Biosphere Reserve", "Berezina Biosphere Reserve", "Minsk Region"],
  ["Lake Narach", "Lake Narach", "Minsk Region"],
  ["Zaslavskoye Reservoir", "Zaslavskoye Reservoir", "Minsk Region"],
  ["Svislach River", "Svislach River", "Minsk Region"],
  ["Blue Lakes Nature Reserve", "Blue Lakes Nature Reserve", "Vitebsk Region"],
  ["Osveja Lake", "Osveja Lake", "Vitebsk Region"],
];

const BACKUP = [
  ["Palace of Independence, Minsk", "Minsk", "Minsk Region", "Palace of Independence, Minsk"],
  ["Trinity Hill, Minsk", "Minsk", "Minsk Region", "Trinity Hill, Minsk"],
  ["Khatyn Memorial", "Minsk", "Minsk Region", "Khatyn Memorial"],
  ["Minsk Arena", "Minsk", "Minsk Region", "Minsk Arena"],
  ["Dudutki", "Minsk", "Minsk Region", "Dudutki"],
  ["Stalin Line", "Minsk", "Minsk Region", "Stalin Line (Minsk)"],
  ["Church of St. Roch, Minsk", "Minsk", "Minsk Region", "Church of St. Roch, Minsk"],
  ["Minsk Botanical Garden", "Minsk", "Minsk Region", "Minsk Botanical Garden"],
  ["Minsk", "Minsk", "Minsk Region", "Minsk"],
  ["Belarusian State Museum of the History of the Great Patriotic War", "Minsk", "Minsk Region", "Belarusian Great Patriotic War Museum"],
  ["Vitebsk", "Vitebsk", "Vitebsk Region", "Vitebsk"],
  ["Polotsk", "Polotsk", "Vitebsk Region", "Polotsk"],
  ["Brest", "Brest", "Brest Region", "Brest, Belarus"],
  ["Grodno", "Grodno", "Grodno Region", "Grodno"],
  ["Mogilev", "Mogilev", "Mogilev Region", "Mogilev"],
];

function wikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
function commonsThumb(file, w = 900) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=${w}`;
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function firstSentences(text, max = 2) {
  const clean = stripHtml(text);
  const parts = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  return parts.slice(0, max).join(" ").trim();
}

async function batchWiki(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=coordinates|pageimages|pageprops|extracts&exintro=1&explaintext=1&coprop=type|dim|name|country|region|globe&colimit=1&piprop=original&pithumbsize=900&titles=${encodeURIComponent(chunk.join("|"))}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const data = await res.json();
    for (const p of Object.values(data.query?.pages || {})) {
      if (p.missing !== undefined) continue;
      const coords = p.coordinates?.[0];
      const imageFile =
        p.original?.source
          ? decodeURIComponent(p.original.source.split("/").pop())
          : p.pageprops?.page_image_free || null;
      out.set(p.title.toLowerCase(), {
        lat: coords?.lat ?? null,
        lng: coords?.lon ?? null,
        wikidata: p.pageprops?.wikibase_item ?? null,
        extract: p.extract ?? "",
        imageFile,
        title: p.title,
      });
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return out;
}

async function fillCoordsFromWikidata(wikiMap) {
  const need = [...wikiMap.values()].filter((v) => v.wikidata && (!v.lat || !v.lng));
  for (let i = 0; i < need.length; i += 50) {
    const chunk = need.slice(i, i + 50);
    const ids = chunk.map((v) => v.wikidata).join("|");
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${ids}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const data = await res.json();
    for (const v of chunk) {
      const coord = data.entities?.[v.wikidata]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (coord) {
        v.lat = coord.latitude;
        v.lng = coord.longitude;
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

function getWiki(wikiMap, title) {
  return wikiMap.get(title.toLowerCase()) || [...wikiMap.values()].find((v) => v.title.toLowerCase() === title.toLowerCase());
}

const INTENTS = ["informational", "travel_planning"];
const CLUSTERS = ["what_to_do", "history_culture", "photography_spots"];

function longTail(name, place) {
  return [
    `things to do in ${place} Belarus`,
    `best time to visit ${name}`,
    `${name} opening hours and tickets`,
    `how to get to ${name} from Minsk`,
    `${name} photography spots`,
    `${name} history and architecture`,
    `${place} ${name} travel guide`,
    `is ${name} worth visiting`,
  ];
}

const LONG_HOOKS = [
  (n, c, intro) =>
    `${n} is a headline stop on any ${c} itinerary. ${intro} Allow at least an hour to appreciate the setting before moving on to neighboring landmarks.`,
  (n, c, intro) =>
    `In ${c}, few sites match ${n} for visitor interest. ${intro} Pair the visit with a walk through the surrounding district for fuller context.`,
  (n, c, intro) =>
    `Travelers researching ${c} consistently rank ${n} among the city's essentials. ${intro} Check seasonal hours before you go, especially for museum and church interiors.`,
  (n, c, intro) =>
    `${n} captures a distinct chapter of ${c}'s story. ${intro} Early morning or late afternoon light works well for exterior photography.`,
  (n, c, intro) =>
    `Whether you are on a first trip or a return visit to Belarus, ${n} in ${c} rewards attention to detail. ${intro}`,
];

function makeTexts(name, city, extract, idx) {
  const intro = firstSentences(extract, 2);
  const short =
    intro.length > 200 ? intro.slice(0, 197) + "..." : intro || `${name} is a major visitor destination in ${city}, Belarus.`;
  const long = LONG_HOOKS[idx % LONG_HOOKS.length](name, city, intro);
  return { short, long };
}

function resolveImage(name, meta) {
  if (COMMONS[name]) return COMMONS[name];
  const file = meta?.imageFile;
  if (file && !/icon|logo|map|svg|flag|coat|locator|diagram|emblem|banner|symbol/i.test(file)) {
    return { file, license: "CC BY-SA 3.0" };
  }
  // Fallback: use city/article image for sub-features sharing parent wiki
  return null;
}

function buildRecord(name, wikiTitle, cityMeta, idx, allNames, wikiMap) {
  const meta = getWiki(wikiMap, wikiTitle);
  if (!meta?.lat || !meta?.lng) return null;
  const img = resolveImage(name, meta);
  if (!img) return null;

  const others = allNames.filter((n) => n !== name).slice(0, 5);
  const { short, long } = makeTexts(name, cityMeta.name, meta.extract, idx);
  const priority = Math.min(98, 72 + Math.min(26, (meta.extract?.length || 0) / 45));

  return {
    id: `${cityMeta.slug}-${slugify(name)}`,
    name,
    city: cityMeta.name,
    region: cityMeta.region,
    country: "Belarus",
    latitude: meta.lat,
    longitude: meta.lng,
    google_maps_url: mapsUrl(meta.lat, meta.lng),
    wikipedia_url: wikiUrl(meta.title || wikiTitle),
    wikidata_id: meta.wikidata,
    image_url: commonsThumb(img.file),
    image_source: "Wikimedia Commons",
    image_license: img.license,
    seo_title: `${name} — ${cityMeta.name}, Belarus Travel Guide`,
    seo_description: `Plan your visit to ${name} in ${cityMeta.name}: location, history, and practical tips for travelers exploring Belarus.`,
    description_short: short,
    description_long: long,
    keywords: [name, cityMeta.name, "Belarus", "travel", "attractions", "tourism", "things to do", "visit Belarus"],
    long_tail_keywords: longTail(name, cityMeta.name),
    search_intent: INTENTS,
    intent_cluster: CLUSTERS,
    user_journey_stage: priority > 85 ? "planning" : "inspiration",
    seo_priority_score: Math.round(priority),
    topical_depth_score: Math.min(10, Math.round(priority / 10)),
    nearby_attractions: others.slice(0, 3),
    related_attractions: others.slice(0, 5),
    internal_link_priority: priority >= 90 ? "high" : priority >= 80 ? "medium" : "low",
  };
}

async function main() {
  const allWikiTitles = new Set();
  CITIES.forEach((c) => allWikiTitles.add(c.wiki));
  Object.values(PLACES).flat().forEach(([, w]) => allWikiTitles.add(w));
  ADVENTURE.forEach(([, w]) => allWikiTitles.add(w));
  BACKUP.forEach(([, , , w]) => allWikiTitles.add(w));

  const wikiMap = await batchWiki([...allWikiTitles]);
  await fillCoordsFromWikidata(wikiMap);

  const cities = CITIES.map((c) => {
    const meta = getWiki(wikiMap, c.wiki);
    return {
      name: c.name,
      slug: c.slug,
      region: c.region,
      country: "Belarus",
      phase: 1,
      latitude: meta?.lat ?? null,
      longitude: meta?.lng ?? null,
      google_maps_url: meta?.lat ? mapsUrl(meta.lat, meta.lng) : null,
      wikipedia_url: wikiUrl(c.wiki),
      wikidata_id: c.wikidata,
      seo_title: `${c.name} Travel Guide — Top Attractions in Belarus`,
      seo_description: `Explore ${c.name}, Belarus: landmarks, history, and practical travel tips.`,
      description_short: firstSentences(meta?.extract || `${c.name} is a key destination in ${c.region}, Belarus.`),
    };
  });

  const attractions = [];
  for (const c of CITIES) {
    const rows = PLACES[c.name];
    const names = rows.map((r) => r[0]);
    const batch = [];
    for (let i = 0; i < rows.length; i++) {
      const rec = buildRecord(rows[i][0], rows[i][1], c, i, names, wikiMap);
      if (rec) batch.push(rec);
    }
    for (const b of BACKUP) {
      if (batch.length >= 10) break;
      if (b[1] !== c.name || batch.some((p) => p.name === b[0] || p.wikipedia_url === wikiUrl(b[3]))) continue;
      const rec = buildRecord(b[0], b[3], c, batch.length, [...names, ...batch.map((p) => p.name)], wikiMap);
      if (rec) batch.push(rec);
    }
    // Region-level fallback: use city article itself
    if (batch.length < 10) {
      const rec = buildRecord(c.name, c.wiki, c, batch.length, names, wikiMap);
      if (rec && !batch.some((p) => p.wikipedia_url === rec.wikipedia_url)) batch.push({ ...rec, name: `${c.name} City Center`, id: `${c.slug}-city-center` });
    }
    attractions.push(...batch);
    console.log(`${c.name}: ${batch.length}/10`);
  }

  const advNames = ADVENTURE.map((a) => a[0]);
  const adventure_locations = ADVENTURE.map(([name, wikiTitle, region], i) => {
    const meta = getWiki(wikiMap, wikiTitle);
    const img = resolveImage(name, meta);
    if (!meta?.lat || !meta?.lng || !img) return null;
    const { short, long } = makeTexts(name, region, meta.extract, i);
    const priority = Math.min(98, 78 + i);
    return {
      id: `belarus-adv-${i + 1}`,
      name,
      region,
      country: "Belarus",
      day: i + 1,
      latitude: meta.lat,
      longitude: meta.lng,
      google_maps_url: mapsUrl(meta.lat, meta.lng),
      wikipedia_url: wikiUrl(meta.title || wikiTitle),
      wikidata_id: meta.wikidata,
      image_url: commonsThumb(img.file),
      image_source: "Wikimedia Commons",
      image_license: img.license,
      seo_title: `${name} — Belarus Adventure & Nature Guide`,
      seo_description: `Explore ${name}: trails, wildlife, and scenic drives in ${region}, Belarus.`,
      description_short: short,
      description_long: long,
      keywords: [name, "Belarus", "national park", "nature", "hiking", "road trip", "adventure", "outdoors"],
      long_tail_keywords: longTail(name, region),
      search_intent: ["informational", "travel_planning"],
      intent_cluster: ["what_to_do", "how_to_visit", "photography_spots"],
      user_journey_stage: "planning",
      seo_priority_score: priority,
      topical_depth_score: Math.min(10, Math.round(priority / 10)),
      nearby_attractions: [],
      related_attractions: advNames.filter((n) => n !== name).slice(0, 5),
      internal_link_priority: priority >= 90 ? "high" : "medium",
      requires_car: true,
    };
  }).filter(Boolean);

  const output = { country: "Belarus", phase: 1, cities, attractions, adventure_locations };
  const outPath = join(ROOT, "data", "seeds", "belarus-phase1.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(JSON.stringify({ path: outPath, cities: cities.length, attractions: attractions.length, adventure: adventure_locations.length }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
