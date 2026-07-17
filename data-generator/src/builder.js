import { CONFIG, COUNTRY_CITY_OVERRIDES } from "./config.js";
import { COUNTRY_CITY_HARDCODED } from "./city-overrides.js";
import {
  fetchCitiesForCountry,
  fetchCitiesByIds,
  fetchAttractionsForCity,
  fetchAdventuresForCountry,
  fetchCountryLevelAttractions,
  enrichCitySitelinks,
  enrichPlaceSitelinks,
  isLowQualityAttraction,
  rankAttractionCandidates,
} from "./extractor.js";
import { resolveImage } from "./image-resolver.js";
import {
  selectValidItems,
  toAttractionRecord,
  toAdventureRecord,
  toCityRecord,
} from "./validator.js";
import { applyAiSeoBatch } from "./seo-generator.js";
import { log, slugify, wikipediaUrl, mapPool } from "./utils.js";

export async function buildCountry(country) {
  log(`Country: ${country.name} (${country.id})`);

  const hardcoded = COUNTRY_CITY_HARDCODED[country.id];
  const curated = COUNTRY_CITY_OVERRIDES[country.id];
  let cities;
  if (hardcoded?.length) {
    cities = hardcoded.map((c) => ({
      ...c,
      wikipedia_title: c.wiki_title,
      country: country.name,
      country_id: country.id,
      population: 0,
    }));
    log(`  Using ${cities.length} hardcoded cities`);
  } else if (curated?.length) {
    cities = await fetchCitiesByIds(curated, country.name, country.id);
    log(`  Using ${cities.length} curated cities`);
  } else {
    cities = await fetchCitiesForCountry(country.id, country.name);
  }
  cities = await enrichCitySitelinks(cities);
  cities = cities.filter((c) => c.wikipedia_title);

  if (cities.length < CONFIG.citiesPerCountry) {
    log(`  ⚠ Only ${cities.length} cities with enwiki for ${country.name}`);
  }

  cities = cities.slice(0, CONFIG.citiesPerCountry);
  if (cities.length === 0) {
    return null;
  }

  const countryPool = await fetchCountryLevelAttractions(country.id, country.name).catch(
    () => []
  );
  await enrichPlaceSitelinks(countryPool);

  let adventureCandidates = await fetchAdventuresForCountry(country.id, country.name).catch(
    () => []
  );
  adventureCandidates = await enrichPlaceSitelinks(adventureCandidates);

  const usedIds = new Set();
  const cityRecords = cities.map((c) => ({
    ...toCityRecord(c, country.name),
    wikipedia_url: c.wikipedia_title ? wikipediaUrl(c.wikipedia_title) : null,
  }));

  const allAttractions = [];
  const globalUsed = new Set();

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    log(`  City ${i + 1}/${cities.length}: ${city.name}`);
    let candidates = await fetchAttractionsForCity(city.id, city.name, country.name).catch(
      () => []
    );
    candidates = await enrichPlaceSitelinks(candidates);
    candidates = candidates.filter(
      (c) => c.wikipedia_title && !isLowQualityAttraction(c)
    );
    candidates = rankAttractionCandidates(candidates);
    candidates = candidates.slice(0, CONFIG.maxCandidatesPerCity);

    const pool = countryPool.filter(
      (p) =>
        slugify(p.city) === slugify(city.name) &&
        !globalUsed.has(p.id) &&
        !isLowQualityAttraction(p)
    );

    const { selected } = await selectValidItems(
      candidates,
      pool,
      CONFIG.attractionsPerCity,
      resolveImage,
      globalUsed
    );

    if (selected.length < CONFIG.attractionsPerCity) {
      log(
        `  ⚠ ${city.name}: ${selected.length}/${CONFIG.attractionsPerCity} attractions (enwiki + image)`
      );
    }

    const cityMeta = {
      name: city.name,
      slug: slugify(city.name),
      country: country.name,
      region: country.name,
    };

    const withSeo = await applyAiSeoBatch(
      selected.map((s, idx) => toAttractionRecord(s, cityMeta, idx)),
      "attraction"
    );
    allAttractions.push(...withSeo);
  }

  const { selected: adventures } = await selectValidItems(
    adventureCandidates.filter((a) => a.wikipedia_title),
    adventureCandidates,
    CONFIG.adventuresPerCountry,
    resolveImage,
    usedIds
  );

  if (adventures.length < CONFIG.adventuresPerCountry) {
    log(
      `  ⚠ ${country.name}: ${adventures.length}/${CONFIG.adventuresPerCountry} adventure locations`
    );
  }

  const adventureRecords = await applyAiSeoBatch(
    adventures.map((a, idx) => toAdventureRecord(a, idx)),
    "adventure"
  );

  return {
    country: country.name,
    wikidata_id: country.id,
    wikidata_url: `https://www.wikidata.org/wiki/${country.id}`,
    wikipedia_url: null,
    cities: cityRecords,
    attractions: allAttractions,
    adventure_locations: adventureRecords,
    stats: {
      cities: cityRecords.length,
      attractions: allAttractions.length,
      adventures: adventureRecords.length,
      target_cities: CONFIG.citiesPerCountry,
      target_attractions: CONFIG.citiesPerCountry * CONFIG.attractionsPerCity,
      target_adventures: CONFIG.adventuresPerCountry,
    },
  };
}

export async function buildEurope(countries) {
  const results = await mapPool(
    countries,
    async (country) => {
      try {
        return await buildCountry(country);
      } catch (err) {
        log(`  ✗ ${country.name}: ${err.message}`);
        return null;
      }
    },
    CONFIG.countryConcurrency
  );

  return results.filter(Boolean);
}
