import type { SchemaFaqItem } from "./types";

export function buildCountryFaqs(country: string): SchemaFaqItem[] {
  return [
    {
      question: `What are the best cities to visit in ${country}?`,
      answer: `ViaPins curates top cities in ${country} with landmark guides, GPS routes, and travel tips for each destination.`,
    },
    {
      question: `How do I plan a trip to ${country}?`,
      answer: `Browse city guides on ViaPins, save favorite landmarks, and export a GPS route to Google Maps — no app download required.`,
    },
    {
      question: `Is the ${country} travel guide free?`,
      answer: `Yes. ViaPins city and country guides are free to read, share, and use for route planning.`,
    },
  ];
}

export function buildCityFaqs(city: string, country: string): SchemaFaqItem[] {
  return [
    {
      question: `What are the top things to do in ${city}, ${country}?`,
      answer: `ViaPins lists the best landmarks and attractions in ${city} with photos, descriptions, and map coordinates for each stop.`,
    },
    {
      question: `How many days do I need in ${city}?`,
      answer: `Most travelers cover the main sights in ${city} in 2–3 days. Use ViaPins to prioritize landmarks and build a custom GPS route.`,
    },
    {
      question: `Can I get a GPS route for ${city}?`,
      answer: `Yes. Select landmarks in ${city} on ViaPins and export a turn-by-turn route directly to Google Maps.`,
    },
  ];
}

export function buildAdventureFaqs(
  country: string,
  totalDays: number,
  stopCount: number
): SchemaFaqItem[] {
  return [
    {
      question: `What is the ${country} adventure route on ViaPins?`,
      answer: `A curated ${totalDays}-day road trip across ${country} with ${stopCount} scenic stops, driving directions, and landmark guides.`,
    },
    {
      question: `Do I need a car for the ${country} adventure?`,
      answer: `Yes. The ViaPins ${country} adventure route is designed for self-drive travel between regional landmarks.`,
    },
    {
      question: `How do I follow the ${country} itinerary?`,
      answer: `Open the adventure page on ViaPins, review each stop, and use the built-in route planner to navigate with Google Maps.`,
    },
  ];
}
