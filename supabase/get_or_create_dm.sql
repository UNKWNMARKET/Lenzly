-- ============================================================================
-- get_or_create_dm(other_user uuid) -> uuid
--
-- Atomically finds (or creates) a 1:1 conversation between the current user
-- and another user, inserting both participant rows. Runs as SECURITY DEFINER
-- so it bypasses the per-row RLS checks that otherwise prevent a user from
-- adding the *other* participant — while still being safe because it only ever
-- pairs auth.uid() with the requested user.
--
-- Used by the business portal's "Send Hire Request" flow (and safe for any
-- start-a-DM action). Run once in the Supabase SQL editor.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_dm(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF other_user IS NULL OR other_user = auth.uid() THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  -- Reuse an existing conversation that contains exactly these two users
  SELECT cp1.conversation_id INTO conv
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = other_user
  LIMIT 1;

  IF conv IS NOT NULL THEN
    RETURN conv;
  END IF;

  INSERT INTO public.conversations (created_by)
  VALUES (auth.uid())
  RETURNING id INTO conv;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv, auth.uid()), (conv, other_user);

  RETURN conv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_dm(uuid) TO authenticated;
