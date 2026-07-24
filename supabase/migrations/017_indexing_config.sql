-- Indexing prefs + last-run log for admin Search Engine control panel.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS indexing_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN site_settings.indexing_config IS
  'Search engine indexing prefs (auto_notify, IndexNow, Google, sitemap ping) and last_runs log.';
