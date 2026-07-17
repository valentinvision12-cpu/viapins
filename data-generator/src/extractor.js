import {
  CONFIG,
  ATTRACTION_TYPES,
  EXCLUDED_ATTRACTION_TYPES,
  ADVENTURE_TYPES,
  COUNTRY_CITY_OVERRIDES,
} from "./config.js";
import { sparqlQuery, bindingValue, bindingLabel } from "./sparql.js";
import { parseWikidataId, fetchJson, sleep } from "./utils.js";

const QUARTER_TYPES = ["Q123705", "Q702492", "Q188509", "Q7930989"];

const LOW_QUALITY_NAME =
  /railway station|train station|metro station|tram stop|bus station|stadion|stadium| football club| fc |ground$|pitch$|depot$|halt$|halte$/i;

const DEATH_NAME =
  /\bcemetery\b|\bgraveyard\b|\bburial\b|\btomb(s)?\b|\bturbe\b|\bmausoleum\b|\bcatacomb(s)?\b|\bcrypt(s)?\b|\bossuar(y|ies)\b|\bnecropolis\b|\bbone house\b|\bbone chapel\b|\bskeleton\b|\bskull\b|\bmumm(y|ies)\b|\bmemorial cemetery\b|\bwar cemetery\b|\btombs of the kings\b|\bgaravice memorial\b/i;

export function isExcludedAttraction(item) {
  if (LOW_QUALITY_NAME.test(item.name || "")) return true;
  if (DEATH_NAME.test(item.name || "")) return true;
  if (item.description && /\bnecropolis\b|\bburial\b|\bbones?\b|\bossuary\b|\bcatacomb\b/i.test(item.description)) {
    return true;
  }
  return false;
}

/**
 * Sovereign states with primary continent Europe (Wikidata P30=Q46).
 */
export async function fetchEuropeanCountries() {
  const query = `
SELECT DISTINCT ?country ?countryLabel (MAX(?pop) AS ?population) WHERE {
  ?country wdt:P31/wdt:P279* wd:Q3624078 .
  ?country wdt:P30 wd:Q46 .
  OPTIONAL { ?country wdt:P1082 ?pop . }
  FILTER NOT EXISTS { ?country wdt:P576 ?dissolved . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?country ?countryLabel
ORDER BY DESC(?population)
`;
  const rows = await sparqlQuery(query, "countries-europe");
  return rows
    .map((r) => ({
      id: parseWikidataId(bindingValue(r, "country")),
      name: bindingLabel(r, "countryLabel"),
      population: Number(bindingValue(r, "population") || 0),
    }))
    .filter((c) => c.id && c.name);
}

/**
 * Fetch specific countries by Wikidata ID (any continent — for Asia pipeline).
 */
export async function fetchCountriesByIds(ids) {
  const wdIds = ids.map((id) => (id.startsWith("Q") ? `wd:${id}` : `wd:Q${id}`));
  const values = wdIds.join(" ");
  const query = `
SELECT ?country ?countryLabel (MAX(?pop) AS ?population) WHERE {
  VALUES ?country { ${values} }
  OPTIONAL { ?country wdt:P1082 ?pop . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?country ?countryLabel
ORDER BY DESC(?population)
`;
  const rows = await sparqlQuery(query, "countries-by-id");
  return rows
    .map((r) => ({
      id: parseWikidataId(bindingValue(r, "country")),
      name: bindingLabel(r, "countryLabel"),
      population: Number(bindingValue(r, "population") || 0),
    }))
    .filter((c) => c.id && c.name);
}

/**
 * Top populated settlements in a country with coordinates + enwiki.
 * Excludes city quarters / neighborhoods.
 */
