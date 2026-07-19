-- Richer trip fields + collaborators + public collection favorites read

ALTER TABLE public.user_routes
  ADD COLUMN IF NOT EXISTS days INTEGER NOT NULL DEFAULT 0
    CHECK (days >= 0 AND days <= 365),
  ADD COLUMN IF NOT EXISTS memories TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tips TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'shared'));

COMMENT ON COLUMN public.user_routes.days IS 'Planned or completed trip length in days.';
COMMENT ON COLUMN public.user_routes.memories IS 'Personal travel memories for the trip.';
COMMENT ON COLUMN public.user_routes.tips IS 'Tips for future travelers / collaborators.';
COMMENT ON COLUMN public.user_routes.budget IS 'Free-text budget note (e.g. mid-range, 800 EUR).';
COMMENT ON COLUMN public.user_routes.visibility IS 'private | public | shared with collaborators.';

CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  route_id    UUID NOT NULL REFERENCES public.user_routes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor'
              CHECK (role IN ('viewer', 'editor')),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (route_id, user_id),
  CHECK (user_id <> invited_by)
);

CREATE INDEX IF NOT EXISTS trip_collaborators_user_idx
  ON public.trip_collaborators (user_id, status);

COMMENT ON TABLE public.trip_collaborators IS
  'Collaborative trip planning invites and access.';

ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_collab: participants read" ON public.trip_collaborators;
CREATE POLICY "trip_collab: participants read"
  ON public.trip_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = invited_by
    OR EXISTS (
      SELECT 1 FROM public.user_routes r
      WHERE r.id = trip_collaborators.route_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "trip_collab: owner invite" ON public.trip_collaborators;
CREATE POLICY "trip_collab: owner invite"
  ON public.trip_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM public.user_routes r
      WHERE r.id = route_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "trip_collab: invitee update status" ON public.trip_collaborators;
CREATE POLICY "trip_collab: invitee update status"
  ON public.trip_collaborators FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = invited_by)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = invited_by);

DROP POLICY IF EXISTS "trip_collab: owner or invitee delete" ON public.trip_collaborators;
CREATE POLICY "trip_collab: owner or invitee delete"
  ON public.trip_collaborators FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() = invited_by
    OR EXISTS (
      SELECT 1 FROM public.user_routes r
      WHERE r.id = trip_collaborators.route_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "routes: collaborators read" ON public.user_routes;
CREATE POLICY "routes: collaborators read"
  ON public.user_routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_collaborators tc
      WHERE tc.route_id = user_routes.id
        AND tc.user_id = auth.uid()
        AND tc.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "routes: collaborators update" ON public.user_routes;
CREATE POLICY "routes: collaborators update"
  ON public.user_routes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_collaborators tc
      WHERE tc.route_id = user_routes.id
        AND tc.user_id = auth.uid()
        AND tc.status = 'accepted'
        AND tc.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "routes: public read public trips" ON public.user_routes;
CREATE POLICY "routes: public read public trips"
  ON public.user_routes FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS "favorites: public via collection meta" ON public.user_favorites;
CREATE POLICY "favorites: public via collection meta"
  ON public.user_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_collection_meta m
      WHERE m.user_id = user_favorites.user_id
        AND m.country = user_favorites.country
        AND m.visibility = 'public'
    )
  );