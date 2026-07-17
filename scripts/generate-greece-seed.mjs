/**
 * Generates data/seeds/greece.json — 10 cities × 10 places = 100 landmarks
 * Run: node scripts/generate-greece-seed.mjs
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

function adv(name, wiki_title, region, lat, lng, day, order_index, tags, seo_phrase, seo_keywords) {
  return {
    name,
    wiki_title,
    region,
    lat,
    lng,
    day,
    order_index,
    requires_car: true,
    tags,
    seo_phrase,
    seo_keywords,
  };
}

const cities = [
  {
    city: "Athens",
    tags: ["spring", "summer", "autumn", "culture", "history"],
    wiki_title: "Athens",
    seo: citySeo("Athens", "Greece", "Acropolis, Parthenon, and Plaka district"),
    places: [
      place("Acropolis of Athens", "Acropolis of Athens", 37.9715, 23.7267, "Acropolis of Athens — UNESCO citadel crowned by the Parthenon", ["Acropolis Athens", "Parthenon Athens", "Acropolis tickets"]),
      place("Parthenon", "Parthenon", 37.9715, 23.7266, "Parthenon — iconic Doric temple dedicated to Athena on the Acropolis", ["Parthenon Greece", "Parthenon Athens", "Acropolis Parthenon"]),
      place("Ancient Agora of Athens", "Ancient Agora of Athens", 37.9750, 23.7225, "Ancient Agora — heart of classical Athenian public life", ["Ancient Agora Athens", "Athens agora", "Stoa of Attalos"]),
      place("Temple of Olympian Zeus", "Temple of Olympian Zeus, Athens", 37.9690, 23.7331, "Temple of Olympian Zeus — colossal ruins of the largest temple in Greece", ["Temple of Olympian Zeus", "Olympieion Athens", "Hadrian's Gate Athens"]),
      place("Plaka", "Plaka", 37.9715, 23.7300, "Plaka — Athens' oldest neighborhood beneath the Acropolis", ["Plaka Athens", "Plaka restaurants", "where to stay Athens"]),
      place("National Archaeological Museum", "National Archaeological Museum, Athens", 37.9890, 23.7320, "National Archaeological Museum — world's finest collection of ancient Greek art", ["National Archaeological Museum Athens", "Athens museum", "Mask of Agamemnon"]),
      place("Monastiraki Square", "Monastiraki", 37.9762, 23.7256, "Monastiraki — vibrant square for flea markets and street food", ["Monastiraki Athens", "Monastiraki flea market", "Athens street food"]),
      place("Mount Lycabettus", "Lycabettus", 37.9819, 23.7430, "Mount Lycabettus — panoramic hilltop views over Athens", ["Lycabettus Athens", "Lycabettus funicular", "Athens viewpoint"]),
      place("Panathenaic Stadium", "Panathenaic Stadium", 37.9683, 23.7411, "Panathenaic Stadium — marble stadium of the first modern Olympics", ["Panathenaic Stadium", "Kallimarmaro Athens", "1896 Olympics stadium"]),
      place("Acropolis Museum", "Acropolis Museum", 37.9685, 23.7284, "Acropolis Museum — modern museum showcasing Parthenon sculptures", ["Acropolis Museum Athens", "Parthenon marbles museum", "Acropolis Museum tickets"]),
    ],
  },
  {
    city: "Santorini",
    tags: ["spring", "summer", "autumn", "beach", "romantic"],
    wiki_title: "Santorini",
    seo: citySeo("Santorini", "Greece", "Oia sunsets, caldera views, and blue-domed churches"),
    places: [
      place("Oia", "Oia, Greece", 36.4618, 25.3753, "Oia — world-famous village for caldera sunsets and blue domes", ["Oia Santorini", "Oia sunset", "blue domes Santorini"]),
      place("Fira", "Fira", 36.4166, 25.4312, "Fira — capital of Santorini perched on the caldera cliff", ["Fira Santorini", "Fira caldera", "Santorini capital"]),
      place("Akrotiri Archaeological Site", "Akrotiri (prehistoric city)", 36.3517, 25.4031, "Akrotiri — Bronze Age Minoan city preserved by volcanic ash", ["Akrotiri Santorini", "Akrotiri ruins", "prehistoric Santorini"]),
      place("Red Beach", "Red Beach (Santorini)", 36.3486, 25.3944, "Red Beach — dramatic volcanic cliffs and crimson sand", ["Red Beach Santorini", "Santorini beaches", "Akrotiri beach"]),
      place("Ancient Thera", "Ancient Thera", 36.3639, 25.4781, "Ancient Thera — Hellenistic ruins on Mesa Vouno mountain", ["Ancient Thera", "Santorini ancient city", "Mesa Vouno"]),
      place("Santo Wines Winery", "Santorini (wine)", 36.3897, 25.4328, "Santo Wines — caldera-view winery tasting Assyrtiko wine", ["Santorini winery", "Assyrtiko wine", "Santo Wines"]),
      place("Amoudi Bay", "Amoudi Bay", 36.4597, 25.3708, "Amoudi Bay — picturesque harbor below Oia for seafood", ["Amoudi Bay Oia", "Santorini seafood", "Oia harbor"]),
      place("Pyrgos Kallistis", "Pyrgos Kallistis", 36.3831, 25.4486, "Pyrgos — medieval hilltop village with panoramic island views", ["Pyrgos Santorini", "Pyrgos village", "Santorini hidden gem"]),
      place("Skaros Rock", "Skaros Rock", 36.4303, 25.4247, "Skaros Rock — iconic rock formation and hiking viewpoint in Imerovigli", ["Skaros Rock Santorini", "Imerovigli hike", "Santorini caldera walk"]),
      place("Perissa Black Sand Beach", "Perissa, Santorini", 36.3536, 25.4731, "Perissa — long black-sand beach at the foot of Mesa Vouno", ["Perissa beach Santorini", "black sand beach Santorini", "Perissa restaurants"]),
    ],
  },
  {
    city: "Mykonos",
    tags: ["summer", "beach", "nightlife", "culture"],
    wiki_title: "Mykonos",
    seo: citySeo("Mykonos", "Greece", "windmills, Little Venice, and Delos day trips"),
    places: [
      place("Mykonos Windmills", "Windmills of Mykonos", 37.4456, 25.3258, "Mykonos Windmills — iconic hillside windmills overlooking the harbor", ["Mykonos windmills", "Kato Mili Mykonos", "Mykonos icons"]),
      place("Little Venice", "Little Venice, Mykonos", 37.4464, 25.3272, "Little Venice — colorful waterfront houses with balconies over the sea", ["Little Venice Mykonos", "Mykonos sunset bars", "Mykonos Town"]),
      place("Paraportiani Church", "Panagia Paraportiani", 37.4469, 25.3264, "Panagia Paraportiani — whitewashed Cycladic church complex", ["Paraportiani Mykonos", "Mykonos churches", "Cycladic architecture"]),
      place("Delos", "Delos", 37.4014, 25.2689, "Delos — sacred UNESCO island birthplace of Apollo and Artemis", ["Delos day trip", "Delos archaeological site", "Delos from Mykonos"]),
      place("Paradise Beach", "Paradise Beach, Mykonos", 37.4100, 25.3589, "Paradise Beach — famous party beach on the south coast", ["Paradise Beach Mykonos", "Mykonos party beach", "Mykonos beaches"]),
      place("Super Paradise Beach", "Super Paradise Beach", 37.4078, 25.3653, "Super Paradise Beach — vibrant beach club scene on Mykonos", ["Super Paradise Mykonos", "Mykonos beach clubs", "Super Paradise beach"]),
      place("Armenistis Lighthouse", "Armenistis Lighthouse", 37.4603, 25.3169, "Armenistis Lighthouse — scenic viewpoint on the island's northern tip", ["Armenistis Lighthouse Mykonos", "Mykonos lighthouse", "Mykonos sunset spot"]),
      place("Ano Mera", "Ano Mera", 37.4419, 25.3914, "Ano Mera — traditional village with Panagia Tourliani monastery", ["Ano Mera Mykonos", "Panagia Tourliani", "Mykonos village"]),
      place("Matoyianni Street", "Mykonos", 37.4467, 25.3278, "Matoyianni Street — chic shopping lane in Mykonos Town", ["Matoyianni Street", "Mykonos shopping", "Mykonos Town walk"]),
      place("Aegean Maritime Museum", "Aegean Maritime Museum", 37.4458, 25.3275, "Aegean Maritime Museum — nautical history of the Cyclades", ["Maritime Museum Mykonos", "Mykonos museum", "Cyclades history"]),
    ],
  },
  {
    city: "Thessaloniki",
    tags: ["spring", "summer", "autumn", "culture", "food"],
    wiki_title: "Thessaloniki",
    seo: citySeo("Thessaloniki", "Greece", "White Tower, Byzantine walls, and Ladadika nightlife"),
    places: [
      place("White Tower of Thessaloniki", "White Tower of Thessaloniki", 40.6264, 22.9484, "White Tower — symbol of Thessaloniki on the waterfront", ["White Tower Thessaloniki", "Thessaloniki landmark", "Thessaloniki waterfront"]),
      place("Rotunda of Galerius", "Rotunda (Thessaloniki)", 40.6328, 22.9525, "Rotunda — Roman mausoleum turned church with stunning mosaics", ["Rotunda Thessaloniki", "Galerius Rotunda", "Thessaloniki mosaics"]),
      place("Arch of Galerius", "Arch of Galerius", 40.6333, 22.9511, "Arch of Galerius — Roman triumphal arch on Egnatia Street", ["Arch of Galerius", "Kamara Thessaloniki", "Roman Thessaloniki"]),
      place("Aristotelous Square", "Aristotelous Square", 40.6322, 22.9408, "Aristotelous Square — grand waterfront plaza in the heart of the city", ["Aristotelous Square", "Thessaloniki center", "Thessaloniki cafes"]),
      place("Ano Poli", "Ano Poli", 40.6411, 22.9569, "Ano Poli — old upper town with Byzantine walls and tavernas", ["Ano Poli Thessaloniki", "Thessaloniki old town", "Byzantine walls Thessaloniki"]),
      place("Church of Saint Demetrius", "Church of Saint Demetrius", 40.6386, 22.9478, "Church of Saint Demetrius — patron saint basilica with catacombs", ["Agios Dimitrios Thessaloniki", "Saint Demetrius church", "Thessaloniki basilica"]),
      place("Ladadika District", "Ladadika", 40.6353, 22.9353, "Ladadika — historic warehouse quarter turned dining and nightlife hub", ["Ladadika Thessaloniki", "Thessaloniki nightlife", "where to eat Thessaloniki"]),
      place("Museum of Byzantine Culture", "Museum of Byzantine Culture", 40.6253, 22.9542, "Museum of Byzantine Culture — world-class Byzantine art collection", ["Byzantine Museum Thessaloniki", "Thessaloniki museum", "Byzantine art Greece"]),
      place("Heptapyrgion", "Heptapyrgion", 40.6431, 22.9586, "Heptapyrgion — Ottoman fortress overlooking Thessaloniki", ["Heptapyrgion Thessaloniki", "Yedi Kule", "Thessaloniki fortress"]),
      place("Modiano Market", "Modiano Market", 40.6347, 22.9419, "Modiano Market — historic covered market for local food and spices", ["Modiano Market Thessaloniki", "Thessaloniki market", "Thessaloniki food tour"]),
    ],
  },
  {
    city: "Heraklion",
    tags: ["spring", "summer", "autumn", "culture", "history"],
    wiki_title: "Heraklion",
    seo: citySeo("Heraklion", "Greece", "Knossos Palace, Venetian harbor, and Crete museums"),
    places: [
      place("Knossos", "Knossos", 35.2980, 25.1631, "Knossos — legendary Minoan palace of King Minos", ["Knossos Palace", "Knossos Crete", "Minoan civilization"]),
      place("Heraklion Archaeological Museum", "Heraklion Archaeological Museum", 35.3392, 25.1372, "Heraklion Archaeological Museum — world's greatest Minoan artifacts collection", ["Heraklion museum", "Minoan museum Crete", "Phaistos Disc museum"]),
      place("Koules Fortress", "Koules Fortress", 35.3447, 25.1369, "Koules Fortress — Venetian fortress guarding Heraklion harbor", ["Koules Fortress Heraklion", "Heraklion harbor", "Venetian Crete"]),
      place("Morosini Fountain", "Morosini Fountain", 35.3386, 25.1331, "Morosini Fountain — iconic Lion Fountain in Heraklion center", ["Lion Fountain Heraklion", "Morosini Lions", "Heraklion square"]),
      place("Historical Museum of Crete", "Historical Museum of Crete", 35.3378, 25.1303, "Historical Museum of Crete — Cretan history from Byzantine to modern era", ["Historical Museum Crete", "Heraklion history museum", "Crete culture"]),
      place("Natural History Museum of Crete", "Natural History Museum of Crete", 35.3361, 25.1286, "Natural History Museum — Crete's flora, fauna, and earthquake simulator", ["Natural History Museum Crete", "Heraklion family museum", "Crete nature"]),
      place("Agios Minas Cathedral", "Agios Minas Cathedral", 35.3397, 25.1347, "Agios Minas Cathedral — largest cathedral in Crete", ["Agios Minas Heraklion", "Heraklion cathedral", "Crete churches"]),
      place("Venetian Loggia", "Loggia (Heraklion)", 35.3389, 25.1336, "Venetian Loggia — Renaissance building in Heraklion's main square", ["Venetian Loggia Heraklion", "Heraklion architecture", "Crete Venetian"]),
      place("Ammoudara Beach", "Ammoudara", 35.3400, 25.0833, "Ammoudara Beach — long sandy beach west of Heraklion", ["Ammoudara beach", "Heraklion beach", "beaches near Heraklion"]),
      place("Cretaquarium", "Cretaquarium", 35.3328, 25.2803, "Cretaquarium — Mediterranean marine life aquarium near Heraklion", ["Cretaquarium Thalassocosmos", "Crete aquarium", "family Heraklion"]),
    ],
  },
  {
    city: "Rhodes",
    tags: ["spring", "summer", "autumn", "beach", "history"],
    wiki_title: "Rhodes (city)",
    seo: citySeo("Rhodes", "Greece", "Medieval Old Town, Palace of Grand Master, and Lindos"),
    places: [
      place("Rhodes Old Town", "Rhodes (city)", 36.4444, 28.2278, "Rhodes Old Town — UNESCO medieval walled city of the Knights", ["Rhodes Old Town", "Medieval Rhodes", "Rhodes UNESCO"]),
      place("Palace of the Grand Master", "Palace of the Grand Master of the Knights of Rhodes", 36.4458, 28.2239, "Palace of the Grand Master — fortress-palace of the Knights of St. John", ["Grand Master Palace Rhodes", "Knights of Rhodes", "Rhodes castle"]),
      place("Street of the Knights", "Street of the Knights", 36.4456, 28.2247, "Street of the Knights — cobbled medieval avenue in Rhodes Old Town", ["Street of the Knights Rhodes", "Ippoton Street", "Rhodes medieval"]),
      place("Lindos Acropolis", "Acropolis of Lindos", 36.0919, 28.0886, "Lindos Acropolis — clifftop ancient citadel above whitewashed Lindos", ["Lindos Acropolis", "Lindos Rhodes", "Lindos beach"]),
      place("Anthony Quinn Bay", "Anthony Quinn Bay", 36.2333, 28.1167, "Anthony Quinn Bay — crystal-clear cove named after the actor", ["Anthony Quinn Bay Rhodes", "secret beach Rhodes", "Faliraki bay"]),
      place("Valley of the Butterflies", "Valley of the Butterflies", 36.2333, 28.0667, "Valley of the Butterflies — shaded gorge filled with tiger moths in summer", ["Butterfly Valley Rhodes", "Petaloudes Rhodes", "Rhodes nature"]),
      place("Ancient Kamiros", "Kamiros", 36.3389, 27.9194, "Ancient Kamiros — well-preserved Hellenistic city on Rhodes west coast", ["Kamiros Rhodes", "ancient Rhodes", "Rhodes archaeological site"]),
      place("Prasonisi", "Prasonisi", 35.8833, 27.7667, "Prasonisi — windsurfing peninsula where two seas meet", ["Prasonisi Rhodes", "Rhodes windsurfing", "Prasonisi beach"]),
      place("Monolithos Castle", "Monolithos Castle", 36.1167, 27.7333, "Monolithos Castle — ruined crusader castle with dramatic sea views", ["Monolithos Rhodes", "Rhodes castle ruins", "Rhodes sunset viewpoint"]),
      place("Mandraki Harbor", "Mandraki", 36.4511, 28.2272, "Mandraki Harbor — historic port with deer statues and windmills", ["Mandraki Rhodes", "Rhodes harbor", "Colossus of Rhodes site"]),
    ],
  },
  {
    city: "Corfu",
    tags: ["spring", "summer", "autumn", "beach", "culture"],
    wiki_title: "Corfu (city)",
    seo: citySeo("Corfu", "Greece", "Old Fortress, Liston promenade, and Achilleion Palace"),
    places: [
      place("Old Fortress of Corfu", "Old Fortress, Corfu", 39.6236, 19.9306, "Old Fortress — Venetian citadel guarding Corfu Town harbor", ["Old Fortress Corfu", "Corfu fortress", "Corfu Town history"]),
      place("Spianada Square", "Spianada Square", 39.6247, 19.9247, "Spianada Square — one of the largest town squares in the Balkans", ["Spianada Corfu", "Corfu main square", "Liston Corfu"]),
      place("Liston Promenade", "Liston (Corfu)", 39.6242, 19.9236, "Liston — elegant French-style arcade cafés on Spianada", ["Liston Corfu", "Corfu cafes", "Corfu Town walk"]),
      place("Achilleion Palace", "Achilleion (Corfu)", 39.5628, 19.9042, "Achilleion Palace — Empress Sisi's neoclassical palace with Achilles statues", ["Achilleion Corfu", "Sisi palace Corfu", "Achilles statue Corfu"]),
      place("Paleokastritsa", "Paleokastritsa", 39.6786, 19.7036, "Paleokastritsa — stunning bay with monasteries and turquoise coves", ["Paleokastritsa Corfu", "best beaches Corfu", "Paleokastritsa monastery"]),
      place("Kanoni and Mouse Island", "Pontikonisi", 39.5833, 19.9167, "Kanoni — iconic viewpoint of Vlacherna Monastery and Mouse Island", ["Kanoni Corfu", "Pontikonisi", "Vlacherna Monastery"]),
      place("Mon Repos Palace", "Mon Repos, Corfu", 39.6000, 19.9167, "Mon Repos — neoclassical palace and birthplace of Prince Philip", ["Mon Repos Corfu", "Corfu palace", "Mon Repos park"]),
      place("Angelokastro", "Angelokastro", 39.6333, 19.7167, "Angelokastro — Byzantine castle on a clifftop with panoramic views", ["Angelokastro Corfu", "Corfu castle hike", "Byzantine fortress Corfu"]),
      place("Sidari Canal d'Amour", "Canal d'Amour", 39.7833, 19.6833, "Canal d'Amour — sandstone rock formations and legend of lovers' canal", ["Canal d'Amour Corfu", "Sidari Corfu", "Corfu north beaches"]),
      place("New Fortress of Corfu", "New Fortress, Corfu", 39.6253, 19.9169, "New Fortress — massive Venetian fortification above Corfu port", ["New Fortress Corfu", "Corfu Venetian fort", "Corfu history"]),
    ],
  },
  {
    city: "Nafplio",
    tags: ["spring", "summer", "autumn", "culture", "romantic"],
    wiki_title: "Nafplio",
    seo: citySeo("Nafplio", "Greece", "Palamidi Fortress, Bourtzi castle, and charming old town"),
    places: [
      place("Palamidi Fortress", "Palamidi (fortress)", 37.5667, 22.8000, "Palamidi Fortress — Venetian fortress with 999 steps and Argolic Gulf views", ["Palamidi Nafplio", "Palamidi fortress", "Nafplio viewpoint"]),
      place("Bourtzi Castle", "Bourtzi (Nafplio)", 37.5686, 22.7936, "Bourtzi — island fortress in Nafplio harbor", ["Bourtzi Nafplio", "Nafplio castle island", "Nafplio harbor"]),
      place("Nafplio Old Town", "Nafplio", 37.5672, 22.8011, "Nafplio Old Town — elegant neoclassical streets and seaside promenade", ["Nafplio old town", "Nafplio walk", "first capital of Greece"]),
      place("Syntagma Square Nafplio", "Syntagma Square, Nafplio", 37.5675, 22.7986, "Syntagma Square — central square with historic buildings and cafés", ["Syntagma Square Nafplio", "Nafplio center", "Nafplio cafes"]),
      place("Archaeological Museum of Nafplio", "Archaeological Museum of Nafplio", 37.5678, 22.7983, "Archaeological Museum — Mycenaean and classical finds from the Argolis", ["Nafplio archaeological museum", "Argolis museum", "Mycenaean artifacts"]),
      place("Akronafplia", "Acronauplia", 37.5656, 22.7947, "Akronafplia — oldest part of Nafplio's fortifications on the rocky peninsula", ["Akronafplia Nafplio", "Acronauplia castle", "Nafplio history"]),
      place("Arvanitia Beach", "Arvanitia", 37.5636, 22.8028, "Arvanitia Beach — pebble beach below the Palamidi cliffs", ["Arvanitia beach Nafplio", "Nafplio beach", "Nafplio swimming"]),
      place("Komboloi Museum", "Komboloi Museum", 37.5678, 22.7997, "Komboloi Museum — unique museum of worry beads in Nafplio", ["Komboloi Museum Nafplio", "worry beads Greece", "Nafplio museum"]),
      place("Church of Agios Spyridon", "Church of Agios Spyridon, Nafplio", 37.5672, 22.7994, "Church of Agios Spyridon — where the first governor of Greece was assassinated", ["Agios Spyridon Nafplio", "Nafplio church", "Kapodistrias assassination"]),
      place("Karathona Beach", "Karathona", 37.5500, 22.8167, "Karathona Beach — sandy crescent south of Nafplio with Palamidi backdrop", ["Karathona beach Nafplio", "best beach Nafplio", "Nafplio day swim"]),
    ],
  },
  {
    city: "Delphi",
    tags: ["spring", "summer", "autumn", "culture", "history"],
    wiki_title: "Delphi",
    seo: citySeo("Delphi", "Greece", "Oracle of Apollo, ancient theater, and Mount Parnassus"),
    places: [
      place("Temple of Apollo", "Temple of Apollo (Delphi)", 38.4822, 22.5006, "Temple of Apollo — sanctuary of the famous Oracle of Delphi", ["Temple of Apollo Delphi", "Oracle of Delphi", "Delphi sanctuary"]),
      place("Delphi Archaeological Museum", "Delphi Archaeological Museum", 38.4803, 22.4936, "Delphi Archaeological Museum — Charioteer of Delphi and oracle treasures", ["Delphi museum", "Charioteer of Delphi", "Delphi artifacts"]),
      place("Ancient Theatre of Delphi", "Theatre of Delphi", 38.4833, 22.5011, "Ancient Theatre of Delphi — hillside theater with valley views", ["Delphi theatre", "Delphi ancient theater", "Delphi ruins"]),
      place("Tholos of Delphi", "Tholos of Delphi", 38.4817, 22.4961, "Tholos of Delphi — circular marble temple in the Athena Pronaia sanctuary", ["Tholos Delphi", "Athena Pronaia", "Delphi circular temple"]),
      place("Stadium of Delphi", "Stadium at Delphi", 38.4856, 22.5028, "Stadium of Delphi — best-preserved ancient stadium in Greece", ["Delphi stadium", "Pythian Games Delphi", "Delphi sports"]),
      place("Castalian Spring", "Castalian Spring", 38.4811, 22.4978, "Castalian Spring — sacred spring where pilgrims purified themselves", ["Castalian Spring Delphi", "Delphi sacred spring", "Delphi mythology"]),
      place("Delphi Town", "Delphi, Greece", 38.4794, 22.4936, "Delphi Town — mountain village gateway to the archaeological site", ["Delphi village", "where to stay Delphi", "Delphi restaurants"]),
      place("Mount Parnassus", "Mount Parnassus", 38.5333, 22.7833, "Mount Parnassus — mythical mountain home of the Muses and winter skiing", ["Mount Parnassus", "Parnassus ski", "Delphi mountain"]),
      place("Treasury of the Athenians", "Treasury of the Athenians", 38.4825, 22.5003, "Treasury of the Athenians — restored marble treasury on the Sacred Way", ["Treasury of Athenians Delphi", "Sacred Way Delphi", "Delphi monuments"]),
      place("Sphinx of Naxos", "Sphinx of Naxos", 38.4828, 22.5000, "Sphinx of Naxos — monumental sphinx pedestal at the Delphi sanctuary", ["Sphinx of Naxos Delphi", "Delphi sculptures", "Naxian offering Delphi"]),
    ],
  },
  {
    city: "Kalambaka",
    tags: ["spring", "summer", "autumn", "culture", "religious"],
    wiki_title: "Kalabaka",
    seo: citySeo("Kalambaka", "Greece", "Meteora monasteries, rock pillars, and sunset viewpoints"),
    places: [
      place("Great Meteoron Monastery", "Monastery of the Great Meteoron", 39.7214, 21.6269, "Great Meteoron — largest and oldest Meteora monastery on a rock pillar", ["Great Meteoron", "Meteora monasteries", "Meteora UNESCO"]),
      place("Varlaam Monastery", "Varlaam Monastery", 39.7197, 21.6311, "Varlaam Monastery — stunning frescoes atop a Meteora rock formation", ["Varlaam Meteora", "Meteora frescoes", "Meteora visit"]),
      place("Roussanou Monastery", "Roussanou Monastery", 39.7156, 21.6344, "Roussanou Monastery — nunnery perched dramatically between two rocks", ["Roussanou Meteora", "Meteora nunnery", "Meteora photography"]),
      place("Holy Trinity Monastery", "Monastery of the Holy Trinity, Meteora", 39.7133, 21.6369, "Holy Trinity Monastery — famous from James Bond film atop a sheer pillar", ["Holy Trinity Meteora", "Meteora James Bond", "Meteora climb"]),
      place("St. Stephen's Monastery", "Monastery of St. Stephen", 39.7103, 21.6411, "St. Stephen's Monastery — most accessible Meteora monastery with valley views", ["St Stephen Meteora", "Meteora easy access", "Meteora sunset"]),
      place("Meteora Geological Formation", "Meteora", 39.7211, 21.6306, "Meteora — UNESCO landscape of towering sandstone rock pillars", ["Meteora rocks", "Meteora Greece", "Meteora hiking"]),
      place("Meteora Panorama Viewpoint", "Meteora", 39.7186, 21.6286, "Meteora Panorama — classic sunset viewpoint over the monasteries", ["Meteora sunset", "Meteora viewpoint", "best photo Meteora"]),
      place("Natural History Museum of Meteora", "Natural History Museum of Meteora and Mushroom Museum", 39.7069, 21.6269, "Natural History Museum — geology and mushrooms of the Meteora region", ["Meteora museum", "Kalambaka museum", "Meteora geology"]),
      place("Kalambaka Town Center", "Kalabaka", 39.7064, 21.6261, "Kalambaka Town — gateway village with tavernas beneath the rocks", ["Kalambaka town", "where to stay Meteora", "Meteora restaurants"]),
      place("Theopetra Cave", "Theopetra cave", 39.6833, 21.6833, "Theopetra Cave — prehistoric cave with 130,000 years of human presence", ["Theopetra cave", "prehistoric Meteora", "Meteora archaeology"]),
    ],
  },
];

const adventure = {
  title: "Greece Road Trip Adventure",
  subtitle:
    "10-day mainland and Peloponnese road trip through monasteries, gorges, ancient sites, and hidden beaches — car required.",
  wiki_title: "Greece",
  totalDays: 10,
  seo: {
    title: "Greece Road Trip — 10-Day Adventure Itinerary | Car Travel Guide",
    description:
      "Plan a 10-day Greece road trip: Meteora, Vikos Gorge, Monemvasia, Mani Peninsula, Elafonisos, and more. GPS stops, hidden gems, car-only routes.",
    intro:
      "Want to explore Greece beyond the islands? This 10-day Adventure route crosses the mainland and Peloponnese — from clifftop monasteries to turquoise lagoons and medieval fortress towns. Add stops to your cart and navigate in Google Maps.",
    keywords: [
      "Greece road trip",
      "Greece adventure itinerary",
      "Greece by car",
      "10 day Greece tour",
      "Peloponnese road trip",
      "hidden gems Greece",
    ],
  },
  places: [
    adv("Meteora Monasteries Route", "Meteora", "Thessaly", 39.7211, 21.6306, 1, 0, ["monument", "viewpoint"], "Meteora — drive the scenic loop between monasteries on rock pillars", ["Meteora road trip", "Meteora drive", "Thessaly Greece"]),
    adv("Vikos Gorge", "Vikos–Aoös National Park", "Epirus", 39.9167, 20.7167, 2, 1, ["nature", "viewpoint"], "Vikos Gorge — one of the deepest gorges in the world in Zagori", ["Vikos Gorge", "Zagori Greece", "Epirus hiking"]),
    adv("Zagorohoria Villages", "Zagori", "Epirus", 39.8833, 20.7500, 3, 2, ["hidden_gem", "nature"], "Zagorohoria — stone-arch bridge villages of Epirus", ["Zagorohoria", "Papingo Greece", "Epirus villages"]),
    adv("Monemvasia", "Monemvasia", "Peloponnese", 36.6883, 23.0550, 4, 3, ["monument", "hidden_gem"], "Monemvasia — medieval fortress town on a rock island in the Aegean", ["Monemvasia Greece", "Monemvasia castle", "Peloponnese hidden gem"]),
    adv("Mani Peninsula", "Mani Peninsula", "Peloponnese", 36.6667, 22.3833, 5, 4, ["nature", "hidden_gem"], "Mani Peninsula — tower houses, wild coast, and Deep Mani villages", ["Mani Peninsula", "Areopoli Greece", "Deep Mani"]),
    adv("Diros Caves", "Diros Cave", "Peloponnese", 36.5667, 22.3833, 6, 5, ["cave", "nature"], "Diros Caves — boat tour through spectacular underground lake caverns", ["Diros Caves", "Diros boat tour", "Mani caves"]),
    adv("Elafonisos Island", "Elafonisos", "Peloponnese", 36.4833, 22.9500, 7, 6, ["nature", "hidden_gem"], "Elafonisos — Simos Beach with Caribbean-blue waters", ["Elafonisos Simos beach", "Elafonisos Greece", "best beach Peloponnese"]),
    adv("Voidokilia Beach", "Voidokilia", "Peloponnese", 36.9633, 21.6633, 8, 7, ["nature", "viewpoint"], "Voidokilia Beach — perfect omega-shaped lagoon near Pylos", ["Voidokilia beach", "Navarino bay", "Messenia beach"]),
    adv("Olympia Archaeological Site", "Olympia, Greece", "Peloponnese", 37.6378, 21.6300, 9, 8, ["ruins", "monument"], "Olympia — birthplace of the Olympic Games in the Peloponnese", ["Ancient Olympia", "Olympia Greece", "Olympic Games origin"]),
    adv("Lake Doxa", "Lake Doxa", "Peloponnese", 37.9833, 22.5667, 10, 9, ["nature", "viewpoint"], "Lake Doxa — mountain lake with chapel island in Corinthia", ["Lake Doxa Greece", "Feneos lake", "Peloponnese day trip"]),
  ],
};

const seed = {
  version: 1,
  country: "Greece",
  published: true,
  cities,
  adventure,
};

const outDir = join(__dirname, "..", "data", "seeds");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "greece.json");
writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");

const places = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ Written ${outPath}`);
console.log(`  ${cities.length} cities, ${places} places, ${adventure.places.length} adventure stops`);
