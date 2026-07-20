const fs = require("fs");
const path = require("path");
const seedPath = path.join(process.cwd(), "data", "seeds", "kosovo.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const REPL = {
  "Pristina|Imperial Mosque": {
    name: "Heroinat Memorial",
    wiki_title: "Heroinat Memorial",
    lat: 42.6632,
    lng: 21.1621,
    description: "A striking public memorial in central Pristina honoring the contribution of Kosovo women, formed from thousands of metal medallions.",
    seo_phrase: "Heroinat Memorial Pristina: Landmark of Remembrance",
    seo_keywords: ["heroinat memorial", "pristina monuments", "kosovo memorials", "women memorial pristina"],
    type: "landmark",
  },
  "Pristina|Carshia Mosque": {
    name: "Great Hammam of Pristina",
    wiki_title: "Great Hamam of Pristina",
    lat: 42.6668,
    lng: 21.1645,
    description: "A restored Ottoman-era bathhouse beside the old bazaar, now a cultural venue with massive stone vaults.",
    seo_phrase: "Great Hammam Pristina: Historic Bathhouse Guide",
    seo_keywords: ["great hammam pristina", "pristina hammam", "ottoman baths kosovo", "old bazaar pristina"],
    type: "historic_site",
  },
  "Prizren|Sinan Pasha Mosque": {
    name: "Cathedral of Saint George",
    wiki_title: "Cathedral of Saint George, Prizren",
    lat: 42.2089,
    lng: 20.7402,
    description: "A landmark Orthodox cathedral in Prizren with distinctive architecture rising above the old town streets.",
    seo_phrase: "Cathedral of Saint George Prizren: Old Town Landmark",
    seo_keywords: ["saint george cathedral prizren", "prizren orthodox cathedral", "prizren churches", "prizren landmarks"],
    type: "church",
  },
  "Prizren|Emin Pasha Mosque": {
    name: "Lumbardhi Cinema",
    wiki_title: "Prizren",
    lat: 42.2105,
    lng: 20.7398,
    description: "A revived historic cinema on the riverfront, a cultural hub of Prizren festivals and film screenings.",
    seo_phrase: "Lumbardhi Cinema Prizren: Riverfront Culture Spot",
    seo_keywords: ["lumbardhi cinema", "prizren cinema", "dokufest prizren", "prizren culture"],
    type: "landmark",
  },
  "Peja|Bajrakli Mosque": {
    name: "Rugova Canyon Viewpoint",
    wiki_title: "Rugova Canyon",
    lat: 42.666,
    lng: 20.266,
    description: "Dramatic limestone gorge west of Peja with cliff roads, hiking trails, and panoramic viewpoints.",
    seo_phrase: "Rugova Canyon Peja: Gorge Viewpoint Guide",
    seo_keywords: ["rugova canyon", "peja canyon", "kosovo hiking", "rugova gorge"],
    type: "nature",
  },
  "Gjakova|Hadum Mosque": {
    name: "Asim Vokshi Monument",
    wiki_title: "Gjakova",
    lat: 42.3804,
    lng: 20.4308,
    description: "A central civic monument in Gjakova marking the historic core near the old bazaar streets.",
    seo_phrase: "Asim Vokshi Monument Gjakova: City Center Landmark",
    seo_keywords: ["asim vokshi", "gjakova monument", "gjakova landmarks", "gjakova center"],
    type: "landmark",
  },
  "Gjakova|Sheikh Emin's Tekke": {
    name: "Gjakova Cathedral",
    wiki_title: "Gjakova",
    lat: 42.3815,
    lng: 20.4285,
    description: "The main Catholic cathedral of Gjakova, a prominent twin-tower landmark of the city skyline.",
    seo_phrase: "Gjakova Cathedral: Twin-Tower City Landmark",
    seo_keywords: ["gjakova cathedral", "catholic cathedral gjakova", "gjakova churches", "gjakova skyline"],
    type: "church",
  },
  "Mitrovica|Isa Beg Mosque": {
    name: "Miners Monument Mitrovica",
    wiki_title: "Mitrovica",
    lat: 42.8914,
    lng: 20.866,
    description: "An iconic hilltop monument overlooking Mitrovica, dedicated to the region's mining heritage.",
    seo_phrase: "Miners Monument Mitrovica: Hilltop City Viewpoint",
    seo_keywords: ["miners monument mitrovica", "mitrovica viewpoint", "kosovo miners", "mitrovica landmarks"],
    type: "landmark",
  },
  "Gjilan|Atik Mosque": {
    name: "Gjilan City Theatre",
    wiki_title: "Gjilan",
    lat: 42.4635,
    lng: 21.4694,
    description: "The main city theatre and cultural venue anchoring Gjilan's public square life.",
    seo_phrase: "Gjilan City Theatre: Cultural Landmark Guide",
    seo_keywords: ["gjilan theatre", "gjilan culture", "gjilan landmarks", "kosovo theatres"],
    type: "landmark",
  },
  "Gjilan|Sultan Bayezid Mosque": {
    name: "Regional Museum of Gjilan",
    wiki_title: "Gjilan",
    lat: 42.4628,
    lng: 21.4682,
    description: "A local history museum presenting archaeology and heritage collections from the Gjilan region.",
    seo_phrase: "Regional Museum Gjilan: Local Heritage Collection",
    seo_keywords: ["gjilan museum", "regional museum gjilan", "gjilan heritage", "kosovo museums"],
    type: "museum",
  },
  "Vushtrri|Shejh Zahid Mosque": {
    name: "Vojinovic Tower",
    wiki_title: "Vushtrri Castle",
    lat: 42.8235,
    lng: 20.9678,
    description: "A medieval stone tower linked to Vushtrri Castle, one of the town's oldest standing landmarks.",
    seo_phrase: "Vojinovic Tower Vushtrri: Medieval Castle Landmark",
    seo_keywords: ["vojinovic tower", "vushtrri castle", "vushtrri tower", "kosovo fortresses"],
    type: "historic_site",
  },
  "Podujeva|Met Podujeve Mosque": {
    name: "Zahir Pajaziti Square",
    wiki_title: "Podujevo",
    lat: 42.9128,
    lng: 21.1932,
    description: "The central civic square of Podujeva with memorials and the pulse of everyday town life.",
    seo_phrase: "Zahir Pajaziti Square Podujeva: Central Town Plaza",
    seo_keywords: ["zahir pajaziti square", "podujeva square", "podujeva center", "llap region"],
    type: "landmark",
  },
  "Rahovec|Halveti Tekke of Rahovec": {
    name: "Rahovec Vineyard Hills",
    wiki_title: "Rahovec",
    lat: 42.38,
    lng: 20.654,
    description: "Rolling vineyard hills around Rahovec, Kosovo's best-known wine country with valley panoramas.",
    seo_phrase: "Rahovec Vineyard Hills: Kosovo Wine Country Views",
    seo_keywords: ["rahovec vineyards", "kosovo wine", "rahovec hills", "rahovec viewpoints"],
    type: "nature",
  },
  "Rahovec|Hadum Mosque Trip": {
    name: "White Drin Waterfall Trip",
    wiki_title: "White Drin Waterfall",
    lat: 42.354,
    lng: 20.541,
    description: "A scenic day trip to the White Drin waterfall and canyon landscapes near the Rahovec region.",
    seo_phrase: "White Drin Waterfall Trip from Rahovec",
    seo_keywords: ["white drin waterfall", "rahovec day trip", "kosovo waterfalls", "drin canyon"],
    type: "nature",
  },
};

