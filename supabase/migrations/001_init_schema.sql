-- ============================================================
-- TRAVEL MAGAZINE — DATABASE SCHEMA
-- Migration: 001_init_schema
-- Run in: Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles (extends auth.users) ────────────────────────────────────────────
-- Note: Never reference auth.users directly in application code.
-- Always go through this table.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  is_admin    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Public user profiles, extends auth.users.';
COMMENT ON COLUMN public.profiles.is_admin IS 'Set to true manually for admin users.';

-- ── destinations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.destinations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country     TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  published   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.destinations IS 'Travel destinations (city + country pairs).';
COMMENT ON COLUMN public.destinations.tags IS 'Array of season/theme tags, e.g. {summer, beach}.';
COMMENT ON COLUMN public.destinations.published IS 'Only published destinations appear on the public site.';

-- ── places (landmarks) ───────────────────────────────────────────────────────
-- translations JSONB schema:
-- {
--   "en": { "description": "...", "wiki_text": "..." },
--   "es": { "description": "...", "wiki_text": "..." },
--   "fr": { ... }, "de": { ... }, "it": { ... }
-- }
CREATE TABLE IF NOT EXISTS public.places (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID        NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  translations    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  image_url       TEXT,
  lat             DECIMAL(10, 8),
  lng             DECIMAL(11, 8),
  order_index     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.places IS 'Landmarks / points of interest within a destination.';
COMMENT ON COLUMN public.places.translations IS 'JSONB: keyed by locale (en/es/fr/de/it), each containing description and wiki_text.';
COMMENT ON COLUMN public.places.order_index IS 'Display order within the destination. Lower = first.';

-- ── user_routes ───────────────────────────────────────────────────────────────
-- route_places JSON array schema:
-- [ { "place_id": "uuid", "name": "...", "image_url": "...", "lat": 0, "lng": 0, "order": 0 } ]
CREATE TABLE IF NOT EXISTS public.user_routes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  route_places  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT        NOT NULL DEFAULT 'saved'
                            CHECK (status IN ('saved', 'visited')),
  travel_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_routes IS 'User-created routes (ordered collections of places).';

-- ── site_settings (singleton) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            INTEGER     PRIMARY KEY DEFAULT 1,
  hero_titles   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  social_links  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ad_scripts    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

COMMENT ON TABLE public.site_settings IS 'Global site configuration. Always exactly one row (id = 1).';

-- Default row
INSERT INTO public.site_settings (id, hero_titles, social_links, ad_scripts)
VALUES (
  1,
  '{
    "en": "Your Journey Begins Here",
    "es": "Tu Aventura Comienza Aquí",
    "fr": "Votre Aventure Commence Ici",
    "de": "Ihr Abenteuer Beginnt Hier",
    "it": "Il Tuo Viaggio Inizia Qui"
  }'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER user_routes_updated_at
  BEFORE UPDATE ON public.user_routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Performance indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_destinations_published
  ON public.destinations (published);

CREATE INDEX IF NOT EXISTS idx_destinations_country_city
  ON public.destinations (country, city);

CREATE INDEX IF NOT EXISTS idx_places_destination_id
  ON public.places (destination_id);

CREATE INDEX IF NOT EXISTS idx_places_order
  ON public.places (destination_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_routes_user_id
  ON public.user_routes (user_id);

CREATE INDEX IF NOT EXISTS idx_user_routes_status
  ON public.user_routes (user_id, status);

-- GIN index for fast JSONB queries on translations
CREATE INDEX IF NOT EXISTS idx_places_translations
  ON public.places USING GIN (translations);
