import type { AttractionEntity, SchemaTypeArray } from "./types";

const CATEGORY_TYPE_MAP: Record<string, SchemaTypeArray> = {
  museum: ["TouristAttraction", "Museum"],
  church: ["TouristAttraction", "Church"],
  cathedral: ["TouristAttraction", "Church"],
  castle: ["TouristAttraction", "Castle"],
  medieval_castle: ["TouristAttraction", "Castle"],
  fort: ["TouristAttraction", "Castle"],
  fortress: ["TouristAttraction", "Castle"],
  beach: ["TouristAttraction", "Beach"],
  park: ["TouristAttraction", "Park"],
  national_park: ["TouristAttraction", "NationalPark"],
  waterfall: ["TouristAttraction", "Waterfall"],
  mountain: ["TouristAttraction", "Mountain"],
  island: ["TouristAttraction", "Island"],
  bridge: ["TouristAttraction", "Bridge"],
  zoo: ["TouristAttraction", "Zoo"],
  aquarium: ["TouristAttraction", "Aquarium"],
  botanical_garden: ["TouristAttraction", "BotanicalGarden"],
  garden: ["TouristAttraction", "BotanicalGarden"],
  ski: ["TouristAttraction", "SkiResort"],
  ski_resort: ["TouristAttraction", "SkiResort"],
  lake: ["TouristAttraction", "BodyOfWater"],
  river: ["TouristAttraction", "BodyOfWater"],
  historic_site: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  landmark: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  monument: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  ruins: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  palace: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  nature: ["TouristAttraction", "Park"],
  culture: ["TouristAttraction"],
};

const GENERIC = new Set([
  "landmark",
  "nature",
  "historic_site",
  "culture",
  "monument",
  "place",
]);

const NAME_HEURISTICS: Array<{ pattern: RegExp; types: SchemaTypeArray }> = [
  {
    pattern: /\b(castle|château|schloss|fortress|citadel)\b/i,
    types: ["TouristAttraction", "Castle"],
  },
  {
    pattern:
      /\b(cathedral|basilica|duomo|church|chapel|mosque|synagogue|temple)\b/i,
    types: ["TouristAttraction", "Church"],
  },
  {
    pattern: /\b(museum|gallery)\b/i,
    types: ["TouristAttraction", "Museum"],
  },
  {
    pattern: /\b(beach|bay|coast)\b/i,
    types: ["TouristAttraction", "Beach"],
  },
  {
    pattern: /\b(national park)\b/i,
    types: ["TouristAttraction", "NationalPark"],
  },
  {
    pattern: /\b(botanical|arboretum)\b/i,
    types: ["TouristAttraction", "BotanicalGarden"],
  },
  {
    pattern: /\b(park|garden)\b/i,
    types: ["TouristAttraction", "Park"],
  },
  {
    pattern: /\b(waterfall|falls|cascade)\b/i,
    types: ["TouristAttraction", "Waterfall"],
  },
  {
    pattern: /\b(mountain|peak|summit|volcano)\b/i,
    types: ["TouristAttraction", "Mountain"],
  },
  {
    pattern: /\b(island|archipelago)\b/i,
    types: ["TouristAttraction", "Island"],
  },
  {
    pattern: /\b(bridge|viaduct|aqueduct)\b/i,
    types: ["TouristAttraction", "Bridge"],
  },
  {
    pattern: /\b(zoo|safari)\b/i,
    types: ["TouristAttraction", "Zoo"],
  },
  {
    pattern: /\b(aquarium)\b/i,
    types: ["TouristAttraction", "Aquarium"],
  },
  {
    pattern:
      /\b(palace|palais|palazzo|ruins?|monument|memorial|colosseum|amphitheatre|amphitheater|arena)\b/i,
    types: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  },
  {
    pattern: /\b(lake|lagoon|reservoir|river|canal)\b/i,
    types: ["TouristAttraction", "BodyOfWater"],
  },
  {
    pattern: /\b(ski)\b/i,
    types: ["TouristAttraction", "SkiResort"],
  },
];

const TAG_TYPE_MAP: Record<string, SchemaTypeArray> = {
  monument: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  nature: ["TouristAttraction", "Park"],
  ruins: ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
  hidden_gem: ["TouristAttraction"],
  viewpoint: ["TouristAttraction"],
  cave: ["TouristAttraction", "Place"],
};

function normalizeKey(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function matchName(name: string): SchemaTypeArray | undefined {
  for (const rule of NAME_HEURISTICS) {
    if (rule.pattern.test(name)) return rule.types;
  }
  return undefined;
}

function matchTags(tags: string[] | undefined): SchemaTypeArray | undefined {
  if (!tags?.length) return undefined;
  for (const tag of tags) {
    const key = normalizeKey(tag);
    if (TAG_TYPE_MAP[key]) return TAG_TYPE_MAP[key];
    const named = matchName(tag);
    if (named) return named;
  }
  return undefined;
}

export function resolveAttractionTypes(
  category?: string | null,
  name?: string | null,
  tags?: string[] | null
): SchemaTypeArray {
  const key = normalizeKey(category ?? undefined);
  const tagList = tags ?? undefined;

  if (key && CATEGORY_TYPE_MAP[key]) {
    if (GENERIC.has(key)) {
      const fromName = name ? matchName(name) : undefined;
      if (fromName) return [...fromName];
      const fromTags = matchTags(tagList);
      if (fromTags) return [...fromTags];
    }
    return [...CATEGORY_TYPE_MAP[key]];
  }

  if (name) {
    const fromName = matchName(name);
    if (fromName) return [...fromName];
  }

  const fromTags = matchTags(tagList);
  if (fromTags) return [...fromTags];

  if (key) {
    for (const [token, types] of Object.entries(CATEGORY_TYPE_MAP)) {
      if (key.includes(token)) return [...types];
    }
    return ["TouristAttraction"];
  }

  return ["Place"];
}

export function resolveEntityCategory(entity: AttractionEntity): string | undefined {
  return entity.category ?? entity.type;
}

export function resolveEntityImage(entity: AttractionEntity): string | undefined {
  const url = entity.imageUrl ?? entity.image_url;
  return url?.trim() || undefined;
}
