import { resolveWikiExtract } from "../src/lib/wiki-image";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Direct test of internal flow
const WP = "https://en.wikipedia.org/w/api.php";

async function opensearch(q: string) {
  const p = new URLSearchParams({
    action: "opensearch",
    search: q,
    limit: "5",
    format: "json",
  });
  const r = await fetch(`${WP}?${p}`, {
    headers: { "User-Agent": "LuxuryTravelMagazine/1.0" },
  });
  const data = await r.json();
  console.log(q, "->", data[1]);
}

async function main() {
  await opensearch("Peristil Split Croatia");
  await opensearch("Meštrović Gallery Split");
  await opensearch("Riva Split waterfront");
  await opensearch("Šibenik City Museum");

  const r = await resolveWikiExtract("Meštrović Gallery", {
    wikiTitle: "Meštrović Gallery",
    city: "Split",
    country: "Croatia",
  });
  console.log("\nResolved:", r);
}

main();
