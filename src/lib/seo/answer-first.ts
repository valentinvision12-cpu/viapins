import { stripHtml } from "@/lib/seo/content-quality";

export type AnswerFirstContext = {
  heading: string;
  /** Existing intro / description / FAQ answer to reuse when available. */
  sourceText?: string | null;
  entityName?: string;
  placeName?: string;
  cityName?: string;
  countryName?: string;
  /** Extra facts (counts, days, etc.). */
  facts?: string[];
};

/**
 * Build a short 2–3 sentence answer-first lead for GEO / AI citation.
 * Reuses existing copy when present; otherwise synthesizes a direct answer.
 */
export function buildAnswerFirst(ctx: AnswerFirstContext): string {
  const fromSource = extractLead(ctx.sourceText);
  if (fromSource) return fromSource;

  const name =
    ctx.placeName ||
    ctx.cityName ||
    ctx.countryName ||
    ctx.entityName ||
    "this destination";
  const where = [ctx.cityName, ctx.countryName].filter(Boolean).join(", ");
  const facts = (ctx.facts ?? []).filter(Boolean).slice(0, 2);
  const heading = ctx.heading.trim();

  const s1 = where
    ? `${heading.replace(/\?$/, "")} — ${name} in ${where} is a practical place to start.`
    : `${heading.replace(/\?$/, "")} — ${name} is a practical place to start.`;

  const s2 = facts.length
    ? `Key details: ${facts.join("; ")}.`
    : `Use the guide below for highlights, maps, and nearby stops worth combining on the same day.`;

  const s3 =
    "Answers are structured for quick scanning so travelers and AI assistants can cite the essentials first.";

  return [s1, s2, s3].join(" ").replace(/\s+/g, " ").trim();
}

/** Prefer first 2–3 sentences from existing curated copy. */
function extractLead(text: string | null | undefined): string | null {
  const plain = stripHtml(text);
  if (!plain || plain.length < 40) return null;

  const parts = plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  const lead = parts.slice(0, 3).join(" ");
  // Cap length so we don't dump entire wiki under every H2.
  if (lead.length > 420) {
    return `${lead.slice(0, 400).replace(/\s+\S*$/, "")}.`;
  }
  if (parts.length === 1 && lead.length < 60) return null;
  return lead;
}

/**
 * If `existing` already answers the heading (long enough), return it;
 * otherwise return a generated answer-first paragraph.
 */
export function ensureAnswerFirst(
  ctx: AnswerFirstContext,
  existing?: string | null
): string {
  const trimmed = stripHtml(existing);
  if (trimmed && trimmed.length >= 80) {
    return extractLead(trimmed) ?? trimmed;
  }
  return buildAnswerFirst({ ...ctx, sourceText: existing ?? ctx.sourceText });
}
