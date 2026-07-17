#!/usr/bin/env node
/** Fetch lat/lng from English Wikipedia for titles */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const titles = process.argv.slice(2);
if (!titles.length) {
  console.error("Usage: node fetch-wiki-coords.mjs Title1 Title2 ...");
  process.exit(1);
}
const url =
  "https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&titles=" +
  titles.map(encodeURIComponent).join("|");
const res = await fetch(url, { headers: { "User-Agent": "TravelMag/1.0" } });
const data = await res.json();
for (const p of Object.values(data.query.pages)) {
  const c = p.coordinates?.[0];
  console.log(
    JSON.stringify({
      title: p.title,
      missing: !!p.missing,
      lat: c?.lat,
      lng: c?.lon,
    })
  );
}
