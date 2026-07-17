import type { DestinationCard } from "@/actions/get-destinations";

export type InspireVibe =
  | "adventure"
  | "relax"
  | "culture"
  | "nature"
  | "beach"
  | "history";

export type TripStyle =
  | "single_city"
  | "country_tour"
  | "weekend"
  | "surprise";

export interface InspireAnswers {
  vibe: InspireVibe;
  tripStyle: TripStyle;
  season?: string;
}

export interface InspireMatch {
  destination: DestinationCard;
  score: number;
  reasonKey: string;
}

/** Personality profile per city — used for smart matching */
const CITY_PROFILES: Record<
  string,
  { vibes: InspireVibe[]; tripStyles: TripStyle[] }
> = {
  Sofia: { vibes: ["culture", "history"], tripStyles: ["single_city", "country_tour"] },
  Plovdiv: { vibes: ["culture", "history"], tripStyles: ["single_city", "country_tour", "weekend"] },
  Varna: { vibes: ["beach", "relax", "culture"], tripStyles: ["weekend", "single_city"] },
  "Veliko Tarnovo": { vibes: ["history", "culture", "nature"], tripStyles: ["single_city", "country_tour"] },
  Bansko: { vibes: ["adventure", "nature"], tripStyles: ["weekend", "single_city"] },
  Nessebar: { vibes: ["beach", "relax", "history"], tripStyles: ["weekend", "single_city"] },
  Ruse: { vibes: ["culture", "history", "nature"], tripStyles: ["country_tour", "single_city"] },
  Koprivshtitsa: { vibes: ["history", "culture"], tripStyles: ["weekend", "country_tour"] },
  Melnik: { vibes: ["relax", "nature", "culture"], tripStyles: ["weekend", "single_city"] },
  Balchik: { vibes: ["beach", "relax", "culture"], tripStyles: ["weekend", "single_city"] },
  Paris: { vibes: ["culture", "history"], tripStyles: ["single_city", "weekend"] },
  Tokyo: { vibes: ["culture", "adventure"], tripStyles: ["single_city"] },
  Barcelona: { vibes: ["beach", "culture", "relax"], tripStyles: ["weekend", "single_city"] },
  Rome: { vibes: ["history", "culture"], tripStyles: ["single_city"] },
  "New York": { vibes: ["culture", "adventure"], tripStyles: ["single_city", "weekend"] },
  Santorini: { vibes: ["beach", "relax"], tripStyles: ["weekend", "single_city"] },
};

const REASON_KEYS: Record<InspireVibe, string> = {
  adventure: "inspireReasonAdventure",
  relax: "inspireReasonRelax",
  culture: "inspireReasonCulture",
  nature: "inspireReasonNature",
  beach: "inspireReasonBeach",
  history: "inspireReasonHistory",
};

function profileFor(city: string) {
  return (
    CITY_PROFILES[city] ?? {
      vibes: ["culture"],
      tripStyles: ["single_city", "weekend"],
    }
  );
}

function scoreDestination(
  dest: DestinationCard,
  answers: InspireAnswers
): number {
  const profile = profileFor(dest.city);
  let score = 0;

  if (profile.vibes.includes(answers.vibe)) score += 40;
  if (profile.tripStyles.includes(answers.tripStyle)) score += 25;

  if (answers.season && dest.tags.map((t) => t.toLowerCase()).includes(answers.season)) {
    score += 20;
  }

  // Country tour bonus for Bulgaria cities
  if (answers.tripStyle === "country_tour" && dest.country === "Bulgaria") {
    score += 15;
  }

  // Slight randomness seed based on city name for tie-breaking variety
  score += (dest.city.charCodeAt(0) % 7);

  return score;
}

/** Pick best match from top scorers with light randomness */
export function matchDestination(
  destinations: DestinationCard[],
  answers: InspireAnswers
): InspireMatch | null {
  if (destinations.length === 0) return null;

  const scored = destinations
    .map((dest) => ({
      destination: dest,
      score: scoreDestination(dest, answers),
      reasonKey: REASON_KEYS[answers.vibe],
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0].score;
  const topTier = scored.filter((s) => s.score >= topScore - 10);
  const pick = topTier[Math.floor(Math.random() * topTier.length)];

  return pick;
}

/** Pure random — instant inspiration */
export function randomDestination(
  destinations: DestinationCard[]
): InspireMatch | null {
  if (destinations.length === 0) return null;
  const dest =
    destinations[Math.floor(Math.random() * destinations.length)];
  return {
    destination: dest,
    score: 100,
    reasonKey: "inspireReasonSurprise",
  };
}
