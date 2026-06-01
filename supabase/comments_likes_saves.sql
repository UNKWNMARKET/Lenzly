-- ============================================================================
-- LENZLY — Comments, likes & saved posts tables + RLS
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once (uses IF NOT EXISTS / drop-before-create).
--
-- These three tables back the like / comment / save actions in FeedPostCard.
-- Without RLS policies the client (anon key + signed-in user) cannot write to
-- them, so the buttons would silently fail. This file makes them work.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id)  on delete cascade,
  text        text not null check (char_length(text) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id);

alter table public.comments enable row level security;

drop policy if exists "comments_public_read"  on public.comments;
drop policy if exists "comments_owner_insert"  on public.comments;
drop policy if exists "comments_owner_delete"  on public.comments;

create policy "comments_public_read"
on public.comments for select using ( true );

create policy "comments_owner_insert"
on public.comments for insert to authenticated
with check ( auth.uid() = user_id );

create policy "comments_owner_delete"
on public.comments for delete to authenticated
using ( auth.uid() = user_id );

-- ----------------------------------------------------------------------------
-- POST_LIKES  (one row per user per post)
-- ----------------------------------------------------------------------------
create table if not exists public.post_likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists post_likes_post_idx on public.post_likes(post_id);

alter table public.post_likes enable row level security;

drop policy if exists "post_likes_public_read"  on public.post_likes;
drop policy if exists "post_likes_owner_insert"  on public.post_likes;
drop policy if exists "post_likes_owner_delete"  on public.post_likes;

create policy "post_likes_public_read"
on public.post_likes for select using ( true );

create policy "post_likes_owner_insert"
on public.post_likes for insert to authenticated
with check ( auth.uid() = user_id );

create policy "post_likes_owner_delete"
on public.post_likes for delete to authenticated
using ( auth.uid() = user_id );

-- ----------------------------------------------------------------------------
-- SAVED_POSTS  (private bookmarks — only the owner can see them)
-- ----------------------------------------------------------------------------
create table if not exists public.saved_posts (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists saved_posts_user_idx on public.saved_posts(user_id);

alter table public.saved_posts enable row level security;

drop policy if exists "saved_posts_owner_read"    on public.saved_posts;
drop policy if exists "saved_posts_owner_insert"   on public.saved_posts;
drop policy if exists "saved_posts_owner_delete"   on public.saved_posts;

create policy "saved_posts_owner_read"
on public.saved_posts for select to authenticated
using ( auth.uid() = user_id );

create policy "saved_posts_owner_insert"
on public.saved_posts for insert to authenticated
with check ( auth.uid() = user_id );

create policy "saved_posts_owner_delete"
on public.saved_posts for delete to authenticated
using ( auth.uid() = user_id );

-- ----------------------------------------------------------------------------
-- LIKE COUNT TRIGGER — keep posts.likes_count accurate even when the client
-- doesn't update it (and notify the post owner on a like).
-- ----------------------------------------------------------------------------
create or replace function public.handle_post_like_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    if new.user_id <> (select user_id from public.posts where id = new.post_id) then
      insert into public.notifications (user_id, actor_id, type, post_id, message, read)
      select p.user_id, new.user_id, 'like', new.post_id, null, false
      from public.posts p where p.id = new.post_id
      on conflict do nothing;
    end if;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
exception when others then
  return null;
end;
$$;

drop trigger if exists on_post_like_change on public.post_likes;
create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.handle_post_like_change();

-- Recompute existing counts so everything is consistent after install
update public.posts p set
  likes_count    = (select count(*) from public.post_likes where post_id = p.id),
  comments_count = (select count(*) from public.comments   where post_id = p.id);
