import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { CONFIG } from "./config.js";

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function wikipediaUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, "_"))}`;
}

export function commonsFileUrl(fileName, width = 900) {
  const name = String(fileName).replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}

export function wikidataUrl(id) {
  return `https://www.wikidata.org/wiki/${id}`;
}

export function parseWikidataId(uri) {
  if (!uri) return null;
  const m = String(uri).match(/(Q\d+)$/);
  return m ? m[1] : null;
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function cacheRead(key) {
  ensureDir(CONFIG.cacheDir);
  const path = join(CONFIG.cacheDir, `${key}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function cacheWrite(key, data) {
  ensureDir(CONFIG.cacheDir);
  const path = join(CONFIG.cacheDir, `${key}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

export async function fetchWithRetry(url, options = {}, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": CONFIG.userAgent,
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });
      if (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504) {
        await sleep(CONFIG.apiDelayMs * (i + 3));
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${url.slice(0, 100)}`);
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(CONFIG.apiDelayMs * (i + 2));
    }
  }
  throw new Error("fetchWithRetry exhausted");
}

export async function fetchJson(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.json();
}

export async function mapPool(items, fn, concurrency = 2) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}
