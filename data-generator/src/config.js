import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export const CONFIG = {
  root: ROOT,
  outputFile: join(ROOT, "output", "europe.json"),
  cacheDir: join(ROOT, "cache"),
  userAgent: "EuropeTravelDataGenerator/1.0 (programmatic-seo; contact: data-generator@local)",
  wikidataSparql: "https://query.wikidata.org/sparql",
  wikidataApi: "https://www.wikidata.org/w/api.php",
  commonsApi: "https://commons.wikimedia.org/w/api.php",
  wikipediaApi: "https://en.wikipedia.org/w/api.php",

  /** Per-country targets */
  citiesPerCountry: 10,
  attractionsPerCity: 10,
  adventuresPerCountry: 10,

  /** Max POI candidates to try for images per city */
  maxCandidatesPerCity: 50,

  /** City types beyond Q515 — includes towns, villages, parishes */
  cityTypes: ["Q515", "Q3957", "Q532", "Q2983893", "Q15284", "Q486972"],

  /** Networking */
  sparqlDelayMs: Number(process.env.SPARQL_DELAY_MS || 1200),
  apiDelayMs: Number(process.env.API_DELAY_MS || 350),
  maxRetries: 6,
  countryConcurrency: 2,

  /** Optional: limit countries for testing (0 = all) */
  limitCountries: Number(process.env.LIMIT_COUNTRIES || 0),
  countryOffset: Number(process.env.COUNTRY_OFFSET || 0),
  countryIds: process.env.COUNTRY_IDS
    ? process.env.COUNTRY_IDS.split(",").map((s) => s.trim())
    : null,

  /** Optional AI SEO (never for geo data) */
  enableAiSeo: process.env.ENABLE_AI_SEO === "1",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",

  /** Free licenses (aligned with travel-magazine wiki-image.ts) */
  allowedLicenses:
    /public domain|cc0|cc.?zero|cc.?by|creative commons|gfdl|pd-|free art|no restrictions|copyrighted free use/i,

  /** Enable Openverse API fallback (CC/CC0/PD aggregator) */
  enableOpenverse: process.env.DISABLE_OPENVERSE !== "1",
  openverseApi: "https://api.openverse.org/v1/images/",

  /** Min population when auto-picking cities (skip tiny municipalities) */
  minCityPopulation: Number(process.env.MIN_CITY_POPULATION || 25000),
};

/** Curated top cities when Wikidata population ranking picks wrong municipalities */
export const COUNTRY_CITY_OVERRIDES = {
  Q225: [
    "Q11194",
    "Q93347",
    "Q131127",
    "Q174684",
    "Q184036",
    "Q134430",
    "Q321868",
    "Q158892",
    "Q489477",
    "Q147369",
  ],
  /** Japan — curated top 10 cities (Tokyo metro + major hubs) */
  Q17: [
    "Q1490", // Tokyo
    "Q38283", // Yokohama
    "Q35765", // Osaka
    "Q11751", // Nagoya
    "Q37951", // Sapporo
    "Q26600", // Fukuoka
    "Q48320", // Kobe
    "Q34600", // Kyoto
    "Q34668", // Hiroshima
    "Q46747", // Sendai
  ],
};

export const ATTRACTION_TYPES = [
  "Q570116", // tourist attraction
  "Q33506", // museum
  "Q839954", // archaeological site
  "Q23413", // fortress / castle
  "Q4989906", // monument
  "Q16970", // church
  "Q12280", // bridge
  "Q54074585", // tower
  "Q41176", // building (filtered downstream)
];

/** Excluded from attraction results (low tourism value) */
export const EXCLUDED_ATTRACTION_TYPES = [
  "Q55488", // railway station
  "Q483110", // stadium
  "Q928830", // metro station
  "Q2175765", // tram stop
  "Q1060829", // bus station
];

export const ADVENTURE_TYPES = [
  "Q46169", // national park
  "Q179049", // nature reserve
  "Q8502", // mountain
  "Q23397", // lake
  "Q46831", // river
  "Q35666", // glacier
  "Q473972", // protected area
];
