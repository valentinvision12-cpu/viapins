import { getSiteUrl } from "@/lib/seo";
import { SITEMAP_PING_TARGETS } from "./config";
import type { IndexingChannelResult } from "./types";

/**
 * Ping major search engines that the sitemap was updated.
 * Google officially deprecated /ping but still responds; Bing accepts it.
 */
export async function pingSitemaps(): Promise<IndexingChannelResult> {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  const errors: string[] = [];
  let okCount = 0;

  for (const build of SITEMAP_PING_TARGETS) {
    const pingUrl = build(sitemapUrl);
    try {
      const res = await fetch(pingUrl, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "ViaPins-SitemapPing/1.0" },
      });
      if (res.ok || res.status === 204 || res.status === 301 || res.status === 302) {
        okCount += 1;
      } else {
        errors.push(`${new URL(pingUrl).hostname}: HTTP ${res.status}`);
      }
    } catch (err) {
      errors.push(
        `${new URL(pingUrl).hostname}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  if (okCount === 0) {
    return {
      ok: false,
      error: errors[0] ?? "All sitemap pings failed",
    };
  }

  return {
    ok: errors.length === 0,
    submitted: okCount,
    error: errors.length ? errors[0] : undefined,
  };
}
