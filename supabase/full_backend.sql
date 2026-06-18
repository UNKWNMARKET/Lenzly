-- ============================================================================
-- LENZLY — Full backend migration
-- Covers: notifications, conversations, messages, avatars bucket,
--         follows UPDATE policy, profiles columns, notifications RLS
-- Safe to run more than once.
-- ============================================================================


-- ============================================================================
-- 1. PROFILES — ensure all columns exist
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location          text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website           text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty         text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro            boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count   integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count   integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS posts_count       integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded         boolean DEFAULT false;


-- ============================================================================
-- 2. NOTIFICATIONS — create table + full RLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type       text NOT NULL,
  post_id    uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  message    text,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_owner_select" ON public.notifications;
DROP POLICY IF EXISTS "notifs_auth_insert"  ON public.notifications;
DROP POLICY IF EXISTS "notifs_owner_update" ON public.notifications;
DROP POLICY IF EXISTS "notifs_owner_delete" ON public.notifications;

-- Users can read their own notifications
CREATE POLICY "notifs_owner_select"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Any authenticated user can insert a notification (e.g. follow request to another user)
CREATE POLICY "notifs_auth_insert"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can mark their own notifications as read
CREATE POLICY "notifs_owner_update"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifs_owner_delete"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ============================================================================
-- 3. FOLLOWS — add UPDATE policy (needed for accepting/pending status)
-- ============================================================================
ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

DROP POLICY IF EXISTS "follows_self_update" ON public.follows;

-- The person being followed can update the status (accept/decline a request)
CREATE POLICY "follows_self_update"
ON public.follows FOR UPDATE TO authenticated
USING (auth.uid() = following_id);


-- ============================================================================
-- 4. CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bg         text DEFAULT '#0A0804',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "convs_participant_select" ON public.conversations;
DROP POLICY IF EXISTS "convs_auth_insert"        ON public.conversations;
DROP POLICY IF EXISTS "convs_participant_update" ON public.conversations;
DROP POLICY IF EXISTS "convs_participant_delete" ON public.conversations;

CREATE POLICY "convs_participant_select"
ON public.conversations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "convs_auth_insert"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "convs_participant_update"
ON public.conversations FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "convs_participant_delete"
ON public.conversations FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);


-- ============================================================================
-- 5. CONVERSATION_PARTICIPANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conv_parts_user_idx ON public.conversation_participants(user_id);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_parts_participant_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_auth_insert"        ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_self_update"        ON public.conversation_participants;
DROP POLICY IF EXISTS "conv_parts_self_delete"        ON public.conversation_participants;

-- Participants can see all participants in their conversations
CREATE POLICY "conv_parts_participant_select"
ON public.conversation_participants FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "conv_parts_auth_insert"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "conv_parts_self_update"
ON public.conversation_participants FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "conv_parts_self_delete"
ON public.conversation_participants FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);


-- ============================================================================
-- 6. MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         text NOT NULL,
  unsent          boolean DEFAULT false,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conv_idx ON public.messages(conversation_id, sent_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msgs_participant_select" ON public.messages;
DROP POLICY IF EXISTS "msgs_sender_insert"      ON public.messages;
DROP POLICY IF EXISTS "msgs_sender_update"      ON public.messages;
DROP POLICY IF EXISTS "msgs_participant_delete" ON public.messages;

CREATE POLICY "msgs_participant_select"
ON public.messages FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "msgs_sender_insert"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);

-- Sender can "unsend" (soft-delete) their own message
CREATE POLICY "msgs_sender_update"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "msgs_participant_delete"
ON public.messages FOR DELETE TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);


-- ============================================================================
-- 7. STORAGE — avatars bucket (profile photos + cover photos)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "avatars_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_insert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- 8. POSTS — ensure all columns exist
-- ============================================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count    integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS caption        text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location       text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS specialty      text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url      text;


-- ============================================================================
-- 9. Realtime — enable for tables that use live subscriptions
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_comments;
