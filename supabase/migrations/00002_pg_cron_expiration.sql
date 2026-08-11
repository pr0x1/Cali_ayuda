-- pg_cron: Automated report expiration
-- Runs directly in Supabase PostgreSQL, no external cron needed.
--
-- To apply: run this in Supabase Dashboard → SQL Editor
-- pg_cron is enabled by default on Supabase projects.

-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres (required on some Supabase plans)
GRANT USAGE ON SCHEMA cron TO postgres;

-- =============================================================
-- Job 1: Every 15 minutes — mark active reports as 'stale'
-- when their expires_at has passed.
-- =============================================================
SELECT cron.schedule(
  'expire-active-to-stale',
  '*/15 * * * *',
  $$
    UPDATE reports
    SET status = 'stale', updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW();
  $$
);

-- =============================================================
-- Job 2: Every hour — mark stale reports (>24h stale) as 'expired'
-- These are fully hidden from public queries.
-- =============================================================
SELECT cron.schedule(
  'expire-stale-to-expired',
  '0 * * * *',
  $$
    UPDATE reports
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'stale'
      AND updated_at < NOW() - INTERVAL '24 hours';
  $$
);

-- =============================================================
-- Verify: list scheduled jobs
-- =============================================================
-- SELECT * FROM cron.job;
