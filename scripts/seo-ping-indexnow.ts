/**
 * Ping IndexNow with homepage + sitemap URL.
 * Usage: INDEXNOW_KEY=... npm run seo:ping
 * Optional: SEO_PING_URLS=https://viapins.com/en,https://...
 */
import { getSiteUrl } from "../src/lib/seo";

async function main() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    console.error("Set INDEXNOW_KEY");
    process.exit(1);
  }
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || getSiteUrl()).replace(/\/$/, "");
  const host = new URL(siteUrl).hostname;
  const extra = (process.env.SEO_PING_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const urlList = [
    `${siteUrl}/en`,
    `${siteUrl}/sitemap.xml`,
    ...extra,
  ];
  const payload = {
    host,
    key,
    keyLocation: `${siteUrl}/indexnow-key.txt`,
    urlList,
  };
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(res.status, text || "(empty)");
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
