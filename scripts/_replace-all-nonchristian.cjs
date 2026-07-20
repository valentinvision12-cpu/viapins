/**
 * Replace non-Christian religious landmarks across main country seed files.
 * Usage: node scripts/_replace-all-nonchristian.cjs
 */
const fs = require("fs");
const path = require("path");

const CHRISTIAN_KEEP =
  /\b(church|cathedral|chapel|basilica|monastery|abbey|orthodox|catholic|christian|baptist|lutheran|protestant|anglican|sacred heart|co-cathedral|concathedral)\b/i;
const CHRISTIAN_TEMPLE_OR_SHRINE =
  /\b(catholic|christian|orthodox|baptist|lutheran|mormon|latter.?day|holy)\s+temple\b/i;
const NON = [
  /\bmosque\b/i,
  /\bmasjid\b/i,
  /\bmezquita\b/i,
  /\bcami\b/i,
  /\bdžamij/i,
  /\bdzamij/i,
  /\btekke\b/i,
  /\bteqe\b/i,
  /\bsynagogue\b/i,
  /\bsynagog\b/i,
  /\bgurdwara\b/i,
  /\bpagoda\b/i,
  /\bminaret\b/i,
  /\bshinto\b/i,
  /\bjinja\b/i,
  /\bjingu\b/i,
  /\btenmangu\b/i,
  /\binari\b/i,
  /\bhachimangu\b/i,
  /\bvihara\b/i,
  /\bklenteng\b/i,
  /\bstupa\b/i,
  /\bmandir\b/i,
  /\bfire temple\b/i,
  /\bmithras\b/i,
  /\bkul sharif\b/i,
  /\bistiqlal\b/i,
  /\bborobudur\b/i,
  /\bsri mariamman\b/i,
  /\btemple of all religions\b/i,
  /\bshrine\b/i,
  /\btemple\b/i,
  /\bwat\b/i,
];

function isNonChristianReligiousPlace(name) {
  const n = (name || "").trim();
  if (!n) return false;
  if (/\b(mosque|mezquita|masjid|synagogue|tekke|džamij|dzamij|cami)\b/i.test(n)) {
    return true;
  }
  if (CHRISTIAN_KEEP.test(n) || CHRISTIAN_TEMPLE_OR_SHRINE.test(n)) return false;
  return NON.some((p) => p.test(n));
}

function r(name, wiki_title, lat, lng, description, type = "landmark") {
  return {
    name,
    wiki_title,
    lat,
    lng,
    description,
    seo_phrase: `${name}`,
    seo_keywords: [name, "travel", "landmarks"],
    type,
  };
}

