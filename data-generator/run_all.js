#!/usr/bin/env node
/**
 * Europe travel dataset generator — single entry point.
 * Usage: node run_all.js
 *        LIMIT_COUNTRIES=3 node run_all.js   (smoke test)
 *        ENABLE_AI_SEO=1 OPENAI_API_KEY=... node run_all.js
 */
import "./src/bootstrap.js";
import { writeFileSync } from "fs";
import { join } from "path";
import { CONFIG } from "./src/config.js";
import { fetchEuropeanCountries, fetchCountriesByIds } from "./src/extractor.js";
import { buildEurope } from "./src/builder.js";
import { ensureDir, log } from "./src/utils.js";

async function main() {
  const started = Date.now();
  log("Europe Travel Data Generator — starting");
  log(`Output: ${CONFIG.outputFile}`);
  ensureDir(join(CONFIG.root, "output"));
  ensureDir(CONFIG.cacheDir);

  let countries;
  if (CONFIG.countryIds?.length) {
    countries = await fetchCountriesByIds(CONFIG.countryIds);
    log(`COUNTRY_IDS: ${countries.map((c) => `${c.name} (${c.id})`).join(", ")}`);
  } else {
    countries = await fetchEuropeanCountries();
    log(`Found ${countries.length} European countries (Wikidata P30=Q46)`);
  }

  if (!CONFIG.countryIds?.length && CONFIG.countryOffset > 0) {
    countries = countries.slice(CONFIG.countryOffset);
  }

  if (CONFIG.limitCountries > 0) {
    countries = countries.slice(0, CONFIG.limitCountries);
    log(`LIMIT_COUNTRIES=${CONFIG.limitCountries}`);
  }

  const countryData = await buildEurope(countries);

  const output = {
    meta: {
      version: 1,
      generated_at: new Date().toISOString(),
      source: "wikidata-sparql + wikimedia-commons",
      image_policy: "CC0, CC BY, CC BY-SA, Public Domain (multi-source)",
      generator: "data-generator/run_all.js",
      country_count: countryData.length,
    },
    countries: countryData,
  };

  writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2), "utf8");

  const totals = countryData.reduce(
    (acc, c) => {
      acc.cities += c.stats.cities;
      acc.attractions += c.stats.attractions;
      acc.adventures += c.stats.adventures;
      return acc;
    },
    { cities: 0, attractions: 0, adventures: 0 }
  );

  const elapsed = ((Date.now() - started) / 1000 / 60).toFixed(1);
  log("Done.");
  log(`  Countries: ${countryData.length}`);
  log(`  Cities: ${totals.cities}`);
  log(`  Attractions: ${totals.attractions}`);
  log(`  Adventures: ${totals.adventures}`);
  log(`  File: ${CONFIG.outputFile}`);
  log(`  Time: ${elapsed} min`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
