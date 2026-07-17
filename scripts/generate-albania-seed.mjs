/**
 * Generates data/seeds/albania.json — 10 cities × 10 places = 100 landmarks
 * Run: node scripts/generate-albania-seed.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function citySeo(city, country, highlight) {
  return {
    title: `Top 10 Things to Do in ${city}, ${country} | Free GPS Travel Guide`,
    description: `Discover 10 must-see landmarks in ${city}, ${country} — ${highlight}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${city}? This free guide covers the 10 best places to visit in ${city}, ${country} — save your favorites and build a GPS route in Google Maps in minutes.`,
    keywords: [
      `things to do in ${city}`,
      `${city} ${country} travel guide`,
      `best places to visit in ${city}`,
      `${city} landmarks`,
      `${city} itinerary`,
      `${city} gps route`,
    ],
  };
}

function place(name, wiki_title, lat, lng, seo_phrase, seo_keywords) {
  return { name, wiki_title, lat, lng, seo_phrase, seo_keywords };
}

const cities = [
  {
    city: "Tirana",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Tirana",
    seo: citySeo("Tirana", "Albania", "Skanderbeg Square, Bunk'Art, and Et'hem Bey Mosque"),
    places: [
      place("Skanderbeg Square", "Skanderbeg Square", 41.3275, 19.8187, "Skanderbeg Square — the heart of Tirana and Albania's national gathering place", ["Skanderbeg Square Tirana", "central square Albania", "Tirana main square"]),
      place("National History Museum", "National Historical Museum (Albania)", 41.3319, 19.8194, "National History Museum — Albania's largest museum with the iconic mosaic facade", ["National History Museum Tirana", "Albania history museum", "Tirana museum"]),
      place("Et'hem Bey Mosque", "Et'hem Bey Mosque", 41.3272, 19.8197, "Et'hem Bey Mosque — Ottoman-era mosque with exquisite frescoes in central Tirana", ["Et'hem Bey Mosque", "Tirana mosque", "Ottoman mosque Albania"]),
      place("Pyramid of Tirana", "Pyramid of Tirana", 41.3236, 19.8214, "Pyramid of Tirana — iconic brutalist landmark reborn as a cultural hub", ["Pyramid of Tirana", "Piramida Tirana", "Tirana architecture"]),
      place("Bunk'Art 2", "Bunk'Art 2", 41.3278, 19.8244, "Bunk'Art 2 — underground nuclear bunker museum in the heart of Tirana", ["Bunk'Art 2 Tirana", "Albania bunker museum", "communist history Tirana"]),
      place("Bunk'Art 1", "Bunk'Art 1", 41.3456, 19.8511, "Bunk'Art 1 — massive Cold War bunker on the slopes of Dajti Mountain", ["Bunk'Art 1", "Enver Hoxha bunker", "Dajti bunker museum"]),
      place("Dajti Mountain National Park", "Dajti", 41.3653, 19.9136, "Dajti Mountain — panoramic views over Tirana via cable car", ["Dajti Mountain Tirana", "Dajti cable car", "Tirana viewpoint"]),
      place("New Bazaar", "Pazari i Ri", 41.3303, 19.8247, "New Bazaar (Pazari i Ri) — Tirana's revitalized food market and dining district", ["Pazari i Ri Tirana", "New Bazaar Tirana", "where to eat in Tirana"]),
      place("House of Leaves Museum", "House of Leaves", 41.3264, 19.8228, "House of Leaves — former secret police surveillance museum in Tirana", ["House of Leaves Tirana", "Sigurimi museum", "Albania secret police museum"]),
      place("Blloku District", "Blloku", 41.3208, 19.8169, "Blloku District — Tirana's trendiest neighborhood for cafés, bars, and nightlife", ["Blloku Tirana", "Tirana nightlife", "best area to stay in Tirana"]),
    ],
  },
  {
    city: "Berat",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Berat",
    seo: citySeo("Berat", "Albania", "UNESCO Old Town, castle, and Mangalem quarter"),
    places: [
      place("Berat Castle", "Berat Castle", 40.7089, 19.9458, "Berat Castle — ancient hilltop fortress with Byzantine churches", ["Berat Castle", "Kalaja e Beratit", "UNESCO Berat castle"]),
      place("Mangalem Quarter", "Mangalem", 40.7056, 19.9514, "Mangalem Quarter — Ottoman neighborhood of the City of a Thousand Windows", ["Mangalem Berat", "Berat old town", "Berat thousand windows"]),
      place("Gorica Quarter", "Gorica, Berat", 40.7036, 19.9547, "Gorica Quarter — historic hillside neighborhood across the Osumi River", ["Gorica Berat", "Berat riverside", "Berat walking tour"]),
      place("Onufri Museum", "Onufri Iconographic Museum", 40.7083, 19.9456, "Onufri Museum — masterpiece collection of Albanian Orthodox iconography", ["Onufri Museum Berat", "Berat icon museum", "Albanian icons"]),
      place("Gorica Bridge", "Gorica Bridge", 40.7047, 19.9531, "Gorica Bridge — 18th-century Ottoman stone bridge over the Osumi River", ["Gorica Bridge Berat", "Ura e Goricës", "Osumi River Berat"]),
      place("King Mosque", "King Mosque, Berat", 40.7069, 19.9497, "King Mosque — one of the oldest mosques in Berat's Mangalem district", ["King Mosque Berat", "Xhamia e Mbretit", "Berat mosques"]),
      place("Ethnographic Museum of Berat", "Ethnographic Museum of Berat", 40.7064, 19.9503, "Ethnographic Museum — traditional Albanian life inside an Ottoman house", ["Ethnographic Museum Berat", "Berat traditional house", "Albanian culture museum"]),
      place("Bogove Waterfall", "Bogove Waterfall", 40.6167, 20.0833, "Bogove Waterfall — hidden natural gem near Berat", ["Bogove Waterfall", "waterfall near Berat", "Berat nature"]),
      place("Osumi River Canyon", "Osum Canyon", 40.5833, 20.1667, "Osumi River Canyon — dramatic gorge with rafting near Berat", ["Osumi Canyon", "Osum Canyon rafting", "Berat canyon"]),
      place("Saint Mary of Blachernae Church", "Church of St. Mary of Blachernae", 40.7086, 19.9453, "Saint Mary of Blachernae — 13th-century church with rare frescoes in Berat Castle", ["Blachernae Church Berat", "Berat castle church", "Berat frescoes"]),
    ],
  },
  {
    city: "Saranda",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Sarandë",
    seo: citySeo("Saranda", "Albania", "Butrint UNESCO site, Ksamil beaches, and Blue Eye spring"),
    places: [
      place("Butrint National Park", "Butrint", 39.7453, 20.0206, "Butrint National Park — UNESCO World Heritage archaeological site", ["Butrint Albania", "Butrint UNESCO", "day trip from Saranda"]),
      place("Ksamil Islands", "Ksamil", 39.7667, 19.9997, "Ksamil Islands — turquoise beaches on the Albanian Riviera", ["Ksamil beaches", "Ksamil islands Albania", "best beaches Saranda"]),
      place("Blue Eye", "Blue Eye (Albania)", 39.9194, 20.1886, "Blue Eye (Syri i Kaltër) — mystical natural spring with crystal-clear water", ["Blue Eye Albania", "Syri i Kaltër", "natural wonder Albania"]),
      place("Lëkurësi Castle", "Lëkurësi Castle", 39.8756, 20.0069, "Lëkurësi Castle — hilltop fortress with panoramic views over Saranda Bay", ["Lëkurësi Castle", "Saranda castle", "Saranda viewpoint"]),
      place("Monastery of 40 Saints", "Monastery of 40 Saints", 39.8747, 20.0114, "Monastery of 40 Saints — medieval ruins with sweeping views over Saranda", ["Monastery of 40 Saints Saranda", "Saranda monastery", "Byzantine ruins Albania"]),
      place("Saranda Promenade", "Sarandë", 39.8756, 20.0053, "Saranda Promenade — seaside walkway with cafés and Ionian Sea views", ["Saranda promenade", "Saranda waterfront", "where to eat Saranda"]),
      place("Finiq Archaeological Park", "Phoenice", 39.7333, 20.0667, "Finiq Archaeological Park — ancient hilltop city on the Ionian coast", ["Finiq Albania", "Phoenice archaeological site", "ancient ruins Saranda"]),
      place("Mirror Beach", "Mirror Beach", 39.7536, 19.9786, "Mirror Beach — secluded pebble beach between Saranda and Ksamil", ["Mirror Beach Albania", "hidden beach Saranda", "Albanian Riviera"]),
      place("Mesopotam Church", "Mesopotam Church", 39.8167, 20.1167, "Mesopotam Church — well-preserved Byzantine church near Saranda", ["Mesopotam Church Albania", "Byzantine church Saranda", "Saranda day trip"]),
      place("Synagogue of Saranda", "Synagogue of Saranda", 39.7458, 20.0197, "Synagogue of Saranda — ancient Jewish heritage site within Butrint National Park", ["Synagogue of Saranda", "Butrint synagogue", "Jewish heritage Albania"]),
    ],
  },
  {
    city: "Gjirokastër",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Gjirokastër",
    seo: citySeo("Gjirokastër", "Albania", "UNESCO stone city, castle, and Ottoman houses"),
    places: [
      place("Gjirokastër Castle", "Gjirokastër Castle", 40.0739, 20.1403, "Gjirokastër Castle — massive hilltop fortress dominating the stone city", ["Gjirokastër Castle", "Kalaja e Gjirokastrës", "UNESCO castle Albania"]),
      place("Old Bazaar of Gjirokastër", "Old Bazaar, Gjirokastër", 40.0756, 20.1389, "Old Bazaar — cobblestone market street with craft shops and traditional cafés", ["Gjirokastër old bazaar", "Gjirokastër market", "Ottoman bazaar Albania"]),
      place("Skenduli House", "Skenduli House", 40.0753, 20.1378, "Skenduli House — restored Ottoman tower house open to visitors", ["Skenduli House Gjirokastër", "Ottoman house Albania", "Gjirokastër tower house"]),
      place("Zekate House", "Zekate House", 40.0764, 20.1367, "Zekate House — iconic three-story Ottoman mansion with panoramic views", ["Zekate House Gjirokastër", "Gjirokastër viewpoint", "Ottoman mansion Albania"]),
      place("Cold War Tunnel", "Cold War Tunnel (Gjirokastër)", 40.0747, 20.1394, "Cold War Tunnel — secret underground bunker for Albania's communist elite", ["Cold War Tunnel Gjirokastër", "Albania bunker", "communist history Gjirokastër"]),
      place("Ethnographic Museum of Gjirokastër", "Ethnographic Museum of Gjirokastër", 40.0742, 20.1408, "Ethnographic Museum — traditional Albanian life in Enver Hoxha's birthplace", ["Ethnographic Museum Gjirokastër", "Enver Hoxha house", "Gjirokastër museum"]),
      place("Obelisk of Gjirokastër", "Obelisk of Gjirokastër", 40.0736, 20.1411, "Obelisk of Gjirokastër — monument at the castle entrance with city views", ["Obelisk Gjirokastër", "Gjirokastër castle entrance", "Gjirokastër monument"]),
      place("Gjirokastër Mosque", "Gjirokastër Mosque", 40.0758, 20.1383, "Gjirokastër Mosque — historic mosque in the heart of the old bazaar", ["Gjirokastër mosque", "bazaar mosque Albania", "Ottoman mosque Gjirokastër"]),
      place("Libohovë Castle", "Libohovë Castle", 40.1167, 20.0833, "Libohovë Castle — ruined fortress with views over the Drino Valley", ["Libohovë Castle", "day trip from Gjirokastër", "Drino Valley"]),
      place("Drino Valley", "Drino", 40.0833, 20.1333, "Drino Valley — scenic valley surrounding Gjirokastër with hiking trails", ["Drino Valley Albania", "hiking Gjirokastër", "Gjirokastër nature"]),
    ],
  },
  {
    city: "Shkodër",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Shkodër",
    seo: citySeo("Shkodër", "Albania", "Rozafa Castle, Lake Shkodër, and Albanian Alps gateway"),
    places: [
      place("Rozafa Castle", "Rozafa Castle", 42.0464, 19.4936, "Rozafa Castle — legendary hilltop fortress overlooking Lake Shkodër", ["Rozafa Castle", "Kalaja e Rozafës", "Shkodër castle"]),
      place("Lake Shkodër", "Lake Skadar", 42.0833, 19.4167, "Lake Shkodër — largest lake in Southern Europe, shared with Montenegro", ["Lake Shkodër", "Lake Skadar Albania", "boating Lake Shkodër"]),
      place("Marubi National Photo Museum", "Marubi National Museum of Photography", 42.0689, 19.5128, "Marubi Photo Museum — world's largest collection of Albanian photography", ["Marubi Museum Shkodër", "photography museum Albania", "Marubi collection"]),
      place("Lead Mosque", "Lead Mosque", 42.0686, 19.5147, "Lead Mosque — 18th-century mosque with a distinctive lead-covered dome", ["Lead Mosque Shkodër", "Xhamia e Plumbit", "Shkodër mosques"]),
      place("St Stephen's Cathedral", "St Stephen's Cathedral, Shkodër", 42.0683, 19.5136, "St Stephen's Cathedral — grand Catholic cathedral in the heart of Shkodër", ["St Stephen's Cathedral Shkodër", "Shkodër cathedral", "Catholic church Albania"]),
      place("Ebu Bekr Mosque", "Ebu Bekr Mosque", 42.0694, 19.5153, "Ebu Bekr Mosque — one of the largest mosques in Albania", ["Ebu Bekr Mosque Shkodër", "largest mosque Albania", "Shkodër Islam"]),
      place("Mes Bridge", "Mes Bridge", 42.1167, 19.5833, "Mes Bridge (Ura e Mesit) — stunning Ottoman stone bridge near Shkodër", ["Mes Bridge Albania", "Ura e Mesit", "Ottoman bridge Shkodër"]),
      place("Shiroka Village", "Shiroka", 42.05, 19.4667, "Shiroka Village — lakeside fishing village with fresh fish restaurants", ["Shiroka Shkodër", "Lake Shkodër restaurants", "Shkodër lakeside"]),
      place("Venice Art Mask Factory", "Venice Art Mask Factory", 42.0697, 19.5142, "Venice Art Mask Factory — unique artisan workshop and gallery in Shkodër", ["Venice Art Mask Factory Shkodër", "Shkodër art gallery", "Albanian crafts"]),
      place("Kir River", "Kir (river)", 42.07, 19.52, "Kir River — scenic river running through Shkodër", ["Kir River Shkodër", "Shkodër walking route", "Shkodër nature"]),
    ],
  },
  {
    city: "Durrës",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Durrës",
    seo: citySeo("Durrës", "Albania", "Roman amphitheatre, Adriatic beaches, and ancient port city"),
    places: [
      place("Durrës Amphitheatre", "Durrës Amphitheatre", 41.3128, 19.4469, "Durrës Amphitheatre — one of the largest Roman amphitheatres in the Balkans", ["Durrës Amphitheatre", "Roman amphitheatre Albania", "Durrës ancient ruins"]),
      place("Venetian Tower", "Venetian Tower (Durrës)", 41.3086, 19.4453, "Venetian Tower — medieval fortification on the Durrës city walls", ["Venetian Tower Durrës", "Durrës city walls", "medieval Durrës"]),
      place("Durrës Castle", "Durrës Castle", 41.3097, 19.4447, "Durrës Castle — Byzantine and Venetian fortress overlooking the Adriatic", ["Durrës Castle", "Kalaja e Durrësit", "Durrës fortress"]),
      place("Archaeological Museum of Durrës", "Archaeological Museum of Durrës", 41.3114, 19.4442, "Archaeological Museum — treasures from Durrës' 2,700-year history", ["Archaeological Museum Durrës", "Durrës museum", "Albania archaeology"]),
      place("Fatih Mosque", "Fatih Mosque", 41.3092, 19.4458, "Fatih Mosque — historic Ottoman mosque in central Durrës", ["Fatih Mosque Durrës", "Durrës mosque", "Ottoman mosque Durrës"]),
      place("Great Basilica of Durrës", "Great Basilica, Durrës", 41.3142, 19.4486, "Great Basilica — early Christian ruins from the Roman era in Durrës", ["Great Basilica Durrës", "early Christian Albania", "Durrës Roman ruins"]),
      place("Durrës Beach", "Durrës", 41.3167, 19.45, "Durrës Beach — long Adriatic coastline popular for summer holidays", ["Durrës Beach", "Adriatic beach Albania", "best beaches Durrës"]),
      place("Royal Villa of Durrës", "Royal Villa of Durrës", 41.3056, 19.4833, "Royal Villa of Durrës — former royal residence on the Adriatic coast", ["Royal Villa Durrës", "Zogu villa", "Durrës history"]),
      place("Aleksandër Moisiu Theatre", "Aleksandër Moisiu Theatre", 41.3103, 19.4436, "Aleksandër Moisiu Theatre — landmark cultural venue in central Durrës", ["Aleksandër Moisiu Theatre", "Durrës theatre", "Durrës culture"]),
      place("Port of Durrës", "Port of Durrës", 41.3153, 19.455, "Port of Durrës — Albania's main Adriatic port and gateway from Italy", ["Port of Durrës", "Durrës ferry", "Italy to Albania ferry"]),
    ],
  },
  {
    city: "Vlorë",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Vlorë",
    seo: citySeo("Vlorë", "Albania", "Independence Monument, Muradie Mosque, and Albanian Riviera gateway"),
    places: [
      place("Independence Monument", "Independence Monument (Albania)", 40.4667, 19.49, "Independence Monument — symbol of Albania's 1912 independence in Vlorë", ["Independence Monument Vlorë", "Albanian independence", "Flag Square Vlorë"]),
      place("Muradie Mosque", "Muradie Mosque", 40.4686, 19.4897, "Muradie Mosque — elegant 16th-century Ottoman mosque in central Vlorë", ["Muradie Mosque Vlorë", "Vlorë mosque", "Ottoman mosque Vlorë"]),
      place("Kuzum Baba", "Kuzum Baba", 40.4556, 19.475, "Kuzum Baba — hilltop Bektashi tekke with panoramic views over Vlorë Bay", ["Kuzum Baba Vlorë", "Vlorë viewpoint", "Bektashi tekke Albania"]),
      place("Zvërnec Monastery", "Zvërnec", 40.5167, 19.4167, "Zvërnec Monastery — 13th-century monastery on an island in Narta Lagoon", ["Zvërnec Monastery", "Narta Lagoon", "Vlorë day trip"]),
      place("Orikum", "Orikum", 40.3333, 19.4667, "Orikum — ancient Illyrian and Roman port town south of Vlorë", ["Orikum Albania", "ancient Orikum", "archaeology near Vlorë"]),
      place("Karaburun Peninsula", "Karaburun Peninsula", 40.3667, 19.4167, "Karaburun Peninsula — wild peninsula with hidden coves and crystal waters", ["Karaburun Peninsula", "Karaburun beach", "Vlorë nature"]),
      place("National Museum of Independence", "Independence Museum (Albania)", 40.4672, 19.4903, "National Museum of Independence — where Albania declared independence in 1912", ["Independence Museum Vlorë", "Albania history museum", "Vlorë museum"]),
      place("Flag Square", "Flag's Square", 40.4669, 19.4906, "Flag Square — central plaza commemorating Albania's independence", ["Flag Square Vlorë", "Sheshi i Flamurit", "Vlorë city center"]),
      place("Radhimë Beach", "Radhimë", 40.3833, 19.4833, "Radhimë Beach — quiet Adriatic beach near Vlorë", ["Radhimë Beach", "beaches near Vlorë", "Adriatic coast Albania"]),
      place("Llogara National Park", "Llogara National Park", 40.2167, 19.5833, "Llogara National Park — mountain pass with dramatic views over the Riviera", ["Llogara Pass", "Llogara National Park", "Vlorë to Riviera drive"]),
    ],
  },
  {
    city: "Krujë",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Krujë",
    seo: citySeo("Krujë", "Albania", "Skanderbeg Castle, national hero museum, and mountain bazaar"),
    places: [
      place("Krujë Castle", "Krujë Castle", 41.5097, 19.7928, "Krujë Castle — legendary fortress of national hero Skanderbeg", ["Krujë Castle", "Kalaja e Krujës", "Skanderbeg Castle"]),
      place("Skanderbeg Museum", "Skanderbeg Museum", 41.5094, 19.7931, "Skanderbeg Museum — dedicated to Albania's national hero inside Krujë Castle", ["Skanderbeg Museum Krujë", "Gjergj Kastrioti museum", "Albania national hero"]),
      place("Old Bazaar of Krujë", "Krujë", 41.5089, 19.7917, "Old Bazaar — traditional craft market at the foot of Krujë Castle", ["Krujë bazaar", "Old Bazaar Krujë", "Albanian crafts Krujë"]),
      place("Ethnographic Museum of Krujë", "Ethnographic Museum of Krujë", 41.5086, 19.7922, "Ethnographic Museum — Ottoman house museum showcasing traditional Albanian life", ["Ethnographic Museum Krujë", "traditional house Krujë", "Krujë museum"]),
      place("Dollma Tekke", "Dollmah Teqe", 41.5103, 19.7944, "Dollma Tekke — historic Bektashi shrine on the slopes of Krujë", ["Dollma Tekke Krujë", "Bektashi shrine", "Krujë religion"]),
      place("Sari Salltik Tekke", "Sarı Saltık", 41.5111, 19.795, "Sari Salltik Tekke — sacred Bektashi site inside Krujë Castle", ["Sari Salltik Tekke", "Sarı Saltık shrine", "Krujë castle tekke"]),
      place("Qafë-Shtama National Park", "Qafë-Shtamë National Park", 41.4833, 19.9167, "Qafë-Shtama National Park — mountain forest park near Krujë", ["Qafë-Shtama", "national park near Krujë", "hiking Krujë"]),
      place("Mount Krujë", "Krujë", 41.5167, 19.8, "Mount Krujë — scenic mountain backdrop to the historic castle town", ["Mount Krujë", "Krujë hiking", "Krujë nature"]),
      place("Shtamë Pass", "Qafë-Shtamë National Park", 41.47, 19.92, "Shtamë Pass — mountain pass with alpine scenery near Krujë", ["Shtamë Pass", "day trip from Krujë", "Albania mountains"]),
      place("Cave of Sari Salltik", "Sarı Saltık", 41.5114, 19.7956, "Cave of Sari Salltik — pilgrimage cave associated with the Bektashi order", ["Cave of Sari Salltik", "Krujë cave", "Bektashi pilgrimage"]),
    ],
  },
  {
    city: "Korçë",
    tags: ["spring", "summer", "autumn", "winter"],
    wiki_title: "Korçë",
    seo: citySeo("Korçë", "Albania", "Resurrection Cathedral, medieval art museum, and Voskopojë churches"),
    places: [
      place("Resurrection Cathedral", "Resurrection Cathedral, Korçë", 40.6186, 20.7814, "Resurrection Cathedral — grand Orthodox cathedral in the heart of Korçë", ["Resurrection Cathedral Korçë", "Korçë cathedral", "Orthodox church Albania"]),
      place("National Museum of Medieval Art", "National Museum of Medieval Art", 40.6178, 20.7797, "National Museum of Medieval Art — finest collection of Albanian Orthodox icons", ["Medieval Art Museum Korçë", "Albanian icons", "Korçë museum"]),
      place("Old Bazaar of Korçë", "Korçë", 40.6183, 20.7803, "Old Bazaar — charming pedestrian street with cafés and traditional shops", ["Korçë bazaar", "Old Bazaar Korçë", "where to eat Korçë"]),
      place("Bratko Museum", "Bratko Museum", 40.6172, 20.7789, "Bratko Museum — collection of Asian art and archaeology in Korçë", ["Bratko Museum Korçë", "Korçë art museum", "Asian art Albania"]),
      place("Mirahori Mosque", "Mirahori Mosque", 40.6194, 20.7822, "Mirahori Mosque — one of the oldest mosques in Albania, built in 1494", ["Mirahori Mosque Korçë", "oldest mosque Albania", "Ottoman mosque Korçë"]),
      place("French Lyceum", "French Lyceum", 40.6167, 20.7778, "French Lyceum — historic school that shaped Korçë's cultural identity", ["French Lyceum Korçë", "Korçë history", "Albanian education history"]),
      place("Voskopojë", "Voskopojë", 40.6333, 20.5833, "Voskopojë — mountain village famous for its historic churches and frescoes", ["Voskopojë churches", "Voskopojë Albania", "day trip from Korçë"]),
      place("Prespa Lake", "Great Prespa Lake", 40.8333, 20.9167, "Prespa Lake — shared lake with North Macedonia and Greece, rich in birdlife", ["Prespa Lake Albania", "Lake Prespa", "nature near Korçë"]),
      place("Dardha Village", "Dardha, Korçë", 40.5833, 20.6833, "Dardha Village — picturesque mountain village known for skiing and nature", ["Dardha Korçë", "skiing Albania", "mountain village Korçë"]),
      place("Gjon Mili Museum", "Gjon Mili", 40.6189, 20.7811, "Gjon Mili Museum — tribute to the renowned Albanian-American photographer", ["Gjon Mili Museum", "Korçë photography", "Albanian photographers"]),
    ],
  },
  {
    city: "Himarë",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Himarë",
    seo: citySeo("Himarë", "Albania", "Albanian Riviera beaches, Porto Palermo Castle, and coastal villages"),
    places: [
      place("Himarë Castle", "Himarë", 40.1014, 19.7447, "Himarë Castle — Venetian-era fortress overlooking the Ionian coast", ["Himarë Castle", "Kalaja e Himarës", "Himarë fortress"]),
      place("Livadhi Beach", "Himarë", 40.0986, 19.7486, "Livadhi Beach — long sandy beach in the heart of Himarë", ["Livadhi Beach Himarë", "Himarë beach", "Albanian Riviera beaches"]),
      place("Potami Beach", "Himarë", 40.095, 19.752, "Potami Beach — popular pebble beach with clear Ionian waters", ["Potami Beach Himarë", "best beaches Himarë", "Ionian coast Albania"]),
      place("Porto Palermo Castle", "Porto Palermo Castle", 40.0667, 19.7833, "Porto Palermo Castle — Ali Pasha's castle on a peninsula near Himarë", ["Porto Palermo Castle", "Ali Pasha castle", "day trip from Himarë"]),
      place("Gjipe Beach", "Gjipe", 40.1333, 19.6667, "Gjipe Beach — secluded beach at the mouth of Gjipe Canyon", ["Gjipe Beach", "Gjipe Canyon", "hidden beach Albania"]),
      place("Qeparo Village", "Qeparó", 40.0667, 19.8167, "Qeparo Village — split hillside village with old and new quarters on the Riviera", ["Qeparo Albania", "Qeparo village", "Albanian Riviera villages"]),
      place("Borsh Castle", "Borsh", 40.05, 19.85, "Borsh Castle — ruined castle above the longest beach on the Ionian coast", ["Borsh Castle", "Borsh beach", "Borsh Albania"]),
      place("Dhërmi Village", "Dhërmi", 40.15, 19.6333, "Dhërmi Village — vibrant Riviera village with beaches and nightlife", ["Dhërmi Albania", "Dhërmi beach", "Albanian Riviera nightlife"]),
      place("Vuno Village", "Vuno", 40.1333, 19.6833, "Vuno Village — traditional stone village perched above the Ionian Sea", ["Vuno Albania", "Vuno village", "Riviera hiking"]),
      place("Jale Beach", "Jale", 40.1167, 19.7167, "Jale Beach — turquoise beach between Himarë and Dhermi on the Riviera", ["Jale Beach Albania", "Jale Riviera", "best Ionian beaches"]),
    ],
  },
];

function advPlace(name, wiki_title, region, lat, lng, day, tags, seo_phrase, seo_keywords) {
  return {
    name,
    wiki_title,
    region,
    lat,
    lng,
    day,
    order_index: day - 1,
    requires_car: true,
    tags,
    seo_phrase,
    seo_keywords,
  };
}

const adventure = {
  title: "Albania Road Trip Adventure",
  subtitle:
    "10-day country-wide road trip through the Albanian Alps, ancient ruins, hidden beaches, and mountain passes — car required.",
  wiki_title: "Albania",
  totalDays: 10,
  seo: {
    title: "Albania Road Trip — 10-Day Adventure Itinerary | Car Travel Guide",
    description:
      "Plan a 10-day Albania road trip: Theth Alps, Valbonë, Koman Lake, Apollonia, Grama Bay, Llogara Pass, and more. GPS stops, hidden gems, car-only routes.",
    intro:
      "Want to explore Albania beyond the cities? This 10-day Adventure route takes you through the country's most spectacular road-trip destinations — from Albanian Alps villages to secret beaches and ancient ruins. Add stops to your cart and navigate each location in Google Maps.",
    keywords: [
      "Albania road trip",
      "Albania adventure itinerary",
      "Albania by car",
      "10 day Albania tour",
      "Albanian Alps road trip",
      "hidden gems Albania",
    ],
  },
  places: [
    advPlace("Theth", "Theth", "Shkodër County", 42.3942, 19.7747, 1, ["nature", "viewpoint"], "Theth — iconic Albanian Alps village and gateway to Accursed Mountains hikes", ["Theth Albania", "Albanian Alps", "Theth hiking"]),
    advPlace("Valbonë Valley", "Valbonë", "Kukës County", 42.4514, 19.8914, 2, ["nature", "hidden_gem"], "Valbonë Valley — stunning alpine valley at the heart of the Accursed Mountains", ["Valbonë Valley", "Valbona Albania", "Albanian Alps trek"]),
    advPlace("Koman Lake Ferry", "Koman Lake", "Kukës County", 42.0961, 20.0714, 3, ["nature", "viewpoint"], "Koman Lake — dramatic ferry ride through fjord-like canyons in northern Albania", ["Koman Lake ferry", "Lake Koman Albania", "northern Albania road trip"]),
    advPlace("Shala River", "Shala (river)", "Shkodër County", 42.0833, 19.8333, 4, ["nature", "hidden_gem"], "Shala River — turquoise hidden river often called the Albanian Thailand", ["Shala River Albania", "Shala hidden gem", "secret beach Albania"]),
    advPlace("Apollonia Archaeological Park", "Apollonia (Illyria)", "Fier County", 40.7236, 19.4719, 5, ["ruins", "monument"], "Apollonia — ancient Greek city where Octavian studied before becoming emperor", ["Apollonia Albania", "Apollonia archaeological park", "ancient ruins Albania"]),
    advPlace("Grama Bay", "Grama Bay", "Vlorë County", 40.1833, 19.5833, 6, ["hidden_gem", "nature"], "Grama Bay — remote Ionian cove with Byzantine monastery inscriptions on cliffs", ["Grama Bay Albania", "secret beach Albania", "Ionian coast hidden gem"]),
    advPlace("Llogara Pass", "Llogara Pass", "Vlorë County", 40.2167, 19.5833, 7, ["viewpoint", "nature"], "Llogara Pass — dramatic mountain pass with panoramic views over the Riviera", ["Llogara Pass", "Llogara viewpoint", "Albanian Riviera drive"]),
    advPlace("Benja Thermal Baths", "Benja Thermal Waters", "Gjirokastër County", 40.2833, 20.2167, 8, ["nature", "hidden_gem"], "Benja Thermal Baths — natural hot springs beside Langarica Canyon", ["Benja thermal baths", "Permet hot springs", "Langarica Canyon"]),
    advPlace("Tomorr Mountain", "Tomorr", "Berat County", 40.6833, 20.1833, 9, ["nature", "viewpoint"], "Tomorr Mountain — sacred mountain with Bektashi shrine and wild landscapes", ["Tomorr Mountain", "Mount Tomorr Albania", "Bektashi shrine Tomorr"]),
    advPlace("Lake Bovilla", "Bovilla", "Tirana County", 41.3833, 19.9167, 10, ["nature", "viewpoint"], "Lake Bovilla — emerald reservoir near Tirana surrounded by karst mountains", ["Lake Bovilla", "Bovilla reservoir", "day trip from Tirana"]),
  ],
};

const seed = {
  version: 1,
  country: "Albania",
  published: true,
  cities,
  adventure,
};

const outPath = join(__dirname, "..", "data", "seeds", "albania.json");
writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");

// Minimal adventure file for runtime (wiki/images resolved on page load)
const advOutDir = join(__dirname, "..", "data", "adventures");
mkdirSync(advOutDir, { recursive: true });
const advCollection = {
  country: "Albania",
  slug: "albania",
  title: adventure.title,
  subtitle: adventure.subtitle,
  heroImage: "",
  wiki_title: adventure.wiki_title,
  totalDays: adventure.totalDays,
  seo: adventure.seo,
  places: adventure.places.map((p, i) => ({
    id: `albania-adv-${i + 1}`,
    name: p.name,
    country: "Albania",
    region: p.region,
    lat: p.lat,
    lng: p.lng,
    image_url: "",
    wiki_title: p.wiki_title,
    requires_car: true,
    tags: p.tags,
    order_index: p.order_index,
    day: p.day,
    translations: {
      en: {
        description: p.seo_phrase,
        wiki_text: p.seo_phrase,
        seo_phrase: p.seo_phrase,
        seo_keywords: p.seo_keywords,
      },
      es: { description: p.seo_phrase, wiki_text: p.seo_phrase, seo_phrase: p.seo_phrase, seo_keywords: p.seo_keywords },
      fr: { description: p.seo_phrase, wiki_text: p.seo_phrase, seo_phrase: p.seo_phrase, seo_keywords: p.seo_keywords },
      de: { description: p.seo_phrase, wiki_text: p.seo_phrase, seo_phrase: p.seo_phrase, seo_keywords: p.seo_keywords },
      it: { description: p.seo_phrase, wiki_text: p.seo_phrase, seo_phrase: p.seo_phrase, seo_keywords: p.seo_keywords },
    },
  })),
};
writeFileSync(join(advOutDir, "albania.json"), JSON.stringify(advCollection, null, 2), "utf8");

const placeCount = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ Generated ${outPath}`);
console.log(`  ${cities.length} cities × 10 places = ${placeCount} landmarks`);
console.log(`  Adventure: ${adventure.places.length} stops × ${adventure.totalDays} days`);
