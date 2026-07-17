/** Shared vague-zone filter for .mjs scripts — keep in sync with src/lib/precise-place-filter.ts */

export const COUNTRY_BBOX = {
  Spain: { minLat: 27.5, maxLat: 43.8, minLng: -18.5, maxLng: 4.5 },
  Portugal: { minLat: 32.2, maxLat: 42.2, minLng: -31.5, maxLng: -6.0 },
  France: { minLat: 41.3, maxLat: 51.1, minLng: -5.2, maxLng: 9.6 },
  Germany: { minLat: 47.2, maxLat: 55.1, minLng: 5.8, maxLng: 15.1 },
  Italy: { minLat: 36.6, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 },
  Greece: { minLat: 34.5, maxLat: 41.8, minLng: 19.3, maxLng: 29.7 },
  Ireland: { minLat: 51.4, maxLat: 55.4, minLng: -10.5, maxLng: -5.4 },
  Kosovo: { minLat: 41.8, maxLat: 43.3, minLng: 20.0, maxLng: 21.8 },
  Latvia: { minLat: 55.6, maxLat: 58.1, minLng: 20.9, maxLng: 28.3 },
  Lithuania: { minLat: 53.8, maxLat: 56.5, minLng: 20.9, maxLng: 26.9 },
  Liechtenstein: { minLat: 47.0, maxLat: 47.3, minLng: 9.4, maxLng: 9.7 },
  Malta: { minLat: 35.7, maxLat: 36.1, minLng: 14.1, maxLng: 14.6 },
  Moldova: { minLat: 45.4, maxLat: 48.5, minLng: 26.6, maxLng: 30.2 },
  Monaco: { minLat: 43.7, maxLat: 43.8, minLng: 7.4, maxLng: 7.5 },
  Montenegro: { minLat: 41.8, maxLat: 43.6, minLng: 18.4, maxLng: 20.4 },
  Netherlands: { minLat: 50.7, maxLat: 53.6, minLng: 3.3, maxLng: 7.3 },
  "North Macedonia": { minLat: 40.8, maxLat: 42.4, minLng: 20.4, maxLng: 23.0 },
  Norway: { minLat: 57.9, maxLat: 71.2, minLng: 4.5, maxLng: 31.2 },
  Poland: { minLat: 49.0, maxLat: 54.9, minLng: 14.1, maxLng: 24.2 },
  Russia: { minLat: 41.2, maxLat: 82.0, minLng: 19.6, maxLng: 180.0 },
  "San Marino": { minLat: 43.8, maxLat: 44.0, minLng: 12.4, maxLng: 12.5 },
  Serbia: { minLat: 42.2, maxLat: 46.2, minLng: 18.8, maxLng: 23.0 },
  Slovakia: { minLat: 47.7, maxLat: 49.6, minLng: 16.8, maxLng: 22.6 },
  Slovenia: { minLat: 45.4, maxLat: 46.9, minLng: 13.3, maxLng: 16.6 },
  Sweden: { minLat: 55.3, maxLat: 69.1, minLng: 10.9, maxLng: 24.2 },
  Switzerland: { minLat: 45.8, maxLat: 47.8, minLng: 5.9, maxLng: 10.5 },
  Turkey: { minLat: 35.8, maxLat: 42.1, minLng: 25.9, maxLng: 44.8 },
  Ukraine: { minLat: 44.3, maxLat: 52.4, minLng: 22.1, maxLng: 40.2 },
  "United Kingdom": { minLat: 49.8, maxLat: 60.9, minLng: -8.7, maxLng: 1.8 },
  Hungary: { minLat: 45.7, maxLat: 48.6, minLng: 16.1, maxLng: 22.9 },
  Austria: { minLat: 46.4, maxLat: 49.0, minLng: 9.5, maxLng: 17.2 },
  Croatia: { minLat: 42.3, maxLat: 46.6, minLng: 13.4, maxLng: 19.5 },
  Cyprus: { minLat: 34.5, maxLat: 35.7, minLng: 32.2, maxLng: 34.6 },
  "Czech Republic": { minLat: 48.5, maxLat: 51.1, minLng: 12.0, maxLng: 18.9 },
  Bulgaria: { minLat: 41.2, maxLat: 44.2, minLng: 22.3, maxLng: 28.6 },
  Albania: { minLat: 39.6, maxLat: 42.7, minLng: 19.1, maxLng: 21.1 },
  Belarus: { minLat: 51.2, maxLat: 56.2, minLng: 23.1, maxLng: 32.8 },
  Andorra: { minLat: 42.4, maxLat: 42.7, minLng: 1.4, maxLng: 1.8 },
  Luxembourg: { minLat: 49.4, maxLat: 50.2, minLng: 5.7, maxLng: 6.5 },
  Belgium: { minLat: 49.4, maxLat: 51.6, minLng: 2.5, maxLng: 6.4 },
  Estonia: { minLat: 57.5, maxLat: 59.7, minLng: 21.7, maxLng: 28.2 },
  "Bosnia and Herzegovina": { minLat: 42.5, maxLat: 45.3, minLng: 15.7, maxLng: 19.6 },
  Finland: { minLat: 59.5, maxLat: 70.1, minLng: 20.5, maxLng: 31.6 },
  Denmark: { minLat: 54.5, maxLat: 57.8, minLng: 8.0, maxLng: 15.2 },
  Iceland: { minLat: 63.2, maxLat: 66.6, minLng: -24.5, maxLng: -13.5 },
  Romania: { minLat: 43.6, maxLat: 48.3, minLng: 20.2, maxLng: 29.7 },
  Japan: { minLat: 24.0, maxLat: 46.0, minLng: 122.9, maxLng: 153.9 },
};

