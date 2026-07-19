-- Collection visibility meta (mega-prompt shared collections)

CREATE TABLE IF NOT EXISTS public.user_collection_meta (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country     TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'private'
              CHECK (visibility IN ('private', 'public', 'shared')),
  title       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, country)
);

COMMENT ON TABLE public.user_collection_meta IS
  'Per-country collection visibility for passport collections.';

ALTER TABLE public.user_collection_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collection_meta: users read own" ON public.user_collection_meta;
CREATE POLICY "collection_meta: users read own"
  ON public.user_collection_meta FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "collection_meta: public read public" ON public.user_collection_meta;
CREATE POLICY "collection_meta: public read public"
  ON public.user_collection_meta FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS "collection_meta: users upsert own" ON public.user_collection_meta;
CREATE POLICY "collection_meta: users upsert own"
  ON public.user_collection_meta FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "collection_meta: users update own" ON public.user_collection_meta;
CREATE POLICY "collection_meta: users update own"
  ON public.user_collection_meta FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS collection_meta_updated_at ON public.user_collection_meta;
CREATE TRIGGER collection_meta_updated_at
  BEFORE UPDATE ON public.user_collection_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
