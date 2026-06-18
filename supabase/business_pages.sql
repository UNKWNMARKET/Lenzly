-- ============================================================================
-- LENZLY — Business company pages + posts
-- Gives brand/business accounts a company page (logo, cover, about) and the
-- ability to post updates about their business. Distinct from photographer
-- user profiles. Safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend business_profiles with page/branding fields
-- ----------------------------------------------------------------------------
alter table public.business_profiles add column if not exists logo_url   text;
alter table public.business_profiles add column if not exists cover_url  text;
alter table public.business_profiles add column if not exists industry   text;
alter table public.business_profiles add column if not exists tagline    text;

-- Anyone signed in may view a business page (so photographers can see who's hiring)
drop policy if exists "Anyone can view business pages" on public.business_profiles;
create policy "Anyone can view business pages"
  on public.business_profiles for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- 2. Business posts — updates a brand publishes about their company
-- ----------------------------------------------------------------------------
create table if not exists public.business_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists business_posts_user_idx    on public.business_posts (user_id, created_at desc);
create index if not exists business_posts_created_idx on public.business_posts (created_at desc);

alter table public.business_posts enable row level security;

-- Any signed-in user may read business posts
drop policy if exists business_posts_select on public.business_posts;
create policy business_posts_select
  on public.business_posts for select
  to authenticated
  using (true);

-- A business may create / edit / delete only their own posts
drop policy if exists business_posts_insert on public.business_posts;
create policy business_posts_insert
  on public.business_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists business_posts_update on public.business_posts;
create policy business_posts_update
  on public.business_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists business_posts_delete on public.business_posts;
create policy business_posts_delete
  on public.business_posts for delete
  to authenticated
  using (auth.uid() = user_id);
