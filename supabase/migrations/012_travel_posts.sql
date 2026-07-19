-- Travel posts / place reviews (mega-prompt Posts + Reviews)
-- One table: a post is a place-linked memory; rating makes it count as a review.

CREATE TABLE IF NOT EXISTS public.travel_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id      TEXT        NOT NULL DEFAULT '',
  title         TEXT        NOT NULL,
  tip           TEXT        NOT NULL DEFAULT '',
  rating        SMALLINT    NOT NULL DEFAULT 0
                            CHECK (rating >= 0 AND rating <= 5),
  city          TEXT        NOT NULL DEFAULT '',
  country       TEXT        NOT NULL DEFAULT '',
  location      TEXT        NOT NULL DEFAULT '',
  photo_urls    TEXT[]      NOT NULL DEFAULT '{}',
  visibility    TEXT        NOT NULL DEFAULT 'private'
                            CHECK (visibility IN ('private', 'public')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS travel_posts_user_created_idx
  ON public.travel_posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS travel_posts_place_public_idx
  ON public.travel_posts (place_id, created_at DESC)
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS travel_posts_public_feed_idx
  ON public.travel_posts (created_at DESC)
  WHERE visibility = 'public';

COMMENT ON TABLE public.travel_posts IS
  'Place-linked travel memories. rating>0 counts toward passport reviews.';

ALTER TABLE public.travel_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "travel_posts: users read own" ON public.travel_posts;
CREATE POLICY "travel_posts: users read own"
  ON public.travel_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "travel_posts: public read public" ON public.travel_posts;
CREATE POLICY "travel_posts: public read public"
  ON public.travel_posts FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS "travel_posts: users insert own" ON public.travel_posts;
CREATE POLICY "travel_posts: users insert own"
  ON public.travel_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "travel_posts: users update own" ON public.travel_posts;
CREATE POLICY "travel_posts: users update own"
  ON public.travel_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "travel_posts: users delete own" ON public.travel_posts;
CREATE POLICY "travel_posts: users delete own"
  ON public.travel_posts FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS travel_posts_updated_at ON public.travel_posts;
CREATE TRIGGER travel_posts_updated_at
  BEFORE UPDATE ON public.travel_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
