import { getSiteUrl } from "@/lib/seo";
import type { JsonLdGraph, JsonLdNode } from "./types";

export function getSchemaSiteUrl(): string {
  return getSiteUrl();
}

export function buildOrganizationId(siteUrl?: string): string {
  return `${siteUrl ?? getSchemaSiteUrl()}/#organization`;
}

export function buildWebsiteId(siteUrl?: string): string {
  return `${siteUrl ?? getSchemaSiteUrl()}/#website`;
}

export function buildWebpageId(pageUrl: string): string {
  return `${pageUrl}#webpage`;
}

export function buildEntityId(pageUrl: string): string {
  return `${pageUrl}#entity`;
}

export function buildBreadcrumbId(pageUrl: string): string {
  return `${pageUrl}#breadcrumb`;
}

export function buildItemListId(pageUrl: string, suffix = "itemlist"): string {
  return `${pageUrl}#${suffix}`;
}

export function buildPageUrl(locale: string, ...segments: string[]): string {
  const siteUrl = getSchemaSiteUrl();
  const path = segments.filter(Boolean).join("/");
  return path ? `${siteUrl}/${locale}/${path}` : `${siteUrl}/${locale}`;
}

export function validCoordinate(
  value: number | null | undefined
): number | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Number(value);
  if (n < -180 || n > 180) return undefined;
  return n;
}

export function buildGeoCoordinates(
  lat?: number | null,
  lng?: number | null
): JsonLdNode | undefined {
  const latitude = validCoordinate(lat);
  const longitude = validCoordinate(lng);
  if (latitude == null || longitude == null) return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude,
    longitude,
  };
}

export function buildPostalAddress(input: {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  postalCode?: string;
}): JsonLdNode {
  return stripUndefined({
    "@type": "PostalAddress",
    streetAddress: input.streetAddress,
    addressLocality: input.addressLocality,
    addressRegion: input.addressRegion,
    addressCountry: input.addressCountry,
    postalCode: input.postalCode,
  }) as JsonLdNode;
}

/** Only emit structured opening hours when values look like Schema day names or ISO times. */
export function buildOpeningHours(
  hours: string | string[] | undefined
): JsonLdNode[] | undefined {
  if (!hours) return undefined;
  const list = (Array.isArray(hours) ? hours : [hours]).map((h) => h.trim()).filter(Boolean);
  if (!list.length) return undefined;

  const dayNames = new Set([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);

  const specs: JsonLdNode[] = [];
  for (const item of list) {
    if (dayNames.has(item)) {
      specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: item });
      continue;
    }
    // e.g. "Mo-Su 09:00-18:00" — keep as openingHours text via description only if structured-ish
    const match = item.match(
      /^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/
    );
    if (match) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: match[1],
        opens: match[2],
        closes: match[3],
      });
    }
  }
  return specs.length ? specs : undefined;
}

export function buildImageObject(input: {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  creator?: string | { name: string };
}): JsonLdNode | undefined {
  if (!input.url?.trim()) return undefined;
  const creator =
    typeof input.creator === "string"
      ? { "@type": "Person" as const, name: input.creator }
      : input.creator
        ? { "@type": "Person" as const, name: input.creator.name }
        : undefined;

  return stripUndefined({
    "@type": "ImageObject",
    url: input.url,
    width: input.width,
    height: input.height,
    caption: input.caption,
    creator,
  }) as JsonLdNode;
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined && item !== null) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined || nested === null) continue;
      if (Array.isArray(nested) && nested.length === 0) continue;
      const cleaned = stripUndefined(nested);
      if (
        cleaned &&
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as Record<string, unknown>).length === 0
      ) {
        continue;
      }
      out[key] = cleaned;
    }
    return out as T;
  }
  return value;
}

export function mergeGraph(nodes: JsonLdNode[]): JsonLdNode[] {
  const byId = new Map<string, JsonLdNode>();
  const withoutId: JsonLdNode[] = [];
  for (const node of nodes) {
    const id = node["@id"];
    if (typeof id === "string" && id.length > 0) {
      byId.set(id, node);
    } else {
      withoutId.push(node);
    }
  }
  return [...byId.values(), ...withoutId];
}

export function createGraph(nodes: JsonLdNode[]): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": mergeGraph(nodes.map((n) => stripUndefined(n) as JsonLdNode)),
  };
}

export function entityReference(id: string): { "@id": string } {
  return { "@id": id };
}

export function serializeJsonLd(graph: JsonLdGraph): string {
  const cleaned = stripUndefined(graph);
  return JSON.stringify(cleaned)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
