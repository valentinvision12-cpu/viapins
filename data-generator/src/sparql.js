import { CONFIG } from "./config.js";
import { cacheRead, cacheWrite, fetchWithRetry, sleep } from "./utils.js";

export async function sparqlQuery(query, cacheKey = null) {
  if (cacheKey) {
    const cached = cacheRead(cacheKey);
    if (cached) return cached;
  }

  const url = `${CONFIG.wikidataSparql}?format=json&query=${encodeURIComponent(query)}`;
  await sleep(CONFIG.sparqlDelayMs);
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/sparql-results+json" },
  });
  const data = await res.json();
  const bindings = data?.results?.bindings ?? [];
  if (cacheKey) cacheWrite(cacheKey, bindings);
  return bindings;
}

export function bindingValue(row, key) {
  return row[key]?.value ?? null;
}

export function bindingLabel(row, key) {
  const v = bindingValue(row, key);
  if (!v) return null;
  if (v.endsWith("/-")) return null;
  return v;
}
