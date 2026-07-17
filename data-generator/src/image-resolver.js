import { CONFIG } from "./config.js";
import { cacheRead, cacheWrite, commonsFileUrl, fetchJson, sleep } from "./utils.js";

const BAD_FILE =
  /icon|logo|map|coat|seal|diagram|svg|flag|locator|location.?map|relief|sketch|blank|orthophoto|satellite|aerial|openstreetmap|osm-|route.?map|topographic|emblem|banner|placeholder|collage|montage|symbol|pictogram|vector|pdf|reflection|nude|naked|erotic|nsfw|porn|fetish|occult|satanic|satan|baphomet|pentagram|\bdemon\b/i;

function licenseOk(license) {
  if (!license?.trim()) return true;
  return CONFIG.allowedLicenses.test(license.toLowerCase());
}

function pack(file, license, source) {
  const clean = file.replace(/^File:/, "");
  return {
    commons_file: clean,
    image_url: commonsFileUrl(clean),
    image_source: source,
    image_license: license.replace(/<[^>]+>/g, "").trim() || "Unknown",
  };
}

function packUrl(url, license, source, commons_file = null) {
  return {
    commons_file,
    image_url: url,
    image_source: source,
    image_license: license,
  };
}

/**
 * Multi-source image resolver (same spirit as travel-magazine wiki-image.ts).
 */
export async function resolveImage(place) {
  const cacheKey = `img-v3-${place.id}`;
  const cached = cacheRead(cacheKey);
  if (cached !== null && cached !== undefined) return cached || null;

  const sources = [
    () => fromWikidataP18(place),
    () => fromWikidataCommonsCategory(place),
    () => fromCommonsFile(place.commons_file, "Wikimedia Commons (SPARQL P18)"),
    () => fromWikipediaPageImage(place.wikipedia_title),
    () => fromWikipediaGallery(place.wikipedia_title),
    () => fromCommonsSearch(place.name, place.city, place.country),
    () => fromCommonsDepictsWikidata(place.id),
    () => fromOpenverse(place),
  ];

  for (const fn of sources) {
    try {
      const result = await fn();
      if (result) {
        cacheWrite(cacheKey, result);
        return result;
      }
    } catch {
      /* try next source */
    }
  }

  cacheWrite(cacheKey, false);
  return null;
}

// ─── 1. Wikidata P18 ─────────────────────────────────────────────────────────

async function fromWikidataP18(place) {
  if (!place.id) return null;
  const cacheKey = `wd-p18-${place.id}`;
  const cached = cacheRead(cacheKey);
  if (cached !== undefined) return cached || null;

  await sleep(CONFIG.apiDelayMs);
  const url = `${CONFIG.wikidataApi}?action=wbgetentities&format=json&props=claims&ids=${place.id}`;
  const data = await fetchJson(url);
  const file = data?.entities?.[place.id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!file) {
    cacheWrite(cacheKey, false);
    return null;
  }
  const result = await validateCommonsFile(file, "Wikimedia Commons (Wikidata P18)");
  cacheWrite(cacheKey, result || false);
  return result;
}

// ─── 2. Wikidata P373 Commons category ───────────────────────────────────────

async function fromWikidataCommonsCategory(place) {
  if (!place.id) return null;
  await sleep(CONFIG.apiDelayMs);
  const url = `${CONFIG.wikidataApi}?action=wbgetentities&format=json&props=claims&ids=${place.id}`;
  const data = await fetchJson(url);
  const category =
    data?.entities?.[place.id]?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
  if (!category) return null;
  return listCommonsCategoryFiles(category, "Wikimedia Commons (category)");
}

async function listCommonsCategoryFiles(category, sourceLabel) {
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.commonsApi}?action=query&format=json&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmtype=file&cmlimit=20`;
  try {
    const data = await fetchJson(url);
    const members = data?.query?.categorymembers || [];
    for (const m of members) {
      const file = m.title?.replace(/^File:/, "");
      if (!file || BAD_FILE.test(file)) continue;
      const valid = await validateCommonsFile(file, sourceLabel);
      if (valid) return valid;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── 3–4. Wikipedia pageimage + gallery ───────────────────────────────────────

async function fromWikipediaPageImage(wikiTitle) {
  if (!wikiTitle) return null;
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.wikipediaApi}?action=query&format=json&redirects=1&prop=pageimages|pageprops&piprop=original|thumbnail&pithumbsize=900&titles=${encodeURIComponent(wikiTitle)}`;
  try {
    const data = await fetchJson(url);
    const page = Object.values(data?.query?.pages || {})[0];
    if (!page || page.missing !== undefined) return null;
    const file =
      page.original?.source
        ? decodeURIComponent(page.original.source.split("/").pop())
        : page.thumbnail?.source
          ? decodeURIComponent(page.thumbnail.source.split("/").pop().split("?")[0])
          : page.pageprops?.page_image_free;
    if (!file) return null;
    return validateCommonsFile(file, "Wikipedia pageimage");
  } catch {
    return null;
  }
}

