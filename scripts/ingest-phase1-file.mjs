/**
 * Ingest external phase1 JSON → normalize, auto-fill gaps, build seed.
 * Usage: node scripts/ingest-phase1-file.mjs "d:/path/file.txt" [slug]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import {
  inferPlaceType,
  visitDurationHours,
} from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";
import {
  isVaguePlace,
  isCoordInCountry,
  isSpecificLandmark,
  COUNTRY_BBOX,
} from "./precise-place-filter.mjs";
import { COUNTRY_COVER_WIKI } from "./country-meta.mjs";
import { isBadImageUrl, isBadImageCandidate } from "./bad-image-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

const SLUG_MAP = {
  Spain: "spain",
  Latvia: "latvia",
  Liechtenstein: "liechtenstein",
  Lithuania: "lithuania",
  Malta: "malta",
  Moldova: "moldova",
  Monaco: "monaco",
  Montenegro: "montenegro",
  Netherlands: "netherlands",
  "North Macedonia": "north-macedonia",
  Norway: "norway",
  Poland: "poland",
  Portugal: "portugal",
  Russia: "russia",
  "San Marino": "san-marino",
  Serbia: "serbia",
  Slovakia: "slovakia",
  Slovenia: "slovenia",
  Sweden: "sweden",
  Switzerland: "switzerland",
  Turkey: "turkey",
  Ukraine: "ukraine",
  "United Kingdom": "united-kingdom",
  Japan: "japan",
};

function slugify(country) {
  return (
    SLUG_MAP[country] ||
    country
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function parseLooseJson(raw) {
  raw = raw.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const lastObj = raw.lastIndexOf("},");
    if (lastObj > 0) {
      for (const suffix of ["\n]\n}", "\n]\n}\n]", "\n]\n]\n}", "\n}\n]\n}"]) {
        try {
          return JSON.parse(raw.slice(0, lastObj + 1) + suffix);
        } catch {}
      }
      try {
        return JSON.parse(raw.slice(0, lastObj + 1) + "\n]\n}");
      } catch {}
    }
    // Truncated nested cities[] file — keep complete city blocks only
    const cityBlockEnd = raw.lastIndexOf("}\r\n]\r\n},");
    if (cityBlockEnd < 0) {
      const cityBlockEndLf = raw.lastIndexOf("}\n]\n},");
      if (cityBlockEndLf > 0) {
        const stub = raw.slice(0, cityBlockEndLf + 6) + "\n]\n}";
        try {
          return JSON.parse(stub);
        } catch {}
      }
    } else {
      const stub = raw.slice(0, cityBlockEnd + 8) + "\r\n]\r\n}";
      try {
        return JSON.parse(stub);
      } catch {}
    }
    // Truncated mid-attraction — keep through last complete place object
    for (const priority of ["high", "medium", "low"]) {
      for (const eol of ["\n}", "\r\n}"]) {
        const marker = `"internal_link_priority": "${priority}"${eol}`;
        const idx = raw.lastIndexOf(marker);
        if (idx <= 0) continue;
        const end = idx + marker.length;
        for (const suffix of ["\n]\n}\n]\n}", "\r\n]\r\n}\r\n]\r\n}"]) {
          try {
            return JSON.parse(raw.slice(0, end) + suffix);
          } catch {}
        }
      }
    }
    throw new Error("Cannot parse JSON");
  }
}

function cleanUrl(s) {
  if (!s || typeof s !== "string") return "";
  const md = s.match(/\[(https?:\/\/[^\]]+)\]/);
  if (md) return md[1];
  const plain = s.match(/^(https?:\/\/[^\s\])]+)/);
  if (plain) return plain[1];
  return s.trim();
}

function fixWikipediaUrl(url) {
  if (!url) return url;
  url = cleanUrl(url);
  if (url.includes("(") && !url.includes(")")) return url + ")";
  return url;
}

function wikiTitleFromUrl(url) {
  url = cleanUrl(url);
  const m = url?.match(/\/wiki\/([^?#]+)/);
  return m ? decodeURIComponent(m[1].replace(/_/g, " ")) : "";
}

function commonsFromImageUrl(url) {
  url = cleanUrl(url);
  if (!url) return undefined;
  const thumb = url.match(/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/(.+?)(?:\/\d+px-)?$/);
  if (thumb) return decodeURIComponent(thumb[1].replace(/_/g, " "));
  const direct = url.match(/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/(.+)$/i);
  if (direct) return decodeURIComponent(direct[1].replace(/_/g, " "));
  return undefined;
}

function normalizeSeasons(tags) {
  if (!tags?.length) return SEASON_ALL;
  if (tags.includes("all-seasons")) return SEASON_ALL;
  return tags;
}

function cityNameFromAttraction(a, cities, idToName) {
  if (a.city) return a.city;
  if (a.city_name) return a.city_name;
  if (a.city_id && idToName[a.city_id]) return idToName[a.city_id];
  return a.city_id || "Unknown";
}

function attractionImageUrl(a) {
  return cleanUrl(a.image_url || a.image?.url || a.image?.image_url);
}

function normalizeCoverImage(raw) {
  const img =
    raw.country_cover_image ||
    raw.country_representative_image ||
    raw.country_main_image ||
    raw.country_hero_image ||
    raw.hero_image;
  if (!img) return undefined;
  const image_url = cleanUrl(img.image_url || img.url);
  return image_url ? { ...img, image_url } : img;
}

function normalizeInput(raw) {
  if (raw.cities?.length && typeof raw.cities[0] === "string") {
    raw.cities = raw.cities.map((name) => ({ name }));
  }

  // Nested format: cities[].attractions[]
  if (raw.cities?.some((c) => Array.isArray(c.attractions))) {
    const cities = [];
    const attractions = [];
    for (const c of raw.cities || []) {
      const cityName = c.name || c.city_name || c.city;
      if (!cityName) continue;
      cities.push({
        name: cityName,
        region: c.region,
        id: c.id,
        latitude: c.latitude ?? c.lat,
        longitude: c.longitude ?? c.lng,
        wikipedia_url: c.wikipedia_url,
        wikidata_id: c.wikidata_id,
      });
      for (const a of c.attractions || []) {
        attractions.push({
          ...a,
          city: cityName,
          wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
          image_url: attractionImageUrl(a),
        });
      }
    }
    const adventure_locations = (raw.adventure_locations || []).map((a) => ({
      ...a,
      wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
      image_url: attractionImageUrl(a),
    }));
    return {
      country: raw.country,
      cities,
      attractions,
      adventure_locations,
      country_cover_image: normalizeCoverImage(raw),
    };
  }

  const cities = (raw.cities || [])
    .map((c) => ({
      name: c.name || c.city_name || c.city,
      region: c.region,
      id: c.id,
      latitude: c.latitude ?? c.lat,
      longitude: c.longitude ?? c.lng,
      wikipedia_url: c.wikipedia_url,
      wikidata_id: c.wikidata_id,
    }))
    .filter((c) => c.name && c.name !== "undefined");

  const idToName = Object.fromEntries(
    cities.filter((c) => c.id).map((c) => [c.id, c.name])
  );

  const attractions = (raw.attractions || []).map((a) => ({
    ...a,
    city: cityNameFromAttraction(a, cities, idToName),
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
    image_url: attractionImageUrl(a),
  }));

  const adventure_locations = (raw.adventure_locations || []).map((a) => ({
    ...a,
    wikipedia_url: fixWikipediaUrl(a.wikipedia_url),
    image_url: attractionImageUrl(a),
  }));

  return {
    country: raw.country,
    cities,
    attractions,
    adventure_locations,
    country_cover_image: normalizeCoverImage(raw),
  };
}

function alignCityNames(phase1) {
  const map = Object.fromEntries(phase1.cities.map((c) => [normCity(c.name), c.name]));
  for (const a of phase1.attractions || []) {
    const aligned = map[normCity(a.city)];
    if (aligned) a.city = aligned;
  }
  return phase1;
}

function normCity(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function wikiApi(params, retries = 3) {
  const qs = new URLSearchParams({ format: "json", origin: "*", ...params });
  await new Promise((r) => setTimeout(r, 700));
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${qs}`);
      const text = await res.text();
      if (text.includes("too many requests")) {
        await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
        continue;
      }
      return JSON.parse(text);
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return { query: {} };
}

async function getCityCoords(cityName, countryName) {
  for (const title of [cityName, `${cityName}, ${countryName}`]) {
    const data = await wikiApi({ action: "query", titles: title, prop: "coordinates" });
    for (const p of Object.values(data.query?.pages || {})) {
      if (p.coordinates?.[0]) {
        return { lat: p.coordinates[0].lat, lng: p.coordinates[0].lon };
      }
    }
  }
  return null;
}

async function wikiGeoLandmarks(cityName, countryName, need, existingNames, radius = 15000, hitLimit = 40) {
  const coords = await getCityCoords(cityName, countryName);
  if (!coords) return [];

  const geo = await wikiApi({
    action: "query",
    list: "geosearch",
    gsradius: radius,
    gscoord: `${coords.lat}|${coords.lng}`,
    gslimit: hitLimit,
  });
  const hits = geo.query?.geosearch || [];
  if (!hits.length) return [];

  const titles = hits.map((h) => h.title).slice(0, hitLimit);
  const imgData = await wikiApi({
    action: "query",
    titles: titles.join("|"),
    prop: "pageimages|coordinates",
    piprop: "thumbnail",
    pithumbsize: 600,
    colimit: hitLimit,
  });

  const out = [];
  const pagesByTitle = Object.fromEntries(
    Object.values(imgData.query?.pages || {}).map((p) => [p.title, p])
  );
  for (const h of hits) {
    const thumb = pagesByTitle[h.title]?.thumbnail?.source;
    if (!thumb || isBadImageUrl(thumb) || isBadImageCandidate(title, thumb)) continue;
    const title = h.title;
    const key = title.toLowerCase();
    if (existingNames.has(key)) continue;
    if (/^List of|^Demographics|^History of|^Economy of|^Transport in|^Timeline of/i.test(title))
      continue;
    const lat = h.lat;
    const lng = h.lon;
    if (isVaguePlace(title, null, countryName, lat, lng)) continue;
    out.push({
      name: title.includes(",") ? title.split(",")[0].trim() : title,
      city: cityName,
      region: countryName,
      latitude: lat,
      longitude: lng,
      wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      image_url: thumb.replace(/\/\d+px-/, "/800px-"),
      description_short: `${title} — a notable landmark in ${cityName}, ${countryName}.`,
      keywords: [cityName, countryName, "travel"],
      search_intent: "travel_planning",
      season_tags: ["all-seasons"],
      seo_priority_score: 85,
    });
    existingNames.add(key);
    if (out.length >= need) break;
  }
  return out;
}

async function wikiSearchLandmarks(cityName, countryName, need, existingNames, searchQuery, skipGeo = false, limit) {
  const geo = skipGeo ? [] : await wikiGeoLandmarks(cityName, countryName, need, existingNames);
  if (geo.length >= need) return geo;

  const q = searchQuery || `${cityName} ${countryName}`;
  const data = await wikiApi({
    action: "query",
    generator: "search",
    gsrsearch: q,
    gsrlimit: need + 10,
    prop: "pageimages|coordinates",
    piprop: "thumbnail",
    pithumbsize: 600,
    pilimit: 50,
    colimit: 50,
  });
  const pages = Object.values(data.query?.pages || {});
  const out = [...geo];
  for (const p of pages) {
    if (!p.thumbnail?.source) continue;
    const title = p.title;
    const thumb = p.thumbnail.source;
    if (isBadImageUrl(thumb) || isBadImageCandidate(title, thumb)) continue;
    const key = title.toLowerCase();
    if (existingNames.has(key)) continue;
    if (/^List of|^Demographics|^History of|^Economy of|^Transport in/i.test(title)) continue;
    const lat = p.coordinates?.[0]?.lat ?? 0;
    const lng = p.coordinates?.[0]?.lon ?? 0;
    if (isVaguePlace(title, null, countryName, lat, lng)) continue;
    out.push({
      name: title.includes(",") ? title.split(",")[0].trim() : title,
      city: cityName,
      region: countryName,
      latitude: lat,
      longitude: lng,
      wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      image_url: p.thumbnail.source.replace(/\/\d+px-/, "/800px-"),
      description_short: `${title} — a notable landmark in ${cityName}, ${countryName}.`,
      keywords: [cityName, countryName, "travel"],
      search_intent: "travel_planning",
      season_tags: ["all-seasons"],
      seo_priority_score: 85,
    });
    existingNames.add(key);
    if (out.length >= need) break;
  }
  return out.slice(0, Math.max(need, limit ?? need * 3));
}

async function forceFillCity(city, country, phase1, names) {
  const searchQs = [
    `${city.name} ${country} cathedral`,
    `${city.name} ${country} castle`,
    `${city.name} ${country} museum`,
    `${city.name} ${country} church`,
    `${city.name} ${country} palace`,
    `${city.name} ${country} fortress`,
    `${city.name} ${country} monument`,
    `${city.name} ${country} basilica`,
    `${city.name} ${country} bridge`,
    `${city.name} ${country} tower`,
    `${city.name} ${country} plaza square`,
    `${city.name} ${country} UNESCO`,
    `${city.name} ${country} tourist attraction`,
  ];
  let prevValid = -1;
  let stall = 0;
  for (let pass = 0; pass < searchQs.length + 2; pass++) {
    const valid = pickCityPlaces(phase1.attractions || [], city.name, country);
    if (valid.length >= 10) return valid.length;
    // Break early if valid count made no net progress across passes
    if (valid.length <= prevValid) {
      if (++stall >= 3) break;
    } else {
      stall = 0;
    }
    prevValid = valid.length;
    const need = 10 - valid.length;
    console.log(`  fill ${city.name}: +${need} (pass ${pass + 1})`);
    let added = [];
    if (pass === 0) {
      added = await wikiGeoLandmarks(city.name, country, need + 15, names, 18000, 50);
    } else if (pass === searchQs.length + 1) {
      added = await wikiGeoLandmarks(city.name, country, need + 20, names, 25000, 60);
    } else {
      added = await wikiSearchLandmarks(
        city.name,
        country,
        need + 15,
        names,
        searchQs[pass - 1] || `${city.name} ${country} landmark`,
        true,
        need + 25
      );
    }
    for (const a of added) {
      a.city = city.name;
      phase1.attractions.push(a);
      if (a.name) names.add(a.name.toLowerCase());
    }
  }
  return pickCityPlaces(phase1.attractions || [], city.name, country).length;
}

async function wikiCountryAdventures(countryName, need, existingNames = new Set()) {
  const queries = [
    `${countryName} castle`,
    `${countryName} cathedral`,
    `${countryName} monastery`,
    `${countryName} palace`,
    `${countryName} fortress`,
    `${countryName} lighthouse`,
    `${countryName} bridge`,
  ];
  const out = [];
  const seen = new Set(existingNames);
  for (const q of queries) {
    if (out.length >= need) break;
    const data = await wikiApi({
      action: "query",
      generator: "search",
      gsrsearch: q,
      gsrlimit: need + 12,
      prop: "pageimages|coordinates",
      piprop: "thumbnail",
      pithumbsize: 600,
      pilimit: 50,
      colimit: 50,
    });
    for (const p of Object.values(data.query?.pages || {})) {
      const title = p.title;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      const lat = p.coordinates?.[0]?.lat;
      const lng = p.coordinates?.[0]?.lon;
      if (lat == null || lng == null || !p.thumbnail?.source) continue;
      if (isVaguePlace(title, null, countryName, lat, lng)) continue;
      if (!isSpecificLandmark(title) && !title.includes(",")) continue;
      const name = title.includes(",") ? title.split(",")[0].trim() : title;
      out.push({
        name,
        region: countryName,
        latitude: lat,
        longitude: lng,
        wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        image_url: p.thumbnail.source.replace(/\/\d+px-/, "/800px-"),
        description_short: `${name} — a must-see landmark on a ${countryName} road trip.`,
        keywords: [name, countryName, "road trip"],
        search_intent: "travel_planning",
        season_tags: SEASON_WARM,
        seo_priority_score: 90 - out.length,
      });
      seen.add(key);
      seen.add(name.toLowerCase());
      if (out.length >= need) break;
    }
  }
  return out;
}

async function wikiCountryCover(countryName) {
  const curated = COUNTRY_COVER_WIKI[countryName];
  const titles = curated ? [curated, countryName] : [countryName];
  for (const title of titles) {
    const data = await wikiApi({
      action: "query",
      titles: title,
      prop: "pageimages",
      piprop: "original|thumbnail",
      pithumbsize: 1200,
    });
    for (const p of Object.values(data.query?.pages || {})) {
      const url =
        p.original?.source ||
        p.thumbnail?.source?.replace(/\/\d+px-/, "/1200px-");
      if (url && !/flag|logo|map|coat|emblem|locator|svg/i.test(url)) {
        return {
          image_url: url,
          wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent((p.title || title).replace(/ /g, "_"))}`,
        };
      }
    }
  }
  return null;
}

function dedupeAttractions(attractions) {
  const seen = new Set();
  return attractions.filter((a) => {
    if (!a?.name?.trim() || !a?.city?.trim()) return false;
    const key = `${a.city}|${a.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickCityPlaces(all, cityName, countryName, trustSource = false) {
  const target = normCity(cityName);
  return dedupeAttractions(all)
    .filter(
      (a) =>
        normCity(a.city) === target &&
        !/ Landmark \d+$/i.test(a.name) &&
        !isDeathRelatedPlace(a.name, a.description_short || a.description_long) &&
        (trustSource ||
          !isVaguePlace(
            a.name,
            a.description_short || a.description_long,
            countryName,
            a.latitude ?? a.lat,
            a.longitude ?? a.lng
          ))
    )
    .sort((a, b) => {
      const ai = a.image_url ? 1 : 0;
      const bi = b.image_url ? 1 : 0;
      if (bi !== ai) return bi - ai;
      return (b.seo_priority_score ?? 0) - (a.seo_priority_score ?? 0);
    })
    .slice(0, 10);
}

function citySeo(name, country) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [
      `things to do in ${name}`,
      `${name} ${country} travel guide`,
      `best places to visit in ${name}`,
      `${name} landmarks`,
    ],
  };
}

function phase1ToPlace(p, idx, cityName, country) {
  const wikiUrl = fixWikipediaUrl(p.wikipedia_url);
  let imageUrl = cleanUrl(p.image_url);
  if (imageUrl && isBadImageUrl(imageUrl)) {
    p.image_url = "";
    imageUrl = "";
  }
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(wikiUrl) || p.name,
    lat: p.latitude ?? p.lat,
    lng: p.longitude ?? p.lng,
    order_index: idx,
    description:
      p.description_short?.trim() ||
      p.description_long?.slice(0, 200)?.trim() ||
      p.description ||
      p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    commons_file: commonsFromImageUrl(imageUrl),
    image_url: imageUrl,
    seo_priority: p.seo_priority_score ?? 90 - idx,
    search_intent: Array.isArray(p.search_intent)
      ? p.search_intent
      : p.search_intent
        ? [p.search_intent, "travel_planning"]
        : ["informational", "travel_planning"],
    type: inferPlaceType(p.name),
    best_season: normalizeSeasons(p.season_tags),
    visit_duration_hours: visitDurationHours(inferPlaceType(p.name)),
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

async function wikiDiscoverCities(countryName, need, existingNames) {
  const data = await wikiApi({
    action: "query",
    generator: "search",
    gsrsearch: `cities in ${countryName}`,
    gsrlimit: need + 25,
    prop: "coordinates",
    colimit: 50,
  });
  const out = [];
  for (const p of Object.values(data.query?.pages || {})) {
    const title = p.title?.replace(/,.*$/, "").trim();
    if (!title || existingNames.has(normCity(title))) continue;
    if (/^List of|^Category:|^History of|^Demographics of|^Economy of/i.test(p.title)) continue;
    if (!p.coordinates?.[0]) continue;
    out.push({
      name: title,
      latitude: p.coordinates[0].lat,
      longitude: p.coordinates[0].lon,
    });
    existingNames.add(normCity(title));
    if (out.length >= need) break;
  }
  return out;
}

async function ensureTenCities(phase1) {
  const country = phase1.country;
  const existing = new Set(phase1.cities.map((c) => normCity(c.name)));
  while (phase1.cities.length < 10) {
    const need = 10 - phase1.cities.length;
    console.log(`  fill cities: +${need}`);
    const discovered = await wikiDiscoverCities(country, need, existing);
    if (!discovered.length) break;
    phase1.cities.push(...discovered);
  }
  return phase1;
}

async function fillGaps(phase1, trustSource = false) {
  if (!trustSource) phase1 = await ensureTenCities(phase1);
  const country = phase1.country;
  const names = new Set(
    (phase1.attractions || [])
      .filter((a) => a?.name?.trim())
      .map((a) => a.name.toLowerCase())
  );

  if (!trustSource) {
    for (const city of phase1.cities) {
      const count = await forceFillCity(city, country, phase1, names);
      if (count < 10) console.warn(`  ⚠ ${city.name}: ${count}/10 after all fill passes`);
    }
  } else {
    console.log("  ⏭ trust source — skip wiki city fill");
  }

  if (!trustSource) {
    phase1.adventure_locations = (phase1.adventure_locations || []).filter(
      (p) => !isVaguePlace(p.name, p.description_short, country, p.latitude ?? p.lat, p.longitude ?? p.lng)
    );

    while ((phase1.adventure_locations?.length || 0) < 10) {
      const need = 10 - (phase1.adventure_locations?.length || 0);
      console.log(`  fill adventures: +${need}`);
      const advNames = new Set(
        (phase1.adventure_locations || [])
          .filter((a) => a?.name?.trim())
          .map((a) => a.name.toLowerCase())
      );
      const adv = await wikiCountryAdventures(country, need, advNames);
      if (!adv.length) break;
      phase1.adventure_locations = [...(phase1.adventure_locations || []), ...adv];
    }
  } else {
    console.log(`  ⏭ trust source — ${phase1.adventure_locations?.length ?? 0} adventures kept`);
  }
  return phase1;
}

function isTrustSource(phase1) {
  if (process.env.FORCE_TRUST === "1") return true;
  const byCity = new Map();
  for (const a of phase1.attractions || []) {
    const k = normCity(a.city);
    byCity.set(k, (byCity.get(k) || 0) + 1);
  }
  const citiesOk =
    phase1.cities.length >= 10 &&
    phase1.cities.every((c) => (byCity.get(normCity(c.name)) || 0) >= 10);
  const advCount = phase1.adventure_locations?.length || 0;
  const advOk = advCount >= 10 || (citiesOk && advCount >= 8);
  return citiesOk && advOk;
}

function buildSeed(phase1, slug, trustSource = false) {
  const country = phase1.country;
  const cityOrder = phase1.cities.map((c) => c.name);

  const cities = cityOrder.map((cityName) => {
    const places = pickCityPlaces(phase1.attractions || [], cityName, country, trustSource).map((p, i) =>
      phase1ToPlace(p, i, cityName, country)
    );

    return {
      city: cityName,
      tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
      wiki_title: cityName,
      seo: citySeo(cityName, country),
      places,
    };
  });

  const advPlaces = (phase1.adventure_locations || [])
    .filter(
      (p) =>
        !isDeathRelatedPlace(p.name, p.description_short) &&
        (trustSource ||
          !isVaguePlace(p.name, p.description_short, country, p.latitude ?? p.lat, p.longitude ?? p.lng))
    )
    .slice(0, 10)
    .map((p, idx) => ({
      name: p.name,
      wiki_title: wikiTitleFromUrl(fixWikipediaUrl(p.wikipedia_url)) || p.name,
      region: p.region || country,
      lat: p.latitude ?? p.lat,
      lng: p.longitude ?? p.lng,
      day: idx + 1,
      order_index: idx,
      requires_car: true,
      tags: ["nature", "hidden_gem", "adventure", ...SEASON_WARM],
      description: p.description_short || p.description,
      seo_phrase: p.seo_title || p.name,
      seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
      commons_file: commonsFromImageUrl(cleanUrl(p.image_url)),
      image_url: cleanUrl(p.image_url),
      seo_priority: p.seo_priority_score ?? 95 - idx,
      best_season: normalizeSeasons(p.season_tags),
      visit_duration_hours: 4,
      type: "nature",
    }));

  return {
    version: 2,
    country,
    published: true,
    cities,
    adventure: {
      title: `${country} Scenic Road Trip`,
      subtitle: `Explore ${country} beyond the cities — nature, coastlines, and scenic routes.`,
      wiki_title: country,
      hero_image: cleanUrl(phase1.country_cover_image?.image_url),
      totalDays: 10,
      seo: {
        title: `${country} Road Trip Adventure`,
        description: `Plan a ${country} road trip with GPS stops and scenic routes.`,
        intro: `Explore ${country} beyond the cities with this adventure route.`,
        keywords: [`${country} road trip`, `${country} by car`],
      },
      places: advPlaces,
    },
  };
}

const parts = process.argv.slice(2);

function extractBalanced(s) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(0, i + 1);
    }
  }
  return null;
}

if (parts[0] === "--extract") {
  const country = parts[1];
  if (!country) {
    console.error("Usage: node scripts/ingest-phase1-file.mjs --extract <Country> [transcript.jsonl]");
    process.exit(1);
  }
  const transcriptPath =
    parts[2] ||
    process.env.TRANSCRIPT ||
    "C:/Users/Owner/.cursor/projects/d-travel-magazine/agent-transcripts/167dcf52-4a97-4150-aaee-4de6aa04b22b/167dcf52-4a97-4150-aaee-4de6aa04b22b.jsonl";
  const markers = [
    `{"country": "${country}"`,
    `{\n"country": "${country}"`,
    `{\r\n"country": "${country}"`,
  ];
  let best = "";
  for (const line of readFileSync(transcriptPath, "utf8").split(/\r?\n/)) {
    if (!line.includes(country)) continue;
    let content = line;
    try {
      const evt = JSON.parse(line);
      const msg = evt.message || evt;
      if (msg.content) {
        content =
          typeof msg.content === "string"
            ? msg.content
            : msg.content.map((c) => c.text || "").join("");
      }
    } catch {}
    let start = -1;
    for (const marker of markers) {
      const i = content.indexOf(marker);
      if (i >= 0 && (start < 0 || i < start)) start = i;
    }
    if (start >= 0) {
      const rest = content.slice(start);
      const obj = extractBalanced(rest);
      const slice = (obj || rest)
        .replace(/^<user_query>\s*/, "")
        .replace(/\s*<\/user_query>$/, "");
      if (slice.length > best.length) best = slice;
    }
  }
  if (!best) {
    console.error(`No phase1 JSON found for ${country}`);
    process.exit(1);
  }
  const outDir = join(ROOT, "data/phase1");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const slug = slugify(country);
  writeFileSync(join(outDir, `${slug}.json`), best + "\n");
  console.log(`✓ data/phase1/${slug}.json (${best.length} chars)`);
  try {
    JSON.parse(best);
    console.log("  JSON valid");
  } catch (e) {
    console.log(`  JSON needs repair: ${e.message}`);
  }
  process.exit(0);
}

