-- ============================================================
-- TRAVEL MAGAZINE — ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies
-- Run AFTER 001_init_schema.sql
-- ============================================================

-- ── Enable RLS on every table ────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ── Helper function: is_admin() ───────────────────────────────────────────────
-- Runs as SECURITY DEFINER so it can read profiles regardless of caller's RLS.
-- Returns false (not null) for anonymous users, preventing errors.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin IS 'Returns true if the current authenticated user has is_admin = true.';

-- ══════════════════════════════════════════════════════════════════════════════
-- profiles
-- ══════════════════════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (not is_admin — that is admin-only)
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion to admin via this policy
    AND (is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  );

-- Admins have full unrestricted access to all profiles
CREATE POLICY "profiles: admins all"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- destinations
-- ══════════════════════════════════════════════════════════════════════════════

-- Anyone (including anonymous) can read published destinations
CREATE POLICY "destinations: public read published"
  ON public.destinations FOR SELECT
  USING (published = true);

-- Admins have full access (including unpublished)
CREATE POLICY "destinations: admins all"
  ON public.destinations FOR ALL
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- places
-- ══════════════════════════════════════════════════════════════════════════════

-- Anyone can read places that belong to a published destination
CREATE POLICY "places: public read via published destination"
  ON public.places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.destinations d
      WHERE d.id = places.destination_id
        AND d.published = true
    )
  );

-- Admins have full access
CREATE POLICY "places: admins all"
  ON public.places FOR ALL
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- user_routes
-- ══════════════════════════════════════════════════════════════════════════════

-- Users can only see their own routes
CREATE POLICY "routes: users read own"
  ON public.user_routes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create routes (user_id must match auth.uid())
CREATE POLICY "routes: users insert own"
  ON public.user_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own routes
CREATE POLICY "routes: users update own"
  ON public.user_routes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own routes
CREATE POLICY "routes: users delete own"
  ON public.user_routes FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can see all routes (analytics)
CREATE POLICY "routes: admins all"
  ON public.user_routes FOR ALL
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- site_settings
-- ══════════════════════════════════════════════════════════════════════════════

-- Anyone can read site settings (hero titles, social links, etc.)
CREATE POLICY "settings: public read"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can modify site settings
CREATE POLICY "settings: admins write"
  ON public.site_settings FOR ALL
  USING (public.is_admin());

-- ── Grant permissions to service role (bypasses RLS — used only server-side) ─
-- The service_role key is already a superuser in Supabase; this is documentation only.
-- NEVER expose the service_role key to the browser.
