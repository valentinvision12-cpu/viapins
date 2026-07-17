#!/usr/bin/env node
/** Build hungary-landmarks-supplement.json with Wikipedia coordinates */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const LANDMARKS = {
  Debrecen: [
    "Great Reformed Church of Debrecen",
    "Déri Museum",
    "Debrecen Zoo",
    "Aquaticum Debrecen",
    "St. Anne's Cathedral, Debrecen",
    "Csokonai Theatre",
    "MODEM Centre for Modern and Contemporary Arts",
    "Reformed College of Debrecen",
    "Medgyessy Ferenc Memorial Museum",
    "Church of the Holy Cross, Debrecen",
  ],
  Szeged: [
    "Votive Church of Szeged",
    "Dóm Square (Szeged)",
    "Móra Ferenc Museum",
    "New Synagogue (Szeged)",
    "Bridge of Sighs (Szeged)",
    "Anna Spring, Szeged",
    "Klauzál Square",
    "National Memorial Hall (Hungary)",
    "Pick Salami and Szeged Paprika Museum",
    "Szeged Water Tower",
  ],
  Pécs: [
    "Mosque of pasha Qasim",
    "Pécs Cathedral",
    "Zsolnay Cultural Quarter",
    "Barbican (Pécs)",
    "Pécs TV Tower",
    "Csontváry Museum",
    "Victor Vasarely Museum",
    "Széchenyi Square, Pécs",
    "National Theatre of Pécs",
    "Tettye ruins",
  ],
  Győr: [
    "Győr Basilica",
    "Bishop's Castle (Győr)",
    "Carmelite Church (Győr)",
    "Győr City Hall",
    "Rába Quelle",
    "Napóleon House (Győr)",
    "Széchenyi Square, Győr",
    "Xántus János Zoo and Botanical Garden",
    "Rába Island",
    "Abbot's House (Győr)",
  ],
  Miskolc: [
    "Diósgyőr Castle",
    "Cave Bath, Miskolctapolca",
    "Lillafüred",
    "Palace of Arts, Miskolc",
    "Avas Church (Miskolc)",
    "Greek Orthodox Church, Miskolc",
    "Otto Herman Museum",
    "Wooden Church, Miskolc",
    "Miskolc National Theatre",
    "Massa Museum",
  ],
  Nyíregyháza: [
    "Sóstó Zoo",
    "Sóstó Open Air Museum",
    "Nyíregyháza Aquarius Experience Bath",
    "City Hall, Nyíregyháza",
    "András Jósa Museum",
    "Hungarian Greek Catholic Cathedral, Nyíregyháza",
    "Luther Palace, Nyíregyháza",
    "Sóstó Museum Village",
    "Nyíregyháza Reformed Church",
    "Sóstói Lake",
  ],
  Kecskemét: [
    "Kecskemét City Hall",
    "Cifra Palace",
    "Katona József Theatre",
    "Piarist Church of Kecskemét",
    "Great Church, Kecskemét",
    "Leskowsky Collection",
    "Kodály Institute",
    "Hungarian Museum of Photography",
    "Kecskemét Main Square",
    "Franciscan Church, Kecskemét",
  ],
  Szombathely: [
    "Savaria Historical Theme Park",
    "Iseum Savariense",
    "Szombathely Cathedral",
    "Romkert (Savaria)",
    "Kámon Arboretum",
    "Vas County Museum",
    "Main Square, Szombathely",
    "Temple of Isis (Savaria)",
    "Saint Martin's Church, Szombathely",
    "Szombathely Synagogue",
  ],
  Eger: [
    "Eger Castle",
    "Eger Cathedral",
    "Minorite Church, Eger",
    "Valley of the Beautiful Woman",
    "Dobó Square",
    "Lyceum (Eger)",
    "Eger Minaret",
    "Archbishop's Palace, Eger",
    "Serbian Orthodox Church, Eger",
    "Egri Road Beatles Museum",
  ],
};

async function fetchCoords(titles) {
  const chunk = 10;
  const out = new Map();
  for (let i = 0; i < titles.length; i += chunk) {
    const batch = titles.slice(i, i + chunk);
    const url =
      "https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&titles=" +
      batch.map(encodeURIComponent).join("|");
    const res = await fetch(url, { headers: { "User-Agent": "TravelMag/1.0" } });
    const data = await res.json();
    for (const p of Object.values(data.query.pages)) {
      if (p.missing) continue;
      const c = p.coordinates?.[0];
      if (c) out.set(p.title, { lat: c.lat, lng: c.lon, wiki_title: p.title });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return out;
}

async function fetchCoordsSingle(title) {
  await new Promise((r) => setTimeout(r, 1200));
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&redirects=1&titles=" +
    encodeURIComponent(title);
  const res = await fetch(url, { headers: { "User-Agent": "TravelMag/1.0" } });
  const text = await res.text();
  if (text.startsWith("You are")) return null;
  const data = JSON.parse(text);
  const p = Object.values(data.query.pages)[0];
  if (p.missing) return null;
  const c = p.coordinates?.[0];
  if (!c) return null;
  return { lat: c.lat, lng: c.lon, wiki_title: p.title };
}

const supplement = {};
const missing = [];

for (const [city, names] of Object.entries(LANDMARKS)) {
  const coords = await fetchCoords(names);
  supplement[city] = [];
  for (const name of names) {
    let hit =
      coords.get(name) ||
      [...coords.entries()].find(([t]) => t.toLowerCase() === name.toLowerCase())?.[1];
    if (!hit) hit = await fetchCoordsSingle(name);
    if (!hit) {
      missing.push(`${city}: ${name}`);
      // city center fallback from phase1
      continue;
    }
    supplement[city].push({
      name,
      wiki_title: hit.wiki_title || name,
      lat: hit.lat,
      lng: hit.lng,
    });
  }
}

writeFileSync(
  join(ROOT, "data/seeds/hungary-landmarks-supplement.json"),
  JSON.stringify(supplement, null, 2) + "\n"
);

console.log("Missing:", missing.length);
missing.forEach((m) => console.log(" ", m));
for (const [c, p] of Object.entries(supplement)) {
  console.log(`${c}: ${p.length}/10`);
}
