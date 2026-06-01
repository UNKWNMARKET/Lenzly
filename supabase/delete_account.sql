-- ============================================================================
-- LENZLY — In-app account deletion (App Store guideline 5.1.1(v) compliance)
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once.
-- ============================================================================
--
-- The client SDK cannot delete a row from auth.users directly, so we expose a
-- SECURITY DEFINER RPC that a signed-in user can call to erase ONLY their own
-- account. Deleting the auth.users row cascades to every table that references
-- it with `on delete cascade` (profiles, posts, follows, blocks, messages,
-- notifications, spot_stories, likes, comments, etc.). We also remove their
-- uploaded files from storage, which the FK cascade does not cover.
-- ----------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  uid uuid := auth.uid();
begin
  -- Must be authenticated
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Remove the user's storage objects (photos live under "{uid}/..." in the
  --    "photos" bucket; also catch anything tagged with their owner id).
  delete from storage.objects
  where bucket_id = 'photos'
    and ( (storage.foldername(name))[1] = uid::text or owner = uid );

  -- 2. Delete the auth user. Every table with a FK to auth.users(id) that uses
  --    `on delete cascade` is cleaned up automatically by this single delete.
  delete from auth.users where id = uid;
end;
$$;

-- Allow signed-in users to call it. The function itself enforces that a caller
-- can only ever delete themselves (it always uses auth.uid()).
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