/** key: seedFile|city|exactOldName */
const REPL = {
  "bosnia-and-herzegovina.json|Sarajevo|Gazi Husrev-beg Mosque": r(
    "Sarajevo Clock Tower",
    "Sarajevo Clock Tower",
    43.8597,
    18.4312,
    "Ottoman-era stone clock tower rising above Baščaršija, a classic orientation point in central Sarajevo.",
    "historic_site"
  ),
  "bosnia-and-herzegovina.json|Mostar|Koski Mehmed Pasha Mosque": r(
    "Crooked Bridge",
    "Kriva Ćuprija",
    43.3365,
    17.8125,
    "Small stone precursor bridge near Stari Most, a quiet photo stop in old Mostar.",
    "historic_site"
  ),
  "bosnia-and-herzegovina.json|Banja Luka|Ferhadija Mosque": r(
    "Vrbas River Promenade",
    "Banja Luka",
    44.772,
    17.191,
    "Leafy riverside walks along the Vrbas through the heart of Banja Luka.",
    "nature"
  ),
  "bosnia-and-herzegovina.json|Tuzla|Atik Mosque": r(
    "Tuzla City Park",
    "Tuzla",
    44.538,
    18.673,
    "Central green space and gathering spot beside Tuzla's lakes and downtown streets.",
    "nature"
  ),
  "bosnia-and-herzegovina.json|Zenica|Zenica Synagogue": r(
    "Kamberovića Polje",
    "Zenica",
    44.2015,
    17.9078,
    "Open riverside recreation grounds popular with locals for walks and city events.",
    "landmark"
  ),
  "bosnia-and-herzegovina.json|Zenica|Sultan Ahmed Mosque Zenica": r(
    "Zenica Metal Museum Area",
    "Zenica",
    44.203,
    17.907,
    "Industrial-heritage surroundings reflecting Zenica's steel-town identity.",
    "landmark"
  ),
  "bosnia-and-herzegovina.json|Bihać|Fethija Mosque": r(
    "Bihać Town Square",
    "Bihać",
    44.817,
    15.8705,
    "Central civic square of Bihać near the Una, framed by cafés and historic streets.",
    "landmark"
  ),
  "bosnia-and-herzegovina.json|Bihać|Fethija Mosque (Bihać)": r(
    "Una Riverside Walk Bihać",
    "Una",
    44.8155,
    15.872,
    "Scenic path along the emerald Una River through Bihać's historic core.",
    "nature"
  ),
  "bosnia-and-herzegovina.json|Trebinje|Osman Pasha Mosque Trebinje": r(
    "Trg Slobode Trebinje",
    "Trebinje",
    42.7115,
    18.344,
    "Main town square of Trebinje with plane trees, cafés, and old-town atmosphere.",
    "landmark"
  ),
  "bosnia-and-herzegovina.json|Jajce|Temple of Mithras Jajce": r(
    "Jajce Town Gate",
    "Jajce",
    44.3415,
    17.2705,
    "Historic gateway into Jajce's fortified old town above the Pliva waterfall.",
    "historic_site"
  ),
  "bosnia-and-herzegovina.json|Travnik|Sulejmanija Mosque": r(
    "Travnik Vizier Residences Area",
    "Travnik",
    44.2265,
    17.6655,
    "Historic quarter of Travnik recalling the town's centuries as a Bosnian vizier seat.",
    "historic_site"
  ),
  "bosnia-and-herzegovina.json|Travnik|Vezir's Mosque": r(
    "Šumeće Picnic Area",
    "Travnik",
    44.228,
    17.67,
    "Wooded picnic and walking area on the edge of Travnik with easy local access.",
    "nature"
  ),
  "bosnia-and-herzegovina.json|adventure|Blagaj Tekke": r(
    "Buna Spring",
    "Buna (Neretva)",
    43.257,
    17.888,
    "Powerful karst spring of the Buna River below Blagaj cliff — a dramatic nature stop.",
    "nature"
  ),

  "albania.json|Tirana|Et'hem Bey Mosque": r(
    "Tirana Clock Tower",
    "Clock Tower of Tirana",
    41.3278,
    19.8185,
    "19th-century clock tower on Skanderbeg Square, a defining vertical landmark of Tirana.",
    "landmark"
  ),
  "albania.json|Berat|King Mosque": r(
    "Berat Belvedere Viewpoint",
    "Berat",
    40.7085,
    19.9465,
    "Hillside lookout over Berat's white Ottoman houses cascading down both river banks.",
    "viewpoint"
  ),
  "albania.json|Saranda|Synagogue of Saranda": r(
    "Saranda Ferry Port Viewpoint",
    "Saranda",
    39.8755,
    20.005,
    "Harbour viewpoint over the Ionian and Corfu ferry routes from Saranda's waterfront.",
    "viewpoint"
  ),
  "albania.json|Gjirokastër|Gjirokastër Mosque": r(
    "Gjirokastër Clock Tower",
    "Gjirokastër Castle",
    40.0738,
    20.1385,
    "Clock tower within Gjirokastër Castle walls overlooking the stone-roofed old town.",
    "landmark"
  ),
  "albania.json|Shkodër|Lead Mosque": r(
    "Rruga Kole Idromeno",
    "Shkodër",
    42.068,
    19.5125,
    "Pedestrian heart of Shkodër lined with cafés, shops, and Italianate facades.",
    "landmark"
  ),
  "albania.json|Shkodër|Ebu Bekr Mosque": r(
    "Shkodër Civic Centre",
    "Shkodër",
    42.0685,
    19.5115,
    "Modern civic plaza and gathering space in central Shkodër.",
    "landmark"
  ),
  "albania.json|Durrës|Fatih Mosque": r(
    "Durrës Waterfront Promenade",
    "Durrës",
    41.314,
    19.445,
    "Long Adriatic promenade with cafés, sea air, and sunset walks.",
    "landmark"
  ),
  "albania.json|Vlorë|Muradie Mosque": r(
    "Vlorë Lungomare",
    "Vlorë",
    40.456,
    19.484,
    "Seafront boulevard of Vlorë with palms, beaches, and open Adriatic views.",
    "landmark"
  ),
  "albania.json|Krujë|Dollma Tekke": r(
    "Krujë Castle Walls Walk",
    "Krujë Castle",
    41.5125,
    19.7935,
    "Walk the castle ramparts above Krujë with mountain and plain panoramas.",
    "historic_site"
  ),
  "albania.json|Krujë|Sari Salltik Tekke": r(
    "Krujë Panorama Terrace",
    "Krujë",
    41.5118,
    19.7945,
    "High terrace views from Krujë over the coastal plain toward the Adriatic.",
    "viewpoint"
  ),
  "albania.json|Korçë|Mirahori Mosque": r(
    "Korçë Boulevard of the Republic",
    "Korçë",
    40.6185,
    20.7805,
    "Tree-lined main boulevard of Korçë with cafés, shops, and city life.",
    "landmark"
  ),

  "indonesia.json|Jakarta|Istiqlal Mosque": r(
    "Merdeka Square",
    "Merdeka Square, Jakarta",
    -6.1754,
    106.8272,
    "Vast central park around the National Monument, Jakarta's ceremonial heart.",
    "landmark"
  ),
  "indonesia.json|Bandung|Great Mosque of Bandung": r(
    "Braga Street Creative Walk",
    "Jalan Braga",
    -6.9175,
    107.6098,
    "Historic café street of Bandung with colonial facades and nightlife.",
    "landmark"
  ),
  "indonesia.json|Surabaya|Cheng Ho Mosque": r(
    "Surabaya City Hall Square",
    "Surabaya",
    -7.2575,
    112.7521,
    "Civic plaza around Surabaya's historic city hall and colonial core.",
    "landmark"
  ),
  "indonesia.json|Malang|Singosari Temple": r(
    "Malang Town Square Alun-Alun",
    "Malang",
    -7.9785,
    112.634,
    "Central public square of Malang with fountains, gardens, and evening crowds.",
    "landmark"
  ),
  "indonesia.json|Malang|Klenteng Eng An Kiong": r(
    "Malang Flower Market Area",
    "Malang",
    -7.97,
    112.63,
    "Colourful local market streets near central Malang, popular for photos and snacks.",
    "landmark"
  ),
  "indonesia.json|Medan|Great Mosque of Medan": r(
    "Medan City Hall Park",
    "Medan",
    3.5897,
    98.6731,
    "Green civic park beside Medan's historic municipal buildings.",
    "nature"
  ),
  "indonesia.json|Medan|Vihara Gunung Timur": r(
    "Kesawan Heritage Street",
    "Medan",
    3.589,
    98.678,
    "Colonial-era Kesawan streetscape with heritage shophouses and cafés.",
    "landmark"
  ),
  "indonesia.json|Medan|Sri Mariamman Temple": r(
    "Medan Railway Station Plaza",
    "Medan",
    3.591,
    98.6785,
    "Busy plaza around Medan's historic railway station and city approaches.",
    "landmark"
  ),
  "indonesia.json|Makassar|CPI Mosque (99 Domes Mosque)": r(
    "Losari Beach Sunset Point",
    "Losari Beach",
    -5.143,
    119.407,
    "Famous Makassar waterfront for evening walks and seafood stalls.",
    "nature"
  ),
  "indonesia.json|adventure|Borobudur Temple": r(
    "Prambanan Plains Viewpoint",
    "Prambanan",
    -7.752,
    110.4915,
    "Open plains and volcano views near Yogyakarta on the classic Java circuit.",
    "viewpoint"
  ),

  "hungary.json|Budapest|Great Synagogue": r(
    "Dohány Street Area Walk",
    "Budapest",
    47.4955,
    19.061,
    "Central Pest neighbourhood walk near cafés, courtyards, and the river approaches.",
    "landmark"
  ),
  "hungary.json|Szeged|New Synagogue (Szeged)": r(
    "Szeged City Hall",
    "Szeged City Hall",
    46.253,
    20.148,
    "Eclectic city hall on Szeged's main square, a landmark of the rebuilt city.",
    "landmark"
  ),
  "hungary.json|Pécs|Mosque of pasha Qasim": r(
    "Széchenyi Square Arcade Walk",
    "Széchenyi Square, Pécs",
    46.0775,
    18.2278,
    "Main square of Pécs with cafés under the arcades of the historic centre.",
    "landmark"
  ),
  "hungary.json|Kecskemét|Kecskemét Synagogue": r(
    "Kecskemét Art Nouveau Walk",
    "Kecskemét",
    46.9068,
    19.6915,
    "Walk among Kecskemét's celebrated Art Nouveau civic buildings around the main square.",
    "landmark"
  ),
  "hungary.json|Szombathely|Temple of Isis (Savaria)": r(
    "Szombathely Main Square Fountain",
    "Szombathely",
    47.2308,
    16.6215,
    "Central square fountain and café life in Szombathely's historic centre.",
    "landmark"
  ),
  "hungary.json|Szombathely|Szombathely Synagogue": r(
    "Szombathely Theatre Square",
    "Szombathely",
    47.2315,
    16.622,
    "Theatre and civic square area anchoring evening life in Szombathely.",
    "landmark"
  ),
  "hungary.json|Eger|Eger Minaret": r(
    "Eger Thermal Bath Park",
    "Eger",
    47.9025,
    20.3715,
    "Parkland around Eger's thermal baths, popular after castle visits.",
    "nature"
  ),

  "spain.json|Madrid|Temple of Debod": r(
    "Parque del Oeste Viewpoint",
    "Parque del Oeste, Madrid",
    40.4215,
    -3.7275,
    "Hilltop park west of central Madrid with sunset views toward the Royal Palace.",
    "viewpoint"
  ),
  "spain.json|Cordoba|Mosque–Cathedral of Córdoba": r(
    "Roman Bridge of Córdoba",
    "Roman bridge of Córdoba",
    37.878,
    -4.7795,
    "Ancient bridge spanning the Guadalquivir with views of the historic skyline.",
    "historic_site"
  ),
  "spain.json|Cordoba|Mezquita-Catedral de Córdoba": r(
    "Calleja de las Flores",
    "Calleja de las Flores",
    37.8792,
    -4.7798,
    "Tiny flower-draped alley in Córdoba's old quarter, iconic for photos.",
    "landmark"
  ),
  "spain.json|Cordoba|Córdoba Synagogue": r(
    "Plaza del Potro",
    "Plaza del Potro",
    37.8805,
    -4.7745,
    "Historic Córdoba square with a fountain, inns, and museum neighbours.",
    "landmark"
  ),
  "spain.json|Toledo|Synagogue of Santa María la Blanca": r(
    "Toledo Alcázar",
    "Alcázar of Toledo",
    39.8585,
    -4.0205,
    "Dominant fortress-palace above Toledo with military museum and city panoramas.",
    "historic_site"
  ),
  "spain.json|Toledo|Mezquita-Iglesia de El Salvador": r(
    "Puente de San Martín",
    "Puente de San Martín",
    39.8565,
    -4.0325,
    "Medieval bridge over the Tagus with classic Toledo skyline views.",
    "historic_site"
  ),

  "slovakia.json|Prešov|Prešov Synagogue": r(
    "Prešov Hlavná Street",
    "Prešov",
    48.9985,
    21.24,
    "Main historic street of Prešov lined with colourful burgher houses and cafés.",
    "landmark"
  ),
  "slovakia.json|Žilina|New Synagogue Žilina": r(
    "Žilina Andrej Hlinka Square",
    "Žilina",
    49.223,
    18.7395,
    "Central square of Žilina with civic buildings and tram-era atmosphere.",
    "landmark"
  ),
  "slovakia.json|Nitra|Nitra Synagogue": r(
    "Nitra Pedestrian Zone",
    "Nitra",
    48.3145,
    18.0875,
    "Lively pedestrian streets below Nitra Castle with shops and cafés.",
    "landmark"
  ),
  "slovakia.json|Trnava|Status Quo Ante Synagogue (Trnava)": r(
    "Trnava Town Hall Square",
    "Trnava",
    48.3775,
    17.5885,
    "Main square of Little Rome Trnava surrounded by churches and pastel facades.",
    "landmark"
  ),
  "slovakia.json|Trenčín|Trenčín Synagogue": r(
    "Trenčín Mierové Square",
    "Trenčín",
    48.8945,
    18.041,
    "Central square beneath Trenčín Castle with cafés and historic houses.",
    "landmark"
  ),

  "cyprus.json|Nicosia|Selimiye Mosque": r(
    "Buyuk Han Courtyard",
    "Büyük Han",
    35.1765,
    33.3635,
    "Restored Ottoman inn courtyard in Nicosia with craft shops and cafés.",
    "landmark"
  ),
  "cyprus.json|Nicosia|Ömeriye Mosque": r(
    "Nicosia Municipal Market Area",
    "Nicosia",
    35.1715,
    33.3625,
    "Market streets and neighbourhood life inside the Venetian walls.",
    "landmark"
  ),
  "cyprus.json|Larnaca|Hala Sultan Tekke": r(
    "Larnaca Salt Lake Viewpoint",
    "Larnaca Salt Lake",
    34.9005,
    33.605,
    "Seasonal flamingo lake and open views on the edge of Larnaca.",
    "nature"
  ),
  "cyprus.json|Famagusta|Lala Mustafa Pasha Mosque": r(
    "Famagusta Marina Walk",
    "Famagusta",
    35.1255,
    33.9435,
    "Harbour and marina stroll beside Famagusta's medieval sea walls.",
    "landmark"
  ),

  "japan.json|Tokyo|Meiji Jingu": r(
    "Yoyogi Park",
    "Yoyogi Park",
    35.671,
    139.695,
    "Spacious central Tokyo park next to Harajuku, popular for walks and picnics.",
    "nature"
  ),
  "japan.json|Kyoto|Fushimi Inari Taisha": r(
    "Fushimi Sake District",
    "Fushimi",
    34.9325,
    135.763,
    "Historic sake-brewing neighbourhood in southern Kyoto with canal walks.",
    "landmark"
  ),
  "japan.json|Osaka|Namba Yasaka Shrine": r(
    "Dotonbori Canal Walk",
    "Dōtonbori",
    34.6687,
    135.5013,
    "Neon canal entertainment district, Osaka's most famous night streetscape.",
    "landmark"
  ),
  "japan.json|Nagoya|Atsuta Jingu": r(
    "Nagoya Castle Park",
    "Nagoya Castle",
    35.1855,
    136.8995,
    "Castle grounds and gardens in central Nagoya with wide lawns and keep views.",
    "historic_site"
  ),
  "japan.json|Sapporo|Hokkaido Shrine": r(
    "Odori Park",
    "Odori Park",
    43.0605,
    141.353,
    "Long central park bisecting Sapporo, home to festivals and the TV Tower views.",
    "nature"
  ),
  "japan.json|Fukuoka|Dazaifu Tenmangu": r(
    "Dazaifu Station Town Walk",
    "Dazaifu",
    33.5185,
    130.535,
    "Approach streets of Dazaifu with shops, sweets, and day-trip energy from Fukuoka.",
    "landmark"
  ),
  "japan.json|Fukuoka|Kushida Shrine": r(
    "Hakata Canal City",
    "Canal City Hakata",
    33.5895,
    130.4115,
    "Large entertainment complex with canals, shops, and indoor plazas in Hakata.",
    "landmark"
  ),
  "japan.json|Fukuoka|Nanzoin Temple": r(
    "Fukuoka Seaside Momochi",
    "Momochi Seaside Park",
    33.5935,
    130.3515,
    "Modern waterfront park and beach beside Fukuoka Tower.",
    "nature"
  ),
  "japan.json|Fukuoka|Shofukuji Temple": r(
    "Hakata Station Plaza",
    "Hakata Station",
    33.5897,
    130.4207,
    "Major transport hub plaza and shopping approaches in Hakata.",
    "landmark"
  ),
  "japan.json|Fukuoka|Tochoji Temple": r(
    "Ohori Park Boathouse Area",
    "Ōhori Park",
    33.5865,
    130.3765,
    "Lake park in central Fukuoka for rowing, jogging, and cherry blossoms.",
    "nature"
  ),
  "japan.json|Kanazawa|Myoryuji Temple": r(
    "Kanazawa Station Tsuzumi Gate",
    "Kanazawa Station",
    36.578,
    136.648,
    "Dramatic wooden drum gate at Kanazawa Station, a modern welcome landmark.",
    "landmark"
  ),
  "japan.json|Kanazawa|Oyama Shrine": r(
    "Kanazawa Castle Park Gates",
    "Kanazawa Castle",
    36.5645,
    136.659,
    "Castle park gates and moats in the heart of Kanazawa.",
    "historic_site"
  ),
  "japan.json|Kobe|Ikuta Shrine": r(
    "Kobe Harborland",
    "Harborland",
    34.679,
    135.1855,
    "Waterfront shopping and night-view district opposite Kobe's port.",
    "landmark"
  ),

  "north-macedonia.json|Bitola|New Mosque": r(
    "Širok Sokak",
    "Bitola",
    41.0315,
    21.3345,
    "Bitola's famous pedestrian boulevard lined with neoclassical facades and cafés.",
    "landmark"
  ),
  "north-macedonia.json|Tetovo|Šarena Mosque": r(
    "Tetovo City Park",
    "Tetovo",
    42.0085,
    20.9715,
    "Central park and promenade space in Tetovo beneath the surrounding mountains.",
    "nature"
  ),
  "north-macedonia.json|Tetovo|Painted Mosque": r(
    "Pena River Walk Tetovo",
    "Tetovo",
    42.0095,
    20.971,
    "Riverside walk through Tetovo with mountain backdrop.",
    "nature"
  ),
  "north-macedonia.json|Tetovo|Arabati Baba Tekke": r(
    "Tetovo Kale Approach",
    "Tetovo Fortress",
    42.0145,
    20.978,
    "Hill approach toward Tetovo's fortress ruins with valley views.",
    "historic_site"
  ),

  "russia.json|Kazan|Kul Sharif Mosque": r(
    "Kazan Kremlin Walls Walk",
    "Kazan Kremlin",
    55.7985,
    49.1065,
    "Walk the white Kremlin walls and towers overlooking the Kazanka and Volga.",
    "historic_site"
  ),
  "russia.json|Kazan|Temple of All Religions": r(
    "Kaban Lake Embankment",
    "Lake Kaban",
    55.7775,
    49.135,
    "Urban lake embankment popular for evening walks in Kazan.",
    "nature"
  ),
  "russia.json|Nizhny Novgorod|Nizhny Novgorod Synagogue": r(
    "Chkalov Stairs",
    "Chkalov Stairs",
    56.3285,
    44.0095,
    "Monumental Volga-side staircase and viewpoint in Nizhny Novgorod.",
    "landmark"
  ),
  "russia.json|Vladivostok|Vladivostok Synagogue": r(
    "Eagle's Nest Hill",
    "Eagle's Nest (Vladivostok)",
    43.1185,
    131.8825,
    "Classic panorama point over Vladivostok's golden horn harbour.",
    "viewpoint"
  ),

  "belarus.json|Grodno|Great Choral Synagogue, Grodno": r(
    "Soviet Square Grodno",
    "Grodno",
    53.6775,
    23.8295,
    "Central square of Grodno with historic facades and city life.",
    "landmark"
  ),
  "belarus.json|Grodno|Great Synagogue (Grodno)": r(
    "Niemen River Embankment Grodno",
    "Grodno",
    53.6765,
    23.825,
    "Riverside embankment walks along the Niemen through Grodno.",
    "nature"
  ),
  "belarus.json|Nesvizh|Nesvizh Synagogue": r(
    "Nesvizh Market Square",
    "Nesvizh",
    53.2205,
    26.6775,
    "Town square near Nesvizh Castle with cafés and local atmosphere.",
    "landmark"
  ),

  "romania.json|Constanta|Grand Mosque of Constanta": r(
    "Constanța Seafront Casino Walk",
    "Constanța Casino",
    44.1705,
    28.6585,
    "Iconic Art Nouveau casino and Black Sea promenade of Constanța.",
    "landmark"
  ),
  "romania.json|Oradea|Neolog Synagogue": r(
    "Oradea Republicii Street",
    "Oradea",
    47.0555,
    21.9285,
    "Elegant pedestrian street of Oradea with Secession architecture.",
    "landmark"
  ),
  "romania.json|Oradea|Zion Temple": r(
    "Crișul Repede Embankment",
    "Oradea",
    47.0545,
    21.9255,
    "River embankment walks through the centre of Oradea.",
    "nature"
  ),

  "turkey.json|Selçuk|Temple of Artemis ruins": r(
    "Ephesus Harbour Street",
    "Ephesus",
    37.9395,
    27.3425,
    "Marble harbour street of ancient Ephesus leading toward the old coastline.",
    "historic_site"
  ),
  "turkey.json|Bergama|Temple of Trajan": r(
    "Pergamon Theatre Seats",
    "Pergamon",
    39.1325,
    27.1835,
    "Steep ancient theatre carved into the Pergamon acropolis hillside.",
    "historic_site"
  ),
  "turkey.json|Ankara|Temple of Augustus and Rome": r(
    "Ankara Roman Baths Area",
    "Roman Baths of Ankara",
    39.9445,
    32.8585,
    "Open-air Roman baths complex north of Ankara's Ulus district.",
    "historic_site"
  ),

  "bulgaria.json|Plovdiv|Dzhumaya Mosque": r(
    "Plovdiv Kapana Creative District",
    "Kapana",
    42.1485,
    24.7485,
    "Artsy maze of cafés, galleries, and murals beside Plovdiv's old town.",
    "landmark"
  ),
  "bulgaria.json|Balchik|Temple of Cybele": r(
    "Balchik White Cliffs Walk",
    "Balchik",
    43.4075,
    28.1645,
    "Chalk cliff paths above the Black Sea near Balchik Palace gardens.",
    "nature"
  ),

  "czech-republic.json|Plzeň|Great Synagogue, Plzeň": r(
    "Plzeň Smetanovy Sady",
    "Plzeň",
    49.7465,
    13.3755,
    "Central parkland near Plzeň's theatres and river walks.",
    "nature"
  ),
  "czech-republic.json|Hradec Králové|Synagogue Hradec Králové": r(
    "Orlice River Embankment HK",
    "Hradec Králové",
    50.2095,
    15.8335,
    "River embankment walks in Hradec Králové's modern-historic centre.",
    "nature"
  ),

  "greece.json|Athens|Temple of Olympian Zeus": r(
    "Panathenaic Stadium Approach",
    "Panathenaic Stadium",
    37.9685,
    23.7405,
    "Marble stadium of the first modern Olympics and surrounding park walks.",
    "landmark"
  ),
  "greece.json|Delphi|Temple of Apollo": r(
    "Delphi Ancient Gymnasium",
    "Delphi",
    38.4815,
    22.5005,
    "Terraced gymnasium ruins on the sacred way below Delphi's theatre.",
    "historic_site"
  ),

  "latvia.json|Kuldiga|Synagogue Building Complex": r(
    "Kuldīga Old Town Hall Square",
    "Kuldīga",
    56.9675,
    21.9705,
    "Intimate old-town square near the Venta Rapid and brick bridge.",
    "landmark"
  ),
  "latvia.json|Rezekne|Green Synagogue": r(
    "Rezekne Castle Hill Park",
    "Rēzekne",
    56.5095,
    27.3335,
    "Park and ruins on Rēzekne's castle hill with town views.",
    "nature"
  ),

  "serbia.json|Novi Sad|Synagogue of Novi Sad": r(
    "Novi Sad Dunavski Park Edge",
    "Dunavski Park",
    45.2545,
    19.8455,
    "Leafy city park near the Danube and Novi Sad's museum quarter.",
    "nature"
  ),
  "serbia.json|Subotica|Subotica Synagogue": r(
    "Subotica City Hall Square",
    "Subotica",
    46.1005,
    19.6665,
    "Art Nouveau city hall and square, Subotica's signature civic landmark.",
    "landmark"
  ),

  "ukraine.json|Uzhhorod|Uzhhorod Synagogue": r(
    "Uzh River Embankment",
    "Uzhhorod",
    48.6225,
    22.2985,
    "Riverside walks through central Uzhhorod beneath the castle hill.",
    "nature"
  ),
  "ukraine.json|Lutsk|Great Synagogue (Lutsk)": r(
    "Lutsk Market Square",
    "Lutsk",
    50.7455,
    25.3245,
    "Historic market square beside Lubart's Castle and cathedral streets.",
    "landmark"
  ),

  "croatia.json|Pula|Temple of Augustus": r(
    "Pula Forum Square",
    "Pula",
    44.8705,
    13.8455,
    "Roman forum square in the heart of Pula beside the amphitheatre approaches.",
    "landmark"
  ),
  "lithuania.json|Marijampolė|Choral Synagogue Complex Site": r(
    "Marijampolė Basanavičius Square Life",
    "Marijampolė",
    54.5595,
    23.3545,
    "Central square life of Marijampolė with civic buildings and cafés.",
    "landmark"
  ),
  "netherlands.json|Groningen|Synagogue Groningen": r(
    "Groningen Folkingestraat",
    "Groningen",
    53.2165,
    6.5665,
    "Historic shopping street linking Grote Markt with the station approaches.",
    "landmark"
  ),
  "norway.json|Trondheim|Trondheim Synagogue": r(
    "Trondheim Bakklandet",
    "Bakklandet",
    63.4285,
    10.4075,
    "Colourful wooden neighbourhood across the bridge from Nidaros, full of cafés.",
    "landmark"
  ),
  "portugal.json|Evora|Roman Temple of Évora": r(
    "Évora Giraldo Square",
    "Praça do Giraldo",
    38.5715,
    -7.9095,
    "Main square of Évora with arcades, cafés, and whitewashed Alentejo charm.",
    "landmark"
  ),
  "slovenia.json|Maribor|Maribor Synagogue": r(
    "Maribor Lent District",
    "Lent, Maribor",
    46.5565,
    15.6455,
    "Riverside Lent quarter with cafés along the Drava beneath the old town.",
    "landmark"
  ),
  "san-marino.json|San Marino City|San Marino Shrine": r(
    "Cesta dei Bastioni Walk",
    "San Marino",
    43.9365,
    12.4465,
    "Fortified bastion walk with cliff views over the Romagna plain.",
    "viewpoint"
  ),
};

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const seedsDir = path.join(process.cwd(), "data", "seeds");
const uniqueFiles = [...new Set(Object.keys(REPL).map((k) => k.split("|")[0]))];

