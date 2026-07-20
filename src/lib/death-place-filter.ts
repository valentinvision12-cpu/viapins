/** Places focused on graves, bones, burial, or death — excluded from travel listings. */
const DEATH_NAME_PATTERNS = [
  /\bcemetery\b/i,
  /\bgraveyard\b/i,
  /\bburial\b/i,
  /\btomb(s)?\b/i,
  /\bturbe\b/i,
  /\bmausoleum\b/i,
  /\bcatacomb(s)?\b/i,
  /\bcrypt(s)?\b/i,
  /\bossuar(y|ies)\b/i,
  /\bnecropolis\b/i,
  /\bbone house\b/i,
  /\bbone chapel\b/i,
  /\bskeleton\b/i,
  /\bskull\b/i,
  /\bmumm(y|ies)\b/i,
  /\bsarcophag/i,
  /\bfunerary\b/i,
  /\bcremator/i,
  /\bmemorial cemetery\b/i,
  /\bwar cemetery\b/i,
  /\bcharnel\b/i,
  /\bmortuary\b/i,
  /\bgraves\b/i,
  /\btombs of the kings\b/i,
  /\bgaravice memorial\b/i,
];

const DEATH_DESCRIPTION_PATTERNS = [
  /\bnecropolis\b/i,
  /\bburial (ground|chamber|site)\b/i,
  /\bbones?\b/i,
  /\bskeletons?\b/i,
  /\bskulls?\b/i,
  /\bmumm(y|ies)\b/i,
  /\bossuary\b/i,
  /\bcatacomb\b/i,
  /\bgraves?\b/i,
  /\btombs?\b/i,
  /\binterred\b/i,
  /\bentombed\b/i,
];

export function isDeathRelatedPlace(
  name: string,
  description?: string | null
): boolean {
  const n = name.trim();
  if (DEATH_NAME_PATTERNS.some((p) => p.test(n))) return true;
  if (description && DEATH_DESCRIPTION_PATTERNS.some((p) => p.test(description))) {
    return true;
  }
  return false;
}

export type DeathPlaceReplacement = {
  country: string;
  city: string;
  oldName: string;
  replacement: {
    name: string;
    wiki_title: string;
    lat: number;
    lng: number;
    type?: string;
    description?: string;
    seo_phrase?: string;
  };
};

