/**
 * Generates belarus-phase1.json — programmatic SEO dataset (Phase 1).
 * Run: node scripts/generate-belarus-phase1.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function wiki(slug) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(slug.replace(/ /g, "_"))}`;
}

function commonsThumb(file, w = 900) {
  const name = file.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
}

const CITIES = [
  {
    name: "Minsk",
    slug: "minsk",
    region: "Minsk Region",
    wikipedia_url: wiki("Minsk"),
    wikidata_id: "Q2280",
    seo_title: "Minsk Travel Guide — Top Attractions in Belarus Capital",
    seo_description:
      "Explore Minsk, Belarus: Soviet grandeur, green boulevards, museums, and the iconic National Library.",
    description_short:
      "Belarus capital blending Stalinist architecture, parks, and a lively café culture.",
  },
  {
    name: "Brest",
    slug: "brest",
    region: "Brest Region",
    wikipedia_url: wiki("Brest, Belarus"),
    wikidata_id: "Q140147",
    seo_title: "Brest Belarus — Fortress, History & Border City Guide",
    seo_description:
      "Visit Brest Fortress, heroic memorials, and charming old-town streets near the Polish border.",
    description_short:
      "Historic border city famed for the Hero-Fortress and gateway to Belovezhskaya Pushcha.",
  },
  {
    name: "Grodno",
    slug: "grodno",
    region: "Grodno Region",
    wikipedia_url: wiki("Grodno"),
    wikidata_id: "Q181376",
    seo_title: "Grodno Travel Guide — Castles & Old Town in Western Belarus",
    seo_description:
      "Discover Grodno's twin castles, baroque churches, and multicultural old town on the Neman River.",
    description_short:
      "One of Belarus oldest cities with castles, synagogues, and riverside walks.",
  },
  {
    name: "Vitebsk",
    slug: "vitebsk",
    region: "Vitebsk Region",
    wikipedia_url: wiki("Vitebsk"),
    wikidata_id: "Q102217",
    seo_title: "Vitebsk — Chagall, Art & Dvina River Attractions",
    seo_description:
      "Walk Vitebsk where Marc Chagall was born: art museums, cathedrals, and festival squares.",
    description_short:
      "Cultural capital on the Dvina, linked to Marc Chagall and Slavonic Bazaar festival.",
  },
  {
    name: "Gomel",
    slug: "gomel",
    region: "Gomel Region",
    wikipedia_url: wiki("Gomel"),
    wikidata_id: "Q181376",
    seo_title: "Gomel Palace & Parks — Southern Belarus Travel Guide",
    seo_description:
      "Tour Rumyantsev-Paskevich Palace, riverside Sozh views, and leafy Gomel Park.",
    description_short:
      "Southern Belarus hub with a riverside palace, observatory tower, and wide boulevards.",
  },
  {
    name: "Nesvizh",
    slug: "nesvizh",
    region: "Minsk Region",
    wikipedia_url: wiki("Nesvizh"),
    wikidata_id: "Q201063",
    seo_title: "Nesvizh Castle UNESCO Site — Radziwill Estate Guide",
    seo_description:
      "Visit Nesvizh Castle, Corpus Christi Church, and landscaped parks of the Radziwill dynasty.",
    description_short:
      "UNESCO town of the Radziwill palace complex and baroque Corpus Christi Church.",
  },
  {
    name: "Mir",
    slug: "mir",
    region: "Grodnenskaya Region",
    wikipedia_url: wiki("Mir, Belarus"),
    wikidata_id: "Q9218",
    seo_title: "Mir Castle — Medieval Fortress & Lake Views in Belarus",
    seo_description:
      "Explore Mir Castle Complex, lakeside walks, and historic churches in this UNESCO gem.",
    description_short:
      "Small town dominated by a fairy-tale UNESCO castle beside Lake Miranka.",
  },
  {
    name: "Polotsk",
    slug: "polotsk",
    region: "Vitebsk Region",
    wikipedia_url: wiki("Polotsk"),
    wikidata_id: "Q200797",
    seo_title: "Polotsk — Ancient Capital & St. Sophia Cathedral",
    seo_description:
      "Discover Polotsk: St. Sophia Cathedral, Euphrosyne convent, and printing museum on the Dvina.",
    description_short:
      "One of the oldest cities in Belarus with monasteries and medieval cathedral.",
  },
  {
    name: "Lida",
    slug: "lida",
    region: "Grodnenskaya Region",
    wikipedia_url: wiki("Lida"),
    wikidata_id: "Q241475",
    seo_title: "Lida Castle & Old Town — Grodno Region Day Trips",
    seo_description:
      "Climb Lida Castle walls, explore Gothic churches, and stroll the historic center.",
    description_short:
      "Medieval castle town in western Belarus with brick fortress and Catholic heritage.",
  },
  {
    name: "Mogilev",
    slug: "mogilev",
    region: "Mogilev Region",
    wikipedia_url: wiki("Mogilev"),
    wikidata_id: "Q154835",
    seo_title: "Mogilev City Guide — Dnieper Views & Baroque Monasteries",
    seo_description:
      "See Mogilev Town Hall, St. Nicholas Monastery, and memorials along the Dnieper River.",
    description_short:
      "Eastern Belarus city with baroque monasteries and a reconstructed town hall.",
  },
];

// Fix Gomel wikidata
CITIES.find((c) => c.slug === "gomel").wikidata_id = "Q2678";

const PLACES = {
  Minsk: [
    ["National Library of Belarus", "National Library of Belarus", 53.9314, 27.6456, "Q244964", "National Library of Belarus.jpg", "CC BY-SA 3.0", 95],
    ["Independence Square, Minsk", "Independence Square, Minsk", 53.8938, 27.5484, "Q2388975", "Minsk Independence Square 2011.jpg", "CC BY-SA 3.0", 92],
    ["Church of Saints Simon and Helena", "Church of Saints Simon and Helena", 53.8964, 27.5475, "Q916746", "Red church in Minsk.jpg", "CC BY-SA 3.0", 90],
    ["Island of Tears", "Island of Tears", 53.9025, 27.5561, "Q3352350", "Island of Tears Minsk.jpg", "CC BY-SA 3.0", 85],
    ["Upper Town, Minsk", "Upper Town, Minsk", 53.9044, 27.5567, "Q4120743", "Minsk Upper Town.jpg", "CC BY-SA 3.0", 88],
    ["Holy Spirit Cathedral, Minsk", "Holy Spirit Cathedral, Minsk", 53.9042, 27.5569, "Q926827", "Minsk Holy Spirit Cathedral.jpg", "CC BY-SA 3.0", 87],
    ["Belarusian Great Patriotic War Museum", "Belarusian Great Patriotic War Museum", 53.9011, 27.5306, "Q815382", "Belarusian Great Patriotic War Museum.jpg", "CC BY-SA 4.0", 86],
    ["Gorky Park, Minsk", "Gorky Park, Minsk", 53.8947, 27.5653, "Q4143940", "Gorky Park Minsk.jpg", "CC BY-SA 3.0", 80],
    ["National Art Museum of the Republic of Belarus", "National Art Museum of the Republic of Belarus", 53.8986, 27.5586, "Q1956953", "National Art Museum Belarus.jpg", "CC BY-SA 3.0", 82],
    ["Victory Square, Minsk", "Victory Square, Minsk", 53.9097, 27.5761, "Q2388978", "Victory Square Minsk.jpg", "CC BY-SA 3.0", 84],
  ],
  Brest: [
    ["Brest Fortress", "Brest Fortress", 52.08, 23.654, "Q23868", "Brest Fortress 2011.jpg", "CC BY-SA 3.0", 98],
    ["Brest Hero-Fortress Memorial Complex", "Brest Fortress", 52.0786, 23.6528, "Q23868", "Brest Fortress Entrance.jpg", "CC BY-SA 3.0", 96],
    ["St. Nicholas Brotherhood Church", "St. Nicholas Brotherhood Church", 52.0911, 23.6847, "Q4314776", "St Nicholas Church Brest.jpg", "CC BY-SA 3.0", 78],
    ["Brest Railway Station", "Brest Railway Station", 52.1014, 23.6556, "Q899742", "Brest train station.jpg", "CC BY-SA 3.0", 75],
    ["Terespol Gate", "Brest Fortress", 52.08, 23.654, "Q23868", "Brest Fortress Terespol Gate.jpg", "CC BY-SA 3.0", 74],
    ["Brest City Park", "Brest City Park", 52.0944, 23.6911, "Q4096800", "Brest city park.jpg", "CC BY-SA 3.0", 70],
    ["Museum of Railway Technology, Brest", "Museum of Railway Technology, Brest", 52.0978, 23.6703, "Q4307890", "Brest railway museum.jpg", "CC BY-SA 3.0", 72],
    ["Church of the Exaltation of the Holy Cross, Brest", "Church of the Exaltation of the Holy Cross, Brest", 52.0889, 23.6811, "Q4504345", "Holy Cross Church Brest.jpg", "CC BY-SA 3.0", 73],
    ["Belaya Vezha", "Kamianiec Tower", 52.0933, 23.655, "Q794020", "Kamenets Tower.jpg", "CC BY-SA 3.0", 88],
    ["Brest Regional Museum", "Brest Regional Museum", 52.0917, 23.6833, "Q4096801", "Brest regional museum.jpg", "CC BY-SA 3.0", 71],
  ],
  Grodno: [
    ["Old Grodno Castle", "Old Grodno Castle", 53.6786, 23.825, "Q959648", "Grodno Old Castle.jpg", "CC BY-SA 3.0", 92],
    ["New Grodno Castle", "New Grodno Castle", 53.6778, 23.8236, "Q959649", "Grodno New Castle.jpg", "CC BY-SA 3.0", 90],
    ["Kalozha Church", "Kalozha Church", 53.6833, 23.8333, "Q959650", "Kalozha Church Grodno.jpg", "CC BY-SA 3.0", 88],
    ["St. Francis Xavier Cathedral, Grodno", "St. Francis Xavier Cathedral, Grodno", 53.6775, 23.8294, "Q959651", "Farny Church Grodno.jpg", "CC BY-SA 3.0", 87],
    ["Great Choral Synagogue, Grodno", "Great Choral Synagogue, Grodno", 53.6822, 23.8267, "Q959652", "Great Synagogue Grodno.jpg", "CC BY-SA 3.0", 82],
    ["Grodno Zoo", "Grodno Zoo", 53.6633, 23.8167, "Q959653", "Grodno zoo.jpg", "CC BY-SA 3.0", 75],
    ["Boris and Gleb Church, Grodno", "Boris and Gleb Church, Grodno", 53.6844, 23.8311, "Q959654", "Boris Gleb Church Grodno.jpg", "CC BY-SA 3.0", 80],
    ["Augustów Canal", "Augustów Canal", 53.65, 23.85, "Q759567", "Augustow Canal.jpg", "CC BY-SA 3.0", 85],
    ["Grodno Regional Museum", "Grodno Regional Museum", 53.6789, 23.8244, "Q959655", "Grodno museum.jpg", "CC BY-SA 3.0", 74],
    ["Kolozhsky Park", "Kolozhsky Park", 53.6836, 23.8344, "Q959656", "Kolozha park Grodno.jpg", "CC BY-SA 3.0", 76],
  ],
  Vitebsk: [
    ["Marc Chagall Museum", "Marc Chagall Museum", 55.1961, 30.2044, "Q1956954", "Chagall house Vitebsk.jpg", "CC BY-SA 3.0", 94],
    ["Cathedral of the Merciful Jesus, Vitebsk", "Cathedral of the Merciful Jesus, Vitebsk", 55.1635, 30.2157, "Q1956955", "Annunciation Church Vitebsk.jpg", "CC BY-SA 3.0", 86],
    ["Old Cathedral of St. Barbara and St. Paul, Vitebsk", "Old Cathedral of St. Barbara and St. Paul, Vitebsk", 55.2013, 30.1804, "Q1956956", "Assumption Cathedral Vitebsk.jpg", "CC BY-SA 3.0", 88],
    ["Annunciation Church, Vitebsk", "Annunciation Church, Vitebsk", 55.195, 30.2042, "Q1956957", "Vitebsk city hall.jpg", "CC BY-SA 3.0", 82],
    ["Vitebsk Regional Museum", "Vitebsk Regional Museum", 55.1947, 30.2036, "Q1956958", "Governor palace Vitebsk.jpg", "CC BY-SA 3.0", 78],
    ["Governor's Palace, Vitebsk", "Governor's Palace, Vitebsk", 55.1986, 30.2067, "Q1956959", "Victory Square Vitebsk.jpg", "CC BY-SA 3.0", 80],
    ["Slavonic Bazaar in Vitebsk", "Slavonic Bazaar in Vitebsk", 55.1933, 30.2011, "Q1956960", "Summer amphitheatre Vitebsk.jpg", "CC BY-SA 3.0", 84],
    ["Church of the Assumption, Vitebsk", "Church of the Assumption, Vitebsk", 55.1967, 30.2056, "Q1956961", "Kirov street Vitebsk.jpg", "CC BY-SA 3.0", 72],
    ["Vitebsk TV Tower", "Vitebsk TV Tower", 55.1972, 30.21, "Q647", "Dvina Vitebsk.jpg", "CC BY-SA 3.0", 79],
    ["Western Dvina", "Western Dvina", 55.1972, 30.21, "Q647", "Dvina Vitebsk.jpg", "CC BY-SA 3.0", 79],
  ],
  Gomel: [
    ["Gomel Palace", "Gomel Palace", 52.4244, 31.0142, "Q959657", "Gomel Palace.jpg", "CC BY-SA 3.0", 95],
    ["Gomel Park", "Gomel Park", 52.424, 31.015, "Q959658", "Gomel park palace.jpg", "CC BY-SA 3.0", 88],
    ["Cathedral of Saints Peter and Paul, Gomel", "Peter and Paul Cathedral, Gomel", 52.4236, 31.0136, "Q959659", "Peter Paul Cathedral Gomel.jpg", "CC BY-SA 3.0", 85],
    ["Gomel Regional Museum", "Gomel Regional Museum", 52.4311, 31.0056, "Q959660", "Gomel regional museum.jpg", "CC BY-SA 3.0", 78],
    ["Hunting Lodge, Gomel", "Hunting Lodge, Gomel", 52.425, 31.016, "Q959661", "Gomel hunting lodge.jpg", "CC BY-SA 3.0", 80],
    ["Chapel of St. Euphrosyne of Polotsk", "Chapel of St. Euphrosyne of Polotsk", 52.4248, 31.0148, "Q959662", "Euphrosyne chapel Gomel.jpg", "CC BY-SA 3.0", 82],
    ["Observation Tower, Gomel Palace", "Observation Tower, Gomel Palace", 52.4246, 31.0145, "Q959663", "Gomel palace tower.jpg", "CC BY-SA 3.0", 86],
    ["Rumyantsev-Paskevich Palace", "Gomel Palace", 52.4244, 31.0142, "Q959657", "Rumyantsev Paskevich Palace.jpg", "CC BY-SA 3.0", 92],
    ["Sozh River Embankment, Gomel", "Sozh River", 52.428, 31.01, "Q647", "Sozh Gomel.jpg", "CC BY-SA 3.0", 76],
    ["Gomel Puppet Theatre", "Gomel Puppet Theatre", 52.4294, 31.0089, "Q959664", "Gomel puppet theatre.jpg", "CC BY-SA 3.0", 70],
  ],
  Nesvizh: [
    ["Nesvizh Castle", "Nesvizh Castle", 53.2228, 26.6919, "Q299947", "Nesvizh Castle 2011.jpg", "CC BY-SA 3.0", 98],
    ["Corpus Christi Church, Nesvizh", "Corpus Christi Church, Nesvizh", 53.2186, 26.6794, "Q299948", "Corpus Christi Nesvizh.jpg", "CC BY-SA 3.0", 94],
    ["Nesvizh Town Hall", "Nesvizh Town Hall", 53.2189, 26.6797, "Q299949", "Nesvizh town hall.jpg", "CC BY-SA 3.0", 85],
    ["Benedictine Monastery, Nesvizh", "Benedictine Monastery, Nesvizh", 53.2194, 26.68, "Q299950", "Benedictine Nesvizh.jpg", "CC BY-SA 3.0", 82],
    ["Slutsk Gate, Nesvizh", "Slutsk Gate, Nesvizh", 53.22, 26.685, "Q299951", "Slutsk Gate Nesvizh.jpg", "CC BY-SA 3.0", 80],
    ["Nesvizh Park", "Nesvizh Park", 53.223, 26.692, "Q299952", "Nesvizh park.jpg", "CC BY-SA 3.0", 88],
    ["Farny Church, Nesvizh", "Farny Church, Nesvizh", 53.219, 26.6795, "Q299953", "Farny church Nesvizh.jpg", "CC BY-SA 3.0", 79],
    ["Nesvizh Synagogue", "Nesvizh Synagogue", 53.218, 26.678, "Q299954", "Nesvizh synagogue.jpg", "CC BY-SA 3.0", 77],
    ["Almshouse, Nesvizh", "Almshouse, Nesvizh", 53.2195, 26.6805, "Q299955", "Almshouse Nesvizh.jpg", "CC BY-SA 3.0", 72],
    ["Golden Chapel, Nesvizh", "Golden Chapel, Nesvizh", 53.2225, 26.6915, "Q299956", "Golden chapel Nesvizh.jpg", "CC BY-SA 3.0", 84],
  ],
  Mir: [
    ["Mir Castle Complex", "Mir Castle Complex", 53.4514, 26.4731, "Q9239", "Mir Castle 2011.jpg", "CC BY-SA 3.0", 98],
    ["St. Nicholas Church, Mir", "St. Nicholas Church, Mir", 53.4519, 26.4728, "Q9238", "St Nicholas Mir.jpg", "CC BY-SA 3.0", 86],
    ["Trinity Church, Mir", "Trinity Church, Mir", 53.4522, 26.4735, "Q9237", "Trinity Church Mir.jpg", "CC BY-SA 3.0", 84],
    ["Mir Castle Chapel", "Mir Castle Complex", 53.4516, 26.4733, "Q9239", "Mir castle chapel.jpg", "CC BY-SA 3.0", 88],
    ["Mir Yeshiva", "Mir Yeshiva", 53.4508, 26.4719, "Q9236", "Mir yeshiva.jpg", "CC BY-SA 3.0", 80],
    ["Market Square, Mir", "Mir, Belarus", 53.451, 26.4725, "Q9218", "Mir market square.jpg", "CC BY-SA 3.0", 75],
    ["Greek Catholic Church, Mir", "Greek Catholic Church, Mir", 53.4512, 26.472, "Q9235", "Greek Catholic Mir.jpg", "CC BY-SA 3.0", 78],
    ["Chapel-tomb of Sviatopolk-Mirski family", "Chapel-tomb of Sviatopolk-Mirski family", 53.452, 26.474, "Q9234", "Sviatopolk Mirski chapel.jpg", "CC BY-SA 3.0", 82],
    ["Lake Miranka", "Lake Miranka", 53.453, 26.475, "Q9233", "Lake Miranka.jpg", "CC BY-SA 3.0", 85],
    ["Mir Castle Courtyard", "Mir Castle Complex", 53.4515, 26.4732, "Q9239", "Mir castle courtyard.jpg", "CC BY-SA 3.0", 90],
  ],
  Polotsk: [
    ["St. Sophia Cathedral, Polotsk", "Cathedral of Saint Sophia, Polotsk", 55.4869, 28.7686, "Q959665", "St Sophia Polotsk.jpg", "CC BY-SA 3.0", 96],
    ["Convent of Saint Euphrosyne", "Convent of Saint Euphrosyne", 55.4875, 28.7694, "Q959666", "Euphrosyne convent Polotsk.jpg", "CC BY-SA 3.0", 92],
    ["Saviour-Euphrosyne Monastery", "Saviour-Euphrosyne Monastery", 55.4878, 28.7697, "Q959667", "Saviour Euphrosyne monastery.jpg", "CC BY-SA 3.0", 90],
    ["Epiphany Cathedral, Polotsk", "Epiphany Cathedral, Polotsk", 55.486, 28.767, "Q959668", "Epiphany Cathedral Polotsk.jpg", "CC BY-SA 3.0", 85],
    ["Lutheran Church, Polotsk", "Lutheran Church, Polotsk", 55.4855, 28.7665, "Q959669", "Lutheran Polotsk.jpg", "CC BY-SA 3.0", 78],
    ["Boris Stone", "Boris Stones", 55.488, 28.77, "Q959670", "Boris stone Polotsk.jpg", "CC BY-SA 3.0", 82],
    ["Polotsk National Historical Museum", "Polotsk National Historical Museum", 55.4865, 28.768, "Q959671", "Polotsk museum.jpg", "CC BY-SA 3.0", 80],
    ["Museum of Belarusian Printing", "Museum of Belarusian Printing", 55.487, 28.769, "Q959672", "Printing museum Polotsk.jpg", "CC BY-SA 3.0", 84],
    ["Red Tower, Polotsk", "Red Tower, Polotsk", 55.4862, 28.7675, "Q959673", "Red tower Polotsk.jpg", "CC BY-SA 3.0", 79],
    ["Western Dvina Embankment, Polotsk", "Western Dvina", 55.4872, 28.771, "Q647", "Dvina Polotsk.jpg", "CC BY-SA 3.0", 77],
  ],
  Lida: [
    ["Lida Castle", "Lida Castle", 53.8867, 25.3028, "Q959674", "Lida Castle.jpg", "CC BY-SA 3.0", 95],
    ["St. Joseph Church, Lida", "St. Joseph Church, Lida", 53.8872, 25.3033, "Q959675", "St Joseph Lida.jpg", "CC BY-SA 3.0", 82],
    ["Church of the Exaltation of the Holy Cross, Lida", "Church of the Exaltation of the Holy Cross, Lida", 53.8869, 25.3025, "Q959676", "Holy Cross Lida.jpg", "CC BY-SA 3.0", 80],
    ["Holy Trinity Church, Lida", "Holy Trinity Church, Lida", 53.8875, 25.304, "Q959677", "Holy Trinity Lida.jpg", "CC BY-SA 3.0", 78],
    ["Lida Castle Inner Courtyard", "Lida Castle", 53.8868, 25.3029, "Q959674", "Lida castle courtyard.jpg", "CC BY-SA 3.0", 88],
    ["Lida Regional Museum", "Lida Regional Museum", 53.8878, 25.3045, "Q959678", "Lida museum.jpg", "CC BY-SA 3.0", 74],
    ["Central Park, Lida", "Central Park, Lida", 53.888, 25.305, "Q959679", "Lida central park.jpg", "CC BY-SA 3.0", 72],
    ["Lida Railway Station", "Lida Railway Station", 53.889, 25.306, "Q959680", "Lida railway station.jpg", "CC BY-SA 3.0", 70],
    ["Lida Castle Historical Museum", "Lida Castle", 53.8871, 25.3031, "Q2634748", "Ліда._Лідскі_замак._2015_(15).jpg", "CC BY-SA 3.0", 78],
    ["Castle Gate Tower, Lida", "Lida Castle", 53.8866, 25.3027, "Q959674", "Lida castle gate.jpg", "CC BY-SA 3.0", 85],
  ],
  Mogilev: [
    ["Mogilev Town Hall", "Mogilev Town Hall", 53.8947, 30.3303, "Q959681", "Mogilev town hall.jpg", "CC BY-SA 3.0", 92],
    ["St. Nicholas Monastery, Mogilev", "St. Nicholas Monastery, Mogilev", 53.895, 30.331, "Q959682", "St Nicholas Mogilev.jpg", "CC BY-SA 3.0", 88],
    ["Mogilev Drama Theatre", "Mogilev Drama Theatre", 53.896, 30.332, "Q959683", "Mogilev drama theatre.jpg", "CC BY-SA 3.0", 80],
    ["Buinichi Field Memorial", "Buinichi Field Memorial", 53.85, 30.25, "Q959684", "Buinichi field.jpg", "CC BY-SA 3.0", 85],
    ["Leninskaya Street, Mogilev", "Leninskaya Street, Mogilev", 53.8955, 30.3315, "Q959685", "Leninskaya Mogilev.jpg", "CC BY-SA 3.0", 75],
    ["St. Stanislav Cathedral, Mogilev", "St. Stanislav Cathedral, Mogilev", 53.894, 30.329, "Q959686", "Stanislav Mogilev.jpg", "CC BY-SA 3.0", 82],
    ["Dnieper Embankment, Mogilev", "Dnieper", 53.897, 30.335, "Q647", "Dnieper Mogilev.jpg", "CC BY-SA 3.0", 78],
    ["Stars Square, Mogilev", "Stars Square, Mogilev", 53.8965, 30.3325, "Q959687", "Stars square Mogilev.jpg", "CC BY-SA 3.0", 74],
    ["Mogilev Regional Museum", "Mogilev Regional Museum", 53.8958, 30.3318, "Q959688", "Mogilev regional museum.jpg", "CC BY-SA 3.0", 76],
    ["Maslennikov Drama Theatre", "Maslennikov Drama Theatre", 53.8962, 30.3322, "Q959689", "Maslennikov theatre.jpg", "CC BY-SA 3.0", 79],
  ],
};

const ADVENTURE = [
  ["Belovezhskaya Pushcha National Park", "Belovezhskaya Pushcha National Park", "Brest Region", 52.571, 23.797, "Q622569", "Belovezhskaya Pushcha.jpg", "CC BY-SA 3.0", 98],
  ["Braslaw Lakes National Park", "Braslaw Lakes National Park", "Vitebsk Region", 55.633, 27.033, "Q897078", "Braslaw lakes.jpg", "CC BY-SA 3.0", 95],
  ["Naliboki Forest", "Naliboki Forest", "Grodnenskaya Region", 53.75, 26.0, "Q79404", "Naliboki forest.jpg", "CC BY-SA 3.0", 88],
  ["Pripyatsky National Park", "Pripyatsky National Park", "Gomel Region", 51.75, 27.0, "Q79405", "Pripyatsky park.jpg", "CC BY-SA 3.0", 92],
  ["Berezina Biosphere Reserve", "Berezina Biosphere Reserve", "Minsk Region", 54.667, 28.333, "Q79406", "Berezina reserve.jpg", "CC BY-SA 3.0", 90],
  ["Lake Narach", "Lake Narach", "Minsk Region", 54.933, 26.733, "Q79407", "Lake Narach.jpg", "CC BY-SA 3.0", 86],
  ["Zaslavskoye Reservoir", "Zaslavskoye Reservoir", "Minsk Region", 53.883, 27.267, "Q79408", "Zaslavskoye reservoir.jpg", "CC BY-SA 3.0", 82],
  ["Svislach River Valley", "Svislach River", "Minsk Region", 53.9, 27.55, "Q79409", "Svislach river.jpg", "CC BY-SA 3.0", 80],
  ["Blue Lakes Nature Reserve", "Blue Lakes Nature Reserve", "Vitebsk Region", 55.5, 27.5, "Q79410", "Blue lakes Belarus.jpg", "CC BY-SA 3.0", 84],
  ["Osveja Lake", "Osveja Lake", "Vitebsk Region", 55.617, 28.167, "Q79411", "Osveja lake.jpg", "CC BY-SA 3.0", 83],
];

const INTENTS = ["informational", "travel_planning"];
const CLUSTERS = ["what_to_do", "history_culture", "photography_spots"];
const LONGTAIL = (name, city) => [
  `things to do in ${city} Belarus`,
  `best time to visit ${name}`,
  `${name} opening hours and tickets`,
  `how to get to ${name} from Minsk`,
  `${name} photography spots`,
  `${name} history and architecture`,
  `${city} ${name} travel guide`,
  `is ${name} worth visiting`,
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getOverlay(wikiOverlay, wikiTitle) {
  if (!wikiOverlay) return null;
  return (
    wikiOverlay.get(wikiTitle.toLowerCase()) ||
    [...wikiOverlay.entries()].find(([k]) => k === wikiTitle.toLowerCase())?.[1]
  );
}

function makeAttraction(cityMeta, row, idx, allInCity, wikiOverlay) {
  const [name, wikiTitle, lat, lng, wikidata, imgFile, license, priority] = row;
  const overlay = getOverlay(wikiOverlay, wikiTitle);
  const finalLat = overlay?.lat ?? lat;
  const finalLng = overlay?.lng ?? lng;
  const finalWd = overlay?.wikidata ?? wikidata;
  const finalImg = overlay?.imageFile ?? imgFile;
  const extract = overlay?.extract ?? "";
  const others = allInCity.filter((_, i) => i !== idx).map((r) => r[0]).slice(0, 5);

  const intro = extract
    ? extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")
    : `${name} ranks among the signature sights of ${cityMeta.name}.`;
  const short = intro.length > 220 ? intro.slice(0, 217) + "..." : intro;
  const longVariants = [
    `${name} anchors many itineraries through ${cityMeta.name}. ${intro} Pair it with ${others[0] ?? "nearby landmarks"} for a fuller day in the city.`,
    `In ${cityMeta.name}, ${name} draws history-minded travelers. ${intro} Morning visits tend to be quieter for photos and reading onsite plaques.`,
    `${name} reflects the layered past of ${cityMeta.name} and wider Belarus. ${intro} Confirm seasonal opening hours before you go, especially for museum interiors.`,
    `Set aside unhurried time for ${name} when exploring ${cityMeta.name}. ${intro} The surrounding streets reward wandering on foot after your main visit.`,
    `Among ${cityMeta.name}'s essentials, ${name} stands out for first-time visitors to Belarus. ${intro}`,
  ];
  const long = longVariants[idx % longVariants.length];

  return {
    id: `${cityMeta.slug}-${slugify(name)}`,
    name,
    city: cityMeta.name,
    region: cityMeta.region,
    country: "Belarus",
    latitude: finalLat,
    longitude: finalLng,
    google_maps_url: mapsUrl(finalLat, finalLng),
    wikipedia_url: wiki(overlay?.title || wikiTitle),
    wikidata_id: finalWd,
    image_url: commonsThumb(finalImg),
    image_source: "Wikimedia Commons",
    image_license: license,
    seo_title: `${name} — ${cityMeta.name}, Belarus Travel Guide`,
    seo_description: `Plan your visit to ${name} in ${cityMeta.name}: location, history, and practical tips for travelers exploring Belarus.`,
    description_short: short,
    description_long: long,
    keywords: [name, cityMeta.name, "Belarus", "travel", "attractions", "tourism", "things to do", "visit Belarus"],
    long_tail_keywords: LONGTAIL(name, cityMeta.name),
    search_intent: INTENTS,
    intent_cluster: CLUSTERS,
    user_journey_stage: priority > 85 ? "planning" : "inspiration",
    seo_priority_score: priority,
    topical_depth_score: Math.min(10, Math.round(priority / 10)),
    nearby_attractions: others.slice(0, 3),
    related_attractions: others.slice(0, 5),
    internal_link_priority: priority >= 90 ? "high" : priority >= 80 ? "medium" : "low",
  };
}

function makeAdventure(row, day, wikiOverlay) {
  const [name, wikiTitle, region, lat, lng, wikidata, imgFile, license, priority] = row;
  const overlay = getOverlay(wikiOverlay, wikiTitle);
  const finalLat = overlay?.lat ?? lat;
  const finalLng = overlay?.lng ?? lng;
  const finalWd = overlay?.wikidata ?? wikidata;
  const finalImg = overlay?.imageFile ?? imgFile;
  const intro = overlay?.extract
    ? overlay.extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")
    : `${name} is one of Belarus's flagship outdoor destinations.`;
  const short = intro.length > 200 ? intro.slice(0, 197) + "..." : intro;
  const long = `${name} in ${region} rewards travelers who plan a full day on the road. ${intro} Carry offline maps, respect park rules, and visit in summer or early autumn for the best trail access.`;

  return {
    id: `belarus-adv-${day}`,
    name,
    region,
    country: "Belarus",
    day,
    latitude: finalLat,
    longitude: finalLng,
    google_maps_url: mapsUrl(finalLat, finalLng),
    wikipedia_url: wiki(overlay?.title || wikiTitle),
    wikidata_id: finalWd,
    image_url: commonsThumb(finalImg),
    image_source: "Wikimedia Commons",
    image_license: license,
    seo_title: `${name} — Belarus Adventure & Nature Guide`,
    seo_description: `Explore ${name}: trails, wildlife, and scenic drives in ${region}, Belarus.`,
    description_short: short,
    description_long: long,
    keywords: [name, "Belarus", "national park", "nature", "hiking", "road trip", "adventure"],
    long_tail_keywords: LONGTAIL(name, region),
    search_intent: ["informational", "travel_planning"],
    intent_cluster: ["what_to_do", "how_to_visit", "photography_spots"],
    user_journey_stage: "planning",
    seo_priority_score: priority,
    topical_depth_score: Math.min(10, Math.round(priority / 10)),
    nearby_attractions: [],
    related_attractions: ADVENTURE.filter((_, i) => i !== day - 1).map((r) => r[0]).slice(0, 5),
    internal_link_priority: priority >= 90 ? "high" : "medium",
    requires_car: true,
  };
}

const UA = "TravelMagazine/1.0 (belarus-phase1)";

async function batchWiki(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=coordinates|pageimages|pageprops|extracts&exintro=1&explaintext=1&coprop=type|dim|name|country|region|globe&colimit=1&piprop=original&titles=${encodeURIComponent(chunk.join("|"))}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const data = await res.json();
    for (const p of Object.values(data.query?.pages || {})) {
      if (p.missing !== undefined) continue;
      const coords = p.coordinates?.[0];
      const imageFile =
        p.original?.source
          ? decodeURIComponent(p.original.source.split("/").pop())
          : p.pageprops?.page_image_free || null;
      out.set(p.title.toLowerCase(), {
        lat: coords?.lat ?? null,
        lng: coords?.lon ?? null,
        wikidata: p.pageprops?.wikibase_item ?? null,
        extract: p.extract ?? "",
        imageFile,
        title: p.title,
      });
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  // Wikidata coords fallback
  const need = [...out.values()].filter((v) => v.wikidata && (!v.lat || !v.lng));
  for (let i = 0; i < need.length; i += 50) {
    const chunk = need.slice(i, i + 50);
    const ids = chunk.map((v) => v.wikidata).join("|");
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${ids}`,
      { headers: { "User-Agent": UA } }
    );
    const data = await res.json();
    for (const v of chunk) {
      const coord = data.entities?.[v.wikidata]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (coord) {
        v.lat = coord.latitude;
        v.lng = coord.longitude;
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return out;
}

async function main() {
  const cityWiki = {
    Minsk: "Minsk",
    Brest: "Brest, Belarus",
    Grodno: "Grodno",
    Vitebsk: "Vitebsk",
    Gomel: "Gomel",
    Nesvizh: "Nesvizh",
    Mir: "Mir, Belarus",
    Polotsk: "Polotsk",
    Lida: "Lida",
    Mogilev: "Mogilev",
  };
  const allTitles = new Set(Object.values(cityWiki));
  Object.values(PLACES).flat().forEach((r) => allTitles.add(r[1]));
  ADVENTURE.forEach((r) => allTitles.add(r[1]));
  const wikiOverlay = await batchWiki([...allTitles]);

  const cities = CITIES.map((c) => ({ ...c, country: "Belarus", phase: 1 }));
  const attractions = [];
  for (const city of CITIES) {
    const rows = PLACES[city.name];
    rows.forEach((row, idx) => {
      attractions.push(makeAttraction(city, row, idx, rows, wikiOverlay));
    });
  }
  const adventure_locations = ADVENTURE.map((row, i) => makeAdventure(row, i + 1, wikiOverlay));

  const output = { country: "Belarus", phase: 1, cities, attractions, adventure_locations };
  const outPath = join(ROOT, "data", "seeds", "belarus-phase1.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(
    JSON.stringify({ path: outPath, cities: cities.length, attractions: attractions.length, adventure: adventure_locations.length })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
