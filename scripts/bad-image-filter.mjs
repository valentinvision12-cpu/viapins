/** Keep in sync with src/lib/wiki-image.ts BAD_IMAGE / isBadImageUrl */

export const BAD_IMAGE =
  /icon|flag|logo|map|coat|seal|diagram|svg|plan|chart|graph|locator|location.?map|relief|sketch|blank|orthophoto|satellite|aerial.?view|openstreetmap|osm-|route.?map|topographic|emblem|banner|placeholder|thumbnail|collage|montage|distribution|outline|boundary|infobox|symbol|pictogram|clip.?art|vector|reflection|nude|naked|erotic|nsfw|porn|fetish|occult|satanic|satan|baphomet|pentagram|\bdemon\b|toilet|bathroom|restroom|\bwc\b|lavatory|urinal|\bsink\b|faucet|selfie|self-portrait|portrait|headshot|close.?up|closeup|mirror.?selfie|blurry|out.?of.?focus|low.?res|pixelated|screenshot|screen.?shot|\bIMG_\d{3,}|\bDSC[_-]?\d{3,}|\bP\d{7,}\b|makeup|hair.?salon|hotel.?room|bedroom|car.?interior|license.?plate|food.?court|restaurant.?interior|pushpin|push.?pin|red.?dot|blue.?dot|marker.?map|dot.?map|highlighted|geographic.?map|political.?map|physical.?map|administrative.?map|counties.?of|provinces.?of|departments.?of|regions.?of|municipalities.?of|location.?in|\bin_[a-z]|_in_[a-z]|carte_|_carte|karte_|_karte|mapa_|_mapa|mappa_|_mappa|lageplan|situation.?plan|floor.?plan|site.?plan|schematic|geo.?map|atlas.?map|island.?map|city.?map|street.?map|road.?map|transport.?map|metro.?map|subway.?map|bus.?map|train.?map|rail.?map|harbour.?map|harbor.?map|port.?map|airport.?map|unesco.?map|heritage.?map|national.?map|country.?map|world.?map|europe.?map|relief.?map|terrain.?map|elevation.?map|contour|isohyet|isotherm/i;

export const OFF_TOPIC_IMAGE =
  /\b(selfie|portrait|headshot|wedding|party|model|makeup|bikini|swimsuit|toilet|bathroom|restroom|lavatory|urinal|mirror)\b/i;

function decodePath(url) {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname + u.search).replace(/\+/g, " ");
  } catch {
    return url;
  }
}

export function isBadImageCandidate(title = "", url = "") {
  const hay = `${title} ${decodePath(url)}`.toLowerCase();
  return BAD_IMAGE.test(hay) || OFF_TOPIC_IMAGE.test(hay);
}

export function isBadImageUrl(url) {
  if (!url?.trim()) return true;
  return isBadImageCandidate("", url);
}
