/**
 * Historical regions / political entities that Wikipedia illustrates with maps,
 * not visit-able landmarks (Taifa, Caliphate, Vega/comarca, kingdoms, etc.).
 */
const MAP_OR_NON_LANDMARK =
  /\b(taifa|caliphate|emirate|umayyad|abbasid|ottoman empire|kingdom of|duchy of|county of|province of|comarca|vega de|state of|sultanate|khanate|principality of|margraviate|voivodeship|oblast of|governorate|siege of|battle of|treaty of)\b/i;

export function isMapOrNonLandmarkPlace(name: string): boolean {
  const n = (name || "").trim();
  if (!n) return false;
  return MAP_OR_NON_LANDMARK.test(n);
}