-- ============================================================================
-- LENZLY — New-user onboarding flag
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once.
--
-- Adds an `onboarded` flag to profiles. New accounts start false and are sent
-- through the welcome / suggested-follows flow; existing users are marked true
-- so they don't suddenly see onboarding.
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

-- Everyone who already exists has effectively been "onboarded" — don't show
-- the flow to current users. (New rows still default to false.)
update public.profiles set onboarded = true where created_at < now();
