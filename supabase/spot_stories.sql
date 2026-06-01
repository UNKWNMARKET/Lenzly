CREATE TABLE IF NOT EXISTS public.spot_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  location_name text NOT NULL,
  lat double precision,
  lng double precision,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.spot_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spot stories viewable by everyone" ON public.spot_stories;
DROP POLICY IF EXISTS "Users can insert own spot stories" ON public.spot_stories;
DROP POLICY IF EXISTS "Users can delete own spot stories" ON public.spot_stories;

CREATE POLICY "Spot stories viewable by everyone"
  ON public.spot_stories FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can insert own spot stories"
  ON public.spot_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spot stories"
  ON public.spot_stories FOR DELETE USING (auth.uid() = user_id);
