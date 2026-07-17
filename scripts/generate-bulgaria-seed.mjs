/**
 * Generates data/seeds/bulgaria.json — 10 cities × 10 places = 100 landmarks
 * Run: node scripts/generate-bulgaria-seed.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** From src/lib/commons-images.ts PLACE_COMMONS */
const PLACE_COMMONS = {
  "sofia-1": "AlexanderNevskyCathedral-Sofia-6.jpg",
  "sofia-2": "Boyana Church 2 TB.JPG",
  "sofia-3": "Vitosha Mountains.JPG",
  "sofia-4": "National Palace of Culture Sofia.jpg",
  "plovdiv-1": "Roman Theatre Philippopolis.jpg",
  "plovdiv-2": "Plovdiv old town view.jpg",
  "vt-1": "Veliko Tarnovo (Велико Търново) - Tsarevets.JPG",
  "vt-5": "Gurko street Veliko Tarnovo.jpg",
  "bansko-3": "Rila Monastery courtyard.jpg",
  "bansko-4": "Seven Rila Lakes Bulgaria.jpg",
  "nessebar-1": "Nessebar old town aerial.jpg",
  "nessebar-2": "Church of Christ Pantocrator Nesebar.jpg",
  "varna-6": "Pobiti kamani 2.jpg",
  "varna-8": "Cape Kaliakra Bulgaria.jpg",
  "melnik-1": "Melnik 2011.jpg",
  "balchik-1": "BG TX Balchik queen Maria castle 1.jpg",
  "balchik-2": "Balchik Botanical Garden 2017 E6.jpg",
  "balchik-3": "Chapel Stella Maris l in Balchik (Bulgaria).jpg",
  "balchik-4": "Balchik (view on beach, 2004).jpg",
  "balchik-5": "Bulgaria-Balchik-05.jpg",
  "balchik-6": "Balchik (2) (1535892471).jpg",
  "balchik-7": "Balchik - The sanctuary of Cybele.JPG",
  "balchik-8": "Balchik boats.jpg",
  "balchik-9": "Balchik coast, Bulgaria.jpg",
  "balchik-10": "Balchik (51) (1536761484).jpg",
};

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

function place(name, wiki_title, lat, lng, seo_phrase, seo_keywords, commonsKey) {
  const p = { name, wiki_title, lat, lng, seo_phrase, seo_keywords };
  if (commonsKey && PLACE_COMMONS[commonsKey]) {
    p.commons_file = PLACE_COMMONS[commonsKey];
  }
  return p;
}

