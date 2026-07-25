-- Visitor analytics live presence + page view history
-- Migration: 018_visitor_analytics

CREATE TABLE IF NOT EXISTS public.visitor_presence (
  session_id   TEXT PRIMARY KEY,
  path         TEXT NOT NULL DEFAULT '/',
  locale       TEXT,
  country_code TEXT,
  city         TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  first_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_presence_last_seen_idx
  ON public.visitor_presence (last_seen DESC);

CREATE INDEX IF NOT EXISTS visitor_presence_country_idx
  ON public.visitor_presence (country_code);

CREATE TABLE IF NOT EXISTS public.page_views (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT NOT NULL,
  path         TEXT NOT NULL DEFAULT '/',
  locale       TEXT,
  country_code TEXT,
  city         TEXT,
  referrer     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS page_views_country_idx
  ON public.page_views (country_code);

CREATE INDEX IF NOT EXISTS page_views_session_idx
  ON public.page_views (session_id);

ALTER TABLE public.visitor_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitor_presence: admins read" ON public.visitor_presence;
CREATE POLICY "visitor_presence: admins read"
  ON public.visitor_presence FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "page_views: admins read" ON public.page_views;
CREATE POLICY "page_views: admins read"
  ON public.page_views FOR SELECT
  USING (public.is_admin());
