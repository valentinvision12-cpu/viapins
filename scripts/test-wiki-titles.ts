import { getWikiExtract } from "../src/lib/wiki-image";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const titles = [
  "Peristyle of Diocletian's Palace",
  "Peristyle",
  "Diocletian's Palace",
  "Riva, Split",
  "Riva (Split)",
  "Meštrović Gallery",
  "Ivan Meštrović Gallery",
  "Split City Museum",
  "Šibenik City Museum",
  "Museum of Šibenik",
];

async function main() {
  for (const t of titles) {
    const e = await getWikiExtract(t);
    console.log(t, "->", e ? e.slice(0, 100) : "EMPTY");
  }
}
main();
