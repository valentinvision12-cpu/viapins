import type { JsonLdNode, SchemaFaqItem } from "../types";
import { stripUndefined } from "../utils";

export function buildFaqNode(
  pageUrl: string,
  faqs: SchemaFaqItem[],
  locale: string
): JsonLdNode {
  return stripUndefined({
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage: locale,
    mainEntity: faqs.map((faq) =>
      stripUndefined({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })
    ),
  }) as JsonLdNode;
}
