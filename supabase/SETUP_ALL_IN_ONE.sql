-- ============================================================
-- TRAVEL MAGAZINE — ПЪЛНА БАЗА ДАННИ (всичко в един файл)
-- Копирай целия файл → Supabase → SQL Editor → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  is_admin    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── destinations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.destinations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country     TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  seo         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  published   BOOLEAN     NOT NULL DEFAULT false,
  cover_image TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── places ───────────────────────────────────────────────────
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

-- ── user_routes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_routes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  route_places  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT        NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'visited')),
  travel_date   DATE,
  city          TEXT,
  country       TEXT,
  route_type    TEXT        NOT NULL DEFAULT 'city' CHECK (route_type IN ('city', 'country')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── user_favorites ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  country     TEXT        NOT NULL,
  image_url   TEXT        NOT NULL DEFAULT '',
  lat         DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng         DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

-- ── site_settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            INTEGER     PRIMARY KEY DEFAULT 1,
  hero_titles   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  social_links  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ad_scripts    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.site_settings (id, hero_titles, social_links, ad_scripts)
VALUES (1, '{"en":"Your Journey Begins Here","bg":"Твоето пътешествие започва тук"}'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER destinations_updated_at
  BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER places_updated_at
  BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER user_routes_updated_at
  BEFORE UPDATE ON public.user_routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "profiles: users read own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: users insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: admins all"       ON public.profiles FOR ALL    USING (public.is_admin());

-- destinations
CREATE POLICY "destinations: public read" ON public.destinations FOR SELECT USING (published = true);
CREATE POLICY "destinations: admins all"  ON public.destinations FOR ALL    USING (public.is_admin());

-- places
CREATE POLICY "places: public read"  ON public.places FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.destinations d WHERE d.id = places.destination_id AND d.published = true));
CREATE POLICY "places: admins all"   ON public.places FOR ALL USING (public.is_admin());

-- user_routes
CREATE POLICY "routes: users read own"   ON public.user_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routes: users insert own" ON public.user_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routes: users update own" ON public.user_routes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routes: users delete own" ON public.user_routes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "routes: admins all"       ON public.user_routes FOR ALL    USING (public.is_admin());

-- user_favorites
CREATE POLICY "favorites: users read own"   ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites: users insert own" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites: users delete own" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- site_settings
CREATE POLICY "settings: public read"  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings: admins write" ON public.site_settings FOR ALL    USING (public.is_admin());

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_destinations_published    ON public.destinations (published);
CREATE INDEX IF NOT EXISTS idx_places_destination_id     ON public.places (destination_id);
CREATE INDEX IF NOT EXISTS idx_user_routes_user_id       ON public.user_routes (user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id    ON public.user_favorites (user_id);

-- ── Migration 005: destination SEO ────────────────────────────
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── Migration 006: adventure collections ─────────────────────
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

