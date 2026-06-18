-- Add archived column to posts table (defaults false so all existing posts remain visible)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Update RLS read policy to hide archived posts
DROP POLICY IF EXISTS "posts_public_read" ON public.posts;

CREATE POLICY "posts_public_read"
ON public.posts FOR SELECT
USING (archived = false);
