import { CONFIG } from "./config.js";

/**
 * SEO layer — templates by default; optional OpenAI batch if ENABLE_AI_SEO=1.
 * NEVER generates geographic data.
 */
export function generateSeoTitle(name, city, country) {
  if (city) {
    return `${name} — ${city}, ${country} Travel Guide`;
  }
  return `${name} — ${country} Adventure & Nature Guide`;
}

export function generateSeoDescription(name, city, country, kind = "attraction") {
  if (kind === "adventure") {
    return `Explore ${name}: trails, wildlife, and scenic drives in ${country}. Verified coordinates and free CC0/PD imagery.`;
  }
  return `Plan your visit to ${name} in ${city}, ${country}. Real-world location data from Wikidata with Wikimedia Commons imagery.`;
}

export function applyTemplateSeo(records, kind = "attraction") {
  return records.map((r) => ({
    ...r,
    seo_title: r.seo_title || generateSeoTitle(r.name, r.city, r.country),
    seo_description:
      r.seo_description || generateSeoDescription(r.name, r.city, r.country, kind),
  }));
}

export async function applyAiSeoBatch(records, kind = "attraction") {
  if (!CONFIG.enableAiSeo || !CONFIG.openaiApiKey) {
    return applyTemplateSeo(records, kind);
  }

  const out = [];
  for (let i = 0; i < records.length; i += 20) {
    const chunk = records.slice(i, i + 20);
    try {
      const enriched = await callOpenAiSeo(chunk, kind);
      out.push(...enriched);
    } catch {
      out.push(...applyTemplateSeo(chunk, kind));
    }
  }
  return out;
}

async function callOpenAiSeo(records, kind) {
  const prompt = records
    .map(
      (r, i) =>
        `${i + 1}. name="${r.name}" city="${r.city || ""}" country="${r.country}" kind=${kind}`
    )
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CONFIG.openaiModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Write unique SEO title (max 70 chars) and description (max 160 chars) for each travel place. Return JSON: { items: [{ index, seo_title, seo_description }] }. Do NOT invent locations or facts.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  const map = new Map(parsed.items.map((x) => [x.index, x]));

  return records.map((r, idx) => {
    const ai = map.get(idx + 1);
    return {
      ...r,
      seo_title: ai?.seo_title || generateSeoTitle(r.name, r.city, r.country),
      seo_description:
        ai?.seo_description ||
        generateSeoDescription(r.name, r.city, r.country, kind),
    };
  });
}
