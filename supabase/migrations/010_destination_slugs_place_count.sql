-- Global-ready destination routing + light list queries
-- Adding a country = insert data; no code rewrite required.

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS country_slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city_slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS place_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.destinations.country_slug IS
  'URL slug for /explore/[country] (e.g. france). Backfilled from country name.';
COMMENT ON COLUMN public.destinations.city_slug IS
  'URL slug for /explore/[country]/[city] (e.g. paris). Backfilled from city name.';
COMMENT ON COLUMN public.destinations.place_count IS
  'Cached landmark count so list pages need not nest places(...).';

-- Backfill slugs from existing names (simple lower + hyphen; app slugify may refine later)
UPDATE public.destinations
SET
  country_slug = trim(both '-' from regexp_replace(lower(trim(country)), '[^a-z0-9]+', '-', 'g')),
  city_slug = trim(both '-' from regexp_replace(lower(trim(city)), '[^a-z0-9]+', '-', 'g'))
WHERE country_slug = '' OR city_slug = '';

-- Backfill place counts
UPDATE public.destinations d
SET place_count = COALESCE((
  SELECT COUNT(*)::integer FROM public.places p WHERE p.destination_id = d.id
), 0);

CREATE INDEX IF NOT EXISTS destinations_country_slug_idx
  ON public.destinations (country_slug)
  WHERE published = true;

CREATE UNIQUE INDEX IF NOT EXISTS destinations_country_city_slug_uidx
  ON public.destinations (country_slug, city_slug)
  WHERE published = true;

-- Keep place_count in sync on place insert/delete
CREATE OR REPLACE FUNCTION public.sync_destination_place_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dest_id UUID;
BEGIN
  dest_id := COALESCE(NEW.destination_id, OLD.destination_id);
  UPDATE public.destinations
  SET place_count = (
    SELECT COUNT(*)::integer FROM public.places WHERE destination_id = dest_id
  )
  WHERE id = dest_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_destination_place_count ON public.places;
CREATE TRIGGER trg_sync_destination_place_count
  AFTER INSERT OR DELETE OR UPDATE OF destination_id ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_destination_place_count();
