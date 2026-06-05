-- Run this in the Supabase SQL editor

create table if not exists public.story_views (
  story_id  uuid not null references public.spot_stories(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

alter table public.story_views enable row level security;

-- Anyone can insert their own view
create policy "insert own view" on public.story_views
  for insert with check (auth.uid() = user_id);

-- Story owner can read all views on their stories
create policy "story owner reads views" on public.story_views
  for select using (
    exists (
      select 1 from public.spot_stories s
      where s.id = story_id and s.user_id = auth.uid()
    )
  );

-- Index for fast lookup by story
create index if not exists story_views_story_id_idx on public.story_views(story_id);
