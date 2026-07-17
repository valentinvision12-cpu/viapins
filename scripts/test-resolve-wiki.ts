import { resolveWikiExtract } from "../src/lib/wiki-image";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.SEQUENTIAL_WIKI = "1";

async function main() {
  const tests = [
    ["Peristil", "Split", "Croatia", "Peristyle of Diocletian's Palace"],
    ["Riva", "Split", "Croatia", "Riva (Split)"],
    ["Šibenik City Museum", "Šibenik", "Croatia", "Šibenik City Museum"],
    ["Meštrović Gallery", "Split", "Croatia", "Meštrović Gallery"],
  ] as const;

  for (const [name, city, country, wiki] of tests) {
    const r = await resolveWikiExtract(name, { wikiTitle: wiki, city, country });
    console.log("\n", name, "->", r.wikiTitle);
    console.log(r.extract ? r.extract.slice(0, 150) : "EMPTY");
  }
}

main();
