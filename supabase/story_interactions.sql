-- Story likes
CREATE TABLE IF NOT EXISTS public.story_likes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.spot_stories(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(story_id, user_id)
);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "story_likes_read"   ON public.story_likes;
DROP POLICY IF EXISTS "story_likes_insert" ON public.story_likes;
DROP POLICY IF EXISTS "story_likes_delete" ON public.story_likes;

CREATE POLICY "story_likes_read"   ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "story_likes_insert" ON public.story_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_likes_delete" ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- Story comments
CREATE TABLE IF NOT EXISTS public.story_comments (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.spot_stories(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null check (char_length(text) > 0 and char_length(text) <= 500),
  created_at timestamptz default now()
);

ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "story_comments_read"   ON public.story_comments;
DROP POLICY IF EXISTS "story_comments_insert" ON public.story_comments;
DROP POLICY IF EXISTS "story_comments_delete" ON public.story_comments;

CREATE POLICY "story_comments_read"   ON public.story_comments FOR SELECT USING (true);
CREATE POLICY "story_comments_insert" ON public.story_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_comments_delete" ON public.story_comments FOR DELETE USING (auth.uid() = user_id or story_id in (select id from public.spot_stories where user_id = auth.uid()));
