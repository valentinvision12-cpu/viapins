/** Meaningful travel achievements (mega-prompt). */

export type AchievementId =
  | "first_adventure"
  | "ten_cities"
  | "castle_hunter"
  | "beach_explorer"
  | "world_traveler"
  | "photography_explorer"
  | "hidden_gem_finder";

export type PassportLevelId =
  | "beginner"
  | "explorer"
  | "adventurer"
  | "world_explorer"
  | "legend";

export type Achievement = { id: AchievementId; unlocked: boolean };

export type PassportLevel = {
  id: PassportLevelId;
  labelKey: string;
  progress: number;
  nextKey?: string;
};

export type AchievementInput = {
  countries: number;
  cities: number;
  places: number;
  photos: number;
  routes: number;
  countriesVisited: number;
  placeNames?: string[];
  tags?: string[];
};

const CASTLE_RE = /castle|fortress|palace|замък|chateau|burg/i;
const BEACH_RE = /beach|coast|bay|seaside|ривiera|плаж/i;
const GEM_RE = /hidden|gem|secret|off.?the.?beaten|скрит/i;

export function computePassportLevel(input: AchievementInput): PassportLevel {
  const score =
    input.countriesVisited * 4 +
    input.countries * 2 +
    input.cities +
    input.places * 0.5 +
    input.routes * 2;

  if (score >= 120 || input.countriesVisited >= 30) {
    return { id: "legend", labelKey: "passportLevelLegend", progress: 1 };
  }
  if (score >= 60 || input.countriesVisited >= 15) {
    return {
      id: "world_explorer",
      labelKey: "passportLevelWorldExplorer",
      progress: Math.min(1, score / 120),
      nextKey: "passportLevelNextLegend",
    };
  }
  if (score >= 28 || input.countriesVisited >= 5) {
    return {
      id: "adventurer",
      labelKey: "passportLevelAdventurer",
      progress: Math.min(1, score / 60),
      nextKey: "passportLevelNextWorld",
    };
  }
  if (score >= 10 || input.cities >= 5) {
    return {
      id: "explorer",
      labelKey: "passportLevelExplorer",
      progress: Math.min(1, score / 28),
      nextKey: "passportLevelNextAdventurer",
    };
  }
  return {
    id: "beginner",
    labelKey: "passportLevelBeginner",
    progress: Math.min(1, score / 10),
    nextKey: "passportLevelNextExplorer",
  };
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const hay = [...(input.placeNames ?? []), ...(input.tags ?? [])].join(" ");
  return [
    { id: "first_adventure", unlocked: input.routes >= 1 || input.places >= 1 },
    { id: "ten_cities", unlocked: input.cities >= 10 },
    { id: "castle_hunter", unlocked: CASTLE_RE.test(hay) },
    { id: "beach_explorer", unlocked: BEACH_RE.test(hay) },
    {
      id: "world_traveler",
      unlocked: input.countriesVisited >= 10 || input.countries >= 10,
    },
    { id: "photography_explorer", unlocked: input.photos >= 20 },
    { id: "hidden_gem_finder", unlocked: GEM_RE.test(hay) },
  ];
}
