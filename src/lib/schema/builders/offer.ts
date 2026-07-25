import type { JsonLdNode, SchemaOfferInput, SchemaProductOfferInput } from "../types";
import { stripUndefined } from "../utils";

function hasRealPrice(offer: SchemaOfferInput | undefined | null): boolean {
  if (!offer) return false;
  const price = offer.price;
  if (price === null || price === undefined) return false;
  if (typeof price === "string" && !price.trim()) return false;
  if (typeof price === "number" && (Number.isNaN(price) || price < 0)) return false;
  if (!offer.priceCurrency?.trim()) return false;
  return true;
}

/** Emit Offer node only when a real price (+ currency) is provided. */
export function buildOfferNode(
  offer: SchemaOfferInput | undefined | null
): JsonLdNode | undefined {
  if (!hasRealPrice(offer) || !offer) return undefined;

  return stripUndefined({
    "@type": "Offer",
    price: offer.price,
    priceCurrency: offer.priceCurrency.trim(),
    availability: offer.availability ?? "https://schema.org/InStock",
    url: offer.url,
    validFrom: offer.validFrom,
    validThrough: offer.validThrough,
  }) as JsonLdNode;
}

/** Emit AggregateOffer when multiple priced offers exist. */
export function buildAggregateOfferNode(
  offers: SchemaOfferInput[] | undefined | null
): JsonLdNode | undefined {
  const priced = (offers ?? []).filter(hasRealPrice);
  if (priced.length === 0) return undefined;
  if (priced.length === 1) return buildOfferNode(priced[0]);

  const prices = priced.map((o) => Number(o.price)).filter((n) => !Number.isNaN(n));
  const currency = priced[0].priceCurrency.trim();

  return stripUndefined({
    "@type": "AggregateOffer",
    lowPrice: prices.length ? Math.min(...prices) : undefined,
    highPrice: prices.length ? Math.max(...prices) : undefined,
    priceCurrency: currency,
    offerCount: priced.length,
    offers: priced.map((o) => buildOfferNode(o)).filter(Boolean),
  }) as JsonLdNode;
}

/**
 * Optional Product wrapper with Offer(s).
 * Returns undefined when no real price is available — never emit fake prices.
 */
export function buildProductWithOffers(
  product: SchemaProductOfferInput | undefined | null
): JsonLdNode | undefined {
  if (!product?.name?.trim()) return undefined;

  const offersList = Array.isArray(product.offers)
    ? product.offers
    : product.offers
      ? [product.offers]
      : [];
  const offerNode = buildAggregateOfferNode(offersList);
  if (!offerNode) return undefined;

  return stripUndefined({
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: offerNode,
  }) as JsonLdNode;
}

export { hasRealPrice };
