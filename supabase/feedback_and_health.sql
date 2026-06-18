-- Feedback table for in-app user reports
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'bug', -- bug | suggestion | other
  message text NOT NULL,
  app_version text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Only service role can read feedback" ON public.feedback;

CREATE POLICY "Users can insert feedback"
  ON public.feedback FOR INSERT WITH CHECK (true);

-- Health check helper function (called by GitHub Actions)
CREATE OR REPLACE FUNCTION public.recount_all_profile_stats()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET
    followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = id),
    following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = id),
    posts_count     = (SELECT COUNT(*) FROM public.posts WHERE user_id = id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
