-- Fix posts visibility: use IS NOT TRUE so NULL rows are also visible
-- Run this in Supabase SQL Editor

-- Ensure archived column exists with correct default
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Backfill any NULLs to false
UPDATE public.posts SET archived = false WHERE archived IS NULL;

-- Fix the read policy: archived IS NOT TRUE covers both false AND null
DROP POLICY IF EXISTS "posts_public_read" ON public.posts;

CREATE POLICY "posts_public_read"
ON public.posts FOR SELECT
USING (archived IS NOT TRUE);
