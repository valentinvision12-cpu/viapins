/**
 * Curated Unsplash travel/landmark photo IDs used as fallbacks when a
 * place or destination has no image (or a broken one).
 * All photos are free-to-use under the Unsplash license.
 */
const TRAVEL_PHOTOS = [
  "1476514525535-07fb3b4ae5f1", // Paris river
  "1516483638261-f4dbaf036963", // Italian coast
  "1499856871958-5b9357976b82", // city skyline at dusk
  "1477959858617-67f85cf4f1df", // European old town
  "1514565131-ffa0098ad05b", // stone archway
  "1536514498073-a8bbd87a6f65", // cobblestone alley
  "1470004914212-4202a08b75af", // cathedral interior
  "1548013146-72479768bada", // landmark at golden hour
  "1526397751294-331021109fbd", // canal city
  "1570168007204-dfb528c6958f", // night lights
  "1467269204519-dc71e2e97cc4", // mountain road
  "1504150558240-0b4fd8946624", // beach cliff view
  "1537996134247-caefead8b70b", // historic square
  "1529260830199-42c24126f198", // misty forest
  "1441974231531-c6227db76b6e", // green valley
  "1506905925346-21bda4d32df4", // alpine lake
  "1534430480872-3498386e7856", // gothic architecture
  "1533929736458-ca588d08c8be", // old port
  "1582407947304-fd86f28320c7", // ancient ruins
  "1551649001-7a2d26fa5b0f", // ornate ceiling
  "1568454537842-d933259bb558", // wine country vineyard
  "1543536448-d209d2d498e8", // monastery hillside
  "1519923041107-fe5e37c2aad9", // medieval castle
  "1458442510314-b3e534c94b6e", // turquoise sea
  "1571406384686-71d8b8898575", // colourful buildings
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns a deterministic, beautiful Unsplash fallback URL for a given seed
 * (city name, place name, etc.). Always returns the same URL for the same seed.
 */
export function fallbackImageUrl(seed: string, width = 800, height = 560): string {
  const idx = hashStr(seed) % TRAVEL_PHOTOS.length;
  const id = TRAVEL_PHOTOS[idx];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}
