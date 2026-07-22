/** Homepage & explore grid order — newest uploads first, then batch queue, then legacy */
export const FEATURED_COUNTRY_ORDER = [
  // Phase 1 batch — uploaded
  "Spain",
  "Latvia",
  "Montenegro",
  "Moldova",
  "Kosovo",
  // Phase 1 batch — in progress / next
  "Lithuania",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Russia",
  "North Macedonia",
  "Serbia",
  "Turkey",
  "United Kingdom",
  "Slovakia",
  "Slovenia",
  "Sweden",
  "Switzerland",
  "Ukraine",
  "Liechtenstein",
  "Malta",
  "Monaco",
  "San Marino",
  // Earlier countries
  "Greece",
  "Italy",
  "France",
  "Hungary",
  "Estonia",
  "Austria",
  "Bosnia and Herzegovina",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Bulgaria",
  "Albania",
  "Belarus",
  "Andorra",
  "Luxembourg",
  "Germany",
  "Ireland",
  "Belgium",
  // Asia
  "Japan",
] as const;

/** Curated home “Featured” row — premium destinations, not the full catalog */
export const HOME_FEATURED_COUNTRIES = [
  "Italy",
  "France",
  "Spain",
  "Japan",
  "Greece",
  "Portugal",
  "United Kingdom",
  "Germany",
] as const;

/** Hero quick-picks / featured count on home */
export const TOP_COUNTRIES_HOME = 8;
