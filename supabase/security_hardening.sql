-- ============================================================================
-- SECURITY HARDENING — idempotent, safe to run multiple times.
-- Run once in the Supabase SQL editor.
--
-- Addresses:
--   1. SECURITY DEFINER functions with a mutable search_path (privilege-
--      escalation vector — Supabase linter "Function Search Path Mutable").
--   2. comment_likes table left with RLS disabled + ALL granted to anon
--      (anyone with the public anon key could like/unlike as any user).
--   3. Defensive re-assertion that messaging tables keep RLS on and anon off,
--      regardless of the order older migrations were applied in.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Pin search_path on every SECURITY DEFINER function.
--    Wrapped per-function so a missing one never aborts the rest.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
  sigs text[] := ARRAY[
    'public.recount_all_profile_stats()',
    'public.handle_follow_change()',
    'public.handle_follow_notification()',
    'public.handle_like_change()',
    'public.handle_comment_notification()',
    'public.handle_post_count()',
    'public.is_conversation_participant(uuid)',
    'public.handle_new_user()',
    'public.get_or_create_dm(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY sigs LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn);
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'skip (not found): %', fn;
    END;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Secure comment_likes
-- ----------------------------------------------------------------------------
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comment_likes FROM anon;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;

DROP POLICY IF EXISTS "comment_likes_read"   ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON public.comment_likes;

CREATE POLICY "comment_likes_read" ON public.comment_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comment_likes_insert" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comment_likes_delete" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Defensive re-assertion: messaging tables stay locked down
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.conversations             FROM anon;
REVOKE ALL ON public.conversation_participants FROM anon;
REVOKE ALL ON public.messages                  FROM anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='message_reactions') THEN
    EXECUTE 'ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.message_reactions FROM anon';
  END IF;
END $$;
