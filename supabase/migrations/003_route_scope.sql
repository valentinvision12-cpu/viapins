-- Route scope: one city per saved route; city/country columns for passport UI
ALTER TABLE public.user_routes
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS route_type TEXT NOT NULL DEFAULT 'city'
    CHECK (route_type IN ('city', 'country'));

COMMENT ON COLUMN public.user_routes.city IS 'Primary city for city-scoped routes.';
COMMENT ON COLUMN public.user_routes.country IS 'Country for the route (city or country tour).';
COMMENT ON COLUMN public.user_routes.route_type IS 'city = single-city walking route; country = future multi-city adventure.';
