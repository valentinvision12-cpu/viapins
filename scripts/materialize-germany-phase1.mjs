/**
 * Materialize germany-phase1-input.json from curated dataset (essential fields).
 * Run: node scripts/materialize-germany-phase1.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function a(
  city,
  name,
  lat,
  lng,
  wiki,
  image,
  desc,
  seoTitle,
  keywords,
  score = 90
) {
  return {
    city,
    name,
    latitude: lat,
    longitude: lng,
    wikipedia_url: `https://en.wikipedia.org/wiki/${wiki}`,
    image_url: image,
    description_short: desc,
    seo_title: seoTitle,
    keywords: keywords.slice(0, 5),
    search_intent: "travel_planning",
    seo_priority_score: score,
  };
}

const attractions = [
  // Berlin
  a("Berlin", "Brandenburg Gate", 52.5162, 13.3777, "Brandenburg_Gate", "https://upload.wikimedia.org/wikipedia/commons/a/a6/Brandenburger_Tor_abends.jpg", "A landmark 18th-century neoclassical triumphal arch in Berlin, symbolizing peace and European unification.", "Brandenburg Gate Berlin Travel Guide - Iconic German Landmark", ["Brandenburg Gate", "Berlin attractions", "German monuments"], 98),
  a("Berlin", "Reichstag Building", 52.5186, 13.3761, "Reichstag_building", "https://upload.wikimedia.org/wikipedia/commons/e/e0/Reichstag_building_Berlin_view_from_west.jpg", "The historic seat of the German parliament, completely transformed with a spectacular contemporary glass dome.", "Inside the Reichstag Building Berlin - Glass Dome Tours", ["Reichstag dome", "German Parliament", "Berlin architecture"], 96),
  a("Berlin", "Berlin Cathedral", 52.519, 13.4011, "Berlin_Cathedral", "https://upload.wikimedia.org/wikipedia/commons/1/1b/Berliner_Dom_Blick_von_Altem_Museum.jpg", "The magnificent 19th-century Evangelical cathedral famed for its striking turquoise dome and exquisite interiors.", "Berlin Cathedral Guide - Berliner Dom Architecture & Dome Climb", ["Berliner Dom", "Berlin Cathedral", "Museum Island churches"], 93),
  a("Berlin", "Altes Museum", 52.5194, 13.3983, "Altes_Museum", "https://upload.wikimedia.org/wikipedia/commons/d/de/Altes_Museum_Berlin_2016.jpg", "A world-renowned neoclassical museum building housing a collection of Greek, Etruscan, and Roman antiquities.", "Altes Museum Berlin - Classical Antiquities on Museum Island", ["Altes Museum", "Museum Island Berlin", "Schinkel architecture"], 91),
  a("Berlin", "Berlin Television Tower", 52.5208, 13.4094, "Fernsehturm_Berlin", "https://upload.wikimedia.org/wikipedia/commons/e/eb/Fernsehturm_am_Alexanderplatz_Abendhimmel.jpg", "The tallest structure in Germany, offering breathtaking panoramic views from its iconic retro-futuristic sphere.", "Berlin TV Tower (Fernsehturm) - Tickets & Rotating Restaurant", ["Fernsehturm Berlin", "Berlin TV Tower", "Alexanderplatz tower"], 95),
  a("Berlin", "Gendarmenmarkt", 52.5136, 13.3928, "Gendarmenmarkt", "https://upload.wikimedia.org/wikipedia/commons/0/07/Berlin_Gendarmenmarkt_Blick_zum_Deutschen_Dom.jpg", "An exquisite architectural ensemble featuring the Konzerthaus and twin French and German Reformed churches.", "Gendarmenmarkt Square Berlin - Architectural Gem Guide", ["Gendarmenmarkt", "Berlin historic squares", "Konzerthaus Berlin"], 90),
  a("Berlin", "Großer Tiergarten", 52.5144, 13.3501, "Tiergarten_(park)", "https://upload.wikimedia.org/wikipedia/commons/d/de/Tiergarten_Berlin_Herbst.jpg", "Berlin's expansive central urban park, filled with scenic shaded pathways, quiet lakes, and historic monuments.", "Großer Tiergarten Berlin - The Ultimate Urban Park Guide", ["Tiergarten park", "Berlin green spaces", "central park Berlin"], 89),
  a("Berlin", "Berlin Victory Column", 52.5145, 13.3501, "Berlin_Victory_Column", "https://upload.wikimedia.org/wikipedia/commons/f/fb/Siegessaeule_Berlin_2017.jpg", "A grand, historic monument featuring a shining golden statue of Victoria and a high viewing platform.", "Berlin Victory Column (Siegessäule) - History & Viewpoint", ["Siegessäule", "Victory Column Berlin", "Berlin viewpoints"], 88),
  a("Berlin", "Bode Museum", 52.5211, 13.3941, "Bode_Museum", "https://upload.wikimedia.org/wikipedia/commons/e/e9/Bode-Museum_Berlin_Spree.jpg", "A striking neo-Baroque museum on Museum Island, famous for master sculptures and Byzantine art.", "Bode Museum Berlin - Sculpture Collection & Byzantine Art", ["Bode Museum", "Museum Island", "Berlin sculpture gallery"], 87),
  a("Berlin", "Charlottenburg Palace", 52.5211, 13.2958, "Charlottenburg_Palace", "https://upload.wikimedia.org/wikipedia/commons/a/ab/Schloss_Charlottenburg_Berlin_Fassade.jpg", "The largest and grandest surviving royal palace in Berlin, boasting magnificent Baroque and Rococo architecture.", "Charlottenburg Palace Berlin - Baroque Residence & Gardens", ["Charlottenburg Palace", "Berlin royal estates", "Schloss Charlottenburg"], 92),
  // Munich
  a("Munich", "Marienplatz", 48.1372, 11.5755, "Marienplatz", "https://upload.wikimedia.org/wikipedia/commons/c/c1/Munich_Marienplatz_with_New_Town_Hall.jpg", "Munich's historic central square, dominated by the spectacular Gothic Revival Neues Rathaus.", "Marienplatz Munich Guide - New Town Hall & Glockenspiel", ["Marienplatz", "Munich central square", "Glockenspiel Munich"], 99),
  a("Munich", "Frauenkirche", 48.1386, 11.5728, "Munich_Frauenkirche", "https://upload.wikimedia.org/wikipedia/commons/e/eb/Munich_Frauenkirche_aerial_view.jpg", "The iconic Gothic cathedral of Munich, recognizable by its distinctive twin brick towers capped with Renaissance domes.", "Munich Frauenkirche - Cathedral of Our Lady Architecture", ["Frauenkirche Munich", "Munich Cathedral", "Gothic brick church"], 94),
  a("Munich", "Munich Residenz", 48.1411, 11.5781, "Munich_Residenz", "https://upload.wikimedia.org/wikipedia/commons/c/ca/Residenz_Muenchen_Antiquarium.jpg", "The expansive former royal palace of the Wittelsbach monarchs, featuring opulent Renaissance and Baroque halls.", "Munich Residenz Tour - Palace Museum & Antiquarium", ["Munich Residenz", "Bavarian Royal Palace", "Antiquarium Munich"], 93),
  a("Munich", "Englischer Garten", 48.1528, 11.5921, "Englischer_Garten", "https://upload.wikimedia.org/wikipedia/commons/e/ec/Monopteros_in_the_English_Garden_Munich.jpg", "A vast urban park famed for scenic meadows, peaceful lakes, and the unique Eisbach river surfing wave.", "Englischer Garten Munich - Surfing, Lakes, & Park Guide", ["Englischer Garten", "English Garden Munich", "Eisbach surfing"], 95),
  a("Munich", "Nymphenburg Palace", 48.1581, 11.5033, "Nymphenburg_Palace", "https://upload.wikimedia.org/wikipedia/commons/1/1c/Schloss_Nymphenburg_Munich.jpg", "A stunning Baroque summer palace featuring elegant classical interiors and an extensive canal network.", "Nymphenburg Palace Munich - Baroque Summer Residence", ["Nymphenburg Palace", "Schloss Nymphenburg", "Munich Baroque palaces"], 92),
  a("Munich", "Viktualienmarkt", 48.1351, 11.5761, "Viktualienmarkt", "https://upload.wikimedia.org/wikipedia/commons/e/ec/Viktualienmarkt_Muenchen_Maibaum.jpg", "A bustling historic open-air gourmet food market and culinary hub located just steps from Marienplatz.", "Viktualienmarkt Munich - Historic Food Market Guide", ["Viktualienmarkt", "Munich food market", "Bavarian food culture"], 91),
  a("Munich", "Alte Pinakothek", 48.1483, 11.57, "Alte_Pinakothek", "https://upload.wikimedia.org/wikipedia/commons/6/6d/Alte_Pinakothek_Muenchen_Aussenansicht.jpg", "One of the oldest and most prestigious art galleries in the world, housing brilliant Old Master paintings.", "Alte Pinakothek Munich - Old Master Painting Gallery", ["Alte Pinakothek", "Munich art museums", "Old Master paintings"], 89),
  a("Munich", "Deutsches Museum", 48.1299, 11.5834, "Deutsches_Museum", "https://upload.wikimedia.org/wikipedia/commons/e/e0/Deutsches_Museum_Luftfahrt.jpg", "The world's largest museum of science and technology, featuring fascinating masterworks of engineering.", "Deutsches Museum Munich - World's Largest Science Museum", ["Deutsches Museum", "Munich science museum", "aviation exhibits Munich"], 94),
  a("Munich", "Odeonsplatz", 48.1428, 11.5775, "Odeonsplatz", "https://upload.wikimedia.org/wikipedia/commons/a/a2/Odeonsplatz_Muenchen_Theatinerkirche.jpg", "A striking monument-lined public square designed in a classical Florentine architectural style.", "Odeonsplatz Munich - Italianate Architecture & Feldherrnhalle", ["Odeonsplatz", "Feldherrnhalle Munich", "Theatinerkirche"], 88),
  a("Munich", "St. Peter's Church", 48.1364, 11.5758, "St._Peter%27s_Church,_Munich", "https://upload.wikimedia.org/wikipedia/commons/e/ee/Alter_Peter_Muenchen_Aussichtsturm.jpg", "Munich's oldest parish church, famous for its historic tower that offers breathtaking views of the city center.", "St. Peter's Church Munich (Alter Peter) - Tower Viewpoint", ["Alter Peter", "St Peter Church Munich", "Munich viewpoints"], 90),
  // Hamburg
  a("Hamburg", "Elbphilharmonie", 53.5413, 9.9841, "Elbphilharmonie", "https://upload.wikimedia.org/wikipedia/commons/1/14/Elbphilharmonie_Hamburg_April_2017.jpg", "A stunning modern architectural icon of Hamburg, rising like a glass wave over an old brick warehouse.", "Elbphilharmonie Hamburg - Plaza Tickets & Concert Hall Guide", ["Elbphilharmonie", "Hamburg concert hall", "HafenCity architecture"], 98),
  a("Hamburg", "Speicherstadt", 53.5444, 9.9908, "Speicherstadt", "https://upload.wikimedia.org/wikipedia/commons/e/e0/Hamburg_Speicherstadt_Wasserschloss.jpg", "The world's largest historic warehouse complex, built with striking red-brick Gothic architecture along picturesque canals.", "Speicherstadt Hamburg - UNESCO Warehouse District Guide", ["Speicherstadt", "Hamburg UNESCO sites", "warehouse district Hamburg"], 97),
  a("Hamburg", "Hamburg Town Hall", 53.5503, 9.9928, "Hamburg_Rathaus", "https://upload.wikimedia.org/wikipedia/commons/b/bd/Hamburg_Rathaus_Aussenansicht.jpg", "The magnificent seat of Hamburg's local government, boasting an exceptionally ornate Neo-Renaissance design.", "Hamburg Town Hall (Rathaus) - Neo-Renaissance Architecture", ["Hamburg Rathaus", "Hamburg Town Hall", "Neo Renaissance architecture"], 93),
  a("Hamburg", "St. Michael's Church", 53.5483, 9.9789, "St._Michael%27s_Church,_Hamburg", "https://upload.wikimedia.org/wikipedia/commons/6/69/Hamburg_Sankt_Michaelis_Aussenansicht.jpg", "Hamburg's most famous Baroque church, fondly nicknamed Der Michel and featuring a high maritime lookout tower.", "St. Michael's Church Hamburg - Michel Tower Viewpoint", ["Der Michel Hamburg", "St Michaels Church", "Baroque church Germany"], 92),
  a("Hamburg", "Landungsbrücken", 53.5458, 9.9667, "Landungsbr%C3%BCcken", "https://upload.wikimedia.org/wikipedia/commons/4/4e/Hamburg_Landungsbr%C3%BCcken.jpg", "Hamburg's iconic floating dock piers on the Elbe, a historic gateway to the port and harbor cruises.", "Landungsbrücken Hamburg - Historic Harbor Piers Guide", ["Landungsbrücken", "Hamburg harbor piers", "Elbe waterfront Hamburg"], 90),
  a("Hamburg", "Jungfernstieg", 53.5539, 9.9925, "Jungfernstieg", "https://upload.wikimedia.org/wikipedia/commons/4/41/Hamburg_Binnenalster_Blick_zum_Jungfernstieg.jpg", "Hamburg's premier historic waterfront promenade along the shores of the scenic Binnenalster lake.", "Jungfernstieg Hamburg - Historic Waterfront Promenade", ["Jungfernstieg", "Alster lake Hamburg", "Binnenalster promenade"], 91),
  a("Hamburg", "International Maritime Museum", 53.5436, 10.0003, "International_Maritime_Museum_Hamburg", "https://upload.wikimedia.org/wikipedia/commons/2/23/Internationales_Maritimes_Museum_Hamburg_Kaispeicher_B.jpg", "A world-class maritime museum housed in Hamburg's oldest preserved port warehouse building.", "International Maritime Museum Hamburg - Naval History", ["Hamburg Maritime Museum", "Kaispeicher B", "nautical history Germany"], 89),
  a("Hamburg", "St. James's Church", 53.5503, 9.9992, "St._James%27s_Church,_Hamburg", "https://upload.wikimedia.org/wikipedia/commons/a/ab/Hamburg_Sankt_Jacobi_Hauptschiff.jpg", "A historic 14th-century Gothic parish church housing a world-famous Arp Schnitger Baroque pipe organ.", "St. James's Church Hamburg - Historic Arp Schnitger Organ", ["Sankt Jacobi Hamburg", "Arp Schnitger organ", "brick Gothic church"], 86),
  a("Hamburg", "St. Peter's Church", 53.5511, 9.9964, "St._Peter%27s_Church,_Hamburg", "https://upload.wikimedia.org/wikipedia/commons/0/05/Hamburg_Sankt_Petri_Aussenansicht.jpg", "The oldest surviving parish church site in Hamburg, showcasing soaring neo-Gothic brick design.", "St. Peter's Church Hamburg - Oldest Parish Church", ["Sankt Petri Hamburg", "oldest church Hamburg", "neo Gothic brick"], 85),
  a("Hamburg", "Chilehaus", 53.5483, 10.0019, "Chilehaus", "https://upload.wikimedia.org/wikipedia/commons/b/b2/Chilehaus_Hamburg_Spitze.jpg", "An exceptional 1920s office building famous for its sharp architectural angle resembling an ocean liner's bow.", "Chilehaus Hamburg - Brick Expressionism Masterpiece", ["Chilehaus Hamburg", "Brick Expressionism", "Fritz Höger architecture"], 90),
  // Cologne
  a("Cologne", "Cologne Cathedral", 50.9413, 6.9583, "Cologne_Cathedral", "https://upload.wikimedia.org/wikipedia/commons/5/5a/Koelner_Dom_Fassade.jpg", "Germany's most visited monument, a breathtaking High Gothic cathedral featuring towering twin spires.", "Cologne Cathedral Guide - Kölner Dom Architecture & Tickets", ["Cologne Cathedral", "Kölner Dom", "Gothic cathedrals Germany"], 100),
  a("Cologne", "Hohenzollern Bridge", 50.9417, 6.9653, "Hohenzollern_Bridge", "https://upload.wikimedia.org/wikipedia/commons/e/ee/Hohenzollernbruecke_Koeln_Abend.jpg", "A historic three-arched steel railway bridge across the Rhine, famous for thousands of colorful love locks.", "Hohenzollern Bridge Cologne - Love Locks & Rhine Views", ["Hohenzollern Bridge", "Cologne love locks", "Rhine River bridges"], 96),
  a("Cologne", "Alter Markt", 50.9381, 6.9594, "Alter_Markt,_Cologne", "https://upload.wikimedia.org/wikipedia/commons/2/25/Koeln_Alter_Markt_Haeuserzeile.jpg", "Cologne's charming old town marketplace, lined with traditional narrow gabled houses and historic cafes.", "Alter Markt Cologne - Old Town Square & Historic Cafes", ["Alter Markt Cologne", "Cologne Old Town", "Jan von Werth fountain"], 92),
  a("Cologne", "Farina Fragrance Museum", 50.9378, 6.9583, "Farina_Fragrance_Museum", "https://upload.wikimedia.org/wikipedia/commons/d/df/Farina_Haus_Koeln.jpg", "The world's oldest pristine fragrance factory, where the original Eau de Cologne was invented.", "Farina Fragrance Museum Cologne - Birthplace of Eau de Cologne", ["Farina Museum", "Eau de Cologne history", "original perfume factory"], 91),
  a("Cologne", "Cologne Chocolate Museum", 50.9322, 6.9639, "Cologne_Chocolate_Museum", "https://upload.wikimedia.org/wikipedia/commons/2/23/Schokoladenmuseum_Koeln_Aussenansicht.jpg", "An interactive museum charting the history of cocoa, complete with a massive golden chocolate fountain.", "Cologne Chocolate Museum (Schokoladenmuseum) - Visitor Guide", ["Schokoladenmuseum", "Cologne Chocolate Museum", "chocolate fountain Cologne"], 95),
  a("Cologne", "Great St. Martin Church", 50.9386, 6.9617, "Great_St._Martin_Church,_Cologne", "https://upload.wikimedia.org/wikipedia/commons/4/4b/Gro%C3%9F_Sankt_Martin_Koeln.jpg", "A historic Romanesque church famous for its unique clover-leaf crossing tower that defines the riverside skyline.", "Great St. Martin Church Cologne - Romanesque Landmark", ["Gross Sankt Martin", "Great St Martin Cologne", "Romanesque church Germany"], 89),
  a("Cologne", "Museum Ludwig", 50.9411, 6.9603, "Museum_Ludwig", "https://upload.wikimedia.org/wikipedia/commons/f/fc/Museum_Ludwig_Koeln.jpg", "A premier modern art museum housing one of Europe's largest collections of Pop Art and Picasso masterworks.", "Museum Ludwig Cologne - Modern Art & Picasso Collection", ["Museum Ludwig", "Cologne modern art", "Picasso collection Germany"], 92),
  a("Cologne", "Rhine Garden", 50.9394, 6.9619, "Rheingarten_(Cologne)", "https://upload.wikimedia.org/wikipedia/commons/d/da/Rheingarten_Koeln_Rhine_Promenade.jpg", "A beautiful waterfront park and promenade linking Cologne's Old Town directly to the edge of the Rhine.", "Rhine Garden Cologne (Rheingarten) - Waterfront Promenade", ["Rheingarten Cologne", "Rhine promenade park", "Cologne old town waterfront"], 88),
  a("Cologne", "Cologne City Hall", 50.9378, 6.9592, "Cologne_City_Hall", "https://upload.wikimedia.org/wikipedia/commons/4/41/Koeln_Rathaus_Renaissancelaube.jpg", "Germany's oldest serving city hall, featuring an elegant Renaissance loggia and an ornate Gothic tower.", "Cologne City Hall (Rathaus) - Renaissance Loggia & Tower", ["Cologne Rathaus", "Cologne City Hall", "Renaissance loggia"], 90),
  a("Cologne", "Cologne Flora", 50.9594, 6.9714, "Flora_und_Botanischer_Garten_K%C3%B6ln", "https://upload.wikimedia.org/wikipedia/commons/a/a9/Flora_Koeln_Botanischer_Garten.jpg", "A beautiful historic botanical garden featuring a majestic 19th-century iron and glass palace.", "Cologne Flora - Botanical Garden & Glass Palace Guide", ["Cologne Flora", "Cologne Botanical Garden", "glass palace Germany"], 88),
  // Frankfurt
  a("Frankfurt", "Römerberg", 50.1103, 8.6822, "R%C3%B6merberg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Frankfurt_Roemerberg_Ostzeile.jpg", "Frankfurt's picturesque historic central square, lined with iconic half-timbered houses and the landmark medieval city hall.", "Römerberg Frankfurt Guide - Historic Old Town Square", ["Römerberg", "Frankfurt Old Town", "Römer town hall"], 99),
  a("Frankfurt", "Main Tower", 50.1125, 8.6722, "Main_Tower", "https://upload.wikimedia.org/wikipedia/commons/e/e3/Frankfurt_Main_Tower_Aussichtsplattform.jpg", "A landmark 200-meter skyscraper boasting Frankfurt's highest open-air public observation deck.", "Main Tower Frankfurt - Tickets & Skyline Observation Deck", ["Main Tower Frankfurt", "Frankfurt skyscrapers", "skyline viewing deck"], 96),
  a("Frankfurt", "Goethe House", 50.1111, 8.6778, "Goethe_House", "https://upload.wikimedia.org/wikipedia/commons/4/4e/Goethe-Haus_Frankfurt_am_Main.jpg", "The historic birthplace and family home of Germany's most celebrated literary genius, Johann Wolfgang von Goethe.", "Goethe House Frankfurt - Birthplace of Johann Wolfgang von Goethe", ["Goethe House", "Johann Wolfgang von Goethe", "Frankfurt museum house"], 93),
  a("Frankfurt", "St. Bartholomew's Cathedral", 50.1106, 8.6853, "Frankfurt_Cathedral", "https://upload.wikimedia.org/wikipedia/commons/4/42/Frankfurt_am_Main_Kaiserdom.jpg", "A historic Gothic cathedral built of striking red sandstone, famed as the site for imperial elections and coronations.", "Frankfurt Cathedral (Dom Sankt Bartholomäus) - Imperial History", ["Frankfurt Dom", "St Bartholomews Cathedral", "red sandstone Gothic"], 92),
  a("Frankfurt", "Iron Footbridge", 50.1092, 8.6817, "Eiserner_Steg", "https://upload.wikimedia.org/wikipedia/commons/7/75/Frankfurt_Eiserner_Steg_Abend.jpg", "A historic late 19th-century iron pedestrian bridge offering famous views of Frankfurt's skyscrapers.", "Iron Footbridge Frankfurt (Eiserner Steg) - Love Lock Bridge", ["Eiserner Steg", "Iron Footbridge Frankfurt", "Main River bridge"], 94),
  a("Frankfurt", "Palmengarten", 50.1233, 8.6581, "Palmengarten", "https://upload.wikimedia.org/wikipedia/commons/9/90/Palmengarten_Frankfurt_Gesellschaftshaus.jpg", "One of Germany's largest botanical gardens, centered around a majestic 19th-century glass Palm House.", "Palmengarten Frankfurt - Botanical Greenhouses Guide", ["Palmengarten Frankfurt", "Frankfurt botanical garden", "Palmenhaus"], 90),
  a("Frankfurt", "Städel Museum", 50.1028, 8.6739, "St%C3%A4del_Museum", "https://upload.wikimedia.org/wikipedia/commons/2/25/Staedel_Museum_Frankfurt.jpg", "One of Germany's most elite art museums, presenting seven centuries of European masterpieces under one roof.", "Städel Museum Frankfurt - 700 Years of Art History", ["Städel Museum", "Museumsufer Frankfurt", "Old Master paintings"], 93),
  a("Frankfurt", "St. Paul's Church", 50.1111, 8.6808, "St._Paul%27s_Church,_Frankfurt", "https://upload.wikimedia.org/wikipedia/commons/e/e0/Frankfurt_Paulskirche_Aussenansicht.jpg", "A historic circular limestone building celebrated as the cradle of modern German democracy.", "St. Paul's Church Frankfurt (Paulskirche) - Democracy Cradle", ["Paulskirche", "St Pauls Church Frankfurt", "German democracy cradle"], 91),
  a("Frankfurt", "Kleinmarkthalle", 50.1119, 8.6839, "Kleinmarkthalle_Frankfurt", "https://upload.wikimedia.org/wikipedia/commons/0/0e/Kleinmarkthalle_Frankfurt_Innenansicht.jpg", "A bustling indoor market hall featuring unique regional culinary delicacies and local vendor stalls.", "Kleinmarkthalle Frankfurt - Gourmet Food Market Guide", ["Kleinmarkthalle", "Frankfurt food market", "Green Sauce Frankfurt"], 89),
  a("Frankfurt", "Alte Oper", 50.1158, 8.6719, "Alte_Oper", "https://upload.wikimedia.org/wikipedia/commons/8/87/Alte_Oper_Frankfurt_am_Main.jpg", "A grand late 19th-century Renaissance Revival concert hall fronted by a spacious public square.", "Alte Oper Frankfurt - Historic Opera House Architecture", ["Alte Oper", "Frankfurt Opera House", "Renaissance Revival architecture"], 91),
];

function adv(name, region, lat, lng, wiki, image, desc, seoTitle, keywords, score = 95) {
  return {
    name,
    region,
    latitude: lat,
    longitude: lng,
    wikipedia_url: `https://en.wikipedia.org/wiki/${wiki}`,
    image_url: image,
    description_short: desc,
    seo_title: seoTitle,
    keywords: keywords.slice(0, 5),
    seo_priority_score: score,
  };
}

const adventure_locations = [
  adv("Neuschwanstein Castle", "Bavaria", 47.5576, 10.7498, "Neuschwanstein_Castle", "https://upload.wikimedia.org/wikipedia/commons/f/f8/Schloss_Neuschwanstein_2013.jpg", "The iconic late 19th-century romantic palace built on a rugged alpine cliff.", "Neuschwanstein Castle Travel Guide - Fairy Tale Palace", ["Neuschwanstein Castle", "Bavarian Alps road trip", "King Ludwig II"], 98),
  adv("Bastei Bridge", "Saxony", 50.9622, 14.0734, "Bastei", "https://upload.wikimedia.org/wikipedia/commons/e/ee/Basteibruecke_Morgennebel.jpg", "A spectacular historic stone bridge built directly across towering natural sandstone rock columns.", "Bastei Bridge Road Trip Guide - Saxon Switzerland", ["Bastei Bridge", "Saxon Switzerland National Park", "Elbe Sandstone Mountains"], 97),
  adv("Eltz Castle", "Rhineland-Palatinate", 50.2051, 7.3366, "Eltz_Castle", "https://upload.wikimedia.org/wikipedia/commons/a/ae/Burg_Eltz_2020.jpg", "An exceptionally preserved medieval castle hidden deep within a forested valley.", "Burg Eltz Castle Guide - Medieval Marvel Hidden in Eltz Forest", ["Burg Eltz", "Eltz Castle road trip", "medieval castles Germany"], 96),
  adv("Lake Königssee", "Bavaria", 47.5542, 12.9886, "K%C3%B6nigsee", "https://upload.wikimedia.org/wikipedia/commons/9/9f/Koenigssee_Sankt_Bartholomae_2016.jpg", "A stunning crystal-clear alpine lake surrounded by towering mountain walls within Berchtesgaden National Park.", "Lake Königssee Guide - Berchtesgaden National Park Road Trip", ["Lake Königssee", "Berchtesgaden National Park", "St Bartholomew church"], 95),
  adv("Zugspitze Peak", "Bavaria", 47.4211, 10.9847, "Zugspitze", "https://upload.wikimedia.org/wikipedia/commons/3/30/Zugspitze_Blick_vom_Gipfel.jpg", "The highest mountain peak in Germany, offering breathtaking 360-degree views across four Alpine nations.", "Zugspitze Peak Travel Guide - Germany's Highest Mountain", ["Zugspitze Peak", "highest mountain Germany", "Eibsee cable car"], 97),
  adv("Rakotzbrücke (Devil's Bridge)", "Saxony", 51.5363, 14.6405, "Rakotzbr%C3%BCcke", "https://upload.wikimedia.org/wikipedia/commons/5/52/Rakotzbruecke_Kromlau_2021.jpg", "A unique 19th-century basalt stone arch bridge designed to form a perfect circle reflection in the waters below.", "Rakotzbrücke Devil's Bridge Guide - Kromlau Park Road Trip", ["Rakotzbruecke", "Devils Bridge Germany", "Kromlau Park"], 90),
  adv("Mummelsee Lake (Black Forest)", "Baden-Württemberg", 48.5975, 8.2003, "Mummelsee", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Mummelsee_Schwarzwald.jpg", "A pristine mountain lake nestled deep within the dense pine forests of the historic Black Forest.", "Mummelsee Lake Road Trip Guide - Black Forest High Road", ["Mummelsee", "Black Forest High Road", "Schwarzwald nature"], 88),
  adv("Lichtenstein Castle", "Baden-Württemberg", 48.4064, 9.2578, "Lichtenstein_Castle_(Germany)", "https://upload.wikimedia.org/wikipedia/commons/e/e1/Schloss_Lichtenstein_2019.jpg", "A stunning 19th-century Neo-Gothic knight's castle perched dramatically on a vertical rock escarpment.", "Lichtenstein Castle Guide - Swabian Jura Road Trip", ["Lichtenstein Castle", "Schloss Lichtenstein", "Swabian Jura road trip"], 89),
  adv("Chalk Cliffs of Jasmund", "Mecklenburg-Vorpommern", 54.5733, 13.6622, "Jasmund_National_Park", "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ruegen_Kreidefelsen_Koenigsstuhl.jpg", "Spectacular bright-white chalk cliffs rising dramatically above the blue waters of the Baltic Sea.", "Jasmund Chalk Cliffs Guide - Rügen Island Road Trip", ["Jasmund National Park", "Ruegen Island chalk cliffs", "Koenigsstuhl view"], 90),
  adv("Mainau Island (Lake Constance)", "Baden-Württemberg", 47.7053, 9.1953, "Mainau", "https://upload.wikimedia.org/wikipedia/commons/5/53/Mainau_Island_Flower_Gardens.jpg", "A stunning botanical island oasis in Lake Constance, famed for massive seasonal floral displays and a Baroque palace.", "Mainau Island Lake Constance - Botanical Paradise Guide", ["Mainau Island", "Lake Constance botanical", "Bodensee road trip"], 88),
];

const cities = [
  { name: "Berlin", city_name: "Berlin", region: "Berlin", latitude: 52.52, longitude: 13.405 },
  { name: "Munich", city_name: "Munich", region: "Bavaria", latitude: 48.1351, longitude: 11.582 },
  { name: "Hamburg", city_name: "Hamburg", region: "Hamburg", latitude: 53.5511, longitude: 9.9937 },
  { name: "Cologne", city_name: "Cologne", region: "North Rhine-Westphalia", latitude: 50.9375, longitude: 6.9603 },
  { name: "Frankfurt", city_name: "Frankfurt", region: "Hesse", latitude: 50.1109, longitude: 8.6821 },
  { name: "Dresden", city_name: "Dresden", region: "Saxony", latitude: 51.0504, longitude: 13.7373 },
  { name: "Nuremberg", city_name: "Nuremberg", region: "Bavaria", latitude: 49.4521, longitude: 11.0767 },
  { name: "Stuttgart", city_name: "Stuttgart", region: "Baden-Württemberg", latitude: 48.7758, longitude: 9.1829 },
  { name: "Düsseldorf", city_name: "Düsseldorf", region: "North Rhine-Westphalia", latitude: 51.2277, longitude: 6.7735 },
  { name: "Leipzig", city_name: "Leipzig", region: "Saxony", latitude: 51.3397, longitude: 12.3731 },
];

const output = {
  country: "Germany",
  phase: 1,
  hero_image: {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Berlin_-_Brandenburger_Tor_nachts.jpg",
    image_source: "Wikimedia Commons",
    image_license: "CC BY-SA 4.0",
    description: "The majestic Brandenburg Gate lit at night, representing German unity, classical architecture, and national identity.",
  },
  cities,
  attractions,
  adventure_locations,
};

writeFileSync(
  join(ROOT, "data/seeds/germany-phase1-input.json"),
  JSON.stringify(output, null, 2) + "\n"
);

console.log(
  `✓ germany-phase1-input.json: ${cities.length} cities, ${attractions.length} attractions, ${adventure_locations.length} adventures`
);
