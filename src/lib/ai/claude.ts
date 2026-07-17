"use server";

export interface GeneratedPlace {
  name: string;
  lat: number;
  lng: number;
  wiki_title: string;
  order_index: number;
  translations: Record<"en" | "es" | "fr" | "de" | "it", { description: string }>;
}

export interface GeneratedDestination {
  destination: {
    country: string;
    city: string;
    tags: string[];
  };
  places: GeneratedPlace[];
}

const PROMPT = (city: string, country: string) => `\
You are a luxury travel content generator. Generate the top 10 must-visit landmarks for ${city}, ${country}.

Respond with ONLY a raw JSON object — no markdown, no code blocks, no commentary.

Use this exact schema:
{
  "destination": {
    "country": "Country in English",
    "city": "City in English",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "places": [
    {
      "name": "Landmark Name in English",
      "lat": 0.000000,
      "lng": 0.000000,
      "wiki_title": "Exact English Wikipedia article title",
      "order_index": 0,
      "translations": {
        "en": { "description": "Two engaging sentences in English, luxury travel style." },
        "es": { "description": "Dos frases en español." },
        "fr": { "description": "Deux phrases en français." },
        "de": { "description": "Zwei Sätze auf Deutsch." },
        "it": { "description": "Due frasi in italiano." }
      }
    }
  ]
}

Rules:
- Exactly 10 places, ordered most iconic → hidden gem
- GPS: 6 decimal precision, accurate within 50 m
- wiki_title: exact title as it appears on English Wikipedia
- tags: 3–5 from [architecture, beach, culture, history, food, nature, nightlife, art, shopping, adventure, religious, seasonal]
- descriptions: evocative, 2 sentences, luxury travel writing voice`;

export async function generateDestinationData(
  city: string,
  country: string
): Promise<GeneratedDestination> {
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
      // Update this to the latest Claude model available in your account
      model: "claude-opus-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: PROMPT(city, country) }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Claude API върна грешка ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? "";

  // Strip markdown code fences if Claude adds them despite the prompt
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as GeneratedDestination;

    if (!parsed.destination || !Array.isArray(parsed.places)) {
      throw new Error("Невалидна структура на JSON отговор от Claude.");
    }

    return parsed;
  } catch {
    throw new Error(
      "Claude върна невалиден JSON. Опитай отново или провери API ключа."
    );
  }
}
