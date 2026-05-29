-- ============================================================================
-- LENZLY — Fix photo upload RLS + add follower blocking
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once (drops policies before recreating them).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STORAGE: the "photos" bucket must exist, be public, and let signed-in
--    users upload into their own folder ( {user_id}/filename.jpg )
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos_public_read"   on storage.objects;
drop policy if exists "photos_user_insert"    on storage.objects;
drop policy if exists "photos_user_update"    on storage.objects;
drop policy if exists "photos_user_delete"    on storage.objects;

-- Anyone can view photos (public feed)
create policy "photos_public_read"
on storage.objects for select
using ( bucket_id = 'photos' );

-- A logged-in user can upload only into a folder named after their own id
create policy "photos_user_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_user_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_user_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------------------------
-- 2. POSTS: a user can create their own posts; everyone can read them
-- ----------------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "posts_public_read"  on public.posts;
drop policy if exists "posts_owner_insert"  on public.posts;
drop policy if exists "posts_owner_update"  on public.posts;
drop policy if exists "posts_owner_delete"  on public.posts;

create policy "posts_public_read"
on public.posts for select using ( true );

create policy "posts_owner_insert"
on public.posts for insert to authenticated
with check ( auth.uid() = user_id );

create policy "posts_owner_update"
on public.posts for update to authenticated
using ( auth.uid() = user_id );

create policy "posts_owner_delete"
on public.posts for delete to authenticated
using ( auth.uid() = user_id );

-- ----------------------------------------------------------------------------
-- 3. PHOTO_SPOTS: any signed-in user can add/update a community spot
-- ----------------------------------------------------------------------------
alter table public.photo_spots enable row level security;

drop policy if exists "spots_public_read"  on public.photo_spots;
drop policy if exists "spots_auth_insert"   on public.photo_spots;
drop policy if exists "spots_auth_update"   on public.photo_spots;

create policy "spots_public_read"
on public.photo_spots for select using ( true );

create policy "spots_auth_insert"
on public.photo_spots for insert to authenticated
with check ( true );

create policy "spots_auth_update"
on public.photo_spots for update to authenticated
using ( true );

-- ----------------------------------------------------------------------------
-- 4. BLOCKS: block unwanted users/followers
--    (created BEFORE follows because the follows policy references it)
-- ----------------------------------------------------------------------------
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "blocks_owner_read"   on public.blocks;
drop policy if exists "blocks_owner_insert"  on public.blocks;
drop policy if exists "blocks_owner_delete"  on public.blocks;

-- You can only see, create, and remove your own blocks
create policy "blocks_owner_read"
on public.blocks for select to authenticated
using ( auth.uid() = blocker_id );

create policy "blocks_owner_insert"
on public.blocks for insert to authenticated
with check ( auth.uid() = blocker_id );

create policy "blocks_owner_delete"
on public.blocks for delete to authenticated
using ( auth.uid() = blocker_id );

-- ----------------------------------------------------------------------------
-- 5. FOLLOWS: make sure follow / unfollow works under RLS
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id)
);

alter table public.follows enable row level security;

drop policy if exists "follows_public_read" on public.follows;
drop policy if exists "follows_self_insert"  on public.follows;
drop policy if exists "follows_self_delete"  on public.follows;

create policy "follows_public_read"
on public.follows for select using ( true );

-- You can only create a follow row as yourself, and not for someone who blocked you
create policy "follows_self_insert"
on public.follows for insert to authenticated
with check (
  auth.uid() = follower_id
  and not exists (
    select 1 from public.blocks b
    where b.blocker_id = following_id and b.blocked_id = auth.uid()
  )
);

-- You can remove a follow row if you are either side of it
-- (lets a user "remove" an unwanted follower as well as unfollow)
create policy "follows_self_delete"
on public.follows for delete to authenticated
using ( auth.uid() = follower_id or auth.uid() = following_id );

-- ----------------------------------------------------------------------------
-- 6. When you block someone, drop any follow relationship in BOTH directions
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_block()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from public.follows
  where (follower_id = new.blocked_id and following_id = new.blocker_id)
     or (follower_id = new.blocker_id and following_id = new.blocked_id);
  return new;
end;
$$;

drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created
  after insert on public.blocks
  for each row execute function public.handle_new_block();
