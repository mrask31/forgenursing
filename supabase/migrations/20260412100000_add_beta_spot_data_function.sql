-- Create a SECURITY DEFINER function that bypasses RLS entirely
-- to return the true count of beta users, regardless of which
-- Supabase key (anon or service_role) is used to call it.
CREATE OR REPLACE FUNCTION get_beta_spot_data()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM profiles WHERE is_beta = true;
$$ LANGUAGE sql SECURITY DEFINER;
