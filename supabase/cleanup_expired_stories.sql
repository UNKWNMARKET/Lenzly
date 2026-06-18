-- ============================================================================
-- EXPIRED STORY CLEANUP
-- The app already HIDES expired stories on read (every query filters
-- `expires_at > now()`), so users never see stale stories. This script adds
-- server-side cleanup so expired rows don't accumulate in the table forever.
--
-- Two parts:
--   A. An index to make the expiry filter + cleanup fast.
--   B. A scheduled job (pg_cron) that hard-deletes expired stories hourly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. Index on expires_at — speeds up both the `expires_at > now()` read filter
--    and the cleanup delete below.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS spot_stories_expires_at_idx
  ON public.spot_stories (expires_at);

-- ----------------------------------------------------------------------------
-- B. Hourly cleanup via pg_cron.
--    Requires the pg_cron extension (available on Supabase — enable once).
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reusable cleanup function. Deleting via a function keeps the schedule simple
-- and lets you also call it manually: SELECT public.cleanup_expired_stories();
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.spot_stories
  WHERE expires_at <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Schedule it to run at the top of every hour.
-- Unschedule first so re-running this file doesn't create duplicates.
SELECT cron.unschedule('cleanup-expired-stories')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-stories'
);

SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 * * * *',                                   -- every hour, on the hour
  $$ SELECT public.cleanup_expired_stories(); $$
);

-- To verify the schedule:        SELECT * FROM cron.job;
-- To run cleanup right now:       SELECT public.cleanup_expired_stories();
