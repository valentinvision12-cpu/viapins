/**
 * Build indonesia.json (seed v2) and data/phase1/indonesia.json (nested cities).
 * Run: node scripts/build-indonesia-seed.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { inferPlaceType, visitDurationHours } from "../data-generator/src/seasons.js";
import { isDeathRelatedPlace } from "./death-place-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const country = "Indonesia";
const slug = "indonesia";

const SEASON_WARM = ["spring", "summer", "autumn"];
const SEASON_ALL = ["spring", "summer", "autumn", "winter"];

function cleanUrl(s) {
  if (!s || typeof s !== "string") return "";
  const md = s.match(/\[(https?:\/\/[^\]]+)\]/);
  if (md) return md[1];
  const plain = s.match(/^(https?:\/\/[^\s\])]+)/);
  if (plain) return plain[1];
  return s.trim();
}

function wikiTitleFromUrl(url) {
  url = cleanUrl(url);
  if (!url) return "";
  const m = url.match(/\/wiki\/([^?#]+)/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

function commonsFromImageUrl(url) {
  url = cleanUrl(url);
  if (!url) return undefined;
  const thumb = url.match(/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/(.+?)(?:\/\d+px-)?$/);
  if (thumb) return decodeURIComponent(thumb[1].replace(/_/g, " "));
  const direct = url.match(/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/(.+)$/i);
  if (direct) return decodeURIComponent(direct[1].replace(/_/g, " "));
  return undefined;
}

function wikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${title}`;
}

function citySeo(name) {
  return {
    title: `Top 10 Things to Do in ${name}, ${country}`,
    description: `Discover 10 must-see landmarks in ${name}, ${country}. Free GPS routes, photos, and history.`,
    intro: `Planning a trip to ${name}? Explore the best places to visit in ${name}, ${country}.`,
    keywords: [
      `things to do in ${name}`,
      `${name} ${country} travel guide`,
      `best places to visit in ${name}`,
      `${name} landmarks`,
    ],
  };
}

function phase1ToPlace(p, idx, cityName) {
  const wiki = cleanUrl(p.wikipedia_url);
  const imageUrl = cleanUrl(p.image_url);
  const commons = commonsFromImageUrl(imageUrl);
  return {
    name: p.name,
    wiki_title: wikiTitleFromUrl(wiki) || p.name,
    lat: p.latitude,
    lng: p.longitude,
    order_index: idx,
    description: p.description_short?.trim() || p.name,
    seo_phrase: p.seo_title || p.name,
    seo_keywords: p.keywords?.slice(0, 6) || [p.name, cityName, country],
    ...(commons ? { commons_file: commons } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
    seo_priority: p.seo_priority_score ?? 90 - idx,
    search_intent: ["informational", "travel_planning"],
    type: inferPlaceType(p.name),
    best_season: p.season_tags?.length ? p.season_tags : SEASON_WARM,
    visit_duration_hours: visitDurationHours(inferPlaceType(p.name)),
    nearby_places: (p.nearby_attractions || []).slice(0, 3),
  };
}

function attraction(row, cityName, region) {
  const [name, lat, lng, wikiTitle, description_short, seo_title, keywords, score, season_tags, image_url] = row;
  const base = {
    name,
    city: cityName,
    region,
    latitude: lat,
    longitude: lng,
    google_maps_url: `https://www.google.com/maps?q=${lat},${lng}`,
    wikipedia_url: wikiUrl(wikiTitle),
    season_tags: season_tags || SEASON_WARM,
    seo_title,
    description_short,
    keywords,
    search_intent: "travel_planning",
    seo_priority_score: score,
  };
  if (image_url) base.image_url = image_url;
  return base;
}


const COVER_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/86/Borobudur-Nothwest-view.jpg";

const CITY_ROWS = {
  Jakarta: [
    ["Monas", -6.175392, 106.827153, "National_Monument_(Indonesia)", "Indonesia's towering National Monument crowns Merdeka Square and offers elevator views over the capital's sprawl.", "Monas Jakarta | National Monument & Merdeka Square Guide", ["Monas Jakarta", "National Monument Indonesia", "Merdeka Square", "Jakarta landmarks"], 98],
    ["Istiqlal Mosque", -6.1703, 106.8312, "Istiqlal_Mosque", "Southeast Asia's largest mosque stands opposite Jakarta Cathedral, symbolizing the nation's religious harmony.", "Istiqlal Mosque Jakarta | Southeast Asia's Grandest Mosque", ["Istiqlal Mosque", "Jakarta mosque", "Merdeka Square faith sites"], 96],
    ["Jakarta Cathedral", -6.1692, 106.833, "Jakarta_Cathedral", "This neo-Gothic Roman Catholic cathedral, rebuilt after fire, anchors the historic heart of colonial Batavia.", "Jakarta Cathedral | Neo-Gothic Church at Lapangan Banteng", ["Jakarta Cathedral", "Gereja Katedral", "Jakarta churches"], 94],
    ["Kota Tua", -6.1352, 106.8133, "Kota_Tua,_Jakarta", "Kota Tua preserves Dutch-era warehouses and canals where Jakarta's trading past still feels alive on foot.", "Kota Tua Jakarta | Old Town Dutch Heritage Walk", ["Kota Tua Jakarta", "Old Town Jakarta", "Jakarta history"], 95],
    ["Fatahillah Square", -6.135, 106.8135, "Fatahillah_Square", "Fatahillah Square is the lively plaza fronting the Jakarta History Museum with street performers and vintage bikes.", "Fatahillah Square | Jakarta History Museum Plaza", ["Fatahillah Square", "Taman Fatahillah", "Jakarta History Museum"], 93],
    ["National Museum of Indonesia", -6.1764, 106.8222, "National_Museum_of_Indonesia", "Known as the Elephant Building, this museum holds one of the finest collections of Indonesian archaeology and ethnography.", "National Museum of Indonesia | Elephant Building Collections", ["National Museum Indonesia", "Museum Gajah", "Jakarta museums"], 97],
    ["Sunda Kelapa Harbor", -6.1275, 106.8086, "Sunda_Kelapa", "Pinisi schooners still load cargo at Sunda Kelapa, Jakarta's centuries-old port on the Ciliwung River mouth.", "Sunda Kelapa Harbor | Historic Pinisi Port Jakarta", ["Sunda Kelapa", "Jakarta harbor", "pinisi ships"], 91],
    ["Taman Mini Indonesia Indah", -6.3024, 106.8952, "Taman_Mini_Indonesia_Indah", "TMII showcases traditional houses from every province in a vast cultural park with museums and lake rides.", "Taman Mini Indonesia Indah | Cultural Park East Jakarta", ["Taman Mini Indonesia", "TMII Jakarta", "Indonesia traditional houses"], 90],
    ["Senayan Park", -6.2186, 106.8028, "Gelora_Bung_Karno", "Senayan Park and the Gelora Bung Karno complex offer green space, sports venues, and events beside central Jakarta.", "Senayan Park Jakarta | GBK Sports & Green Space", ["Senayan Park", "Gelora Bung Karno", "Jakarta parks"], 88],
    ["Glodok Chinatown", -6.1445, 106.8158, "Glodok", "Glodok is Jakarta's bustling Chinatown of temples, markets, and street food alleys northwest of Kota Tua.", "Glodok Chinatown Jakarta | Markets & Temples Guide", ["Glodok Jakarta", "Jakarta Chinatown", "Petak Sembilan"], 92],
  ],
  Yogyakarta: [
    ["Kraton Ngayogyakarta Hadiningrat", -7.8053, 110.3642, "Kraton_Ngayogyakarta_Hadiningrat", "The Sultan's palace remains a living court of Javanese culture with pavilions, gamelan, and royal heirlooms.", "Yogyakarta Kraton | Sultan's Palace & Javanese Court", ["Yogyakarta Kraton", "Sultan palace", "Javanese culture"], 98],
    ["Taman Sari", -7.8101, 110.3494, "Taman_Sari_(Yogyakarta)", "The Water Castle blends bathing pools, underground passages, and gardens built for the royal family.", "Taman Sari Water Castle | Royal Pools Yogyakarta", ["Taman Sari", "Water Castle Yogyakarta", "Yogyakarta history"], 96],
    ["Malioboro Street", -7.7925, 110.3656, "Malioboro", "Malioboro is Yogyakarta's main boulevard for batik shops, becak rides, and nightly street food.", "Malioboro Street | Yogyakarta Shopping & Street Life", ["Malioboro", "Malioboro shopping", "Yogyakarta street food"], 97],
    ["Beringharjo Market", -7.798, 110.3655, "Beringharjo_Market", "Beringharjo Market is the city's oldest bazaar for batik, spices, and everyday Javanese goods.", "Beringharjo Market | Historic Batik Bazaar Yogyakarta", ["Beringharjo Market", "Yogyakarta market", "batik Yogyakarta"], 93],
    ["Museum Sonobudoyo", -7.8017, 110.364, "Museum_Sonobudoyo", "Sonobudoyo displays Javanese wayang, keris, and ethnographic treasures steps from the northern alun-alun.", "Museum Sonobudoyo | Javanese Art & Wayang Yogyakarta", ["Museum Sonobudoyo", "wayang museum", "Yogyakarta culture"], 90],
    ["Sultan's Carriage Museum", -7.8058, 110.3635, "Museum_Kereta", "Museum Kereta houses ornate royal carriages and ceremonial transport from the Yogyakarta sultanate.", "Sultan's Carriage Museum | Royal Kereta Collection", ["Museum Kereta", "royal carriages Yogyakarta", "Kraton museums"], 88],
    ["Kotagede", -7.8317, 110.3994, "Kotagede", "Kotagede's silver workshops and mosque quarter preserve the legacy of the Mataram kingdom's first capital.", "Kotagede Yogyakarta | Silver Village & Old Mataram", ["Kotagede", "Yogyakarta silver", "Mataram heritage"], 91],
    ["Alun-Alun Kidul", -7.8078, 110.3628, "Alun-Alun_Kidul", "The southern royal square is famous for twin banyan trees and a playful blindfolded walk tradition.", "Alun-Alun Kidul | Southern Royal Square Yogyakarta", ["Alun-Alun Kidul", "Yogyakarta square", "banyan trees"], 89],
    ["Ngasem Market", -7.8012, 110.3658, "Pasar_Burung_Ngasem", "Ngasem bird market near the kraton is a colorful slice of local life with songbirds and handicrafts.", "Ngasem Market Yogyakarta | Bird Market Near Kraton", ["Ngasem Market", "Pasar Burung Ngasem", "Yogyakarta market"], 85],
    ["Gembira Loka Zoo", -7.8075, 110.3994, "Gembira_Loka_Zoo", "Gembira Loka Zoo pairs Indonesian wildlife exhibits with family-friendly gardens in east Yogyakarta.", "Gembira Loka Zoo | Family Wildlife Park Yogyakarta", ["Gembira Loka Zoo", "Yogyakarta zoo", "Indonesia wildlife"], 87],
  ],
};


Object.assign(CITY_ROWS, {
  Ubud: [
    ["Sacred Monkey Forest Sanctuary", -8.5185, 110.2592, "Ubud_Monkey_Forest", "Lush forest temples shelter hundreds of long-tailed macaques amid mossy statues and jungle paths.", "Ubud Monkey Forest | Sacred Sanctuary & Temples", ["Ubud Monkey Forest", "Sacred Monkey Forest", "Bali temples"], 98],
    ["Ubud Palace", -8.5069, 110.2625, "Ubud_Palace", "Puri Saren Agung hosts evening dance performances in the heart of Ubud's royal quarter.", "Ubud Palace | Puri Saren Agung & Balinese Dance", ["Ubud Palace", "Puri Saren Agung", "Balinese dance Ubud"], 95],
    ["Ubud Art Market", -8.5064, 110.2633, "Ubud_Art_Market", "Morning stalls overflow with batik, wood carvings, and souvenirs steps from the palace gates.", "Ubud Art Market | Batik & Handicrafts Shopping", ["Ubud Art Market", "Pasar Seni Ubud", "Bali shopping"], 92],
    ["Pura Taman Saraswati", -8.5058, 110.2614, "Pura_Taman_Saraswati", "This water temple honors the goddess of learning with a lotus pond and carved gates on Jalan Raya Ubud.", "Pura Taman Saraswati | Lotus Temple Ubud", ["Pura Taman Saraswati", "Saraswati temple Ubud", "Bali water temple"], 90],
    ["Campuhan Ridge Walk", -8.5102, 110.2542, "Campuhan_Ridge_Walk", "An easy ridge trail above the Ayung River valley delivers classic Ubud rice-field panoramas at sunrise.", "Campuhan Ridge Walk | Ubud Sunrise Trail Guide", ["Campuhan Ridge Walk", "Ubud hiking", "Bali rice terraces"], 94],
    ["Blanco Renaissance Museum", -8.5056, 110.2669, "Blanco_Renaissance_Museum", "The flamboyant former studio of Antonio Blanco showcases his portraits amid hilltop gardens.", "Blanco Renaissance Museum | Antonio Blanco Art Ubud", ["Blanco Museum", "Ubud art", "Bali museums"], 88],
    ["ARMA Museum", -8.5181, 110.2622, "Agung_Rai_Museum_of_Art", "ARMA pairs classical and contemporary Balinese art with cultural workshops in a tranquil compound.", "ARMA Museum Ubud | Balinese Art & Culture", ["ARMA Museum", "Agung Rai Museum", "Ubud museums"], 89],
    ["Neka Art Museum", -8.5092, 110.2486, "Neka_Art_Museum", "Neka surveys Balinese painting schools from wayang styles to modern masters in curated galleries.", "Neka Art Museum | Balinese Painting Collections Ubud", ["Neka Art Museum", "Balinese painting", "Ubud art"], 87],
    ["The Yoga Barn", -8.5139, 110.2653, "The_Yoga_Barn", "The Yoga Barn is Ubud's renowned wellness campus for daily classes, retreats, and plant-based dining.", "The Yoga Barn Ubud | Yoga Retreats & Wellness", ["Yoga Barn Ubud", "Ubud yoga", "Bali wellness"], 86],
    ["Pura Dalem Agung", -8.5187, 110.2586, "Pura_Dalem_Agung_Padangtegal", "The main death temple of Padangtegal anchors the monkey forest with towering meru shrines.", "Pura Dalem Agung | Padangtegal Temple Ubud", ["Pura Dalem Agung", "Ubud temple", "Padangtegal"], 85],
  ],
  Bandung: [
    ["Gedung Sate", -6.9025, 107.6186, "Gedung_Sate", "Bandung's iconic government building with its satay-skewer spire is a landmark of Dutch Deco design.", "Gedung Sate Bandung | Iconic Dutch Colonial Landmark", ["Gedung Sate", "Bandung landmark", "West Java architecture"], 97],
    ["Museum of the Asian-African Conference", -6.9236, 107.6097, "Museum_of_the_Asian-African_Conference", "The museum preserves the 1955 Bandung Conference that shaped the Non-Aligned Movement.", "Asian-African Conference Museum | Bandung History", ["Asian African Conference Museum", "Bandung Conference", "Gedung Merdeka"], 94],
    ["Jalan Braga", -6.9178, 107.6086, "Braga_Street", "Braga Street blends art deco facades, cafes, and galleries in Bandung's most walkable heritage lane.", "Jalan Braga | Art Deco Heritage Walk Bandung", ["Jalan Braga", "Braga Street", "Bandung old town"], 93],
    ["Alun-alun Bandung", -6.9203, 107.6064, "Alun-alun_Bandung", "The city square faces the grand mosque and is a gathering place for evening snacks and family outings.", "Alun-alun Bandung | City Square & Grand Mosque", ["Alun-alun Bandung", "Bandung square", "West Java"], 88],
    ["Great Mosque of Bandung", -6.9211, 107.6067, "Grand_Mosque_of_Bandung", "Masjid Raya Bandung's soaring minarets dominate the skyline beside the central alun-alun.", "Great Mosque of Bandung | Masjid Raya Landmark", ["Grand Mosque Bandung", "Masjid Raya", "Bandung mosque"], 90],
    ["Museum Geologi", -6.9006, 107.6194, "Bandung_Geological_Museum", "Indonesia's geology museum explains volcanoes and fossils that shape the surrounding highlands.", "Museum Geologi Bandung | Volcanoes & Fossils", ["Museum Geologi", "Bandung museum", "Indonesia geology"], 89],
    ["Kampung Daun", -6.8467, 107.5903, "Kampung_Daun", "Kampung Daun serves Sundanese cuisine in bamboo villages with waterfalls on Bandung's green outskirts.", "Kampung Daun | Sundanese Dining Village Bandung", ["Kampung Daun", "Bandung restaurants", "Sundanese food"], 86],
    ["Saung Angklung Udjo", -6.9431, 107.6692, "Saung_Angklung_Udjo", "This cultural center stages interactive angklung bamboo orchestra performances for visitors.", "Saung Angklung Udjo | Bamboo Orchestra Bandung", ["Saung Angklung Udjo", "angklung Bandung", "West Java culture"], 92],
    ["Paris Van Java", -6.8844, 107.5964, "Paris_van_Java_(mall)", "Paris Van Java mall mixes upscale shopping with open-air architecture in Bandung's northern hills.", "Paris Van Java | Hillside Shopping Bandung", ["Paris Van Java", "PVJ Bandung", "Bandung shopping"], 84],
    ["Jalan Riau", -6.9081, 107.6189, "Jalan_Riau", "Jalan Riau and adjacent factory outlets are Bandung's go-to strip for fashion and local factory sales.", "Jalan Riau Bandung | Factory Outlet Shopping", ["Jalan Riau", "Bandung factory outlets", "Bandung shopping"], 87],
  ],
  Surabaya: [
    ["House of Sampoerna", -7.2389, 112.7392, "House_of_Sampoerna", "A colonial cigarette factory turned museum tells Surabaya's trading history with guided tours.", "House of Sampoerna | Surabaya Heritage Museum", ["House of Sampoerna", "Surabaya museum", "colonial Surabaya"], 95],
    ["Jalesveva Jayamahe Monument", -7.1956, 112.7278, "Jalesveva_Jayamahe_Monument", "The towering naval monument on the waterfront salutes Indonesia's maritime forces.", "Jalesveva Jayamahe Monument | Surabaya Naval Landmark", ["Jalesveva Jayamahe", "Surabaya monument", "Indonesia navy"], 90],
    ["Cheng Ho Mosque", -7.2422, 112.7386, "Cheng_Ho_Mosque", "This Chinese-style mosque commemorates Admiral Zheng He's voyages and Surabaya's Muslim Chinese community.", "Cheng Ho Mosque Surabaya | Chinese Architecture Mosque", ["Cheng Ho Mosque", "Surabaya mosque", "Zheng He"], 91],
    ["Taman Bungkul", -7.2892, 112.7347, "Taman_Bungkul", "Bungkul Park is a beloved urban green space for skateboarding, street food, and evening hangouts.", "Taman Bungkul | Surabaya's Favorite City Park", ["Taman Bungkul", "Bungkul Park", "Surabaya parks"], 88],
    ["Tunjungan Street", -7.2625, 112.7389, "Jalan_Tunjungan", "Tunjungan Street lines up heritage buildings, malls, and cafes in Surabaya's commercial core.", "Tunjungan Street | Heritage Boulevard Surabaya", ["Tunjungan Street", "Jalan Tunjungan", "Surabaya shopping"], 92],
    ["Ciputra World", -7.2897, 112.6844, "Ciputra_World_Surabaya", "Ciputra World anchors west Surabaya with shopping, dining, and contemporary architecture.", "Ciputra World Surabaya | Modern Mall & Dining", ["Ciputra World Surabaya", "Surabaya mall", "West Surabaya"], 85],
    ["Wonorejo Mangrove", -7.2986, 112.8019, "Wonorejo_Mangrove_Forest", "Boardwalks through Wonorejo mangroves offer birdwatching and calm escapes near the coast.", "Wonorejo Mangrove | Coastal Eco Walk Surabaya", ["Wonorejo Mangrove", "Surabaya nature", "mangrove forest"], 87],
    ["Suramadu Bridge", -7.1853, 112.7792, "Suramadu_National_Bridge", "Suramadu links Java and Madura across the Madura Strait in a dramatic cable-stayed span.", "Suramadu Bridge | Java-Madura Crossing", ["Suramadu Bridge", "Surabaya bridge", "Madura Strait"], 94],
    ["Arab Quarter (Sunan Ampel area)", -7.2292, 112.7358, "Ampel_Mosque", "The Ampel quarter around Sunan Ampel Mosque is Surabaya's historic Arab district of souks and dates.", "Surabaya Arab Quarter | Ampel Mosque & Souks", ["Ampel Surabaya", "Sunan Ampel Mosque", "Arab Quarter Surabaya"], 93],
    ["Submarine Monument (Monkasel)", -7.2797, 112.7492, "KRI_Pasopati_(S129)", "Monkasel displays the retired KRI Pasopati submarine as a museum on the riverfront.", "Monkasel Submarine Museum | KRI Pasopati Surabaya", ["Monkasel", "Submarine Monument Surabaya", "KRI Pasopati"], 89],
  ],
});


Object.assign(CITY_ROWS, {
  Malang: [
    ["Tugu Monument", -7.9825, 112.6308, "Tugu_Monument_(Malang)", "Malang's signature roundabout monument marks the city center and Dutch-era urban planning.", "Tugu Monument Malang | City Center Landmark", ["Tugu Malang", "Malang monument", "East Java"], 92],
    ["Kampung Warna Warni Jodipan", -7.9847, 112.6336, "Kampung_Warna-Warni_Jodipan", "Rainbow-painted alleys and bridges turned Jodipan into one of Indonesia's most photogenic villages.", "Kampung Warna Warni Jodipan | Rainbow Village Malang", ["Jodipan rainbow village", "Kampung Warna Warni", "Malang Instagram"], 96],
    ["Malang City Square", -7.9831, 112.6319, "Alun-Alun_Malang", "The alun-alun pairs a grand mosque with evening food stalls and a relaxed local atmosphere.", "Malang City Square | Alun-alun & Evening Food", ["Alun-alun Malang", "Malang square", "East Java"], 88],
    ["Ijen Boulevard", -7.9792, 112.6331, "Malang", "Ijen Boulevard showcases preserved Dutch colonial villas shaded by flowering trees.", "Ijen Boulevard Malang | Dutch Colonial Heritage Walk", ["Ijen Boulevard", "Malang heritage", "colonial Malang"], 90],
    ["Museum Brawijaya", -7.9844, 112.6372, "Brawijaya_Museum", "Brawijaya Museum documents East Java's military history with armor and independence-era exhibits.", "Museum Brawijaya Malang | Military History East Java", ["Museum Brawijaya", "Malang museum", "Indonesia military history"], 87],
    ["Singosari Temple", -7.8925, 112.6631, "Singhasari", "Singosari temple ruins recall the 13th-century Hindu kingdom that preceded Majapahit.", "Singosari Temple | Hindu Ruins Near Malang", ["Singosari Temple", "Singhasari", "East Java temples"], 91],
    ["Klenteng Eng An Kiong", -7.9836, 112.6347, "Eng_An_Kiong_Temple", "Eng An Kiong is Malang's historic Chinese temple with ornate roofs near the city square.", "Eng An Kiong Temple | Malang Chinese Heritage", ["Eng An Kiong", "Klenteng Malang", "Malang temple"], 86],
    ["Senaputra Park", -7.9669, 112.6364, "Malang", "Senaputra Park offers family recreation and green lawns on the eastern side of Malang.", "Senaputra Park Malang | Family Green Space", ["Senaputra Park", "Malang parks", "East Java"], 82],
    ["Balai Kota Malang", -7.9814, 112.6306, "Malang_City_Hall", "Malang's white city hall faces the Tugu and reflects Dutch civic architecture.", "Balai Kota Malang | Historic City Hall", ["Balai Kota Malang", "Malang city hall", "Dutch architecture"], 84],
    ["Malang Tempo Doeloe area", -7.9786, 112.6325, "Malang", "Lanes around Ijen and Trunojoyo evoke 'tempo doeloe' Malang with cafes in restored shophouses.", "Malang Tempo Doeloe | Heritage Cafes & Shophouses", ["Tempo Doeloe Malang", "Malang old town", "heritage cafes"], 85],
  ],
  Medan: [
    ["Maimun Palace", -3.5753, 98.6836, "Maimun_Palace", "The yellow Maimun Palace blends Malay, Indian, and European styles as a symbol of Deli sultanate.", "Maimun Palace Medan | Deli Sultanate Landmark", ["Maimun Palace", "Medan palace", "North Sumatra"], 97],
    ["Great Mosque of Medan", -3.575, 98.6853, "Great_Mosque_of_Medan", "Masjid Raya Medan rises beside the palace with Middle Eastern-inspired domes and minarets.", "Great Mosque of Medan | Masjid Raya Landmark", ["Great Mosque Medan", "Masjid Raya Medan", "Medan mosque"], 95],
    ["Tjong A Fie Mansion", -3.5856, 98.6814, "Tjong_A_Fie_Mansion", "This restored Chinese mansion tells the story of a Medan tycoon amid carved courtyards.", "Tjong A Fie Mansion | Historic Medan Merchant Home", ["Tjong A Fie Mansion", "Medan heritage", "Chinese mansion"], 94],
    ["Merdeka Walk", -3.5892, 98.6736, "Merdeka_Walk", "Merdeka Walk is Medan's pedestrian dining promenade with local snacks and evening buzz.", "Merdeka Walk Medan | Pedestrian Food Street", ["Merdeka Walk", "Medan food", "North Sumatra"], 90],
    ["Tip Top Restaurant", -3.5853, 98.6819, "Tip_Top_(restaurant)", "Tip Top has served ice cream and Dutch-influenced dishes from a colonial-era storefront since 1934.", "Tip Top Restaurant Medan | Colonial-Era Dining", ["Tip Top Medan", "Medan restaurant", "colonial cafe"], 88],
    ["Vihara Gunung Timur", -3.5831, 98.6803, "Vihara_Gunung_Timur", "This Buddhist temple complex features a multi-tiered pagoda near Medan's multicultural center.", "Vihara Gunung Timur | Buddhist Temple Medan", ["Vihara Gunung Timur", "Medan temple", "Buddhist Medan"], 89],
    ["Sri Mariamman Temple", -3.5847, 98.6825, "Sri_Mariamman_Temple,_Medan", "Medan's Tamil Hindu temple bursts with painted gopuram detail in the city's Indian quarter.", "Sri Mariamman Temple Medan | Tamil Hindu Temple", ["Sri Mariamman Medan", "Hindu temple Medan", "Medan India Street"], 87],
    ["Rahmat International Wildlife Museum", -3.5603, 98.6542, "Rahmat_International_Wildlife_Museum", "Rahmat's wildlife museum displays taxidermy dioramas from around the world in a modern hall.", "Rahmat Wildlife Museum Medan | Global Taxidermy Collection", ["Rahmat Wildlife Museum", "Medan museum", "wildlife museum"], 83],
    ["Medan Post Office", -3.5897, 98.6753, "Medan_Post_Office", "The heritage post office building anchors colonial architecture along Medan's main axis.", "Medan Post Office | Colonial Heritage Building", ["Medan Post Office", "Kantor Pos Medan", "heritage Medan"], 86],
    ["Kesawan Historic District", -3.5875, 98.6808, "Kesawan", "Kesawan preserves shophouses and the old commercial spine of Dutch-era Medan.", "Kesawan Historic District | Old Medan Commercial Quarter", ["Kesawan Medan", "historic Medan", "North Sumatra heritage"], 91],
  ],
});


Object.assign(CITY_ROWS, {
  Makassar: [
    ["Fort Rotterdam", -5.1347, 119.4069, "Fort_Rotterdam", "Dutch Fort Rotterdam guards the harbor with museums inside thick coral-stone walls.", "Fort Rotterdam Makassar | Dutch Harbor Fortress", ["Fort Rotterdam", "Makassar fort", "South Sulawesi history"], 96],
    ["Losari Beach", -5.1431, 119.4086, "Losari_Beach", "Losari Beach promenade is famous for sunset views and pisang epe grilled banana snacks.", "Losari Beach Makassar | Sunset Promenade Guide", ["Losari Beach", "Makassar sunset", "pisang epe"], 94],
    ["Trans Studio Makassar", -5.1614, 119.3956, "Trans_Studio_Mall_Makassar", "Indonesia's indoor theme park at Trans Studio Mall packs rides and shows under one roof.", "Trans Studio Makassar | Indoor Theme Park", ["Trans Studio Makassar", "Makassar mall", "Indonesia theme park"], 88],
    ["Paotere Harbor", -5.1089, 119.4203, "Paotere", "Paotere still bustles with pinisi boats loading goods beside traditional Bugis sailors.", "Paotere Harbor | Traditional Pinisi Port Makassar", ["Paotere Harbor", "pinisi Makassar", "Bugis ships"], 90],
    ["Somba Opu Cultural Village", -5.1342, 119.4225, "Fort_Somba_Opu", "Somba Opu reconstructs Gowa kingdom forts and houses to showcase South Sulawesi heritage.", "Somba Opu Cultural Village | Gowa Kingdom Heritage", ["Somba Opu", "Gowa fort", "Makassar culture"], 87],
    ["Akkarena Beach", -5.1617, 119.4892, "Akkarena_Beach", "Akkarena Beach offers a cleaner stretch of sand and seafood warungs east of the city center.", "Akkarena Beach Makassar | Seafood & Sand", ["Akkarena Beach", "Makassar beach", "South Sulawesi coast"], 85],
    ["Mandala Monument", -5.1478, 119.4328, "Mandala_Monument", "The Mandala Monument honors liberation struggles with a soaring pillar and museum.", "Mandala Monument Makassar | Liberation Memorial", ["Mandala Monument", "Makassar monument", "Indonesia history"], 86],
    ["Museum La Galigo", -5.1356, 119.4081, "La_Galigo_Museum", "La Galigo Museum presents Bugis maritime culture and the epic literature of South Sulawesi.", "Museum La Galigo | Bugis Maritime Culture", ["La Galigo Museum", "Makassar museum", "Bugis culture"], 89],
    ["Karebosi Link", -5.1472, 119.4147, "Karebosi_Link", "Karebosi Link is a downtown park and tunnel plaza connecting Makassar's main squares.", "Karebosi Link | Downtown Park Makassar", ["Karebosi Link", "Makassar park", "city center"], 84],
    ["CPI Mosque (99 Domes Mosque)", -5.0931, 119.4669, "Al-Markas_Al-Islami_Mosque", "The 99 Domes Mosque dazzles with golden domes and modern Islamic architecture on the waterfront.", "99 Domes Mosque Makassar | Al Markas Al Islami", ["99 Domes Mosque", "CPI Mosque Makassar", "Makassar mosque"], 92],
  ],
  "Labuan Bajo": [
    ["Labuan Bajo Waterfront Marina", -8.4961, 119.8877, "Labuan_Bajo", "The marina waterfront is the jumping-off point for Komodo boat trips and golden-hour harbor views.", "Labuan Bajo Marina | Komodo Gateway Waterfront", ["Labuan Bajo marina", "Komodo harbor", "Flores gateway"], 93],
    ["Sylvia Hill", -8.4897, 119.8786, "Labuan_Bajo", "Sylvia Hill viewpoint overlooks the bay and islands that stretch toward Komodo National Park.", "Sylvia Hill Labuan Bajo | Panoramic Bay Viewpoint", ["Sylvia Hill", "Labuan Bajo viewpoint", "Flores sunset"], 88],
    ["Paradise Bar", -8.4953, 119.8869, "Labuan_Bajo", "Paradise Bar is a laid-back sunset spot for drinks above the harbor after island day trips.", "Paradise Bar Labuan Bajo | Harbor Sunset Hangout", ["Paradise Bar Labuan Bajo", "Flores nightlife", "sunset bar"], 82],
    ["Batu Cermin Cave", -8.5331, 119.8203, "Batu_Cermin_Cave", "Mirror Cave shines when sunlight reflects off crystal walls in a short guided walk near town.", "Batu Cermin Cave | Mirror Cave Near Labuan Bajo", ["Batu Cermin", "Mirror Cave Flores", "Labuan Bajo caves"], 87],
    ["Rangko Cave", -8.5264, 119.8036, "Rangko_Cave", "Rangko Cave hides a saltwater pool for swimming inside a limestone chamber lit by openings above.", "Rangko Cave | Swimming Cave Pool Flores", ["Rangko Cave", "Labuan Bajo cave", "Flores swimming cave"], 90],
    ["Waecicu Beach", -8.4719, 119.8639, "Waecicu_Beach", "Waecicu Beach offers calm shallows and island views a short drive from Labuan Bajo.", "Waecicu Beach | Calm Shore Near Labuan Bajo", ["Waecicu Beach", "Labuan Bajo beach", "Flores coast"], 86],
    ["St. Angela Church", -8.4978, 119.8892, "Labuan_Bajo", "St. Angela Church crowns a hill with sea breezes and a quiet perch above the fishing town.", "St. Angela Church Labuan Bajo | Hilltop Parish", ["St. Angela Church", "Labuan Bajo church", "Flores Catholic"], 84],
    ["Puncak Waringin", -8.4936, 119.8847, "Labuan_Bajo", "Puncak Waringin is a favorite lookout under a giant waringin tree for sweeping harbor photos.", "Puncak Waringin | Labuan Bajo Lookout Point", ["Puncak Waringin", "Labuan Bajo viewpoint", "Flores photography"], 85],
    ["Local Fish Market", -8.4986, 119.8886, "Labuan_Bajo", "Morning fish auctions and waterfront grills show the daily catch that fuels Komodo fleet crews.", "Labuan Bajo Fish Market | Morning Harbor Catch", ["Labuan Bajo fish market", "Flores seafood", "harbor market"], 83],
    ["Komodo National Park Visitor Center", -8.4892, 119.8814, "Komodo_National_Park", "The visitor center orients travelers to Komodo dragon habitats, trekking rules, and park fees.", "Komodo National Park Visitor Center | Dragon Park Gateway", ["Komodo visitor center", "Komodo National Park", "Labuan Bajo tours"], 97],
  ],
  Solo: [
    ["Mangkunegaran Palace", -7.5686, 110.8239, "Mangkunegaran_Palace", "Pura Mangkunegaran preserves Javanese court dance, silver, and gamelan in central Solo.", "Mangkunegaran Palace | Solo Royal Court & Gamelan", ["Mangkunegaran Palace", "Solo palace", "Surakarta"], 96],
    ["Kasunanan Palace", -7.5747, 110.8264, "Kraton_Surakarta", "The Kasunanan Surakarta palace remains the cultural heart of the Sunanate with museum halls.", "Kasunanan Palace Solo | Surakarta Kraton Guide", ["Kasunanan Palace", "Kraton Surakarta", "Solo kraton"], 97],
    ["Laweyan Batik Village", -7.5758, 110.8086, "Laweyan", "Laweyan is a living batik neighborhood where workshops still dye cloth in traditional patterns.", "Laweyan Batik Village | Solo Batik Workshops", ["Laweyan batik", "Solo batik village", "Surakarta batik"], 94],
    ["Pasar Gede", -7.5689, 110.8281, "Pasar_Gede_Boeng", "Pasar Gede's grand market hall sells spices, produce, and snacks under a colonial roof.", "Pasar Gede Solo | Historic Central Market", ["Pasar Gede", "Solo market", "Surakarta food"], 91],
    ["Triwindu Market", -7.5681, 110.8247, "Triwindu_Antique_Market", "Triwindu Market is Solo's antiques bazaar for batik, puppets, and vintage curios.", "Triwindu Market | Solo Antiques & Curios", ["Triwindu Market", "Solo antiques", "Surakarta shopping"], 89],
    ["Klewer Market", -7.5714, 110.8253, "Klewer_Market", "Klewer Market specializes in batik sarongs and fabric at bargain prices near the palaces.", "Klewer Market Solo | Batik Textile Bazaar", ["Klewer Market", "Solo batik market", "Surakarta shopping"], 88],
    ["Balekambang Park", -7.5586, 110.8178, "Balekambang_Park", "Balekambang Park offers lakes, tree-lined paths, and weekend family recreation in Solo.", "Balekambang Park | Family Lakeside Park Solo", ["Balekambang Park", "Solo parks", "Surakarta recreation"], 86],
    ["Danar Hadi Batik Museum", -7.5683, 110.8256, "Danar_Hadi_Batik_Museum", "Danar Hadi displays prized batik collections from court cloths to contemporary pieces.", "Danar Hadi Batik Museum | Premier Batik Collection Solo", ["Danar Hadi Museum", "Solo batik museum", "Surakarta culture"], 93],
    ["Gladag", -7.5703, 110.8272, "Gladag", "Gladag square buzzes with becak, street vendors, and palace proximity in old Surakarta.", "Gladag Solo | Historic Square Near Palaces", ["Gladag Solo", "Surakarta square", "Solo old town"], 85],
    ["Bengawan Solo Park", -7.5656, 110.8125, "Bengawan_Solo_Park", "This riverside park celebrates the legendary Solo River with paths, bridges, and open lawns.", "Bengawan Solo Park | Riverside Green Space", ["Bengawan Solo Park", "Solo river park", "Surakarta"], 87],
  ],
});

const ADVENTURE_ROWS = [
  ["Borobudur Temple", -7.6079, 110.2038, "Borobudur", "Central Java", "The world's largest Buddhist temple rises in concentric terraces of carved stupas at dawn mist.", "Borobudur Temple | UNESCO Buddhist Monument Java", ["Borobudur", "Central Java temple", "Indonesia UNESCO"], 98, SEASON_WARM, "https://upload.wikimedia.org/wikipedia/commons/8/86/Borobudur-Nothwest-view.jpg"],
  ["Mount Bromo", -7.9425, 112.953, "Mount_Bromo", "East Java", "Bromo's sea of sand and smoking crater draw sunrise jeep convoys across the Tengger caldera.", "Mount Bromo Sunrise | Tengger Caldera Adventure", ["Mount Bromo", "Bromo sunrise", "East Java volcano"], 97, SEASON_WARM],
  ["Ijen Crater", -8.0583, 114.2425, "Kawah_Ijen", "East Java", "Night hikes reveal blue sulfur flames and turquoise acid lake at Kawah Ijen volcano.", "Ijen Crater Blue Fire | Kawah Ijen Trek Guide", ["Ijen Crater", "Kawah Ijen", "blue fire Indonesia"], 96, SEASON_WARM],
  ["Komodo National Park", -8.55, 119.45, "Komodo_National_Park", "East Nusa Tenggara", "Komodo dragons roam islands of savanna and reef, accessible by liveaboard from Labuan Bajo.", "Komodo National Park | Dragons & Island Hopping", ["Komodo National Park", "Komodo dragons", "Labuan Bajo tours"], 99, SEASON_WARM],
  ["Raja Ampat", -0.2333, 130.5167, "Raja_Ampat", "West Papua", "Raja Ampat's karst isles and coral reefs rank among the richest marine habitats on Earth.", "Raja Ampat Islands | World-Class Diving & Reefs", ["Raja Ampat", "West Papua diving", "Indonesia islands"], 98, SEASON_WARM],
  ["Lake Toba", 2.6848, 98.874, "Lake_Toba", "North Sumatra", "Vast Lake Toba fills a supervolcano caldera with Batak villages on Samosir Island.", "Lake Toba | Samosir Island & Batak Culture", ["Lake Toba", "Samosir Island", "North Sumatra"], 95, SEASON_WARM],
  ["Tumpak Sewu Waterfall", -8.2333, 112.9167, "Tumpak_Sewu", "East Java", "Tumpak Sewu cascades like a curtain of waterfalls in a lush amphitheater near Lumajang.", "Tumpak Sewu Waterfall | Semeru Region Cascade", ["Tumpak Sewu", "East Java waterfall", "Indonesia waterfalls"], 94, SEASON_WARM],
  ["Bunaken National Park", 1.6236, 124.7633, "Bunaken_National_Park", "North Sulawesi", "Bunaken's wall dives drop into coral gardens minutes by boat from Manado.", "Bunaken National Park | Manado Diving Paradise", ["Bunaken", "Manado diving", "North Sulawesi reef"], 93, SEASON_WARM],
  ["Tanjung Puting National Park", -3.1, 111.95, "Tanjung_Puting_National_Park", "Central Kalimantan", "Houseboat cruises on the Sekonyer River bring orangutans and proboscis monkeys into view.", "Tanjung Puting | Orangutan River Safari Borneo", ["Tanjung Puting", "orangutan Borneo", "Kalimantan river cruise"], 92, SEASON_WARM],
  ["Wae Rebo Village", -8.8972, 120.0294, "Wae_Rebo", "Flores", "Wae Rebo's cone-shaped mbaru niang houses sit in cloud forest on a remote Flores ridge.", "Wae Rebo Village | Traditional Flores Highland Settlement", ["Wae Rebo", "Flores village", "Manggarai culture"], 91, SEASON_WARM],
];

const CITY_ORDER = [
  "Jakarta",
  "Yogyakarta",
  "Ubud",
  "Bandung",
  "Surabaya",
  "Malang",
  "Medan",
  "Makassar",
  "Labuan Bajo",
  "Solo",
];

const REGION_BY_CITY = {
  Jakarta: "Java",
  Yogyakarta: "Java",
  Ubud: "Bali",
  Bandung: "West Java",
  Surabaya: "East Java",
  Malang: "East Java",
  Medan: "North Sumatra",
  Makassar: "South Sulawesi",
  "Labuan Bajo": "East Nusa Tenggara",
  Solo: "Central Java",
};

function buildNestedPhase1() {
  const cities = CITY_ORDER.map((name) => {
    const region = REGION_BY_CITY[name];
    const rows = CITY_ROWS[name] || [];
    const attractions = rows
      .map((row) => attraction(row, name, region))
      .filter((a) => !isDeathRelatedPlace(a.name, a.description_short));
    return { name, region, attractions };
  });

  const adventure_locations = ADVENTURE_ROWS.map((row) => {
    const [name, lat, lng, wikiTitle, region, description_short, seo_title, keywords, score, season_tags, image_url] =
      row;
    const item = {
      name,
      region,
      latitude: lat,
      longitude: lng,
      wikipedia_url: wikiUrl(wikiTitle),
      description_short,
      season_tags,
      seo_title,
      keywords,
      seo_priority_score: score,
      search_intent: "travel_planning",
    };
    if (image_url) item.image_url = image_url;
    return item;
  }).filter((a) => !isDeathRelatedPlace(a.name, a.description_short));

  return {
    country,
    slug,
    published: true,
    phase: 1,
    country_representative_image: {
      image_url: COVER_IMAGE,
      image_source: "Wikimedia Commons",
      image_license: "CC BY-SA 2.0",
    },
    country_main_image: {
      image_url: COVER_IMAGE,
      image_source: "Wikimedia Commons",
      image_license: "CC BY-SA 2.0",
    },
    cities,
    adventure_locations,
  };
}

function flattenAttractions(nested) {
  const out = [];
  for (const c of nested.cities) {
    for (const a of c.attractions || []) {
      out.push({ ...a, city: c.name, region: a.region || c.region });
    }
  }
  return out;
}


const nested = buildNestedPhase1();
const phase1Dir = join(ROOT, "data", "phase1");
const seedsDir = join(ROOT, "data", "seeds");
if (!existsSync(phase1Dir)) mkdirSync(phase1Dir, { recursive: true });
if (!existsSync(seedsDir)) mkdirSync(seedsDir, { recursive: true });

const phase1Path = join(phase1Dir, `${slug}.json`);
const seedPath = join(seedsDir, `${slug}.json`);

writeFileSync(phase1Path, JSON.stringify(nested, null, 2) + "\n");

const cityOrder = nested.cities.map((c) => c.name);
const attractions = flattenAttractions(nested);

const cities = cityOrder.map((cityName) => {
  const places = attractions
    .filter(
      (a) =>
        a.city === cityName &&
        !isDeathRelatedPlace(a.name, a.description_short)
    )
    .slice(0, 10)
    .map((p, i) => phase1ToPlace(p, i, cityName));

  const cityMeta = nested.cities.find((c) => c.name === cityName);
  return {
    city: cityName,
    tags: [...SEASON_ALL, "history", "culture"].slice(0, 6),
    wiki_title: wikiTitleFromUrl(cityMeta?.wikipedia_url) || cityName,
    seo: citySeo(cityName),
    places,
  };
});

const advPlaces = (nested.adventure_locations || [])
  .filter((p) => !isDeathRelatedPlace(p.name, p.description_short))
  .slice(0, 10)
  .map((p, idx) => {
    const imageUrl = cleanUrl(p.image_url);
    const commons = commonsFromImageUrl(imageUrl);
    return {
      name: p.name,
      wiki_title: wikiTitleFromUrl(cleanUrl(p.wikipedia_url)) || p.name,
      region: p.region || country,
      lat: p.latitude,
      lng: p.longitude,
      day: idx + 1,
      order_index: idx,
      requires_car: true,
      tags: ["nature", "hidden_gem", "adventure", ...(p.season_tags?.length ? p.season_tags : SEASON_WARM)],
      description: p.description_short,
      seo_phrase: p.seo_title || p.name,
      seo_keywords: p.keywords?.slice(0, 6) || [p.name, country, "road trip"],
      ...(commons ? { commons_file: commons } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      seo_priority: p.seo_priority_score ?? 95 - idx,
      best_season: p.season_tags?.length ? p.season_tags : SEASON_WARM,
      visit_duration_hours: 4,
      type: "nature",
    };
  });

const output = {
  version: 2,
  country,
  published: true,
  cities,
  adventure: {
    title: `${country} Islands & Volcanoes Road Trip`,
    subtitle: `Explore ${country} beyond the cities — rainforests, dragons, reefs, and volcanic calderas.`,
    wiki_title: country,
    hero_image: cleanUrl(nested.country_cover_image?.image_url || nested.country_main_image?.image_url || COVER_IMAGE),
    totalDays: 10,
    seo: {
      title: `${country} Road Trip — Islands & Volcano Adventure`,
      description: `Plan an ${country} road trip with GPS stops, Komodo, Bromo, Raja Ampat, and rainforest wildlife.`,
      intro: `Explore ${country} beyond the cities with this island-hopping and nature adventure route.`,
      keywords: [`${country} road trip`, `${country} Komodo`, `${country} by car`],
    },
    places: advPlaces,
  },
};

writeFileSync(seedPath, JSON.stringify(output, null, 2) + "\n");

const total = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ ${phase1Path}`);
console.log(`✓ ${seedPath}`);
console.log(`  ${total} places, ${advPlaces.length} adventures`);
for (const c of cities) {
  console.log(`  ${c.places.length === 10 ? "✓" : "⚠"} ${c.city}: ${c.places.length}/10`);
}

