/**
 * Find a concrete city landmark with a real photo (no maps / diagrams).
 */
import { isBadImageUrl, resolvePlaceImage } from "./wiki-image";
import { isVaguePlace, isSpecificLandmark, isCoordNearCity } from "./precise-place-filter";

const WP_API = "https://en.wikipedia.org/w/api.php";
const UA = "ViaPins/1.0 (https://viapins.com)";

async function wikiApi(params: Record<string, string>) {
  const p = new URLSearchParams({ format: "json", ...params });
  const res = await fetch(`${WP_API}?${p}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, unknown>>;
}

export async function getCityCoords(city: string, country: string) {
  for (const q of [`${city}, ${country}`, `${city} ${country}`, city]) {
    const data = await wikiApi({
      action: "query",
      list: "search",
      srsearch: q,
      srlimit: "3",
    });
    const hits =
      (data as { query?: { search?: { title?: string }[] } })?.query?.search ?? [];
    for (const h of hits) {
      const title = h.title ?? "";
      if (!title.toLowerCase().includes(city.toLowerCase().slice(0, 4))) continue;
      const geo = await wikiApi({
        action: "query",
        prop: "coordinates",
        titles: title,
        colimit: "1",
      });
      const page = Object.values(
        (geo as { query?: { pages?: Record<string, { coordinates?: { lat: number; lon: number }[] }> } })
          ?.query?.pages ?? {}
      )[0];
      const c = page?.coordinates?.[0];
      if (c) return { lat: c.lat, lng: c.lon };
    }
  }
  return null;
}

type WikiHit = {
  title: string;
  lat: number;
  lng: number;
  thumb?: string;
};

function displayName(title: string): string {
  return title.includes(",") ? title.split(",")[0].trim() : title;
}

function skipTitle(title: string): boolean {
  return /^List of|^Demographics|^History of|^Economy of|^Transport in|^Timeline of|^Geography of/i.test(
    title
  );
}

async function geosearchHits(
  city: string,
  country: string,
  existingNames: Set<string>,
  limit = 40,
  cityCoords?: { lat: number; lng: number } | null
): Promise<WikiHit[]> {
  const coords = cityCoords ?? (await getCityCoords(city, country));
  if (!coords) return [];

  const radius = country === "Malta" || country === "Monaco" ? "12000" : "18000";
  const geo = await wikiApi({
    action: "query",
    list: "geosearch",
    gsradius: radius,
    gscoord: `${coords.lat}|${coords.lng}`,
    gslimit: String(limit),
  });
  const hits =
    (geo as { query?: { geosearch?: { title: string; lat: number; lon: number }[] } })?.query
      ?.geosearch ?? [];
  if (!hits.length) return [];

  const titles = hits.map((h) => h.title).slice(0, limit);
  const imgData = await wikiApi({
    action: "query",
    titles: titles.join("|"),
    prop: "pageimages|coordinates",
    piprop: "thumbnail",
    pithumbsize: "900",
    redirects: "1",
  });

  const pagesByTitle = Object.fromEntries(
    Object.values(
      (imgData as { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } })
        ?.query?.pages ?? {}
    ).map((p) => [p.title, p])
  );

  const out: WikiHit[] = [];
  for (const h of hits) {
    const title = h.title;
    const key = title.toLowerCase();
    const displayKey = displayName(title).toLowerCase();
    if (existingNames.has(key) || existingNames.has(displayKey) || skipTitle(title)) continue;
    if (isVaguePlace(title, undefined, country, h.lat, h.lon)) continue;
    if (!isSpecificLandmark(title)) continue;
    if (!isCoordNearCity(h.lat, h.lon, coords.lat, coords.lng, country)) continue;
    const thumb = pagesByTitle[title]?.thumbnail?.source;
    if (thumb && isBadImageUrl(thumb)) continue;
    out.push({ title, lat: h.lat, lng: h.lon, thumb });
  }
  return out;
}

async function searchHits(
  city: string,
  country: string,
  existingNames: Set<string>,
  query: string,
  limit = 20,
  cityCoords?: { lat: number; lng: number } | null
): Promise<WikiHit[]> {
  const data = await wikiApi({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limit),
    prop: "pageimages|coordinates",
    piprop: "thumbnail",
    pithumbsize: "900",
    redirects: "1",
  });
  const pages = Object.values(
    (data as {
      query?: {
        pages?: Record<
          string,
          { title?: string; coordinates?: { lat: number; lon: number }[]; thumbnail?: { source?: string } }
        >;
      };
    })?.query?.pages ?? {}
  );

  const out: WikiHit[] = [];
  for (const p of pages) {
    const title = p.title ?? "";
    const key = title.toLowerCase();
    const displayKey = displayName(title).toLowerCase();
    if (
      !title ||
      existingNames.has(key) ||
      existingNames.has(displayKey) ||
      skipTitle(title)
    ) {
      continue;
    }
    const lat = p.coordinates?.[0]?.lat ?? 0;
    const lng = p.coordinates?.[0]?.lon ?? 0;
    if (isVaguePlace(title, undefined, country, lat, lng)) continue;
    if (!isSpecificLandmark(title)) continue;
    if (
      cityCoords &&
      !isCoordNearCity(lat, lng, cityCoords.lat, cityCoords.lng, country)
    ) {
      continue;
    }
    const thumb = p.thumbnail?.source;
    if (thumb && isBadImageUrl(thumb)) continue;
    out.push({ title, lat, lng, thumb });
  }
  return out;
}

export type ReplacementLandmark = {
  name: string;
  lat: number;
  lng: number;
  wikiTitle: string;
  image_url: string;
};

/** Pick another city landmark with a verified photo when the current one has only maps / no image. */
export async function findReplacementLandmark(
  city: string,
  country: string,
  existingNames: Set<string>,
  avoidUrls: Set<string>
): Promise<ReplacementLandmark | null> {
  const queries = [
    `${city} ${country} cathedral`,
    `${city} ${country} castle`,
    `${city} ${country} museum`,
    `${city} ${country} church`,
    `${city} ${country} palace`,
    `${city} ${country} monument`,
    `${city} ${country} fortress`,
    `${city} ${country} bridge`,
    `${city} ${country} tower`,
  ];
  if (process.env.RELAX_MICROSTATE === "1") {
    queries.push(
      `${city}`,
      `${city} ${country}`,
      `${city} ${country} chapel`,
      `${city} ${country} parish`,
      `${city} ${country} stadium`,
      `${city} ${country} park`,
      `${country} ${city}`
    );
  }

  const candidates: WikiHit[] = [];
  const seen = new Set<string>();

  function addHits(hits: WikiHit[]) {
    for (const h of hits) {
      const key = h.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(h);
    }
  }

  const cityCoords = await getCityCoords(city, country);

  addHits(await geosearchHits(city, country, existingNames, process.env.RELAX_MICROSTATE === "1" ? 80 : 40, cityCoords));
  const searchResults = await Promise.all(
    queries.map((q) => searchHits(city, country, existingNames, q, 12, cityCoords))
  );
  for (const hits of searchResults) addHits(hits);

  if (process.env.RELAX_MICROSTATE === "1" && candidates.length < 8) {
    const countryQueries = [
      `${country} church`,
      `${country} monastery`,
      `${country} museum`,
      `${country} fortress`,
      `${country} cathedral`,
      `${city} landmark`,
    ];
    for (const q of countryQueries) {
      addHits(await searchHits(city, country, existingNames, q, 15, cityCoords));
    }
    addHits(await geosearchHits(country, country, existingNames, 50, cityCoords));
  }

  for (const hit of candidates) {
    const name = displayName(hit.title);
    const nameKey = name.toLowerCase();
    if (
      nameKey === city.toLowerCase() ||
      nameKey === country.toLowerCase() ||
      existingNames.has(nameKey)
    ) {
      continue;
    }
    let image = hit.thumb && !isBadImageUrl(hit.thumb) ? hit.thumb : "";
    if (!image || avoidUrls.has(image)) {
      image = await resolvePlaceImage(
        {
          placeName: name,
          wikiTitle: hit.title,
          city,
          country,
          preferCommons: true,
          avoidUrls,
        },
        900
      );
    }
    if (!image || isBadImageUrl(image) || avoidUrls.has(image)) continue;
    if (hit.lat === 0 && hit.lng === 0) continue;

    return {
      name,
      lat: hit.lat,
      lng: hit.lng,
      wikiTitle: hit.title,
      image_url: image,
    };
  }

  return null;
}
