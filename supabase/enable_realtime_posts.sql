-- ============================================================================
-- Enable realtime for the posts table so the web/app feed live-appends new
-- posts (parity with notifications/messages, which were already enabled).
--
-- Guarded so re-running is safe: ALTER PUBLICATION ... ADD TABLE errors if the
-- table is already a member, so we check pg_publication_tables first.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END $$;

-- REPLICA IDENTITY FULL ensures UPDATE/DELETE realtime payloads include the
-- full old row (e.g. so deletes carry the id even when the PK changes shape).
ALTER TABLE public.posts REPLICA IDENTITY FULL;