export async function fetchCitiesForCountry(countryId, countryName) {
  const typeValues = CONFIG.cityTypes.map((t) => `wd:${t}`).join(" ");
  const quarterFilters = QUARTER_TYPES.map(
    (t) => `FILTER NOT EXISTS { ?city wdt:P31/wdt:P279* wd:${t} . }`
  ).join("\n  ");
  const query = `
SELECT ?city ?cityLabel ?lat ?lon ?wiki (MAX(?pop) AS ?population) WHERE {
  VALUES ?cityType { ${typeValues} }
  ?city wdt:P31/wdt:P279* ?cityType .
  ?city wdt:P17 wd:${countryId} .
  ?city p:P625 ?st .
  ?st psv:P625 ?coords .
  ?coords wikibase:geoLatitude ?lat .
  ?coords wikibase:geoLongitude ?lon .
  ${quarterFilters}
  OPTIONAL { ?city wdt:P1082 ?pop . }
  OPTIONAL {
    ?en schema:about ?city ;
         schema:isPartOf <https://en.wikipedia.org/> ;
         schema:name ?wiki .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?city ?cityLabel ?lat ?lon ?wiki
ORDER BY DESC(?population)
LIMIT 60
`;
  const cacheKey = `cities-v2-${countryId}`;
  const rows = await sparqlQuery(query, cacheKey);

  const seen = new Set();
  const cities = [];
  for (const r of rows) {
    const id = parseWikidataId(bindingValue(r, "city"));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const lat = Number(bindingValue(r, "lat"));
    const lon = Number(bindingValue(r, "lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name = bindingLabel(r, "cityLabel");
    if (isQuarterName(name)) continue;
    const pop = Number(bindingValue(r, "population") || 0);
    if (pop > 0 && pop < CONFIG.minCityPopulation) continue;
    cities.push({
      id,
      name,
      lat,
      lng: lon,
      wikipedia_title: bindingValue(r, "wiki") || null,
      population: Number(bindingValue(r, "population") || 0),
      country: countryName,
      country_id: countryId,
    });
    if (cities.length >= CONFIG.citiesPerCountry * 3) break;
  }
  return cities;
}

function isQuarterName(name) {
  return (
    /^(north|south|east|west|upper|lower|old|new)\s+/i.test(name) ||
    /^stari grad$/i.test(name.trim()) ||
    /,\s*(sarajevo|mostar|banja luka)$/i.test(name)
  );
}

/**
 * Fetch specific cities by Wikidata ID (curated list for countries with bad SPARQL ranking).
 */
export async function fetchCitiesByIds(ids, countryName, countryId) {
  const values = ids.map((id) => `wd:${id}`).join(" ");
  const query = `
SELECT ?city ?cityLabel ?lat ?lon ?wiki (MAX(?pop) AS ?population) WHERE {
  VALUES ?city { ${values} }
  ?city p:P625 ?st .
  ?st psv:P625 ?coords .
  ?coords wikibase:geoLatitude ?lat .
  ?coords wikibase:geoLongitude ?lon .
  OPTIONAL { ?city wdt:P1082 ?pop . }
  OPTIONAL {
    ?en schema:about ?city ;
         schema:isPartOf <https://en.wikipedia.org/> ;
         schema:name ?wiki .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?city ?cityLabel ?lat ?lon ?wiki
`;
  const cacheKey = `cities-curated-${countryId}`;
  const rows = await sparqlQuery(query, cacheKey);
  const byId = new Map();
  for (const r of rows) {
    const id = parseWikidataId(bindingValue(r, "city"));
    if (!id) continue;
    byId.set(id, {
      id,
      name: bindingLabel(r, "cityLabel"),
      lat: Number(bindingValue(r, "lat")),
      lng: Number(bindingValue(r, "lon")),
      wikipedia_title: bindingValue(r, "wiki") || null,
      population: Number(bindingValue(r, "population") || 0),
      country: countryName,
      country_id: countryId,
    });
  }
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

function typesValues(ids) {
  return ids.map((id) => `wd:${id}`).join(" ");
}

function excludedTypeFilters() {
  return EXCLUDED_ATTRACTION_TYPES.map(
    (t) => `FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:${t} . }`
  ).join("\n  ");
}

export function isLowQualityAttraction(item) {
  return isExcludedAttraction(item);
}

/** Prefer items with P18 image, tourist types, shorter generic names */
export function rankAttractionCandidates(candidates) {
  const score = (item) => {
    let s = 0;
    if (item.commons_file) s += 40;
    const n = (item.name || "").toLowerCase();
    if (/museum|cathedral|church|castle|fort|abbey|monument|bridge|park|palace|tower|memorial|gallery|ruins|square|market|theatre|theater|aqueduct|château|schloss|basilica|mosque|synagogue|lighthouse|unesco|world heritage|national/.test(n)) {
      s += 30;
    }
    if (/building$|house$|station$|hall$/.test(n)) s -= 10;
    if (n.length > 55) s -= 5;
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a));
}

/**
 * Candidate POIs located in/under a city admin hierarchy.
 */
export async function fetchAttractionsForCity(cityId, cityName, countryName) {
  const query = `
SELECT DISTINCT ?item ?itemLabel ?lat ?lon ?wiki ?image WHERE {
  VALUES ?type { ${typesValues(ATTRACTION_TYPES)} }
  ?item wdt:P31/wdt:P279* ?type .
  ?item wdt:P131* wd:${cityId} .
  ?item p:P625 ?st .
  ?st psv:P625 ?coords .
  ?coords wikibase:geoLatitude ?lat .
  ?coords wikibase:geoLongitude ?lon .
  ${excludedTypeFilters()}
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL {
    ?en schema:about ?item ;
         schema:isPartOf <https://en.wikipedia.org/> ;
         schema:name ?wiki .
  }
  FILTER NOT EXISTS { ?item wdt:P576 ?gone . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 120
`;
  const cacheKey = `attractions-v2-${cityId}`;
  const rows = await sparqlQuery(query, cacheKey);
  return rowsToPlaces(rows, cityName, countryName, "attraction");
}

/**
 * Fallback attractions: country-level notable sites when city has too few.
 */
export async function fetchCountryLevelAttractions(countryId, countryName) {
  const query = `
SELECT DISTINCT ?item ?itemLabel ?lat ?lon ?wiki ?image ?cityLabel WHERE {
  VALUES ?type { ${typesValues(ATTRACTION_TYPES)} }
  ?item wdt:P31/wdt:P279* ?type .
  ?item wdt:P17 wd:${countryId} .
  ?item wdt:P131 ?city .
  ?city rdfs:label ?cityLabel .
  FILTER(LANG(?cityLabel) = "en")
  ?item p:P625 ?st .
  ?st psv:P625 ?coords .
  ?coords wikibase:geoLatitude ?lat .
  ?coords wikibase:geoLongitude ?lon .
  ${excludedTypeFilters()}
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL {
    ?en schema:about ?item ;
         schema:isPartOf <https://en.wikipedia.org/> ;
         schema:name ?wiki .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 200
`;
  const rows = await sparqlQuery(query, `country-pois-v2-${countryId}`);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const id = parseWikidataId(bindingValue(r, "item"));
    if (!id || seen.has(id)) continue;
    const name = bindingLabel(r, "itemLabel");
    const lat = Number(bindingValue(r, "lat"));
    const lng = Number(bindingValue(r, "lon"));
    const city = bindingLabel(r, "cityLabel");
    if (!name || !city || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (isLowQualityAttraction({ name })) continue;
    seen.add(id);
    const imageRaw = bindingValue(r, "image");
    out.push({
      id,
      name,
      city,
      region: countryName,
      country: countryName,
      lat,
      lng,
      wikipedia_title: bindingValue(r, "wiki") || null,
      commons_file: imageRaw ? decodeURIComponent(imageRaw.split("/").pop()) : null,
      kind: "attraction",
    });
  }
  return out;
}

/**
 * Nature / adventure candidates anywhere in country.
 */
export async function fetchAdventuresForCountry(countryId, countryName) {
  const query = `
SELECT DISTINCT ?item ?itemLabel ?lat ?lon ?wiki ?image ?regionLabel WHERE {
  VALUES ?type { ${typesValues(ADVENTURE_TYPES)} }
  ?item wdt:P31/wdt:P279* ?type .
  ?item wdt:P17 wd:${countryId} .
  ?item p:P625 ?st .
  ?st psv:P625 ?coords .
  ?coords wikibase:geoLatitude ?lat .
  ?coords wikibase:geoLongitude ?lon .
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL {
    ?item wdt:P131 ?region .
    ?region rdfs:label ?regionLabel .
    FILTER(LANG(?regionLabel) = "en")
  }
  OPTIONAL {
    ?en schema:about ?item ;
         schema:isPartOf <https://en.wikipedia.org/> ;
         schema:name ?wiki .
  }
  FILTER NOT EXISTS { ?item wdt:P576 ?gone . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 80
`;
  const cacheKey = `adventures-${countryId}`;
  const rows = await sparqlQuery(query, cacheKey);
  return rowsToPlaces(rows, null, countryName, "adventure");
}

function rowsToPlaces(rows, cityName, countryName, kind) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const id = parseWikidataId(bindingValue(r, "item"));
    if (!id || seen.has(id)) continue;
    const name = bindingLabel(r, "itemLabel");
    const lat = Number(bindingValue(r, "lat"));
    const lng = Number(bindingValue(r, "lon"));
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    seen.add(id);
    const imageRaw = bindingValue(r, "image");
    const imageFile = imageRaw ? decodeURIComponent(imageRaw.split("/").pop()) : null;
    out.push({
      id,
      name,
      city: cityName,
      region: bindingLabel(r, "regionLabel") || countryName,
      country: countryName,
      lat,
      lng,
      wikipedia_title: bindingValue(r, "wiki") || null,
      commons_file: imageFile,
      kind,
    });
  }
  return out;
}

/**
 * Enrich missing enwiki titles via Wikidata API (batch).
 */
export async function enrichSitelinks(items) {
  const need = items.filter((i) => !i.wikipedia_title && i.id);
  if (!need.length) return items;

  for (let i = 0; i < need.length; i += 50) {
    const chunk = need.slice(i, i + 50);
    const ids = chunk.map((x) => x.id).join("|");
    const url = `${CONFIG.wikidataApi}?action=wbgetentities&format=json&props=sitelinks&sitefilter=enwiki&ids=${ids}`;
    try {
      await sleep(CONFIG.apiDelayMs);
      const data = await fetchJson(url);
      for (const item of chunk) {
        const title = data?.entities?.[item.id]?.sitelinks?.enwiki?.title;
        if (title) item.wikipedia_title = title;
      }
    } catch (err) {
      console.warn(`[enrichSitelinks] chunk skip: ${err.message}`);
    }
  }
  return items;
}

export async function enrichCitySitelinks(cities) {
  return enrichSitelinks(cities);
}

export async function enrichPlaceSitelinks(places) {
  return enrichSitelinks(places);
}
