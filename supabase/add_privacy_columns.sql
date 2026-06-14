-- Add privacy toggle columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS private_account boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location boolean NOT NULL DEFAULT true;

-- Ensure users can update their own profile (including privacy fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
