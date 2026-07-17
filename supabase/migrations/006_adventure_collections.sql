-- Adventure road-trip collections (one row per country, places in JSONB)
-- Seed template: data/templates/adventure-section.template.json
-- Upload: npm run import:adventure -- {country-slug}  OR  /admin/adventures → Качи
CREATE TABLE IF NOT EXISTS public.adventure_collections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country     TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  title       TEXT        NOT NULL,
  subtitle    TEXT        NOT NULL,
  hero_image  TEXT        DEFAULT '',
  wiki_title  TEXT,
  total_days  INTEGER     NOT NULL DEFAULT 10,
  seo         JSONB       NOT NULL DEFAULT jsonb_build_object(),
  places      JSONB       NOT NULL DEFAULT jsonb_build_array(),
  published   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS adventure_collections_country_lower_idx
  ON public.adventure_collections (lower(country));

ALTER TABLE public.adventure_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adventure: public read published"
  ON public.adventure_collections FOR SELECT
  USING (published = true);

CREATE POLICY "adventure: admins manage"
  ON public.adventure_collections FOR ALL
  USING (public.is_admin());

COMMENT ON TABLE public.adventure_collections IS 'One road-trip adventure per country (10 stops × 10 days).';
COMMENT ON COLUMN public.adventure_collections.places IS 'JSONB array of stops: id, name, lat, lng, day, tags, image_url, translations.';
COMMENT ON COLUMN public.adventure_collections.seo IS 'JSONB: title, description, intro, keywords.';
