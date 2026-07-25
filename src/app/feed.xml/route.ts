import { getCachedHomeDestinations } from "@/actions/get-destinations";
import { getSiteUrl } from "@/lib/seo";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const destinations = await getCachedHomeDestinations();
  const featured = destinations
    .slice()
    .sort((a, b) => b.placeCount - a.placeCount)
    .slice(0, 50);

  const items = featured
    .map((dest) => {
      const link = `${siteUrl}/en/explore/${dest.slug.country}/${dest.slug.city}`;
      const title = escapeXml(`${dest.city}, ${dest.country}`);
      const description = escapeXml(
        `Travel guide for ${dest.city}, ${dest.country} with ${dest.placeCount} places.`
      );
      return `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ViaPins — Featured destinations</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Travel guides with GPS routes for destinations worldwide.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