let replaced = 0;
const report = [];
const unmapped = [];

for (const file of uniqueFiles) {
  const seedPath = path.join(seedsDir, file);
  if (!fs.existsSync(seedPath)) {
    console.log("MISSING FILE", file);
    continue;
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const apply = (places, cityName, where) => {
    if (!places) return;
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const key = `${file}|${cityName}|${p.name}`;
      let hit = REPL[key];
      if (!hit) {
        const entry = Object.entries(REPL).find(([k]) => {
          const [f, c, n] = k.split("|");
          return f === file && norm(c) === norm(cityName) && norm(n) === norm(p.name);
        });
        hit = entry?.[1];
      }
      if (!hit && isNonChristianReligiousPlace(p.name)) {
        unmapped.push(`${file}|${cityName}|${p.name}`);
        continue;
      }
      if (!hit) continue;
      const next = {
        ...p,
        ...hit,
        order_index: p.order_index,
        seo_priority: p.seo_priority ?? 85,
        search_intent: p.search_intent || ["informational", "travel_planning"],
        best_season:
          hit.type === "nature"
            ? ["spring", "summer", "autumn"]
            : p.best_season || ["spring", "summer", "autumn", "winter"],
        visit_duration_hours: p.visit_duration_hours || 1.5,
        nearby_places: (p.nearby_places || []).filter(
          (n) => !isNonChristianReligiousPlace(n)
        ),
      };
      delete next.image_url;
      delete next.commons_file;
      places[i] = next;
      replaced++;
      report.push(`${where}: ${p.name} -> ${hit.name}`);
    }
    for (const p of places) {
      if (p.nearby_places) {
        p.nearby_places = p.nearby_places.filter(
          (n) => !isNonChristianReligiousPlace(n)
        );
      }
    }
  };

  for (const city of seed.cities || []) {
    apply(city.places, city.city, city.city);
  }
  if (seed.adventure?.places) apply(seed.adventure.places, "adventure", "adventure");

  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
}

console.log(report.join("\n"));
console.log("replaced=" + replaced);
if (unmapped.length) {
  console.log("UNMAPPED=" + unmapped.length);
  console.log(unmapped.join("\n"));
}
