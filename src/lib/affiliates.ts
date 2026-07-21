export type AffiliateCategory =
  | "hotels"
  | "flights"
  | "car_rental"
  | "insurance"
  | "esim"
  | "tours";

export interface AffiliatePartner {
  id: string;
  category: AffiliateCategory;
  label: string;
  description: string;
  enabled: boolean;
  url_template: string;
  adventure_only?: boolean;
  city_only?: boolean;
  sort_order: number;
}

export interface AffiliateConfig {
  enabled: boolean;
  min_places: number;
  disclosure_en: string;
  disclosure_bg: string;
  partners: AffiliatePartner[];
}

export const AFFILIATE_CATEGORIES: {
  id: AffiliateCategory;
  label: string;
  hint: string;
  example: string;
}[] = [
  {
    id: "hotels",
    label: "Hotels",
    hint: "Booking, Hotels.com",
    example:
      "https://www.booking.com/searchresults.html?ss={city}%2C%20{country}&aid=YOUR_AID",
  },
  {
    id: "flights",
    label: "Flights",
    hint: "Skyscanner, Kiwi",
    example:
      "https://www.skyscanner.net/transport/flights/?adultsv2=1&destination={city}",
  },
  {
    id: "car_rental",
    label: "Car rental",
    hint: "Rentalcars",
    example: "https://www.rentalcars.com/SearchResults.do?city={city}",
  },
  {
    id: "insurance",
    label: "Travel insurance",
    hint: "SafetyWing, World Nomads",
    example: "https://safetywing.com/?referenceID=YOUR_ID",
  },
  {
    id: "esim",
    label: "eSIM / data",
    hint: "Airalo, Holafly",
    example: "https://www.airalo.com/{country_slug}?utm_source=viapins",
  },
  {
    id: "tours",
    label: "Tours & tickets",
    hint: "GetYourGuide, Viator",
    example: "https://www.getyourguide.com/s/?q={city}&partner_id=YOUR_ID",
  },
];

const DEFAULT_DISCLOSURE_EN =
  "Partner link — same price for you, supports ViaPins.";
const DEFAULT_DISCLOSURE_BG =
  "Партньорски линк — същата цена за вас, подкрепя ViaPins.";

export const DEFAULT_AFFILIATE_CONFIG: AffiliateConfig = {
  enabled: false,
  min_places: 2,
  disclosure_en: DEFAULT_DISCLOSURE_EN,
  disclosure_bg: DEFAULT_DISCLOSURE_BG,
  partners: [
    {
      id: "hotels-booking",
      category: "hotels",
      label: "Hotels",
      description: "Stays near your route",
      enabled: false,
      url_template:
        "https://www.booking.com/searchresults.html?ss={city}%2C%20{country}&aid=",
      sort_order: 10,
    },
    {
      id: "flights-skyscanner",
      category: "flights",
      label: "Flights",
      description: "Compare airlines",
      enabled: false,
      url_template:
        "https://www.skyscanner.net/transport/flights/?adultsv2=1&destination={city}",
      sort_order: 20,
    },
    {
      id: "cars-rentalcars",
      category: "car_rental",
      label: "Car rental",
      description: "Pick up for your trip",
      enabled: false,
      url_template: "https://www.rentalcars.com/SearchResults.do?city={city}",
      adventure_only: true,
      sort_order: 30,
    },
    {
      id: "insurance-safetywing",
      category: "insurance",
      label: "Travel insurance",
      description: "Cover abroad",
      enabled: false,
      url_template: "https://safetywing.com/",
      sort_order: 40,
    },
    {
      id: "esim-airalo",
      category: "esim",
      label: "eSIM data",
      description: "Mobile internet on arrival",
      enabled: false,
      url_template: "https://www.airalo.com/{country_slug}",
      sort_order: 50,
    },
    {
      id: "tours-gyg",
      category: "tours",
      label: "Tours & tickets",
      description: "Skip-the-line entry",
      enabled: false,
      url_template: "https://www.getyourguide.com/s/?q={city}",
      city_only: true,
      sort_order: 60,
    },
  ],
};

export function mergeAffiliatePartners(
  stored: AffiliatePartner[] | undefined
): AffiliatePartner[] {
  const defaults = DEFAULT_AFFILIATE_CONFIG.partners;
  if (!stored?.length) return defaults;
  const byId = new Map(stored.map((p) => [p.id, p]));
  const merged = defaults.map((d) => ({ ...d, ...byId.get(d.id) }));
  for (const p of stored) {
    if (!defaults.some((d) => d.id === p.id)) merged.push(p);
  }
  return merged.sort((a, b) => a.sort_order - b.sort_order);
}

export function parseAffiliateConfig(raw: unknown): AffiliateConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_AFFILIATE_CONFIG;
  const o = raw as Partial<AffiliateConfig>;
  return {
    enabled: o.enabled ?? DEFAULT_AFFILIATE_CONFIG.enabled,
    min_places: o.min_places ?? DEFAULT_AFFILIATE_CONFIG.min_places,
    disclosure_en: o.disclosure_en ?? DEFAULT_DISCLOSURE_EN,
    disclosure_bg: o.disclosure_bg ?? DEFAULT_DISCLOSURE_BG,
    partners: mergeAffiliatePartners(o.partners),
  };
}

export interface AffiliateLinkContext {
  city: string;
  country: string;
  country_slug?: string;
  locale: string;
  lat?: number;
  lng?: number;
  is_adventure: boolean;
}

export function buildAffiliateUrl(
  template: string,
  ctx: AffiliateLinkContext
): string {
  if (!template.trim()) return "";

  const countrySlug =
    ctx.country_slug ??
    ctx.country
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const replacements: Record<string, string> = {
    city: encodeURIComponent(ctx.city),
    country: encodeURIComponent(ctx.country),
    country_slug: encodeURIComponent(countrySlug),
    locale: encodeURIComponent(ctx.locale),
    lat: ctx.lat != null ? String(ctx.lat) : "",
    lng: ctx.lng != null ? String(ctx.lng) : "",
  };

  let url = template;
  for (const [key, value] of Object.entries(replacements)) {
    url = url.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
  }
  return url;
}

export function getActivePartners(
  config: AffiliateConfig,
  ctx: AffiliateLinkContext,
  placeCount: number
): AffiliatePartner[] {
  if (!config.enabled || placeCount < config.min_places) return [];

  return config.partners.filter((p) => {
    if (!p.enabled || !p.url_template.trim()) return false;
    if (p.adventure_only && !ctx.is_adventure) return false;
    if (p.city_only && ctx.is_adventure) return false;
    return true;
  });
}
