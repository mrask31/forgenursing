-- Allow service_role to read all profiles (bypasses RLS for beta count queries)
CREATE POLICY "Service role full access"
  ON profiles
  FOR SELECT
  TO service_role
  USING (true);