if (parts[0] === "--add-cities") {
  const slug = parts[1];
  const cityNames = parts.slice(2);
  if (!slug) {
    console.error("Usage: node scripts/ingest-phase1-file.mjs --add-cities <slug> [City1 City2 ...]");
    process.exit(1);
  }
  const phase1Path = join(ROOT, `data/phase1/${slug}.json`);
  if (!existsSync(phase1Path)) {
    console.error(`Missing ${phase1Path}`);
    process.exit(1);
  }
  let phase1 = normalizeInput(parseLooseJson(readFileSync(phase1Path, "utf8")));
  phase1 = alignCityNames(phase1);
  phase1.attractions = dedupeAttractions(phase1.attractions || []);
  const country = phase1.country;
  const existing = new Set(phase1.cities.map((c) => normCity(c.name)));
  const names = new Set(
    (phase1.attractions || []).filter((a) => a?.name?.trim()).map((a) => a.name.toLowerCase())
  );

  const toAdd =
    cityNames.length > 0
      ? cityNames.map((n) => ({ name: n, region: country }))
      : [];
  if (!toAdd.length && phase1.cities.length < 10) {
    const need = 10 - phase1.cities.length;
    console.log(`  discover cities: +${need}`);
    const discovered = await wikiDiscoverCities(country, need, existing);
    toAdd.push(...discovered.map((d) => ({ name: d.name, region: country })));
  }

  for (const city of toAdd) {
    if (existing.has(normCity(city.name))) {
      console.log(`  skip existing: ${city.name}`);
      continue;
    }
    phase1.cities.push(city);
    existing.add(normCity(city.name));
    console.log(`  add city: ${city.name}`);
    const count = await forceFillCity(city, country, phase1, names);
    console.log(`  ${count === 10 ? "✓" : "⚠"} ${city.name}: ${count}/10`);
  }

  // Rebuild nested phase1 file for readability
  const nested = {
    country: phase1.country,
    phase: 1,
    country_representative_image: phase1.country_cover_image,
    country_main_image: phase1.country_cover_image,
    cities: phase1.cities.map((c) => ({
      name: c.name,
      region: c.region || country,
      attractions: pickCityPlaces(phase1.attractions || [], c.name, country, true).slice(0, 10),
    })),
    adventure_locations: phase1.adventure_locations || [],
  };
  writeFileSync(phase1Path, JSON.stringify(nested, null, 2) + "\n");
  const attrs = nested.cities.reduce((n, c) => n + c.attractions.length, 0);
  console.log(
    `✓ ${slug}.json — ${nested.cities.length} cities, ${attrs} attractions, ${nested.adventure_locations.length} adventures`
  );
  process.exit(0);
}

