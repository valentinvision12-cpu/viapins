import {
  REVIEW_THRESHOLD,
  type JsonLdNode,
  type SchemaAggregateRatingInput,
  type SchemaReviewInput,
} from "../types";
import { stripUndefined } from "../utils";

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildAggregateRatingNode(
  pageUrl: string,
  input: SchemaAggregateRatingInput | undefined
): JsonLdNode | undefined {
  if (!input || input.reviewCount < REVIEW_THRESHOLD) return undefined;

  return stripUndefined({
    "@type": "AggregateRating",
    "@id": `${pageUrl}#aggregateRating`,
    ratingValue: roundRating(input.ratingValue),
    reviewCount: input.reviewCount,
    bestRating: input.bestRating ?? 5,
    worstRating: input.worstRating ?? 1,
  }) as JsonLdNode;
}

export function buildReviewNodes(
  pageUrl: string,
  reviews: SchemaReviewInput[] | undefined
): JsonLdNode[] {
  if (!reviews?.length || reviews.length < REVIEW_THRESHOLD) return [];

  return reviews.map((review, index) =>
    stripUndefined({
      "@type": "Review",
      "@id": `${pageUrl}#review-${index + 1}`,
      author: {
        "@type": "Person",
        name: review.authorName?.trim() || "ViaPins traveler",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: roundRating(review.rating),
        bestRating: 5,
        worstRating: 1,
      },
      name: review.title ?? undefined,
      reviewBody: review.body ?? undefined,
      datePublished: review.date ?? undefined,
    }) as JsonLdNode
  );
}

export function computeAggregateRating(
  reviews: SchemaReviewInput[]
): SchemaAggregateRatingInput | undefined {
  if (!reviews.length) return undefined;
  const ratingValue =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    ratingValue,
    reviewCount: reviews.length,
  };
}
