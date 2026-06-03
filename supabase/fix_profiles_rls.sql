-- Fix: Allow authenticated users to read all profiles (required for Search / Find People to work)
-- Without this policy, Supabase RLS blocks users from seeing anyone else's profile row.

-- Drop any overly-restrictive select policy first (ignore error if it doesn't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;

-- Allow every logged-in user to read any profile
CREATE POLICY IF NOT EXISTS "profiles_read_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow unauthenticated reads so the Explore page works before sign-in (optional but safe)
CREATE POLICY IF NOT EXISTS "profiles_read_anon"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Add display_seconds column to spot_stories if not already present (story duration feature)
ALTER TABLE spot_stories ADD COLUMN IF NOT EXISTS display_seconds integer DEFAULT 6;

-- Add follow status column to follows table if not already present (follow request flow)
ALTER TABLE follows ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';