if (parts[0] === "--refill-city") {
  const slug = parts[1];
  const cityNames = parts.slice(2);
  if (!slug || !cityNames.length) {
    console.error("Usage: node scripts/ingest-phase1-file.mjs --refill-city <slug> <City>...");
    process.exit(1);
  }
  const phase1Path = join(ROOT, `data/phase1/${slug}.json`);
  let phase1 = normalizeInput(parseLooseJson(readFileSync(phase1Path, "utf8")));
  phase1 = alignCityNames(phase1);
  const country = phase1.country;
  const refillSet = new Set(cityNames.map((c) => normCity(c)));
  phase1.attractions = (phase1.attractions || []).filter(
    (a) => !refillSet.has(normCity(a.city))
  );
  const names = new Set(
    (phase1.attractions || []).filter((a) => a?.name?.trim()).map((a) => a.name.toLowerCase())
  );
  for (const cityName of cityNames) {
    const city = phase1.cities.find((c) => normCity(c.name) === normCity(cityName));
    if (!city) {
      console.warn(`  ⚠ city not found: ${cityName}`);
      continue;
    }
    console.log(`  refill: ${city.name}`);
    const count = await forceFillCity(city, country, phase1, names);
    console.log(`  ${count === 10 ? "✓" : "⚠"} ${city.name}: ${count}/10`);
  }
  const nested = {
    country: phase1.country,
    phase: 1,
    country_representative_image: phase1.country_cover_image,
    country_main_image: phase1.country_cover_image,
    cities: phase1.cities.map((c) => ({
      name: c.name,
      region: c.region || country,
      attractions: pickCityPlaces(phase1.attractions || [], c.name, country, true).slice(0, 10),
    })),
    adventure_locations: phase1.adventure_locations || [],
  };
  writeFileSync(phase1Path, JSON.stringify(nested, null, 2) + "\n");
  console.log(`✓ ${slug}.json updated`);
  process.exit(0);
}