const SPECIFIC_LANDMARK = [
  /\bcastle\b/i, /\bcathedral\b/i, /\bbasilica\b/i, /\bchurch\b/i, /\bchapel\b/i,
  /\bmosque\b/i, /\bsynagogue\b/i, /\btemple\b/i, /\bmonastery\b/i, /\babbey\b/i,
  /\bpalace\b/i, /\bmuseum\b/i, /\bgallery\b/i, /\bfortress\b/i, /\bfort\b/i,
  /\bcitadel\b/i, /\bbridge\b/i, /\btower\b/i, /\blighthouse\b/i,
  /\bamphitheatre\b/i, /\bamphitheater\b/i, /\baqueduct\b/i, /\bobservatory\b/i,
  /\bplaza\b/i, /\bsquare\b/i, /\bmarket hall\b/i, /\bopera\b/i, /\btheatre\b/i,
  /\btheater\b/i, /\bmonument\b/i, /\bstatue\b/i, /\bviewpoint\b/i, /\blookout\b/i,
  /\bpeak\b/i, /\bmount\b/i, /\bmountain\b/i, /\bisland\b/i, /\barch\b/i, /\bgate\b/i,
  /\bwall\b/i, /\bruins\b/i, /\bcolosseum\b/i, /\barena\b/i, /\bshrine\b/i,
  /\bclock tower\b/i, /\bbell tower\b/i, /\bminaret\b/i, /\bdom\b/i, /\bduomo\b/i,
  /\bmezquita\b/i, /\balcázar\b/i, /\balcazar\b/i, /\bchâteau\b/i, /\bschloss\b/i,
  /\bburg\b/i,   /\bwaterfall\b/i, /\bcliff\b/i, /\bviewpoints?\b/i,
  /\bopen air museum\b/i, /\bunderground city\b/i, /\bmonks valley\b/i,
  /\b gorge\b/i, /\b canyon\b/i, /\b pier\b/i, /\bsunset point\b/i,
  /\bvalley trail\b/i, /\blove valley\b/i, /\bdevrent valley\b/i,
  /\bpigeon valley\b/i,   /\bred valley\b/i, /\bnational park trails\b/i,
  /\bihlara valley\b/i, /\bbutterfly valley\b/i,
];

const VAGUE_ZONE = [
  /\bnational park\b/i, /\bnational forest\b/i, /\bstate park\b/i,
  /\bregional park\b/i, /\bnature reserve\b/i, /\bnatural park\b/i,
  /\bwilderness\b/i, /\bprotected area\b/i, /\bnature park\b/i, /\bforest\b/i,
  /\bdistrict\b/i, /\bhighlands\b/i, /\barchipelago\b/i, /\bpeninsula\b/i,
  /\bcoastline\b/i, /\bscenic route\b/i, /\bscenic drive\b/i, /\broad trip\b/i,
  /\bcountryside\b/i, /\bregion\b/i, /\bprovince\b/i, /\bcounty\b/i, /\barea\b/i,
  /\bzone\b/i, /\bvalley\b/i, /\bmountains\b/i, /\bmountain range\b/i, /\b range\b/i,
  /\bsea\b/i, /\bocean\b/i, /\bbay\b/i, /\bcoast\b/i, /\bshore\b/i, /\briver\b/i,
  /\blake district\b/i, /\bislands\b/i, /\bgeopark\b/i, /\bbiosphere\b/i,
  /\bdepart(ment|amento)\b/i, /\bviceroyalty\b/i, /\bmonarchs\b/i, /\breconquest\b/i, /\bmunicipality\b/i,
  /^list of\b/i, /^history of\b/i, /^geography of\b/i, /^tourism in\b/i,
];

export function isSpecificLandmark(name) {
  return SPECIFIC_LANDMARK.some((p) => p.test((name || "").trim()));
}

export function isCoordInCountry(lat, lng, country) {
  const b = COUNTRY_BBOX[country];
  if (!b) return true;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la === 0 && ln === 0) return false;
  return la >= b.minLat && la <= b.maxLat && ln >= b.minLng && ln <= b.maxLng;
}

export function isVaguePlace(name, description, country, lat, lng) {
  const n = (name || "").trim();
  if (!n) return true;
  if (isSpecificLandmark(n)) {
    if (country && lat != null && lng != null && !isCoordInCountry(lat, lng, country)) return true;
    return false;
  }
  if (VAGUE_ZONE.some((p) => p.test(n))) return true;
  if (country && lat != null && lng != null && !isCoordInCountry(lat, lng, country)) return true;
  return false;
}

export function isPrecisePlace(name, description, country, lat, lng) {
  return !isVaguePlace(name, description, country, lat, lng);
}

export function getCityRadiusKm(country) {
  switch (country) {
    case "Liechtenstein":
    case "Monaco":
    case "San Marino":
    case "Andorra":
      return 8;
    case "Malta":
      return 18;
    case "Luxembourg":
      return 15;
    default:
      return 35;
  }
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isCoordNearCity(lat, lng, cityLat, cityLng, country) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return haversineKm(lat, lng, cityLat, cityLng) <= getCityRadiusKm(country);
}

export function isTopCityLandmark(name, country, lat, lng, cityLat, cityLng, description) {
  if (!isPrecisePlace(name, description, country, lat, lng)) return false;
  if (cityLat != null && cityLng != null && !isCoordNearCity(lat, lng, cityLat, cityLng, country)) {
    return false;
  }
  return true;
}
