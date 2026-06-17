-- Fix story archive: let users see ALL their own stories (including expired/deleted)
-- The existing public policy only shows active stories (expires_at > now()),
-- which is correct for the feed. We add a second policy for archive access.

-- Allow each user to read ALL their own stories regardless of expiry
DROP POLICY IF EXISTS "Users can view own stories" ON public.spot_stories;
CREATE POLICY "Users can view own stories"
  ON public.spot_stories FOR SELECT
  USING (auth.uid() = user_id);

-- Stop the pg_cron job from permanently deleting expired stories —
-- they belong in the archive. We only hard-delete stories the user
-- explicitly deleted (marked by setting expires_at to a sentinel past date).
-- If you previously ran cleanup_expired_stories.sql, remove the cron job:
SELECT cron.unschedule('cleanup-expired-stories')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-stories'
);

-- Replace the cleanup function to only delete explicitly-deleted stories
-- (expires_at = '2000-01-01'), NOT stories that merely expired naturally.
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only remove stories the user explicitly deleted (sentinel date)
  DELETE FROM public.spot_stories
  WHERE expires_at = '2000-01-01T00:00:00.000Z'::timestamptz;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Reschedule to run daily (less urgent now that we're not bulk-deleting)
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 3 * * *',
  $$ SELECT public.cleanup_expired_stories(); $$
);
