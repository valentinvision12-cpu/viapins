"use server";

import type { TravelSeedCity } from "@/lib/travel-seed";
import type { TravelSeedAdventure } from "@/lib/adventure-seed";
import { COUNTRY_SEED_SPEC } from "@/lib/travel-seed";
import { ADVENTURE_SEED_SPEC } from "@/lib/adventure-seed";

export interface CountryCityOutline {
  city: string;
  tags: string[];
  wiki_title: string;
}

async function claudeJson<T>(prompt: string, maxTokens = 8192): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("placeholder") || apiKey === "") {
    throw new Error(
      "ANTHROPIC_API_KEY не е конфигуриран. Добави го в .env.local и рестартирай сървъра."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Claude API грешка ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? "";
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error("Claude върна невалиден JSON. Опитай отново.");
  }
}

/** Стъпка 1: 10-те най-важни туристически града в държавата */
export async function generateCountryCitiesList(
  country: string
): Promise<CountryCityOutline[]> {
  const n = COUNTRY_SEED_SPEC.citiesPerCountry;
  const parsed = await claudeJson<{ cities: CountryCityOutline[] }>(`\
You are a luxury travel editor. Pick the ${n} best tourist cities in ${country}.

Respond with ONLY raw JSON — no markdown.

{
  "cities": [
    {
      "city": "City name in English",
      "wiki_title": "Exact English Wikipedia article title",
      "tags": ["spring", "summer", "culture"]
    }
  ]
}

Rules:
- Exactly ${n} cities, diverse regions (capital, coast, mountains, history, etc.)
- tags: 3–5 from [architecture, beach, culture, history, food, nature, nightlife, art, shopping, adventure, religious, seasonal, spring, summer, autumn, winter]
- wiki_title: exact English Wikipedia title for the city`);

  if (!Array.isArray(parsed.cities) || parsed.cities.length !== n) {
    throw new Error(`Claude трябва да върне точно ${n} града.`);
  }
  return parsed.cities;
}

/** Стъпка 2: Топ 10 забележителности за един град (минимален seed) */
export async function generateCityPlacesSeed(
  city: string,
  country: string
): Promise<TravelSeedCity> {
  const n = COUNTRY_SEED_SPEC.placesPerCity;
  const parsed = await claudeJson<TravelSeedCity>(`\
Generate the top ${n} must-visit landmarks for ${city}, ${country}.

Respond with ONLY raw JSON:

{
  "city": "${city}",
  "tags": ["spring", "summer"],
  "wiki_title": "Exact Wikipedia city title",
  "seo": {
    "title": "Top 10 Things to Do in ${city}, ${country}",
    "description": "Long-tail meta description for Google (150 chars max).",
    "intro": "2 sentences intro for the city page.",
    "keywords": ["things to do in ${city}", "${city} ${country} travel guide"]
  },
  "places": [
    {
      "name": "Landmark Name",
      "wiki_title": "Exact English Wikipedia article title",
      "lat": 0.000000,
      "lng": 0.000000,
      "seo_phrase": "Landmark — short SEO phrase with city and country",
      "seo_keywords": ["keyword1", "keyword2"]
    }
  ]
}

Rules:
- Exactly ${n} places, ordered most iconic → hidden gem
- GPS: 6 decimal precision, accurate within 50 m
- wiki_title: exact English Wikipedia title
- Each place needs seo_phrase + 2–3 seo_keywords`);

  if (!parsed.places || parsed.places.length !== n) {
    throw new Error(`"${city}": трябват точно ${n} забележителности.`);
  }
  return { ...parsed, city };
}

/** Стъпка 3: Adventure road trip извън градовете */
export async function generateAdventureSeedBlock(
  country: string
): Promise<TravelSeedAdventure> {
  const stops = ADVENTURE_SEED_SPEC.placesPerCountry;
  const days = ADVENTURE_SEED_SPEC.daysPerRoute;

  const parsed = await claudeJson<TravelSeedAdventure>(`\
Create a ${days}-day country-wide ROAD TRIP for ${country} — stops OUTSIDE major cities, car required.

Respond with ONLY raw JSON:

{
  "title": "${country} Road Trip Adventure",
  "subtitle": "One sentence describing the route",
  "wiki_title": "${country}",
  "totalDays": ${days},
  "seo": {
    "title": "${country} road trip itinerary",
    "description": "Meta description for Google",
    "intro": "2 sentences for adventure page",
    "keywords": ["${country} road trip", "${country} by car"]
  },
  "places": [
    {
      "name": "Stop name",
      "wiki_title": "Exact Wikipedia title",
      "region": "County or region",
      "lat": 0.000000,
      "lng": 0.000000,
      "day": 1,
      "order_index": 0,
      "requires_car": true,
      "tags": ["nature"],
      "seo_phrase": "SEO phrase",
      "seo_keywords": ["keyword1"]
    }
  ]
}

Rules:
- Exactly ${stops} stops, one per day (day 1 through ${days})
- Rural, scenic, hidden gems — NOT city landmarks already in travel guides
- tags from: hidden_gem, monument, nature, ruins, viewpoint, cave
- GPS accurate, wiki_title exact`);

  if (!parsed.places || parsed.places.length !== stops) {
    throw new Error(`Adventure: трябват точно ${stops} спирки.`);
  }
  return parsed;
}