/** Curated swaps for already-published countries */
export const DEATH_PLACE_REPLACEMENTS: DeathPlaceReplacement[] = [
  {
    country: "Croatia",
    city: "Zagreb",
    oldName: "Mirogoj Cemetery",
    replacement: {
      name: "Dolac Market",
      wiki_title: "Dolac Market",
      lat: 45.8131,
      lng: 15.9782,
      type: "landmark",
      description:
        "Dolac is Zagreb’s open-air market at the foot of the upper town, famous for red umbrellas, local produce, and everyday city life.",
      seo_phrase: "Dolac Market in Zagreb, Croatia",
    },
  },
  {
    country: "Croatia",
    city: "Varaždin",
    oldName: "Varaždin Cemetery",
    replacement: {
      name: "King Tomislav Square",
      wiki_title: "King Tomislav Square, Varaždin",
      lat: 46.3047,
      lng: 16.3378,
      type: "landmark",
      description:
        "King Tomislav Square is the elegant heart of Varaždin’s historic centre, framed by Baroque facades and a lively café scene.",
      seo_phrase: "King Tomislav Square in Varaždin, Croatia",
    },
  },
  {
    country: "Cyprus",
    city: "Paphos",
    oldName: "Tombs of the Kings",
    replacement: {
      name: "Chrysopolitissa Basilica",
      wiki_title: "Panagia Chrysopolitissa",
      lat: 34.7556,
      lng: 32.4133,
      type: "historic_site",
      description:
        "Early Christian basilica ruins in central Kato Paphos with mosaic floors and columns — one of the city’s most photogenic heritage sites.",
      seo_phrase: "Chrysopolitissa Basilica in Paphos, Cyprus",
    },
  },
  {
    country: "Cyprus",
    city: "Paphos",
    oldName: "Agia Solomoni Catacomb",
    replacement: {
      name: "Paphos Lighthouse",
      wiki_title: "Paphos Lighthouse",
      lat: 34.7458,
      lng: 32.4025,
      type: "landmark",
      description:
        "The lighthouse at Paphos harbour marks the edge of the waterfront with open sea views — a simple but memorable coastal photo stop.",
      seo_phrase: "Paphos Lighthouse in Paphos, Cyprus",
    },
  },
  {
    country: "Czech Republic",
    city: "Brno",
    oldName: "Brno Ossuary",
    replacement: {
      name: "Brno Observatory and Planetarium",
      wiki_title: "Brno Observatory and Planetarium",
      lat: 49.2042,
      lng: 16.5838,
      type: "museum",
      description:
        "Brno’s hilltop observatory and planetarium offers star shows and wide views over the city — a family-friendly alternative in the Špilberk area.",
      seo_phrase: "Brno Observatory and Planetarium",
    },
  },
  {
    country: "Czech Republic",
    city: "Brno",
    oldName: "Capuchin Crypt",
    replacement: {
      name: "Brno Reservoir",
      wiki_title: "Brno Reservoir",
      lat: 49.2317,
      lng: 16.5217,
      type: "nature",
      description:
        "The Brno Reservoir (Brněnská přehrada) is a popular lake escape with walking paths, boat rides, and forested shores just outside the city.",
      seo_phrase: "Brno Reservoir day trip",
    },
  },
  {
    country: "Czech Republic",
    city: "Kutná Hora",
    oldName: "Sedlec Ossuary",
    replacement: {
      name: "Kutná Hora Town House",
      wiki_title: "Kutná Hora Town House",
      lat: 49.9494,
      lng: 15.2631,
      type: "historic_site",
      description:
        "The Gothic town house on Palackého Square anchors Kutná Hora’s historic centre with ornate facades and a strong medieval civic presence.",
      seo_phrase: "Kutná Hora Town House",
    },
  },
  {
    country: "Bosnia and Herzegovina",
    city: "Mostar",
    oldName: "Partisan Memorial Cemetery",
    replacement: {
      name: "Musalla Bridge",
      wiki_title: "Musalla Bridge",
      lat: 43.3394,
      lng: 17.8172,
      type: "historic_site",
      description:
        "Musalla Bridge is a graceful Ottoman-era stone bridge over the Radobolja stream, linking Mostar’s old quarters with quiet river views.",
      seo_phrase: "Musalla Bridge in Mostar",
    },
  },
  {
    country: "Bosnia and Herzegovina",
    city: "Jajce",
    oldName: "Catacombs of Jajce",
    replacement: {
      name: "Pliva Watermills",
      wiki_title: "Pliva Watermills",
      lat: 44.3386,
      lng: 17.2681,
      type: "historic_site",
      description:
        "The wooden watermills on the Pliva River near Jajce are a picturesque cluster of historic mills set beside clear green water.",
      seo_phrase: "Pliva Watermills in Jajce",
    },
  },
  {
    country: "Bosnia and Herzegovina",
    city: "Travnik",
    oldName: "Turbe of Travnik",
    replacement: {
      name: "Turkish Clock Tower Travnik",
      wiki_title: "Clock tower in Travnik",
      lat: 44.2263,
      lng: 17.6661,
      type: "historic_site",
      description:
        "The Ottoman clock tower in Travnik’s old core is a landmark of the city’s vizier-era past, set among stone lanes and historic houses.",
      seo_phrase: "Turkish Clock Tower in Travnik",
    },
  },
  {
    country: "Bosnia and Herzegovina",
    city: "Bihać",
    oldName: "Garavice Memorial",
    replacement: {
      name: "Spring of Una",
      wiki_title: "Una (river)",
      lat: 44.8169,
      lng: 15.8708,
      type: "nature",
      description:
        "The Una River near Bihać is celebrated for emerald water, forested banks, and rafting — one of the most beautiful river landscapes in the Balkans.",
      seo_phrase: "Una River near Bihać",
    },
  },
];
