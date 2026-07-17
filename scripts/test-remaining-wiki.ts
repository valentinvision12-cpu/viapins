import { resolveWikiExtract } from "../src/lib/wiki-image";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const cases = [
  ["Kolovare Beach", "Zadar", "Croatia"],
  ["Molo Longo", "Rijeka", "Croatia"],
  ["Zerostrasse", "Pula", "Croatia"],
  ["Travnik Castle", "Travnik", "Bosnia and Herzegovina"],
  ["Yellow Fortress", "Sarajevo", "Bosnia and Herzegovina"],
  ["Old Bridge Museum", "Mostar", "Bosnia and Herzegovina"],
  ["Sankturin House", "Kutná Hora", "Czech Republic"],
  ["iQLANDIA", "Liberec", "Czech Republic"],
  ["Klicperovo Theatre", "Hradec Králové", "Czech Republic"],
] as const;

async function main() {
  for (const [name, city, country] of cases) {
    const r = await resolveWikiExtract(name, { city, country });
    console.log(
      name,
      "->",
      r.wikiTitle,
      "|",
      r.extract ? r.extract.slice(0, 90) : "EMPTY"
    );
  }
}

main();
