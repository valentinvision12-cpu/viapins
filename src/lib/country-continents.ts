/** Continent assignment for country cards and explore grouping */

export type Continent = "europe" | "asia";

/** All European countries in the magazine (seeds + published). */
export const EUROPE_COUNTRIES = new Set([
  "Albania",
  "Andorra",
  "Austria",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
]);

/** Asian countries live in the magazine (expand as seeds are added). */
export const ASIA_COUNTRIES = new Set([
  "Japan",
  "Indonesia",
]);

export const EUROPE_COUNTRY_COUNT = EUROPE_COUNTRIES.size;
export const ASIA_COUNTRY_COUNT = ASIA_COUNTRIES.size;

export function getCountryContinent(country: string): Continent {
  if (ASIA_COUNTRIES.has(country)) return "asia";
  if (EUROPE_COUNTRIES.has(country)) return "europe";
  return "asia";
}

export function isEuropeCountry(country: string): boolean {
  return getCountryContinent(country) === "europe";
}