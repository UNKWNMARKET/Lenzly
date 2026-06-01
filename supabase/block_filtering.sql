-- ============================================================================
-- LENZLY — Bidirectional block filtering helper
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once.
--
-- The blocks table RLS only lets a user read rows they created (people THEY
-- blocked). For a proper block, content must be hidden in BOTH directions:
-- if A blocks B, A should not see B and B should not see A.
--
-- This SECURITY DEFINER function returns the set of user ids the caller should
-- not see — the union of "people I blocked" and "people who blocked me" —
-- without revealing which direction the block came from.
-- ----------------------------------------------------------------------------

create or replace function public.hidden_user_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select blocked_id from public.blocks where blocker_id = auth.uid()
  union
  select blocker_id from public.blocks where blocked_id = auth.uid()
$$;

revoke all on function public.hidden_user_ids() from public;
grant execute on function public.hidden_user_ids() to authenticated;
