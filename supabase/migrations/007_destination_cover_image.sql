-- City card / hero cover (best landmark photo for the destination)
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.destinations.cover_image IS
  'Primary cover photo for city cards and city page hero (landmark image URL).';
