-- Fix avatar uploads: allow users to create their profile row + storage UPDATE checks

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles: users insert own'
  ) THEN
    CREATE POLICY "profiles: users insert own"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DROP POLICY IF EXISTS "avatars: users update own" ON storage.objects;
CREATE POLICY "avatars: users update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
