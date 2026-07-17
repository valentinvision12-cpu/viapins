/**
 * Verified Wikimedia Commons filenames for seed generators (optional overrides).
 * Runtime image resolution uses place name + city + country automatically.
 */

export const CITY_COMMONS: Record<string, string> = {
  "demo-sofia": "Alexander Nevsky Cathedral, Sofia (by Pudelek).JPG",
  "demo-plovdiv": "Roman Theatre Plovdiv 3.jpg",
  "demo-varna":
    "Catedral de la Dormición de la Madre de Dios, Varna, Bulgaria, 2016-05-27, DD 109-111 HDR.jpg",
  "demo-vt": "Veliko Tarnovo (Велико Търново) - Tsarevets.JPG",
  "demo-bansko": "Vihren & Kutelo Pirin Mountains Bulgaria 2025.jpg",
  "demo-nessebar": "Church of Christ Pantocrator Nesebar.jpg",
  "demo-ruse": "Danubio a su paso por Ruse, Bulgaria, 2016-05-27, DD 01.jpg",
  "demo-koprivshtitsa": "Koprivshtitsa 009.jpg",
  "demo-melnik": "Melnik 2011.jpg",
  "demo-balchik": "BG TX Balchik queen Maria castle 1.jpg",
};

/** Optional seed overrides — keyed by generator id (e.g. "sofia-1") */
export const PLACE_COMMONS: Record<string, string> = {
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
