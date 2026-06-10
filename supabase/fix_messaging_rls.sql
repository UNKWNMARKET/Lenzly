-- ============================================================
-- SECURITY FIX: Re-enable RLS on all messaging tables
-- Run this in Supabase SQL Editor immediately.
-- These were disabled by fix_messaging_recursion.sql to work
-- around a recursive policy issue. This file fixes the root
-- cause with a security-definer helper and re-enables RLS.
-- ============================================================

-- 1. Re-enable RLS
ALTER TABLE public.conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions      ENABLE ROW LEVEL SECURITY;

-- 2. Revoke anon access granted by the broken migration
REVOKE ALL ON public.conversations          FROM anon;
REVOKE ALL ON public.conversation_participants FROM anon;
REVOKE ALL ON public.messages               FROM anon;
REVOKE ALL ON public.message_reactions      FROM anon;

-- 3. Helper function to check participation without recursion
--    (SECURITY DEFINER bypasses RLS so it doesn't recurse)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

-- 4. Drop old policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "conv_parts_auth_read"   ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_auth_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_auth_update" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_auth_delete" ON public.conversation_participants;

DROP POLICY IF EXISTS "convs_participant_read"   ON public.conversations;
DROP POLICY IF EXISTS "convs_participant_insert" ON public.conversations;
DROP POLICY IF EXISTS "convs_participant_update" ON public.conversations;
DROP POLICY IF EXISTS "convs_participant_delete" ON public.conversations;

DROP POLICY IF EXISTS "msgs_participant_read"   ON public.messages;
DROP POLICY IF EXISTS "msgs_sender_insert"      ON public.messages;
DROP POLICY IF EXISTS "msgs_sender_update"      ON public.messages;
DROP POLICY IF EXISTS "msgs_participant_delete" ON public.messages;

DROP POLICY IF EXISTS "reactions_participant_read"   ON public.message_reactions;
DROP POLICY IF EXISTS "reactions_auth_insert"        ON public.message_reactions;
DROP POLICY IF EXISTS "reactions_auth_delete"        ON public.message_reactions;

-- 5. conversation_participants policies
CREATE POLICY "cp_read" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id));

CREATE POLICY "cp_insert" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());  -- users can only add themselves

CREATE POLICY "cp_update" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "cp_delete" ON public.conversation_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());  -- users can only remove themselves

-- 6. conversations policies
CREATE POLICY "conv_read" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id));

CREATE POLICY "conv_insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- participant row insertion enforces access

CREATE POLICY "conv_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(id));

CREATE POLICY "conv_delete" ON public.conversations
  FOR DELETE TO authenticated
  USING (public.is_conversation_participant(id));

-- 7. messages policies
CREATE POLICY "msg_read" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "msg_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_participant(conversation_id)
  );

CREATE POLICY "msg_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);  -- only sender can unsend their own

CREATE POLICY "msg_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);  -- only sender can delete their own

-- 8. message_reactions policies
CREATE POLICY "rx_read" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
      AND public.is_conversation_participant(m.conversation_id)
    )
  );

CREATE POLICY "rx_insert" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rx_delete" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 9. story_views: add TO authenticated and viewer-reads-own policy
DROP POLICY IF EXISTS "story_owner_reads_views" ON public.story_views;
DROP POLICY IF EXISTS "viewer_reads_own"         ON public.story_views;

CREATE POLICY "story_owner_reads_views" ON public.story_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spot_stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "viewer_reads_own" ON public.story_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 10. Fix notifications INSERT policy (currently WITH CHECK (true))
DROP POLICY IF EXISTS "notifs_auth_insert" ON public.notifications;

CREATE POLICY "notifs_auth_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 11. Fix spot_stories SELECT: enforce privacy + blocks server-side
DROP POLICY IF EXISTS "Spot stories viewable by everyone" ON public.spot_stories;

CREATE POLICY "spot_stories_read" ON public.spot_stories
  FOR SELECT TO authenticated
  USING (
    expires_at > now()
    -- Own stories always visible
    AND (
      user_id = auth.uid()
      -- Public accounts visible to all authenticated users (not blocked)
      OR (
        NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND private_account = true)
        AND NOT EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id = user_id AND blocked_id = auth.uid()) OR (blocker_id = auth.uid() AND blocked_id = user_id))
      )
      -- Private accounts: only followers can see
      OR (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND private_account = true)
        AND EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id)
        AND NOT EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id = user_id AND blocked_id = auth.uid()) OR (blocker_id = auth.uid() AND blocked_id = user_id))
      )
    )
  );
