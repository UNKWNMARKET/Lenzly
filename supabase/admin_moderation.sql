-- ============================================================================
-- LENZLY — Admin moderation policies
-- Lets the admin (eisdorferjesse@gmail.com) delete any post or spot story from
-- the in-app Admin Console. Relies on public.is_lenzly_admin() defined in
-- admin_analytics.sql. Safe to run more than once.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- Ensure the admin helper exists (no-op if already created by admin_analytics.sql)
create or replace function public.is_lenzly_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'eisdorferjesse@gmail.com';
$$;

-- ----------------------------------------------------------------------------
-- Admin can delete any post
-- ----------------------------------------------------------------------------
drop policy if exists admin_delete_posts on public.posts;
create policy admin_delete_posts
  on public.posts for delete
  to authenticated
  using (public.is_lenzly_admin());

-- ----------------------------------------------------------------------------
-- Admin can read + delete any spot story (incl. expired ones)
-- ----------------------------------------------------------------------------
drop policy if exists admin_select_spots on public.spot_stories;
create policy admin_select_spots
  on public.spot_stories for select
  to authenticated
  using (public.is_lenzly_admin());

drop policy if exists admin_delete_spots on public.spot_stories;
create policy admin_delete_spots
  on public.spot_stories for delete
  to authenticated
  using (public.is_lenzly_admin());
