process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function summary(title: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const r = await fetch(url, {
    headers: { "User-Agent": "LuxuryTravelMagazine/1.0" },
  });
  if (!r.ok) return console.log(title, r.status);
  const j = await r.json();
  console.log(title, "->", (j.extract || j.description || "").slice(0, 120));
}

async function search(q: string) {
  const p = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: q,
    srlimit: "5",
    format: "json",
  });
  const r = await fetch(`https://en.wikipedia.org/w/api.php?${p}`, {
    headers: { "User-Agent": "LuxuryTravelMagazine/1.0" },
  });
  const j = await r.json();
  console.log(
    "search",
    q,
    "->",
    j.query?.search?.map((x: { title: string }) => x.title)
  );
}

async function main() {
  await summary("Ivan Meštrović Gallery");
  await summary("Diocletian's Palace");
  await summary("Riva, Split");
  await search("Meštrović Gallery Split");
  await search("Peristil Split");
  await search("Riva promenade Split");
}

main();
