-- ============================================================================
-- LENZLY — Admin analytics: split visitors by platform (web vs app)
-- Run this in the Supabase SQL Editor (it only replaces the stats function).
-- ============================================================================

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  day_start   timestamptz := date_trunc('day', now());
  week_start  timestamptz := now() - interval '7 days';
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

    -- Unique visitors (all platforms)
    'visitors_today', (select count(distinct visitor_id) from public.site_visits where created_at >= day_start),
    'visitors_week',  (select count(distinct visitor_id) from public.site_visits where created_at >= week_start),
    'visitors_month', (select count(distinct visitor_id) from public.site_visits where created_at >= month_start),

    -- Unique visitors — website only
    'web_visitors_today', (select count(distinct visitor_id) from public.site_visits where platform = 'web' and created_at >= day_start),
    'web_visitors_week',  (select count(distinct visitor_id) from public.site_visits where platform = 'web' and created_at >= week_start),
    'web_visitors_month', (select count(distinct visitor_id) from public.site_visits where platform = 'web' and created_at >= month_start),

    -- Unique visitors — mobile app only
    'app_visitors_today', (select count(distinct visitor_id) from public.site_visits where platform = 'app' and created_at >= day_start),
    'app_visitors_week',  (select count(distinct visitor_id) from public.site_visits where platform = 'app' and created_at >= week_start),
    'app_visitors_month', (select count(distinct visitor_id) from public.site_visits where platform = 'app' and created_at >= month_start),

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
