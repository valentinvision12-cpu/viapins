-- ============================================================
-- ADVENTURE TABLE — пусни САМО този файл в Supabase SQL Editor
-- Таблицата се казва: adventure_collections (не "adventures")
-- ============================================================

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

DROP POLICY IF EXISTS "adventure: public read published" ON public.adventure_collections;
CREATE POLICY "adventure: public read published"
  ON public.adventure_collections FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "adventure: admins manage" ON public.adventure_collections;
CREATE POLICY "adventure: admins manage"
  ON public.adventure_collections FOR ALL
  USING (public.is_admin());

-- Проверка — трябва да върне 1 ред
SELECT 'adventure_collections OK' AS status, count(*) AS rows FROM public.adventure_collections;
