-- Add beta access columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_beta BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Helper function to count active beta users
CREATE OR REPLACE FUNCTION get_beta_user_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM profiles WHERE is_beta = TRUE;
$$ LANGUAGE sql STABLE;
