import type { SchemaFaqItem } from "@/lib/schema/types";

type Props = {
  items: SchemaFaqItem[];
  title?: string;
  className?: string;
};

/**
 * Visible FAQ block — must use the same items as FAQPage JSON-LD.
 */
export function FaqSection({
  items,
  title = "Frequently asked questions",
  className = "",
}: Props) {
  if (!items.length) return null;

  return (
    <section
      className={`border-t border-stone-200 bg-[#F8F6F1] ${className}`}
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <h2
          id="faq-heading"
          className="text-lg font-bold tracking-tight text-stone-900"
        >
          {title}
        </h2>
        <dl className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.question}
              className="rounded-lg border border-stone-200/80 bg-white px-5 py-4"
            >
              <dt className="text-sm font-semibold text-stone-900">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}