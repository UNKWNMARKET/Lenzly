-- ============================================================================
-- LENZLY — Admin analytics
-- Adds a visitor-tracking table + admin-only RPC functions that power the
-- real-time stats on the admin dashboard (visitors / posts / new members
-- by day, week, month). Safe to run more than once.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Visitor tracking table
--    One row per page view. `visitor_id` is an anonymous client id stored in
--    the browser/app so we can count unique visitors as well as raw views.
-- ----------------------------------------------------------------------------
create table if not exists public.site_visits (
  id          bigint generated always as identity primary key,
  visitor_id  text,
  path        text,
  platform    text default 'web',          -- 'web' | 'app'
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists site_visits_created_idx  on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_idx  on public.site_visits (visitor_id);

alter table public.site_visits enable row level security;

-- Anyone (even logged-out visitors) may record a visit. Nobody can read the
-- raw rows directly — analytics are only exposed via the admin RPCs below.
drop policy if exists site_visits_insert on public.site_visits;
create policy site_visits_insert
  on public.site_visits for insert
  to anon, authenticated
  with check (true);

-- ----------------------------------------------------------------------------
-- 2. Helper: is the current caller the admin?
-- ----------------------------------------------------------------------------
create or replace function public.is_lenzly_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'eisdorferjesse@gmail.com';
$$;

-- ----------------------------------------------------------------------------
-- 3. Aggregate dashboard stats (single round-trip)
-- ----------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  day_start  timestamptz := date_trunc('day', now());
  week_start timestamptz := now() - interval '7 days';
  month_start timestamptz := now() - interval '30 days';
begin
  if not public.is_lenzly_admin() then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    -- Members (true signup time from auth.users)
    'members_total', (select count(*) from auth.users),
    'members_today', (select count(*) from auth.users where created_at >= day_start),
    'members_week',  (select count(*) from auth.users where created_at >= week_start),
    'members_month', (select count(*) from auth.users where created_at >= month_start),

    -- Posts
    'posts_total', (select count(*) from public.posts),
    'posts_today', (select count(*) from public.posts where created_at >= day_start),
    'posts_week',  (select count(*) from public.posts where created_at >= week_start),
    'posts_month', (select count(*) from public.posts where created_at >= month_start),

    -- Unique visitors
    'visitors_today', (select count(distinct visitor_id) from public.site_visits where created_at >= day_start),
    'visitors_week',  (select count(distinct visitor_id) from public.site_visits where created_at >= week_start),
    'visitors_month', (select count(distinct visitor_id) from public.site_visits where created_at >= month_start),

    -- Raw page views
    'views_today', (select count(*) from public.site_visits where created_at >= day_start),
    'views_week',  (select count(*) from public.site_visits where created_at >= week_start),
    'views_month', (select count(*) from public.site_visits where created_at >= month_start),

    -- Brand pipeline
    'brands_pending',  (select count(*) from public.brand_applications where status = 'pending'),
    'brands_approved', (select count(*) from public.brand_applications where status = 'approved'),

    'generated_at', now()
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Daily time-series for the trend chart (default last 14 days)
-- ----------------------------------------------------------------------------
create or replace function public.admin_daily_series(days int default 14)
returns table(day date, members bigint, posts bigint, visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lenzly_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  with span as (
    select generate_series(
      date_trunc('day', now()) - ((days - 1) || ' days')::interval,
      date_trunc('day', now()),
      interval '1 day'
    )::date as day
  )
  select
    s.day,
    (select count(*) from auth.users u where u.created_at::date = s.day),
    (select count(*) from public.posts p where p.created_at::date = s.day),
    (select count(distinct v.visitor_id) from public.site_visits v where v.created_at::date = s.day)
  from span s
  order by s.day;
end;
$$;

grant execute on function public.admin_daily_series(int) to authenticated;
