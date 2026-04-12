-- Fix get_beta_user_count() volatility
-- STABLE tells PostgreSQL it can cache the result within a transaction,
-- which can return stale counts. VOLATILE ensures a fresh COUNT(*) every call.
CREATE OR REPLACE FUNCTION get_beta_user_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM profiles WHERE is_beta = TRUE;
$$ LANGUAGE sql VOLATILE;
