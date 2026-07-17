# Europe Travel Data Generator

Standalone Node.js pipeline that builds **`output/europe.json`** from **Wikidata** and **Wikimedia Commons** (CC0 / Public Domain images only).

Does **not** modify the main travel-magazine website.

## Quick start

```bash
cd data-generator
node run_all.js
```

Smoke test (3 countries):

```bash
LIMIT_COUNTRIES=3 node run_all.js
```

Optional AI SEO (titles/descriptions only — never geographic data):

```bash
ENABLE_AI_SEO=1 OPENAI_API_KEY=sk-... node run_all.js
```

## Output

`output/europe.json`:

```json
{
  "meta": { "version": 1, "generated_at": "...", "source": "wikidata-sparql + wikimedia-commons" },
  "countries": [
    {
      "country": "France",
      "wikidata_id": "Q142",
      "cities": [ /* 10 */ ],
      "adventure_locations": [ /* 10 */ ]
    }
  ]
}
```

Per country: **10 cities** (coordinates + Wikipedia) and **10 adventure locations** (nature/outdoor, with free-license images).

No per-city POI/attraction lists — only cities and country-level adventures.

### Image sources (tried in order)

1. **Wikidata P18** — official image property
2. **Wikidata P373** — Commons category members
3. **Wikipedia pageimage** — lead infobox photo
4. **Wikipedia gallery** — all files linked on the article
5. **Wikimedia Commons search** — name + city + country
6. **Commons depicts (P180)** — structured link to Wikidata item
7. **Openverse API** — CC0/CC BY/CC BY-SA/PDM aggregator (Flickr, Wikimedia, etc.)

Licenses allowed: **Public Domain, CC0, CC BY, CC BY-SA, GFDL** (same as the main website).

Disable Openverse: `DISABLE_OPENVERSE=1 node run_all.js`

## Architecture

| File | Role |
|------|------|
| `run_all.js` | Single entry point |
| `src/extractor.js` | Wikidata SPARQL (countries, cities, POIs) |
| `src/image-resolver.js` | Commons license check (CC0/PD only) |
| `src/validator.js` | Required-field validation + selection |
| `src/seo-generator.js` | Template SEO; optional OpenAI batch |
| `src/builder.js` | Per-country assembly |
| `cache/` | SPARQL + image metadata cache (resumable) |

## Validation rules

An item is kept only if it has:

- English Wikipedia sitelink
- Coordinates (P625)
- Wikidata ID
- Wikimedia image with **CC0** or **Public Domain** license

Otherwise it is skipped and the next candidate is used.

## Performance

- SPARQL responses cached under `cache/`
- Rate-limited requests (Wikidata Query Service etiquette)
- 2 countries processed in parallel (configurable in `src/config.js`)

Full Europe run may take **many hours** due to API rate limits and strict image validation.

### Adventure image coverage

Adventure locations require a free-license image (7 sources). Small countries may yield fewer than 10 — warnings are logged.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `LIMIT_COUNTRIES` | `0` (all) | Cap countries for testing |
| `ENABLE_AI_SEO` | off | Enable OpenAI SEO layer |
| `OPENAI_API_KEY` | — | Required if AI SEO enabled |

## Import into website

Copy `output/europe.json` and map fields to your existing seed importer, or build a one-time converter script in the main repo (outside this folder).