const slugArg =
  parts.length > 1 && !/\.txt$/i.test(parts[parts.length - 1]) ? parts.pop() : undefined;
const inputPath = parts.join(" ").trim();
if (!inputPath || !existsSync(inputPath)) {
  console.error("Usage: node scripts/ingest-phase1-file.mjs <file.txt> [slug]");
  process.exit(1);
}

console.log(`→ ${basename(inputPath)}`);
const raw = parseLooseJson(readFileSync(inputPath, "utf8"));
let phase1 = normalizeInput(raw);
phase1 = alignCityNames(phase1);
const slug = slugArg || slugify(phase1.country);

console.log(`  ${phase1.country} (${slug})`);
phase1.attractions = dedupeAttractions(phase1.attractions || []);
const trustSource = isTrustSource(phase1);
if (trustSource) console.log("  ✓ complete source (10×10 + adventures) — no wiki autofill");
if (!phase1.country_cover_image?.image_url) {
  const cover = await wikiCountryCover(phase1.country);
  if (cover) phase1.country_cover_image = cover;
}
phase1 = await fillGaps(phase1, trustSource);

writeFileSync(
  join(ROOT, `data/seeds/${slug}-phase1-input.json`),
  JSON.stringify(phase1, null, 2) + "\n"
);

const seed = buildSeed(phase1, slug, trustSource);
writeFileSync(join(ROOT, `data/seeds/${slug}.json`), JSON.stringify(seed, null, 2) + "\n");

const total = seed.cities.reduce((n, c) => n + c.places.length, 0);
console.log(`SLUG:${slug}`);
console.log(`✓ ${slug}.json: ${total} places, ${seed.adventure.places.length} adventures`);
for (const c of seed.cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}
