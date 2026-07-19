/**
 * Curated iconic landmark covers per country (Wikimedia Commons, CC / PD).
 * Each country has 2–3 verified photos that rotate on cards and hero.
 */

import { resolveStrictLandmarkImage, isBadImageUrl } from "@/lib/wiki-image";
import { getCountryDisplayName } from "@/lib/country-meta";

export type CountryLandmark = {
  wikiTitle: string;
  /** Preferred Commons filename for a strong, on-topic photo */
  commonsFile?: string;
};

/** Up to 3 landmarks per country — primary first */
export const COUNTRY_COVER_LANDMARKS: Record<string, CountryLandmark[]> = {
  Greece: [
    { wikiTitle: "Parthenon", commonsFile: "The Parthenon in Athens.jpg" },
    { wikiTitle: "Santorini", commonsFile: "Santorini Oia sunset.jpg" },
    { wikiTitle: "Meteora", commonsFile: "Meteora monasteries Greece.jpg" },
  ],
  Italy: [
    { wikiTitle: "Colosseum", commonsFile: "Colosseo di Roma visto dal Foro Romano.jpg" },
    { wikiTitle: "Florence Cathedral", commonsFile: "Florence Cathedral from Michelangelo Hill.jpg" },
    { wikiTitle: "Grand Canal", commonsFile: "Venice Grand Canal from Rialto Bridge.jpg" },
  ],
  Spain: [
    { wikiTitle: "Sagrada Família", commonsFile: "View of the Sagrada Família from the Plaça de Gaudí.jpg" },
    { wikiTitle: "Alhambra", commonsFile: "Alhambra evening (21876646051).jpg" },
    { wikiTitle: "Plaza de España, Seville", commonsFile: "Sevilla Plaza de España.jpg" },
  ],
  France: [
    { wikiTitle: "Eiffel Tower", commonsFile: "Tour Eiffel Wikimedia Commons.jpg" },
    { wikiTitle: "Mont-Saint-Michel", commonsFile: "Mont Saint-Michel France.jpg" },
    { wikiTitle: "Palace of Versailles", commonsFile: "Versailles Palace France.jpg" },
  ],
  Hungary: [
    { wikiTitle: "Hungarian Parliament Building", commonsFile: "Hungarian Parliament Building 2010.jpg" },
    { wikiTitle: "Fisherman's Bastion", commonsFile: "Fisherman's Bastion Budapest.jpg" },
    { wikiTitle: "Buda Castle", commonsFile: "Budapest Castle Hill from Danube.jpg" },
  ],
  Estonia: [
    { wikiTitle: "Tallinn Old Town", commonsFile: "Tallinn old town from Toompea.jpg" },
    { wikiTitle: "Alexander Nevsky Cathedral, Tallinn", commonsFile: "Alexander Nevsky Cathedral Tallinn.jpg" },
    { wikiTitle: "Toompea Castle", commonsFile: "Toompea Castle Tallinn.jpg" },
  ],
  Austria: [
    { wikiTitle: "Schönbrunn Palace", commonsFile: "Schönbrunn Palace garden Gloriette.jpg" },
    { wikiTitle: "St. Stephen's Cathedral, Vienna", commonsFile: "Wien Stephansdom abends.jpg" },
    { wikiTitle: "Hallstatt", commonsFile: "Hallstatt Austria.jpg" },
  ],
  "Bosnia and Herzegovina": [
    { wikiTitle: "Stari Most", commonsFile: "Mostar Old Bridge 2.jpg" },
    { wikiTitle: "Sarajevo City Hall", commonsFile: "Vijećnica Sarajevo.jpg" },
    { wikiTitle: "Gazi Husrev-beg Mosque", commonsFile: "Gazi Husrev-beg Mosque Sarajevo.jpg" },
  ],
  Portugal: [
    { wikiTitle: "Belém Tower", commonsFile: "Torre de Belém April 2009-4.jpg" },
    { wikiTitle: "Pena Palace", commonsFile: "Palácio da Pena Sintra.jpg" },
    { wikiTitle: "Dom Luís I Bridge", commonsFile: "Porto Dom Luis I bridge.jpg" },
  ],
  Croatia: [
    { wikiTitle: "Diocletian's Palace", commonsFile: "Split Peristyle Diocletian Palace.jpg" },
    { wikiTitle: "Dubrovnik Old Town", commonsFile: "Dubrovnik Old Town Croatia.jpg" },
    { wikiTitle: "Plitvice Lakes National Park", commonsFile: "Plitvice Lakes National Park Croatia.jpg" },
  ],
  Cyprus: [
    { wikiTitle: "Kyrenia Castle", commonsFile: "Kyrenia Castle Cyprus.jpg" },
    { wikiTitle: "Paphos Archaeological Park", commonsFile: "Paphos mosaics Cyprus.jpg" },
    { wikiTitle: "Nissi Beach", commonsFile: "Nissi Beach Ayia Napa.jpg" },
  ],
  "Czech Republic": [
    { wikiTitle: "Charles Bridge", commonsFile: "Charles Bridge Prague 2014.jpg" },
    { wikiTitle: "Prague Castle", commonsFile: "Prague Castle from Charles Bridge.jpg" },
    { wikiTitle: "Old Town Square", commonsFile: "Prague Old Town Square Astronomical Clock.jpg" },
  ],
  Bulgaria: [
    { wikiTitle: "Alexander Nevsky Cathedral, Sofia", commonsFile: "Alexander Nevsky Cathedral Sofia.jpg" },
    { wikiTitle: "Rila Monastery", commonsFile: "Rila Monastery Bulgaria.jpg" },
    { wikiTitle: "Plovdiv Old Town", commonsFile: "Plovdiv old town Bulgaria.jpg" },
  ],
  Albania: [
    { wikiTitle: "Berat Castle", commonsFile: "Berat Albania old town.jpg" },
    { wikiTitle: "Butrint", commonsFile: "Butrint amphitheatre Albania.jpg" },
    { wikiTitle: "Gjirokastër", commonsFile: "Gjirokaster Albania old town.jpg" },
  ],
  Belarus: [
    { wikiTitle: "Mir Castle Complex", commonsFile: "Mir Castle Belarus.jpg" },
    { wikiTitle: "Nesvizh Castle", commonsFile: "Nesvizh Castle Belarus.jpg" },
    { wikiTitle: "Church of Saints Simon and Helena", commonsFile: "Red Church Minsk.jpg" },
  ],
  Andorra: [
    { wikiTitle: "Casa de la Vall", commonsFile: "Casa de la Vall Andorra la Vella.jpg" },
    { wikiTitle: "Madriu-Perafita-Claror Valley", commonsFile: "Madriu-Perafita-Claror Valley Andorra.jpg" },
    { wikiTitle: "Sant Esteve Church", commonsFile: "Església de Sant Esteve Andorra la Vella.jpg" },
  ],
  Luxembourg: [
    { wikiTitle: "Adolphe Bridge", commonsFile: "Adolphe Bridge Luxembourg City.jpg" },
    { wikiTitle: "Luxembourg City", commonsFile: "Luxembourg City Grund.jpg" },
    { wikiTitle: "Vianden Castle", commonsFile: "Vianden Castle Luxembourg.jpg" },
  ],
  Germany: [
    { wikiTitle: "Brandenburg Gate", commonsFile: "Brandenburger Tor Berlin.jpg" },
    { wikiTitle: "Neuschwanstein Castle", commonsFile: "Neuschwanstein Castle from Marienbrücke.jpg" },
    { wikiTitle: "Cologne Cathedral", commonsFile: "Kölner Dom nachts.jpg" },
  ],
  Ireland: [
    { wikiTitle: "Cliffs of Moher", commonsFile: "Cliffs of Moher Ireland.jpg" },
    { wikiTitle: "Rock of Cashel", commonsFile: "Rock of Cashel Ireland.jpg" },
    { wikiTitle: "Trinity College Dublin", commonsFile: "Trinity College Library Dublin.jpg" },
  ],
  Kosovo: [
    { wikiTitle: "Prizren Fortress", commonsFile: "Prizren Fortress Kosovo.jpg" },
    { wikiTitle: "Gračanica Monastery", commonsFile: "Gračanica Monastery Kosovo.jpg" },
    { wikiTitle: "Newborn monument", commonsFile: "Newborn monument Pristina.jpg" },
  ],
  Netherlands: [
    { wikiTitle: "Rijksmuseum", commonsFile: "Rijksmuseum Amsterdam.jpg" },
    { wikiTitle: "Kinderdijk", commonsFile: "Kinderdijk windmills Netherlands.jpg" },
    { wikiTitle: "Amsterdam Canal Ring", commonsFile: "Amsterdam canal houses.jpg" },
  ],
  Belgium: [
    { wikiTitle: "Grand Place, Brussels", commonsFile: "Grand Place Brussels Belgium.jpg" },
    { wikiTitle: "Atomium", commonsFile: "Atomium Brussels.jpg" },
    { wikiTitle: "Gravensteen", commonsFile: "Gravensteen Ghent Belgium.jpg" },
  ],
  Latvia: [
    { wikiTitle: "House of the Blackheads", commonsFile: "House of the Blackheads Riga.jpg" },
    { wikiTitle: "Riga Cathedral", commonsFile: "Riga Cathedral Latvia.jpg" },
    { wikiTitle: "Turaida Castle", commonsFile: "Turaida Castle Latvia.jpg" },
  ],
  Liechtenstein: [
    { wikiTitle: "Vaduz Castle", commonsFile: "Vaduz Castle Liechtenstein.jpg" },
    { wikiTitle: "Gutenberg Castle", commonsFile: "Gutenberg Castle Balzers.jpg" },
    { wikiTitle: "Malbun", commonsFile: "Malbun Liechtenstein Alps.jpg" },
  ],
  Lithuania: [
    {
      wikiTitle: "Gediminas Tower",
      commonsFile: "Gedimino_bokštas_rudenį.jpg",
    },
    {
      wikiTitle: "Trakai Island Castle",
      commonsFile: "Trakai Island Castle.jpg",
    },
    {
      wikiTitle: "Hill of Crosses",
      commonsFile: "Hill of Crosses near Šiauliai, Lithuania.jpg",
    },
  ],
  Malta: [
    { wikiTitle: "St John's Co-Cathedral", commonsFile: "St John's Co-Cathedral Valletta.jpg" },
    { wikiTitle: "Mdina", commonsFile: "Mdina Malta old city.jpg" },
    { wikiTitle: "Blue Grotto", commonsFile: "Blue Grotto Malta.jpg" },
  ],
  Moldova: [
    { wikiTitle: "Orheiul Vechi", commonsFile: "Orheiul Vechi Moldova.jpg" },
    { wikiTitle: "Căpriana Monastery", commonsFile: "Căpriana Monastery Moldova.jpg" },
    { wikiTitle: "Chișinău Cathedral", commonsFile: "Nativity Cathedral Chișinău.jpg" },
  ],
  Monaco: [
    { wikiTitle: "Prince's Palace of Monaco", commonsFile: "Monaco Palace.jpg" },
    { wikiTitle: "Monte Carlo Casino", commonsFile: "Monte Carlo Casino Monaco.jpg" },
    { wikiTitle: "Monaco harbour", commonsFile: "Monaco harbour yachts.jpg" },
  ],
  Montenegro: [
    { wikiTitle: "Kotor Old Town", commonsFile: "Kotor Old Town Montenegro.jpg" },
    { wikiTitle: "Bay of Kotor", commonsFile: "Bay of Kotor Montenegro.jpg" },
    { wikiTitle: "Sveti Stefan", commonsFile: "Sveti Stefan Montenegro.jpg" },
  ],
  "North Macedonia": [
    { wikiTitle: "Skopje Fortress", commonsFile: "Skopje Fortress Kale.jpg" },
    { wikiTitle: "Lake Ohrid", commonsFile: "Church of St John at Kaneo Ohrid.jpg" },
    { wikiTitle: "Matka Canyon", commonsFile: "Matka Canyon North Macedonia.jpg" },
  ],
  Norway: [
    { wikiTitle: "Bryggen", commonsFile: "Bryggen Bergen Norway.jpg" },
    { wikiTitle: "Geirangerfjord", commonsFile: "Geirangerfjord Norway.jpg" },
    { wikiTitle: "Preikestolen", commonsFile: "Preikestolen Norway.jpg" },
  ],
  Poland: [
    { wikiTitle: "Wawel Castle", commonsFile: "Wawel Castle Krakow Poland.jpg" },
    { wikiTitle: "Old Town Market Place, Warsaw", commonsFile: "Warsaw Old Town Market Square.jpg" },
    { wikiTitle: "Malbork Castle", commonsFile: "Malbork Castle Poland.jpg" },
  ],
  Russia: [
    { wikiTitle: "Saint Basil's Cathedral", commonsFile: "Saint Basil's Cathedral Moscow.jpg" },
    { wikiTitle: "Hermitage Museum", commonsFile: "Hermitage Museum Saint Petersburg.jpg" },
    { wikiTitle: "Lake Baikal", commonsFile: "Lake Baikal Russia winter.jpg" },
  ],
  "San Marino": [
    { wikiTitle: "Guaita", commonsFile: "Guaita San Marino.jpg" },
    { wikiTitle: "Monte Titano", commonsFile: "San Marino Monte Titano.jpg" },
    { wikiTitle: "Basilica di San Marino", commonsFile: "Basilica di San Marino.jpg" },
  ],
  Serbia: [
    { wikiTitle: "Belgrade Fortress", commonsFile: "Belgrade Fortress Kalemegdan.jpg" },
    { wikiTitle: "Church of Saint Sava", commonsFile: "Church of Saint Sava Belgrade.jpg" },
    { wikiTitle: "Đavolja varoš", commonsFile: "Devils Town Serbia.jpg" },
  ],
  Slovakia: [
    { wikiTitle: "Bratislava Castle", commonsFile: "Bratislava Castle Slovakia.jpg" },
    { wikiTitle: "Spiš Castle", commonsFile: "Spis Castle Slovakia.jpg" },
    { wikiTitle: "St Martin's Cathedral, Bratislava", commonsFile: "St Martin Cathedral Bratislava.jpg" },
  ],
  Slovenia: [
    { wikiTitle: "Lake Bled", commonsFile: "Lake Bled Slovenia island church.jpg" },
    { wikiTitle: "Ljubljana Castle", commonsFile: "Ljubljana Castle Slovenia.jpg" },
    { wikiTitle: "Postojna Cave", commonsFile: "Postojna Cave Slovenia.jpg" },
  ],
  Sweden: [
    { wikiTitle: "Gamla stan", commonsFile: "Gamla stan Stockholm Sweden.jpg" },
    { wikiTitle: "Drottningholm Palace", commonsFile: "Drottningholm Palace Sweden.jpg" },
    { wikiTitle: "Icehotel", commonsFile: "Icehotel Jukkasjärvi Sweden.jpg" },
  ],
  Switzerland: [
    { wikiTitle: "Matterhorn", commonsFile: "Matterhorn from Zermatt.jpg" },
    { wikiTitle: "Château de Chillon", commonsFile: "Chillon Castle Switzerland.jpg" },
    { wikiTitle: "Jungfraujoch", commonsFile: "Jungfraujoch Switzerland.jpg" },
  ],
  Turkey: [
    { wikiTitle: "Hagia Sophia", commonsFile: "Hagia Sophia Istanbul.jpg" },
    { wikiTitle: "Cappadocia", commonsFile: "Cappadocia hot air balloons Turkey.jpg" },
    { wikiTitle: "Ephesus", commonsFile: "Library of Celsus Ephesus.jpg" },
  ],
  Ukraine: [
    { wikiTitle: "Saint Sophia Cathedral, Kyiv", commonsFile: "Saint Sophia Cathedral Kyiv.jpg" },
    { wikiTitle: "Lviv Old Town", commonsFile: "Lviv old town Ukraine.jpg" },
    { wikiTitle: "Kamianets-Podilskyi Castle", commonsFile: "Kamianets-Podilskyi Castle Ukraine.jpg" },
  ],
  "United Kingdom": [
    { wikiTitle: "Big Ben", commonsFile: "Big Ben and Westminster Bridge.jpg" },
    { wikiTitle: "Tower Bridge", commonsFile: "Tower Bridge London.jpg" },
    { wikiTitle: "Edinburgh Castle", commonsFile: "Edinburgh Castle Scotland.jpg" },
  ],
  Japan: [
    { wikiTitle: "Mount Fuji", commonsFile: "Mount Fuji from Lake Kawaguchi.jpg" },
    { wikiTitle: "Fushimi Inari-taisha", commonsFile: "Fushimi Inari Taisha Kyoto.jpg" },
    { wikiTitle: "Senso-ji", commonsFile: "Senso-ji Asakusa Tokyo.jpg" },
  ],
};

export function getCountryCoverLandmarks(country: string): CountryLandmark[] {
  const display = getCountryDisplayName(country);
  return COUNTRY_COVER_LANDMARKS[display] ?? COUNTRY_COVER_LANDMARKS[country] ?? [];
}

async function resolveLandmarkImage(
  landmark: CountryLandmark,
  _country: string,
  thumbSize: number,
  avoid: Set<string>
): Promise<string> {
  const url = await resolveStrictLandmarkImage(landmark.wikiTitle, {
    commonsFile: landmark.commonsFile,
    thumbSize,
  });
  if (url && !avoid.has(url) && !isBadImageUrl(url)) {
    avoid.add(url);
    return url;
  }
  return "";
}

/** Resolve 1–3 distinct landmark cover URLs for a country (curated only). */
export async function resolveCountryCoverImages(
  country: string,
  thumbSize = 1600
): Promise<string[]> {
  const display = getCountryDisplayName(country);
  const landmarks = getCountryCoverLandmarks(display);
  const avoid = new Set<string>();
  const out: string[] = [];

  for (const lm of landmarks.slice(0, 3)) {
    const url = await resolveLandmarkImage(lm, display, thumbSize, avoid);
    if (url) out.push(url);
  }

  return out;
}