async function fromWikipediaGallery(wikiTitle) {
  if (!wikiTitle) return null;
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.wikipediaApi}?action=query&format=json&redirects=1&prop=images&imlimit=40&titles=${encodeURIComponent(wikiTitle)}`;
  try {
    const data = await fetchJson(url);
    const page = Object.values(data?.query?.pages || {})[0];
    const imgs = page?.images?.map((i) => i.title?.replace(/^File:/, "")) || [];
    for (const file of imgs) {
      if (BAD_FILE.test(file)) continue;
      const valid = await validateCommonsFile(file, "Wikipedia gallery");
      if (valid) return valid;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── 5. Commons text search (multiple queries) ───────────────────────────────

async function fromCommonsSearch(name, city, country) {
  const queries = [
    city && country ? `${name} ${city} ${country}` : "",
    country ? `${name} ${country}` : "",
    city ? `${name} ${city}` : "",
    name,
  ].filter(Boolean);

  for (const q of queries) {
    const hit = await commonsGeneratorSearch(q);
    if (hit) return hit;
  }
  return null;
}

async function commonsGeneratorSearch(term) {
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.commonsApi}?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}&gsrlimit=15&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=900`;
  try {
    const data = await fetchJson(url);
    const pages = data?.query?.pages;
    if (!pages) return null;
    for (const p of Object.values(pages)) {
      const title = p.title?.replace(/^File:/, "");
      if (!title || BAD_FILE.test(title)) continue;
      const info = p.imageinfo?.[0];
      const lic =
        info?.extmetadata?.LicenseShortName?.value ||
        info?.extmetadata?.UsageTerms?.value ||
        "";
      if (!licenseOk(lic)) continue;
      return pack(title, lic, "Wikimedia Commons (search)");
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── 6. Commons files depicting Wikidata item (P180) ───────────────────────────

async function fromCommonsDepictsWikidata(wikidataId) {
  if (!wikidataId) return null;
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.commonsApi}?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(`haswbstatement:P180=${wikidataId}`)}&gsrlimit=12&prop=imageinfo&iiprop=extmetadata&iiurlwidth=900`;
  try {
    const data = await fetchJson(url);
    const pages = data?.query?.pages;
    if (!pages) return null;
    for (const p of Object.values(pages)) {
      const title = p.title?.replace(/^File:/, "");
      if (!title || BAD_FILE.test(title)) continue;
      const lic = p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || "";
      if (!licenseOk(lic)) continue;
      return pack(title, lic, "Wikimedia Commons (depicts)");
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── 7. Openverse (CC aggregator — Flickr, Wikimedia, etc.) ─────────────────

async function fromOpenverse(place) {
  if (!CONFIG.enableOpenverse) return null;
  const q = [place.name, place.city, place.country].filter(Boolean).join(" ");
  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.openverseApi}?q=${encodeURIComponent(q)}&license=cc0,pdm,by,by-sa&page_size=10&format=json`;
  try {
    const data = await fetchJson(url);
    for (const hit of data?.results || []) {
      if (!hit.url || !hit.license) continue;
      const lic = `${hit.license}${hit.license_version ? ` ${hit.license_version}` : ""}`;
      if (!licenseOk(lic)) continue;
      if (/svg|icon|logo|map/i.test(hit.url)) continue;
      return packUrl(
        hit.url,
        lic,
        `Openverse (${hit.source || "unknown"})`,
        hit.identifier || null
      );
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── Commons file validation ─────────────────────────────────────────────────

async function fromCommonsFile(fileName, source) {
  if (!fileName) return null;
  return validateCommonsFile(fileName, source);
}

export async function validateCommonsFile(fileName, source = "Wikimedia Commons") {
  if (!fileName || BAD_FILE.test(fileName)) return null;
  const clean = fileName.replace(/^File:/, "");
  const meta = await getCommonsMetadata(clean);
  if (!meta) return null;
  return pack(clean, meta.license, source);
}

async function getCommonsMetadata(fileName) {
  const cacheKey = `commons-meta-${fileName}`;
  const cached = cacheRead(cacheKey);
  if (cached !== undefined) return cached || null;

  await sleep(CONFIG.apiDelayMs);
  const url =
    `${CONFIG.commonsApi}?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(fileName)}`;
  try {
    const data = await fetchJson(url);
    const pages = data?.query?.pages;
    if (!pages) {
      cacheWrite(cacheKey, false);
      return null;
    }
    const page = Object.values(pages)[0];
    if (page?.missing !== undefined) {
      cacheWrite(cacheKey, false);
      return null;
    }
    const ext = page?.imageinfo?.[0]?.extmetadata;
    const license =
      ext?.LicenseShortName?.value ||
      ext?.UsageTerms?.value ||
      ext?.License?.value ||
      "";
    if (!licenseOk(license)) {
      cacheWrite(cacheKey, false);
      return null;
    }
    const out = { license: license.replace(/<[^>]+>/g, "").trim() };
    cacheWrite(cacheKey, out);
    return out;
  } catch {
    cacheWrite(cacheKey, false);
    return null;
  }
}

export async function resolveImagesBatch(places, concurrency = 3) {
  const out = [];
  let idx = 0;
  async function worker() {
    while (idx < places.length) {
      const i = idx++;
      out[i] = await resolveImage(places[i]);
    }
  }
  const workers = Math.min(concurrency, places.length);
  await Promise.all(Array.from({ length: workers }, worker));
  return out;
}
