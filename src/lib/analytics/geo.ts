/** Resolve visitor country from common edge / proxy headers. */
export function countryFromHeaders(headers: Headers): {
  countryCode: string | null;
  city: string | null;
} {
  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("cloudfront-viewer-country") ||
    null;

  const city =
    headers.get("x-vercel-ip-city") ||
    headers.get("cf-ipcity") ||
    headers.get("x-city") ||
    null;

  const code = country && country !== "XX" && country !== "T1"
    ? country.toUpperCase().slice(0, 2)
    : null;

  let decodedCity: string | null = null;
  if (city) {
    try {
      decodedCity = decodeURIComponent(city).slice(0, 80);
    } catch {
      decodedCity = city.slice(0, 80);
    }
  }

  return { countryCode: code, city: decodedCity };
}

const COUNTRY_BG: Record<string, string> = {
  BG: "България",
  DE: "Германия",
  GB: "Великобритания",
  US: "САЩ",
  FR: "Франция",
  IT: "Италия",
  ES: "Испания",
  TR: "Турция",
  GR: "Гърция",
  RO: "Румъния",
  NL: "Нидерландия",
  PL: "Полша",
  AT: "Австрия",
  CH: "Швейцария",
  BE: "Белгия",
  CZ: "Чехия",
  HU: "Унгария",
  RS: "Сърбия",
  MK: "Северна Македония",
  AL: "Албания",
  HR: "Хърватия",
  SI: "Словения",
  SK: "Словакия",
  UA: "Украйна",
  RU: "Русия",
  CA: "Канада",
  AU: "Австралия",
  JP: "Япония",
  KR: "Южна Корея",
  CN: "Китай",
  IN: "Индия",
  BR: "Бразилия",
  MX: "Мексико",
  SE: "Швеция",
  NO: "Норвегия",
  DK: "Дания",
  FI: "Финландия",
  IE: "Ирландия",
  PT: "Португалия",
  IL: "Израел",
  AE: "ОАЕ",
  SA: "Саудитска Арабия",
  EG: "Египет",
  ZA: "Южна Африка",
};

export function countryLabel(code: string | null | undefined): string {
  if (!code) return "Неизвестно";
  return COUNTRY_BG[code.toUpperCase()] ?? code.toUpperCase();
}
