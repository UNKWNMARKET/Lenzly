-- Comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO anon;
