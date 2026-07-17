const ids = {
  Sarajevo: "Q11194",
  Mostar: "Q93347",
  BanjaLuka: "Q131127",
  Tuzla: "Q174684",
  Zenica: "Q184036",
  Bihac: "Q134430",
  Trebinje: "Q321868",
  Jajce: "Q158892",
  Neum: "Q489477",
  Travnik: "Q147369",
};

for (const [name, id] of Object.entries(ids)) {
  const query = `
SELECT (COUNT(?item) AS ?c) WHERE {
  ?item wdt:P131* wd:${id} .
  ?item wdt:P31/wdt:P279* wd:Q570116 .
}`;
  const p = new URLSearchParams({ query, format: "json" });
  const res = await fetch(`https://query.wikidata.org/sparql?${p}`, {
    headers: { "User-Agent": "verify-bih/1.0" },
  });
  const data = await res.json();
  const c = data.results?.bindings?.[0]?.c?.value ?? "?";
  console.log(name, id, "tourist POIs:", c);
  await new Promise((r) => setTimeout(r, 400));
}
