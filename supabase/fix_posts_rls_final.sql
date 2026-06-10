-- DEFINITIVE posts visibility fix
-- Removes archived dependency from RLS — just open read for authenticated users
-- Run this in Supabase SQL Editor

-- Drop all existing read policies on posts
DROP POLICY IF EXISTS "posts_public_read"   ON public.posts;
DROP POLICY IF EXISTS "posts_owner_read"    ON public.posts;

-- Simple open read: any authenticated user can read all posts
-- Filtering (private accounts, blocks) is done client-side in the app
CREATE POLICY "posts_public_read"
ON public.posts FOR SELECT TO authenticated
USING (true);

-- Also allow anon reads (for public profile viewing)
CREATE POLICY "posts_anon_read"
ON public.posts FOR SELECT TO anon
USING (true);
