import { SEO_LOCALES } from "@/lib/seo";
import {
  SITE_CONTACT_EMAIL,
  SITE_FULL_NAME,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/site-brand";
import type { JsonLdNode } from "../types";
import {
  buildImageObject,
  buildOrganizationId,
  buildWebsiteId,
  getSchemaSiteUrl,
  stripUndefined,
} from "../utils";

export function buildGlobalEntityNodes(input: {
  locale: string;
  siteUrl?: string;
  sameAs?: string[];
}): JsonLdNode[] {
  const siteUrl = input.siteUrl ?? getSchemaSiteUrl();
  const orgId = buildOrganizationId(siteUrl);
  const websiteId = buildWebsiteId(siteUrl);
  const logoUrl = `${siteUrl}${SITE_LOGO_PATH}`;
  const sameAs = (input.sameAs ?? []).filter((url) =>
    url?.trim().startsWith("http")
  );

  const organization = stripUndefined({
    "@type": "Organization",
    "@id": orgId,
    name: SITE_NAME,
    url: siteUrl,
    email: SITE_CONTACT_EMAIL,
    logo: buildImageObject({ url: logoUrl, caption: SITE_NAME }),
    brand: { "@type": "Brand", name: SITE_NAME },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE_CONTACT_EMAIL,
      availableLanguage: [...SEO_LOCALES],
    },
    ...(sameAs.length ? { sameAs } : {}),
  }) as JsonLdNode;

  const website = stripUndefined({
    "@type": "WebSite",
    "@id": websiteId,
    name: SITE_NAME,
    alternateName: SITE_FULL_NAME,
    url: siteUrl,
    inLanguage: [...SEO_LOCALES],
    publisher: { "@id": orgId },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/${input.locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }) as JsonLdNode;

  return [organization, website];
}