function norm(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const BAD = /mosque|dzamij|džamij|tekke|teqe|synagogue|masjid|minaret|islam/i;
let replaced = 0;
const report = [];

for (const city of seed.cities || []) {
  const existing = new Set((city.places || []).map((p) => norm(p.name)));
  for (let i = 0; i < (city.places || []).length; i++) {
    const p = city.places[i];
    const keyExact = city.city + "|" + p.name;
    let hit = REPL[keyExact];
    if (!hit) {
      const entry = Object.entries(REPL).find(([k]) => {
        const [c, n] = k.split("|");
        return norm(c) === norm(city.city) && norm(n) === norm(p.name);
      });
      hit = entry?.[1];
    }
    if (!hit && BAD.test(p.name)) {
      console.log("UNMAPPED: " + city.city + " / " + p.name);
      continue;
    }
    if (!hit) continue;
    if (existing.has(norm(hit.name)) && norm(hit.name) !== norm(p.name)) {
      console.log("DUP skip: " + hit.name + " already in " + city.city);
      continue;
    }
    existing.delete(norm(p.name));
    existing.add(norm(hit.name));
    city.places[i] = {
      order_index: p.order_index,
      seo_priority: p.seo_priority,
      search_intent: p.search_intent || ["informational", "travel_planning"],
      best_season: hit.type === "nature" ? ["spring", "summer", "autumn"] : (p.best_season || ["spring", "summer", "autumn", "winter"]),
      visit_duration_hours: p.visit_duration_hours || (hit.type === "nature" ? 2 : 1.5),
      nearby_places: (p.nearby_places || []).filter((n) => !BAD.test(n)),
      ...hit,
    };
    replaced++;
    report.push(city.city + ": " + p.name + " -> " + hit.name);
  }
  for (const p of city.places || []) {
    if (!p.nearby_places) continue;
    p.nearby_places = p.nearby_places.filter((n) => !BAD.test(n));
  }
}

if (seed.adventure && seed.adventure.places) {
  for (let i = 0; i < seed.adventure.places.length; i++) {
    const p = seed.adventure.places[i];
    if (!BAD.test(p.name)) continue;
    const entry = Object.entries(REPL).find(([k]) => norm(k.split("|")[1]) === norm(p.name));
    if (!entry) {
      console.log("UNMAPPED adventure: " + p.name);
      continue;
    }
    const hit = entry[1];
    seed.adventure.places[i] = Object.assign({}, p, hit);
    delete seed.adventure.places[i].image_url;
    delete seed.adventure.places[i].commons_file;
    replaced++;
    report.push("adventure: " + p.name + " -> " + hit.name);
  }
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
const check = fs.readFileSync(seedPath, "utf8");
const left = check.match(/mosque|dzamij|džamij|tekke|teqe|synagogue|masjid|minaret/gi) || [];
console.log(report.join("\n"));
console.log("replaced=" + replaced + " remaining=" + left.length);
if (left.length) console.log(left.slice(0, 30).join(", "));