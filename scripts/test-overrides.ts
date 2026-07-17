import { resolveWikiExtract } from "../src/lib/wiki-image";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const overrides: Record<string, string> = {
  "Kolovare Beach|Zadar": "Kolovare",
  "Molo Longo|Rijeka": "Rijeka",
  "Zerostrasse|Pula": "Zerostrasse (Pula)",
  "Lone Bay|Rovinj": "Rovinj",
  "Grisia Street|Rovinj": "Grisia",
  "Sakuntala Park|Osijek": "Osijek",
  "Sankturin House|Kutná Hora": "Sankturin House (Kutná Hora)",
  "Smetana Gardens|Karlovy Vary": "Smetana Gardens",
  "Park 360|Hradec Králové": "Hradec Králové",
  "Jirásek Gardens|Hradec Králové": "Hradec Králové",
  "Klicperovo Theatre|Hradec Králové": "Klicperovo divadlo",
  "Bezručovy sady|Olomouc": "Olomouc",
  "iQLANDIA|Liberec": "iQLANDIA",
  "Tuzla Saltworks|Tuzla": "Tuzla",
  "Pliva Lakes|Jajce": "Pliva Lakes",
  "Jajce Old Town|Jajce": "Jajce",
  "Klek Mountain|Neum": "Neum, Bosnia and Herzegovina",
  "Klek Fortress|Neum": "Neum, Bosnia and Herzegovina",
  "Neum Bay|Neum": "Neum, Bosnia and Herzegovina",
  "Neum Beach|Neum": "Neum, Bosnia and Herzegovina",
  "Ivo Andrić Museum|Travnik": "Ivo Andrić",
  "Vezir's Mosque|Travnik": "Travnik",
  "Turbe of Travnik|Travnik": "Travnik",
  "Travnik Clock Tower|Travnik": "Travnik",
  "Travnik Old Town|Travnik": "Travnik",
  "Sulejmanija Mosque|Travnik": "Travnik",
  "Old Bridge Museum|Mostar": "Stari Most",
  "Hamam Museum|Mostar": "Mostar",
  "Kujundžiluk|Mostar": "Mostar",
  "Bišćević House|Mostar": "Mostar",
  "Gospodska Street|Banja Luka": "Banja Luka",
  "Petar Kočić Park|Banja Luka": "Banja Luka",
  "Yellow Fortress|Sarajevo": "Yellow Bastion",
};

async function main() {
  for (const [key, wiki] of Object.entries(overrides)) {
    const [name, city] = key.split("|");
    const country = city.includes("Hora") || ["Liberec", "Olomouc", "Karlovy Vary", "Hradec Králové"].some((c) => city.includes(c))
      ? "Czech Republic"
      : ["Travnik", "Mostar", "Sarajevo", "Banja Luka", "Tuzla", "Jajce", "Neum"].some((c) => city === c)
        ? "Bosnia and Herzegovina"
        : "Croatia";
    const r = await resolveWikiExtract(name, { wikiTitle: wiki, city, country });
    console.log(key, "=>", r.wikiTitle, "|", r.extract ? "OK" : "EMPTY", r.extract?.slice(0, 70));
  }
}

main();
