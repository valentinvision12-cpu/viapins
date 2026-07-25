import { ensureAnswerFirst, type AnswerFirstContext } from "@/lib/seo/answer-first";

type Props = AnswerFirstContext & {
  existing?: string | null;
  className?: string;
};

/** Short answer-first lead under an H2/H3 for GEO / AI citation. */
export function AnswerFirstLead({
  existing,
  className = "mt-2 max-w-3xl text-sm leading-relaxed text-stone-600",
  ...ctx
}: Props) {
  const text = ensureAnswerFirst(ctx, existing);
  if (!text) return null;
  return <p className={className}>{text}</p>;
}