const cities = [
  {
    city: "Sofia",
    tags: ["spring", "summer", "autumn", "winter"],
    wiki_title: "Sofia",
    seo: citySeo("Sofia", "Bulgaria", "Alexander Nevsky Cathedral, Boyana Church, and Vitosha Mountain"),
    places: [
      place("Alexander Nevsky Cathedral", "Alexander Nevsky Cathedral, Sofia", 42.6958, 23.3328, "Alexander Nevsky Cathedral — Sofia's iconic neo-Byzantine cathedral and national symbol", ["Alexander Nevsky Cathedral Sofia", "Sofia cathedral", "Bulgaria Orthodox church"], "sofia-1"),
      place("Boyana Church", "Boyana Church", 42.6447, 23.2661, "Boyana Church — UNESCO medieval church with exceptional 13th-century frescoes", ["Boyana Church Sofia", "UNESCO Sofia", "medieval frescoes Bulgaria"], "sofia-2"),
      place("Vitosha Mountain", "Vitosha", 42.5653, 23.2833, "Vitosha Mountain — Sofia's backyard peak for hiking, skiing, and city views", ["Vitosha Mountain Sofia", "Vitosha hiking", "Sofia day trip"], "sofia-3"),
      place("National Palace of Culture", "National Palace of Culture", 42.6851, 23.3192, "National Palace of Culture — landmark congress hall and cultural hub in central Sofia", ["NDK Sofia", "National Palace of Culture", "Sofia events"], "sofia-4"),
      place("Saint Sofia Church", "Church of St. Sophia, Sofia", 42.6964, 23.3336, "Saint Sofia Church — ancient basilica that gave the capital its name", ["Saint Sofia Church", "St Sophia Sofia", "oldest church Sofia"], null),
      place("Ivan Vazov National Theatre", "Ivan Vazov National Theatre", 42.6936, 23.3269, "Ivan Vazov National Theatre — neoclassical theatre on Sofia's main boulevard", ["National Theatre Sofia", "Ivan Vazov Theatre", "Sofia culture"], null),
      place("Sofia History Museum", "Central Mineral Baths", 42.6969, 23.3247, "Sofia History Museum — Ottoman-era mineral baths housing the city's history", ["Sofia History Museum", "Central Mineral Baths", "Sofia museum"], null),
      place("Borisova Gradina", "Borisova gradina", 42.6792, 23.345, "Borisova Gradina — Sofia's largest park for lakes, gardens, and open-air concerts", ["Borisova Gradina Sofia", "Sofia park", "where to relax Sofia"], null),
      place("National Archaeological Museum", "National Archaeological Museum, Bulgaria", 42.6961, 23.3244, "National Archaeological Museum — Thracian gold treasures and Roman antiquities", ["Archaeological Museum Sofia", "Thracian gold Bulgaria", "Sofia museum"], null),
      place("St. Nedelya Church", "Saint Nedelya Church, Sofia", 42.6969, 23.3219, "St. Nedelya Church — historic cathedral at the heart of Sofia's city center", ["St Nedelya Church Sofia", "Sofia cathedral square", "Sveta Nedelya"], null),
    ],
  },
  {
    city: "Plovdiv",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Plovdiv",
    seo: citySeo("Plovdiv", "Bulgaria", "Roman theatre, Old Town, and European Capital of Culture"),
    places: [
      place("Plovdiv Roman Theatre", "Ancient theatre of Philippopolis", 42.1478, 24.7519, "Plovdiv Roman Theatre — remarkably preserved 2nd-century amphitheatre in the Old Town", ["Plovdiv Roman Theatre", "Philippopolis theatre", "Plovdiv amphitheatre"], "plovdiv-1"),
      place("Plovdiv Old Town", "Plovdiv Old Town", 42.1486, 24.7531, "Plovdiv Old Town — cobblestone lanes of Revival houses on three hills", ["Plovdiv Old Town", "Kapana Plovdiv", "Plovdiv walking tour"], "plovdiv-2"),
      place("Dzhumaya Mosque", "Dzhumaya Mosque", 42.1472, 24.7478, "Dzhumaya Mosque — 14th-century Ottoman mosque in central Plovdiv", ["Dzhumaya Mosque Plovdiv", "Plovdiv mosque", "Ottoman Plovdiv"], null),
      place("Hisar Kapia", "Hisar Kapia", 42.1489, 24.7531, "Hisar Kapia — medieval gate linking Plovdiv's fortified Old Town hills", ["Hisar Kapia Plovdiv", "Plovdiv gate", "Old Town entrance"], null),
      place("Plovdiv Roman Stadium", "Plovdiv Roman Stadium", 42.1472, 24.7486, "Plovdiv Roman Stadium — ancient chariot track beneath the modern pedestrian zone", ["Roman Stadium Plovdiv", "Plovdiv underground ruins", "Philippopolis stadium"], null),
      place("Church of Saints Constantine and Helena", "Church of Saints Constantine and Helena, Plovdiv", 42.1492, 24.7533, "Church of Saints Constantine and Helena — hilltop church with Old Town views", ["Constantine and Helena Church Plovdiv", "Plovdiv churches", "Old Town viewpoint"], null),
      place("Nebet Tepe", "Nebet Tepe", 42.1478, 24.7556, "Nebet Tepe — ancient Thracian hill with ruins and panoramic Plovdiv views", ["Nebet Tepe Plovdiv", "Plovdiv hills", "Thracian fortress Plovdiv"], null),
      place("Alyosha Monument", "Alyosha Monument", 42.1322, 24.7547, "Alyosha Monument — hilltop Soviet-era statue overlooking all of Plovdiv", ["Alyosha Monument Plovdiv", "Bunardzhik Hill", "Plovdiv viewpoint"], null),
      place("Balabanov House", "Balabanov House", 42.1483, 24.7539, "Balabanov House — ornate Revival-era house museum in the Old Town", ["Balabanov House Plovdiv", "Plovdiv house museum", "Bulgarian Revival architecture"], null),
      place("Regional Ethnographic Museum", "Regional Ethnographic Museum Plovdiv", 42.1486, 24.7528, "Regional Ethnographic Museum — traditional crafts and culture in a 19th-century house", ["Ethnographic Museum Plovdiv", "Plovdiv museum", "Bulgarian folk culture"], null),
    ],
  },
  {
    city: "Varna",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Varna",
    seo: citySeo("Varna", "Bulgaria", "Black Sea beaches, Roman baths, and Sea Garden promenade"),
    places: [
      place("Dormition Cathedral", "Dormition of the Mother of God Cathedral, Varna", 43.2075, 27.9158, "Dormition Cathedral — Varna's grand Orthodox cathedral on the city skyline", ["Dormition Cathedral Varna", "Varna cathedral", "Varna churches"], null),
      place("Sea Garden", "Sea Garden (Varna)", 43.2128, 27.9364, "Sea Garden — long seaside park with promenade, fountains, and Black Sea views", ["Sea Garden Varna", "Varna promenade", "Varna waterfront"], null),
      place("Roman Thermae", "Roman Thermae (Varna)", 43.2072, 27.9194, "Roman Thermae — among the largest Roman bath complexes on the Balkans", ["Roman Thermae Varna", "Odessos ruins", "Roman baths Bulgaria"], null),
      place("Varna Archaeological Museum", "Varna Archaeological Museum", 43.2075, 27.9183, "Varna Archaeological Museum — home of the world's oldest processed gold", ["Varna Gold Treasure", "Archaeological Museum Varna", "Varna history"], null),
      place("Assumption Cathedral", "Assumption Cathedral, Varna", 43.1997, 27.9097, "Assumption Cathedral — historic cathedral in Varna's central district", ["Assumption Cathedral Varna", "Varna old town church", "Bulgarian cathedral"], null),
      place("Pobiti Kamani", "Pobiti Kamani", 43.25, 27.6833, "Pobiti Kamani — mysterious stone forest desert near Varna", ["Pobiti Kamani", "Stone Desert Varna", "Varna day trip"], "varna-6"),
      place("Aladzha Monastery", "Aladzha Monastery", 43.2806, 27.9464, "Aladzha Monastery — medieval rock-hewn monastery in a forest gorge", ["Aladzha Monastery Varna", "rock monastery Bulgaria", "Varna nature"], null),
      place("Cape Kaliakra", "Cape Kaliakra", 43.3628, 28.4661, "Cape Kaliakra — dramatic cliff peninsula with fortress ruins on the Black Sea", ["Cape Kaliakra", "Kaliakra fortress", "Black Sea cliffs Bulgaria"], "varna-8"),
      place("Naval Museum Varna", "Naval Museum, Varna", 43.1997, 27.9269, "Naval Museum — maritime history and warships on Varna's waterfront", ["Naval Museum Varna", "Varna museum", "Black Sea navy history"], null),
      place("Varna Opera House", "Varna Opera House", 43.2072, 27.9236, "Varna Opera House — elegant fin-de-siècle opera building near the Sea Garden", ["Varna Opera", "Varna theatre", "Varna culture"], null),
    ],
  },
  {
    city: "Veliko Tarnovo",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Veliko Tarnovo",
    seo: citySeo("Veliko Tarnovo", "Bulgaria", "Tsarevets Fortress, medieval capital, and Gurko Street views"),
    places: [
      place("Tsarevets Fortress", "Tsarevets (fortress)", 43.0836, 25.6478, "Tsarevets Fortress — medieval stronghold of the Second Bulgarian Empire", ["Tsarevets Fortress", "Veliko Tarnovo castle", "Bulgarian medieval capital"], "vt-1"),
      place("Trapesitsa Fortress", "Trapesitsa", 43.0822, 25.6339, "Trapesitsa Fortress — hilltop citadel with archaeological digs across the Yantra River", ["Trapesitsa Veliko Tarnovo", "Trapesitsa ruins", "medieval Bulgaria"], null),
      place("Baldwin's Tower", "Baldwin's Tower", 43.0853, 25.6494, "Baldwin's Tower — reconstructed tower on Tsarevets with legend of a crusader king", ["Baldwin's Tower", "Tsarevets tower", "Veliko Tarnovo history"], null),
      place("Samovodska Charshia", "Samovodska Charshia", 43.0875, 25.6431, "Samovodska Charshia — craft street with workshops in Revival-era houses", ["Samovodska Charshia", "Veliko Tarnovo crafts", "Bulgarian artisan street"], null),
      place("Gurko Street", "Gurko Street", 43.0831, 25.6425, "Gurko Street — picturesque lane with houses perched above the Yantra gorge", ["Gurko Street Veliko Tarnovo", "Veliko Tarnovo viewpoint", "Yantra River views"], "vt-5"),
      place("Asen's Monument", "Asen's Monument", 43.0822, 25.6503, "Asen's Monument — equestrian statue honoring Tsar Ivan Asen II", ["Asen Monument Veliko Tarnovo", "Tsar Asen statue", "Bulgarian history monument"], null),
      place("Arbanasi", "Arbanasi, Bulgaria", 43.0986, 25.6689, "Arbanasi — hill village of fortified houses and richly frescoed churches", ["Arbanasi Bulgaria", "Arbanasi churches", "day trip Veliko Tarnovo"], null),
      place("Holy Forty Martyrs Church", "Holy Forty Martyrs Church, Veliko Tarnovo", 43.0853, 25.6528, "Holy Forty Martyrs Church — 13th-century church with royal inscriptions", ["Holy Forty Martyrs Church", "Veliko Tarnovo church", "medieval Bulgarian church"], null),
      place("Stambolov Bridge", "Stambolov Bridge", 43.0806, 25.6472, "Stambolov Bridge — stone bridge spanning the Yantra below Tsarevets", ["Stambolov Bridge Veliko Tarnovo", "Yantra River bridge", "Veliko Tarnovo photo spot"], null),
      place("Museum of Bulgarian Revival", "Museum of the Bulgarian Revival and Constituent Assembly", 43.0867, 25.6439, "Museum of Bulgarian Revival — former parliament hall of the 1879 Constitution", ["Bulgarian Revival Museum", "Constituent Assembly Veliko Tarnovo", "Veliko Tarnovo museum"], null),
    ],
  },
  {
    city: "Bansko",
    tags: ["spring", "summer", "autumn", "winter"],
    wiki_title: "Bansko",
    seo: citySeo("Bansko", "Bulgaria", "Pirin skiing, Rila Monastery, and Seven Rila Lakes"),
    places: [
      place("Bansko Old Town", "Bansko", 41.8361, 23.4883, "Bansko Old Town — cobbled lanes of stone houses at the foot of Pirin", ["Bansko Old Town", "Bansko architecture", "Bulgarian mountain town"], null),
      place("Vihren Peak", "Vihren", 41.7714, 23.4, "Vihren Peak — highest summit in Pirin National Park at 2,914 metres", ["Vihren Peak Bansko", "Pirin hiking", "Bulgaria highest peaks"], null),
      place("Rila Monastery", "Rila Monastery", 42.1333, 23.3403, "Rila Monastery — UNESCO fortress monastery and Bulgaria's spiritual heart", ["Rila Monastery", "UNESCO Bulgaria monastery", "day trip from Bansko"], "bansko-3"),
      place("Seven Rila Lakes", "Seven Rila Lakes", 42.1997, 23.3264, "Seven Rila Lakes — glacial cirque lakes linked by a classic Pirin hike", ["Seven Rila Lakes", "Rila Lakes hike", "Bulgaria mountain lakes"], "bansko-4"),
      place("Pirin National Park", "Pirin National Park", 41.8, 23.4, "Pirin National Park — UNESCO park of granite peaks, forests, and alpine meadows", ["Pirin National Park", "Pirin mountains", "UNESCO Bulgaria nature"], null),
      place("Bansko Ski Zone", "Bansko ski resort", 41.82, 23.42, "Bansko Ski Zone — Bulgaria's premier ski resort on the Pirin slopes", ["Bansko ski resort", "Bansko skiing", "Bulgaria winter sports"], null),
      place("Holy Trinity Church", "Holy Trinity Church, Bansko", 41.8356, 23.4878, "Holy Trinity Church — landmark bell tower dominating Bansko's central square", ["Holy Trinity Church Bansko", "Bansko church", "Bulgarian National Revival"], null),
      place("Nikola Vaptsarov House Museum", "Nikola Vaptsarov Museum", 41.8358, 23.4886, "Nikola Vaptsarov House Museum — birthplace of Bulgaria's beloved poet", ["Nikola Vaptsarov Museum", "Bansko museum", "Bulgarian literature"], null),
      place("Dancing Bears Park", "Dancing Bears Park Belitsa", 41.95, 23.4167, "Dancing Bears Park — sanctuary for rescued bears in the Rila foothills", ["Dancing Bears Park Belitsa", "bear sanctuary Bulgaria", "Bansko day trip"], null),
      place("Pirin Street", "Pirin Street, Bansko", 41.8364, 23.4892, "Pirin Street — lively pedestrian strip of taverns, shops, and après-ski", ["Pirin Street Bansko", "Bansko restaurants", "where to eat Bansko"], null),
    ],
  },
  {
    city: "Nessebar",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Nesebar",
    seo: citySeo("Nessebar", "Bulgaria", "UNESCO peninsula, Byzantine churches, and Black Sea charm"),
    places: [
      place("Nessebar Old Town", "Nesebar", 42.6583, 27.7361, "Nessebar Old Town — UNESCO peninsula of ancient walls and cobbled lanes", ["Nessebar Old Town", "Nesebar UNESCO", "Black Sea old town"], "nessebar-1"),
      place("Church of Christ Pantocrator", "Church of Christ Pantocrator, Nesebar", 42.6589, 27.7358, "Church of Christ Pantocrator — 14th-century brick church on the peninsula", ["Christ Pantocrator Nessebar", "Nesebar churches", "Byzantine church Bulgaria"], "nessebar-2"),
      place("Church of St. Stephen", "Church of St. Stephen, Nesebar", 42.6586, 27.7364, "Church of St. Stephen — New Metropolis church with over 1,000 frescoes", ["St Stephen Church Nessebar", "Nesebar frescoes", "medieval church Bulgaria"], null),
      place("Church of St. John Aliturgetos", "Church of St. John Aliturgetos", 42.6578, 27.7356, "Church of St. John Aliturgetos — ruined 14th-century church on the seafront", ["St John Aliturgetos Nessebar", "Nesebar ruins", "Byzantine architecture"], null),
      place("Church of St. Sofia", "Church of St. Sofia, Nesebar", 42.6581, 27.7367, "Church of St. Sofia — oldest church on the Nessebar peninsula", ["St Sofia Church Nessebar", "Old Metropolis Nesebar", "ancient church Bulgaria"], null),
      place("Nessebar Archaeological Museum", "Archaeological Museum, Nesebar", 42.6583, 27.7353, "Nessebar Archaeological Museum — Thracian and Greek artifacts from Mesembria", ["Archaeological Museum Nessebar", "Mesembria history", "Nesebar museum"], null),
      place("Nessebar Windmill", "Nesebar", 42.6592, 27.7336, "Nessebar Windmill — wooden windmill at the entrance to the old peninsula", ["Nessebar windmill", "Nesebar photo spot", "Black Sea landmark"], null),
      place("Church of Saint Paraskevi", "Church of Saint Paraskevi, Nesebar", 42.6575, 27.7361, "Church of Saint Paraskevi — compact medieval church in the old quarter", ["St Paraskevi Church Nessebar", "Nesebar churches", "Bulgarian medieval art"], null),
      place("Church of Saint Spas", "Church of Saint Spas, Nesebar", 42.6583, 27.7372, "Church of Saint Spas — 17th-century church with a richly carved iconostasis", ["St Spas Church Nessebar", "Nesebar iconostasis", "Bulgarian church art"], null),
      place("Ethnographic Museum Nessebar", "Ethnographic Museum, Nesebar", 42.6581, 27.7358, "Ethnographic Museum — traditional Black Sea life in a Revival-era house", ["Ethnographic Museum Nessebar", "Nesebar culture", "Bulgarian folk museum"], null),
    ],
  },
  {
    city: "Ruse",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Ruse, Bulgaria",
    seo: citySeo("Ruse", "Bulgaria", "Danube architecture, Freedom Square, and Roman Sexaginta Prista"),
    places: [
      place("Freedom Square", "Freedom Square, Ruse", 43.8486, 25.9547, "Freedom Square — elegant heart of Ruse with neoclassical facades", ["Freedom Square Ruse", "Ruse city center", "Little Vienna Bulgaria"], null),
      place("Dohodno Zdanie", "Dohodno Zdanie", 43.8481, 25.9539, "Dohodno Zdanie — grand profit house anchoring Ruse's main square", ["Dohodno Zdanie Ruse", "Ruse architecture", "Bulgarian neoclassical"], null),
      place("Sexaginta Prista", "Sexaginta Prista", 43.8533, 25.97, "Sexaginta Prista — Roman river fortress ruins on the Danube bank", ["Sexaginta Prista Ruse", "Roman Ruse", "Danube archaeology"], null),
      place("Danube Promenade", "Danube", 43.8472, 25.9514, "Danube Promenade — riverside walkway with views to Romania", ["Danube promenade Ruse", "Ruse riverfront", "Danube Bulgaria"], null),
      place("Pantheon of National Revival Heroes", "Pantheon of National Revival Heroes", 43.8639, 25.9711, "Pantheon of National Revival Heroes — mausoleum for Bulgaria's freedom fighters", ["Pantheon Ruse", "Bulgarian revival heroes", "Ruse monument"], null),
      place("Ruse Regional Historical Museum", "Regional Historical Museum, Ruse", 43.8492, 25.9542, "Ruse Regional Historical Museum — city history from Thracian times to today", ["Historical Museum Ruse", "Ruse museum", "Danube history Bulgaria"], null),
      place("Cathedral of the Holy Trinity", "Cathedral of the Holy Trinity, Ruse", 43.85, 25.9528, "Cathedral of the Holy Trinity — largest Orthodox church in Ruse", ["Holy Trinity Cathedral Ruse", "Ruse cathedral", "Bulgarian Orthodox church"], null),
      place("Ivanovo Rock Churches", "Rock-hewn Churches of Ivanovo", 43.7167, 25.9667, "Ivanovo Rock Churches — UNESCO cliffside frescoes near the Rusenski Lom", ["Ivanovo Rock Churches", "UNESCO Bulgaria", "day trip from Ruse"], null),
      place("Baba Novini House", "Baba Novini House", 43.8489, 25.9544, "Baba Novini House — historic house linked to Bulgaria's women's movement", ["Baba Novini House Ruse", "Ruse heritage", "Bulgarian history"], null),
      place("Lyuben Karavelov Monument", "Lyuben Karavelov", 43.8483, 25.9536, "Lyuben Karavelov Monument — tribute to a leading Bulgarian revolutionary writer", ["Lyuben Karavelov Ruse", "Bulgarian revolutionaries", "Ruse monuments"], null),
    ],
  },
  {
    city: "Koprivshtitsa",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Koprivshtitsa",
    seo: citySeo("Koprivshtitsa", "Bulgaria", "Revival house museums, April Uprising history, and Sredna Gora"),
    places: [
      place("Daskalov House", "Daskalov House", 42.6378, 24.3597, "Daskalov House — masterpiece of Bulgarian National Revival woodcarving", ["Daskalov House Koprivshtitsa", "Bulgarian Revival house", "Koprivshtitsa museum"], null),
      place("Lyutov House", "Lyutov House", 42.6381, 24.3603, "Lyutov House — colorful merchant house with painted facades and interiors", ["Lyutov House Koprivshtitsa", "Revival architecture Bulgaria", "Koprivshtitsa walking tour"], null),
      place("Dimcho Debelyanov House", "Dimcho Debelyanov House Museum", 42.6372, 24.3592, "Dimcho Debelyanov House — museum of the beloved Bulgarian poet's life", ["Dimcho Debelyanov House", "Koprivshtitsa museum", "Bulgarian poetry"], null),
      place("Osloboditel Square", "Osloboditel Square", 42.6375, 24.3594, "Osloboditel Square — central plaza lined with Revival-era landmarks", ["Osloboditel Square Koprivshtitsa", "Koprivshtitsa center", "Bulgarian old town"], null),
      place("Georgi Benkovski Memorial", "Georgi Benkovski", 42.6339, 24.3528, "Georgi Benkovski Memorial — hilltop monument to an April Uprising leader", ["Georgi Benkovski Koprivshtitsa", "April Uprising Bulgaria", "Koprivshtitsa viewpoint"], null),
      place("Lyuben Karavelov Birth House", "Lyuben Karavelov", 42.6383, 24.3611, "Lyuben Karavelov Birth House — museum of the revolutionary writer's early years", ["Lyuben Karavelov House Koprivshtitsa", "Bulgarian revolution history", "Koprivshtitsa museum"], null),
      place("Church of the Assumption", "Church of the Assumption, Koprivshtitsa", 42.6378, 24.3608, "Church of the Assumption — hilltop church overlooking the town", ["Assumption Church Koprivshtitsa", "Koprivshtitsa church", "Bulgarian Orthodox"], null),
      place("Topalova House", "Topalova House", 42.6386, 24.3606, "Topalova House — preserved merchant home showcasing 19th-century life", ["Topalova House Koprivshtitsa", "Revival house museum", "Koprivshtitsa heritage"], null),
      place("Nehkov House", "Nehkov House", 42.6375, 24.36, "Nehkov House — traditional Koprivshtitsa house with original furnishings", ["Nehkov House Koprivshtitsa", "Bulgarian folk architecture", "Koprivshtitsa museum"], null),
      place("Kalachev Bridge", "Kalachev Bridge", 42.6381, 24.3589, "Kalachev Bridge — stone bridge over the Topolnitsa at the town entrance", ["Kalachev Bridge Koprivshtitsa", "Koprivshtitsa landmark", "Sredna Gora town"], null),
    ],
  },
  {
    city: "Melnik",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Melnik, Bulgaria",
    seo: citySeo("Melnik", "Bulgaria", "sand pyramids, wine cellars, and Bulgaria's smallest town"),
    places: [
      place("Melnik", "Melnik, Bulgaria", 42.5228, 23.3928, "Melnik — Bulgaria's smallest town among towering sand pyramids", ["Melnik Bulgaria", "Melnik town", "smallest town Bulgaria"], "melnik-1"),
      place("Melnik Sand Pyramids", "Melnik Pyramids", 42.5236, 23.395, "Melnik Sand Pyramids — natural rock formations framing the wine town", ["Melnik Pyramids", "sand pyramids Bulgaria", "Melnik geology"], null),
      place("Kordopulov House", "Kordopulov House", 42.5231, 23.3936, "Kordopulov House — largest Revival house in Bulgaria with a historic wine cellar", ["Kordopulov House Melnik", "Melnik wine cellar", "Bulgarian Revival mansion"], null),
      place("Rozhen Monastery", "Rozhen Monastery", 42.5339, 23.4083, "Rozhen Monastery — medieval monastery with views over the Melnik pyramids", ["Rozhen Monastery", "Melnik day trip", "Bulgarian monastery"], null),
      place("Melnik Fortress", "Melnik Fortress", 42.5222, 23.3917, "Melnik Fortress — ruined hilltop citadel above the wine town", ["Melnik Fortress", "Slav fortress Melnik", "Melnik history"], null),
      place("St. Nicholas Church", "Church of St Nicholas, Melnik", 42.5225, 23.3925, "St. Nicholas Church — historic church in the heart of old Melnik", ["St Nicholas Church Melnik", "Melnik church", "Bulgarian Orthodox Melnik"], null),
      place("Melnik Wine Cellars", "Melnik wine", 42.5233, 23.3933, "Melnik Wine Cellars — taste indigenous Broad-leaved Melnik wine underground", ["Melnik wine", "Broad-leaved Melnik wine", "Bulgarian wine tasting"], null),
      place("Melnik History Museum", "Melnik History Museum", 42.5228, 23.3931, "Melnik History Museum — local history from Thracian times to wine fame", ["Melnik museum", "Melnik history", "Pirin foothills culture"], null),
      place("Despot Slav's Fortress", "Despot Slav", 42.5217, 23.3911, "Despot Slav's Fortress — medieval ruins linked to a local Bulgarian ruler", ["Despot Slav fortress", "Melnik medieval ruins", "Bulgarian fortress"], null),
      place("Melnik Viewpoint", "Melnik Pyramids", 42.525, 23.3967, "Melnik Viewpoint — panoramic lookout over sand pyramids and vineyards", ["Melnik viewpoint", "Melnik photo spot", "Pirin wine region"], null),
    ],
  },
  {
    city: "Balchik",
    tags: ["spring", "summer", "autumn"],
    wiki_title: "Balchik",
    seo: citySeo("Balchik", "Bulgaria", "Queen Marie's Palace, botanical garden, and Black Sea cliffs"),
    places: [
      place("Balchik Palace", "Balchik Palace", 43.4228, 28.1597, "Balchik Palace — seaside retreat of Queen Marie with minarets and terraces", ["Balchik Palace", "Queen Marie palace", "Balchik Romania heritage"], "balchik-1"),
      place("Balchik Botanical Garden", "Balchik Botanical Garden", 43.4231, 28.1589, "Balchik Botanical Garden — cactus collection and cliffside plantings by the palace", ["Balchik Botanical Garden", "Balchik cactus garden", "Black Sea botanic garden"], "balchik-2"),
      place("St. Nicholas Chapel", "St. Nicholas Chapel, Balchik", 43.4225, 28.1592, "St. Nicholas Chapel — white chapel within the Balchik palace complex", ["St Nicholas Chapel Balchik", "Balchik palace chapel", "Black Sea chapel"], "balchik-3"),
      place("Balchik Beach", "Balchik", 43.4156, 28.1683, "Balchik Beach — rocky coves and clear water below the palace cliffs", ["Balchik beach", "Black Sea beaches Balchik", "Balchik swimming"], "balchik-4"),
      place("Ethnographic Museum Balchik", "Ethnographic Museum, Balchik", 43.4183, 28.165, "Ethnographic Museum — traditional Black Sea fishing and farming life", ["Ethnographic Museum Balchik", "Balchik culture", "Bulgarian folk museum"], "balchik-5"),
      place("History Museum Balchik", "History Museum, Balchik", 43.4189, 28.1656, "History Museum Balchik — Thracian, Greek, and Ottoman heritage of the coast", ["History Museum Balchik", "Balchik archaeology", "Black Sea history"], "balchik-6"),
      place("Temple of Cybele", "Temple of Cybele, Balchik", 43.4217, 28.1622, "Temple of Cybele — ancient sanctuary ruins near the palace gardens", ["Temple of Cybele Balchik", "ancient Balchik", "Thracian sanctuary"], "balchik-7"),
      place("Balchik Marina", "Balchik", 43.4147, 28.17, "Balchik Marina — yacht harbor at the foot of the palace headland", ["Balchik marina", "Balchik harbor", "Black Sea sailing Bulgaria"], "balchik-8"),
      place("Ak Yaila", "Balchik", 43.425, 28.1556, "Ak Yaila — quiet headland with sea views north of Balchik", ["Ak Yaila Balchik", "Balchik coastal walk", "Black Sea cliffs"], "balchik-9"),
      place("Balchik Lighthouse", "Balchik", 43.4139, 28.1728, "Balchik Lighthouse — coastal beacon on the rocky northern shore", ["Balchik lighthouse", "Black Sea lighthouse", "Balchik coast"], "balchik-10"),
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
  title: "Bulgaria Road Trip Adventure",
  subtitle:
    "10-day country-wide road trip through Rila peaks, Shipka Pass, communist monuments, Thracian tombs, and Black Sea cliffs — car required.",
  wiki_title: "Bulgaria",
  totalDays: 10,
  seo: {
    title: "Bulgaria Road Trip — 10-Day Adventure Itinerary | Car Travel Guide",
    description:
      "Plan a 10-day Bulgaria road trip: Rila Monastery, Seven Rila Lakes, Shipka Pass, Buzludzha, Belogradchik Rocks, Madara Rider, Kazanlak tomb, Sozopol, Cape Kaliakra, and Etara. GPS stops, hidden gems, car-only routes.",
    intro:
      "Want to explore Bulgaria beyond the cities? This 10-day Adventure route takes you through the country's most spectacular road-trip destinations — from Rila monasteries and Balkan passes to Thracian tombs and Black Sea capes. Add stops to your cart and navigate each location in Google Maps.",
    keywords: [
      "Bulgaria road trip",
      "Bulgaria adventure itinerary",
      "Bulgaria by car",
      "10 day Bulgaria tour",
      "Rila Monastery road trip",
      "hidden gems Bulgaria",
    ],
  },
  places: [
    advPlace("Rila Monastery", "Rila Monastery", "Kyustendil Province", 42.1333, 23.3403, 1, ["monument", "culture"], "Rila Monastery — UNESCO fortress monastery in the Rila Mountains", ["Rila Monastery", "UNESCO Bulgaria", "Bulgaria monastery road trip"]),
    advPlace("Seven Rila Lakes", "Seven Rila Lakes", "Kyustendil Province", 42.1997, 23.3264, 2, ["nature", "viewpoint"], "Seven Rila Lakes — iconic glacial lake circuit in the Rila range", ["Seven Rila Lakes", "Rila hiking Bulgaria", "mountain lakes road trip"]),
    advPlace("Shipka Pass", "Shipka Pass", "Stara Zagora Province", 42.7178, 25.3264, 3, ["viewpoint", "monument"], "Shipka Pass — historic Balkan pass with Freedom Monument views", ["Shipka Pass", "Shipka monument", "Balkan Mountains Bulgaria"]),
    advPlace("Buzludzha", "Buzludzha", "Stara Zagora Province", 42.7361, 25.3939, 4, ["monument", "hidden_gem"], "Buzludzha — abandoned UFO-shaped communist monument on a mountain peak", ["Buzludzha monument", "communist Bulgaria", "abandoned monument Balkans"]),
    advPlace("Belogradchik Rocks", "Belogradchik Rocks", "Vidin Province", 43.6264, 22.6797, 5, ["nature", "viewpoint"], "Belogradchik Rocks — surreal sandstone formations and hilltop fortress", ["Belogradchik Rocks", "Belogradchik fortress", "natural wonders Bulgaria"]),
    advPlace("Madara Rider", "Madara Rider", "Shumen Province", 43.2775, 27.1186, 6, ["monument", "ruins"], "Madara Rider — UNESCO cliff relief of a horseman from the 8th century", ["Madara Rider", "UNESCO Bulgaria", "Madara plateau"]),
    advPlace("Thracian Tomb of Kazanlak", "Thracian Tomb of Kazanlak", "Stara Zagora Province", 42.6256, 25.3986, 7, ["ruins", "culture"], "Thracian Tomb of Kazanlak — UNESCO tomb with vivid Hellenistic frescoes", ["Thracian Tomb Kazanlak", "Valley of Thracian Kings", "UNESCO tomb Bulgaria"]),
    advPlace("Sozopol", "Sozopol", "Burgas Province", 42.4178, 27.6947, 8, ["culture", "hidden_gem"], "Sozopol — ancient Black Sea town of wooden houses and seaside ruins", ["Sozopol Bulgaria", "ancient Apollonia", "Black Sea old town"]),
    advPlace("Cape Kaliakra", "Cape Kaliakra", "Dobrich Province", 43.3628, 28.4661, 9, ["nature", "viewpoint"], "Cape Kaliakra — dramatic cliff fortress on the northern Black Sea coast", ["Cape Kaliakra", "Kaliakra fortress", "Black Sea cliffs Bulgaria"]),
    advPlace("Etara", "Etar Architectural-Ethnographic Complex", "Gabrovo Province", 42.8103, 25.3528, 10, ["culture", "hidden_gem"], "Etara — open-air museum of Bulgarian crafts and water-powered workshops", ["Etara Gabrovo", "Bulgarian ethnographic museum", "open air museum Bulgaria"]),
  ],
};

const seed = {
  version: 1,
  country: "Bulgaria",
  published: true,
  cities,
  adventure,
};

const outPath = join(__dirname, "..", "data", "seeds", "bulgaria.json");
writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");

// Minimal adventure file for runtime (wiki/images resolved on page load)
const advOutDir = join(__dirname, "..", "data", "adventures");
mkdirSync(advOutDir, { recursive: true });
const advCollection = {
  country: "Bulgaria",
  slug: "bulgaria",
  title: adventure.title,
  subtitle: adventure.subtitle,
  heroImage: "",
  wiki_title: adventure.wiki_title,
  totalDays: adventure.totalDays,
  seo: adventure.seo,
  places: adventure.places.map((p, i) => ({
    id: `bulgaria-adv-${i + 1}`,
    name: p.name,
    country: "Bulgaria",
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
writeFileSync(join(advOutDir, "bulgaria.json"), JSON.stringify(advCollection, null, 2), "utf8");

const placeCount = cities.reduce((n, c) => n + c.places.length, 0);
console.log(`✓ Generated ${outPath}`);
console.log(`  ${cities.length} cities × 10 places = ${placeCount} landmarks`);
console.log(`  Adventure: ${adventure.places.length} stops × ${adventure.totalDays} days`);
