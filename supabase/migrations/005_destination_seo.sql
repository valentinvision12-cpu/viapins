-- Add SEO metadata column to destinations (city-level long-tail keywords)
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.destinations.seo IS
  'Per-locale SEO: { "en": { "title", "description", "intro", "h1_subtitle", "keywords": [] } }';
