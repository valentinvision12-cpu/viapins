-- Follow graph (mega-prompt: FOLLOW travelers)

CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_following_idx
  ON public.user_follows (following_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_follows_follower_idx
  ON public.user_follows (follower_id, created_at DESC);

COMMENT ON TABLE public.user_follows IS
  'Directed follow edges: follower_id follows following_id.';

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows: public read" ON public.user_follows;
CREATE POLICY "follows: public read"
  ON public.user_follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "follows: users insert own" ON public.user_follows;
CREATE POLICY "follows: users insert own"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows: users delete own" ON public.user_follows;
CREATE POLICY "follows: users delete own"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Public can read traveler identity when username is set
DROP POLICY IF EXISTS "profiles: public read by username" ON public.profiles;
CREATE POLICY "profiles: public read by username"
  ON public.profiles FOR SELECT
  USING (
    username IS NOT NULL
    AND btrim(username) <> ''
  );
