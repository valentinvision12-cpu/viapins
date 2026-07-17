/** Country flags, cover images, and display helpers */

export const COUNTRY_FLAGS: Record<string, string> = {
  Greece: "🇬🇷",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Finland: "🇫🇮",
  France: "🇫🇷",
  Hungary: "🇭🇺",
  Iceland: "🇮🇸",
  Indonesia: "🇮🇩",
  Estonia: "🇪🇪",
  Austria: "🇦🇹",
  "Bosnia and Herzegovina": "🇧🇦",
  Portugal: "🇵🇹",
  Romania: "🇷🇴",
  Croatia: "🇭🇷",
  Cyprus: "🇨🇾",
  "Czech Republic": "🇨🇿",
  Denmark: "🇩🇰",
  Bulgaria: "🇧🇬",
  Albania: "🇦🇱",
  Belarus: "🇧🇾",
  Andorra: "🇦🇩",
  Luxembourg: "🇱🇺",
  Germany: "🇩🇪",
  Ireland: "🇮🇪",
  Kosovo: "🇽🇰",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Latvia: "🇱🇻",
  Liechtenstein: "🇱🇮",
  Lithuania: "🇱🇹",
  Malta: "🇲🇹",
  Moldova: "🇲🇩",
  Monaco: "🇲🇨",
  Montenegro: "🇲🇪",
  "North Macedonia": "🇲🇰",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  Russia: "🇷🇺",
  "San Marino": "🇸🇲",
  Serbia: "🇷🇸",
  Slovakia: "🇸🇰",
  Slovenia: "🇸🇮",
  Sweden: "🇸🇪",
  Switzerland: "🇨🇭",
  Turkey: "🇹🇷",
  Ukraine: "🇺🇦",
  "United Kingdom": "🇬🇧",
  Japan: "🇯🇵",
};

/** ISO 3166-1 alpha-2 for crisp flag PNGs (flagcdn.com, free use) */
export const COUNTRY_ISO2: Record<string, string> = {
  Greece: "gr",
  Italy: "it",
  Spain: "es",
  Finland: "fi",
  France: "fr",
  Hungary: "hu",
  Iceland: "is",
  Indonesia: "id",
  Estonia: "ee",
  Austria: "at",
  "Bosnia and Herzegovina": "ba",
  Portugal: "pt",
  Romania: "ro",
  Croatia: "hr",
  Cyprus: "cy",
  "Czech Republic": "cz",
  Denmark: "dk",
  Bulgaria: "bg",
  Albania: "al",
  Belarus: "by",
  Andorra: "ad",
  Luxembourg: "lu",
  Germany: "de",
  Ireland: "ie",
  Kosovo: "xk",
  Netherlands: "nl",
  Belgium: "be",
  Latvia: "lv",
  Liechtenstein: "li",
  Lithuania: "lt",
  Malta: "mt",
  Moldova: "md",
  Monaco: "mc",
  Montenegro: "me",
  "North Macedonia": "mk",
  Norway: "no",
  Poland: "pl",
  Russia: "ru",
  "San Marino": "sm",
  Serbia: "rs",
  Slovakia: "sk",
  Slovenia: "si",
  Sweden: "se",
  Switzerland: "ch",
  Turkey: "tr",
  Ukraine: "ua",
  "United Kingdom": "gb",
  Japan: "jp",
};

/** Wikimedia-friendly iconic landmark per country for cover cards */
export const COUNTRY_COVER_WIKI: Record<string, string> = {
  Greece: "Parthenon",
  Italy: "Colosseum",
  Spain: "Sagrada Família",
  Finland: "Helsinki Cathedral",
  France: "Eiffel Tower",
  Hungary: "Hungarian Parliament Building",
  Iceland: "Hallgrímskirkja",
  Indonesia: "Borobudur",
  Estonia: "Tallinn Old Town",
  Austria: "Schönbrunn Palace",
  "Bosnia and Herzegovina": "Stari Most",
  Portugal: "Belém Tower",
  Romania: "Palace of the Parliament",
  Croatia: "Diocletian's Palace",
  Cyprus: "Kyrenia Castle",
  "Czech Republic": "Charles Bridge",
  Denmark: "Nyhavn",
  Bulgaria: "Alexander Nevsky Cathedral, Sofia",
  Albania: "Berat Castle",
  Belarus: "Mir Castle Complex",
  Andorra: "Casa de la Vall",
  Luxembourg: "Adolphe Bridge",
  Germany: "Brandenburg Gate",
  Ireland: "Cliffs of Moher",
  Kosovo: "Prizren Fortress",
  Netherlands: "Rijksmuseum",
  Belgium: "Grand Place, Brussels",
  Latvia: "Riga Cathedral",
  Liechtenstein: "Vaduz Castle",
  Lithuania: "Gediminas Tower",
  Malta: "St John's Co-Cathedral",
  Moldova: "Orheiul Vechi",
  Monaco: "Prince's Palace of Monaco",
  Montenegro: "Kotor Old Town",
  "North Macedonia": "Skopje Fortress",
  Norway: "Bryggen",
  Poland: "Wawel Castle",
  Russia: "Saint Basil's Cathedral",
  "San Marino": "Guaita",
  Serbia: "Belgrade Fortress",
  Slovakia: "Bratislava Castle",
  Slovenia: "Lake Bled",
  Sweden: "Gamla stan",
  Switzerland: "Matterhorn",
  Turkey: "Hagia Sophia",
  Ukraine: "Saint Sophia Cathedral, Kyiv",
  "United Kingdom": "Big Ben",
  Japan: "Mount Fuji",
};

/** Short DB/import labels → full display name (no abbreviations in UI) */
const COUNTRY_ALIASES: Record<string, string> = {
  UK: "United Kingdom",
  Czechia: "Czech Republic",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  Macedonia: "North Macedonia",
};

export function getCountryDisplayName(country: string): string {
  const trimmed = country.trim();
  const noParen = trimmed.replace(/\s*[\(\[][^)\]]+[\)\]]\s*$/u, "").trim();
  const noSuffix = noParen.replace(/\s*[-–—]\s*[A-Z]{2,3}\s*$/u, "").trim();
  return COUNTRY_ALIASES[noSuffix] ?? noSuffix;
}

export function getCountryFlag(country: string): string {
  const display = getCountryDisplayName(country);
  return COUNTRY_FLAGS[display] ?? COUNTRY_FLAGS[country] ?? "🌍";
}

export function getCountryIso2(country: string): string | undefined {
  const display = getCountryDisplayName(country);
  return COUNTRY_ISO2[display] ?? COUNTRY_ISO2[country];
}

/** Sharp flag PNG — works on Windows where emoji flags are blank boxes */
export function getCountryFlagUrl(country: string, width = 80): string | undefined {
  const iso = getCountryIso2(country);
  if (!iso) return undefined;
  const w = Math.min(Math.max(width, 40), 320);
  return `https://flagcdn.com/${w}x${Math.round(w * 0.75)}/${iso}.png`;
}

export function getCountryCoverWikiTitle(country: string): string | undefined {
  const display = getCountryDisplayName(country);
  return COUNTRY_COVER_WIKI[display] ?? COUNTRY_COVER_WIKI[country];
}
