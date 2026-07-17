/** Site season keys (hero-map, search-bar, destination cards) */
export const SITE_SEASONS = ["spring", "summer", "autumn", "winter"];

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

/** Cities where winter tourism is common (ski, snow) */
const WINTER_CITY_HINTS =
  /sarajevo|jahorina|kupres|bihac|travnik|mountain|alps|innsbruck|zell|hallstatt|bregenz|klagenfurt|chamonix|zermatt|troms|reine|rovaniemi|lapland/i;

export function inferPlaceType(name) {
  const n = name.toLowerCase();
  if (/museum|gallery|memorial center|memorial centre/.test(n)) return "museum";
  if (/mosque|church|cathedral|monastery|synagogue|basilica|chapel|abbey/.test(n))
    return "church";
  if (/castle|fortress|fort |citadel|tower|gate|bridge|old town|bazaar|market|palace|historic/.test(n))
    return "historic_site";
  if (/national park|nature reserve|waterfall|lake|river|mountain|peak|forest|valley|canyon|spring\b|park\b|garden|trail|hiking|wildlife/.test(n))
    return "nature";
  if (/theatre|theater|opera|gallery|library|university|academy/.test(n)) return "culture";
  if (/stadium|arena|sport/.test(n)) return "landmark";
  return "landmark";
}

export function inferPlaceSeasons(name, type) {
  const n = name.toLowerCase();

  if (/ski|snow|winter|ice rink|olymp|sled|snowboard/.test(n)) {
    return ["winter", "spring"];
  }
  if (/beach|coast|sea\b|adriatic|swim|rafting|river cruise|waterfall|lake|thermal|spa\b|hot spring/.test(n)) {
    return ["spring", "summer", "autumn"];
  }
  if (
    type === "nature" ||
    /national park|nature reserve|mountain|peak|hiking|trail|forest|valley|canyon|wildlife/.test(n)
  ) {
    return SEASON_WARM;
  }
  if (type === "museum" || type === "church" || type === "culture" || type === "historic_site") {
    return SEASON_WARM;
  }
  return SEASON_WARM;
}

export function inferPlaceCategoryTags(name, type) {
  const tags = new Set();
  switch (type) {
    case "museum":
      tags.add("culture");
      tags.add("history");
      tags.add("art");
      break;
    case "church":
      tags.add("religious");
      tags.add("culture");
      tags.add("history");
      tags.add("architecture");
      break;
    case "historic_site":
      tags.add("history");
      tags.add("architecture");
      tags.add("culture");
      break;
    case "nature":
      tags.add("nature");
      tags.add("adventure");
      break;
    case "culture":
      tags.add("culture");
      tags.add("art");
      break;
    default:
      tags.add("culture");
  }
  const n = name.toLowerCase();
  if (/bridge|gate|tower|fortress|castle|old town|bazaar|mosque|cathedral/.test(n)) {
    tags.add("architecture");
  }
  if (/food|market|bazaar/.test(n)) tags.add("food");
  return [...tags];
}

export function inferCitySeasons(cityName, places = []) {
  const set = new Set();
  for (const p of places) {
    for (const s of p.best_season || []) set.add(s);
  }
  if (WINTER_CITY_HINTS.test(cityName)) {
    set.add("winter");
  }
  const ordered = SITE_SEASONS.filter((s) => set.has(s));
  return ordered.length ? ordered : SEASON_WARM;
}

export function inferCityTags(cityName, places = []) {
  const seasons = inferCitySeasons(cityName, places);
  const cats = new Set();
  for (const p of places) {
    for (const t of p.tags || []) {
      if (!SITE_SEASONS.includes(t)) cats.add(t);
    }
  }
  const topCats = [...cats].slice(0, 3);
  return [...seasons, ...topCats];
}

export function inferAdventureSeasons(name) {
  const n = name.toLowerCase();
  if (/ski|snow|glacier|winter/.test(n)) return ["winter", "spring"];
  if (/beach|coast|lake|river|waterfall|thermal/.test(n)) return SEASON_WARM;
  return SEASON_WARM;
}

export function visitDurationHours(type) {
  if (type === "museum") return 2;
  if (type === "nature") return 3;
  if (type === "historic_site") return 1.5;
  return 1;
}
