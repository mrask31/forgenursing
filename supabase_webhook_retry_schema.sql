-- ============================================
-- STRIPE WEBHOOK RETRY MECHANISM
-- ============================================
-- This migration adds webhook event tracking and retry capability
-- to prevent users from paying but not getting access when webhooks fail
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create webhook_events table to track all webhook attempts
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, retrying
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  succeeded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata for debugging
  user_id UUID, -- Extracted from payload if available
  customer_id TEXT, -- Stripe customer ID
  subscription_id TEXT -- Stripe subscription ID
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS webhook_events_updated_at ON webhook_events;
CREATE TRIGGER webhook_events_updated_at
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_events_updated_at();

-- 5. Create function to get failed webhooks that need retry
CREATE OR REPLACE FUNCTION get_webhooks_for_retry(
  max_attempts INTEGER DEFAULT 5,
  retry_delay_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  stripe_event_id TEXT,
  event_type TEXT,
  payload JSONB,
  attempt_count INTEGER,
  last_error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    we.id,
    we.stripe_event_id,
    we.event_type,
    we.payload,
    we.attempt_count,
    we.last_error
  FROM webhook_events we
  WHERE we.status IN ('failed', 'retrying')
    AND we.attempt_count < max_attempts
    AND (
      we.last_attempt_at IS NULL 
      OR we.last_attempt_at < NOW() - (retry_delay_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats()
RETURNS TABLE (
  total_events BIGINT,
  succeeded BIGINT,
  failed BIGINT,
  pending BIGINT,
  retrying BIGINT,
  avg_attempts NUMERIC,
  last_24h_events BIGINT,
  last_24h_failures BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE status = 'succeeded')::BIGINT as succeeded,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
    COUNT(*) FILTER (WHERE status = 'retrying')::BIGINT as retrying,
    AVG(attempt_count) as avg_attempts,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT as last_24h_events,
    COUNT(*) FILTER (WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours')::BIGINT as last_24h_failures
  FROM webhook_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add RLS policies (allow service role only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (webhooks run with service role)
CREATE POLICY "Service role can manage webhook_events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own webhook events (for debugging)
CREATE POLICY "Users can view own webhook events"
  ON webhook_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:
--
-- Check table exists:
-- SELECT * FROM webhook_events LIMIT 1;
--
-- Check indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'webhook_events';
--
-- Check functions:
-- SELECT proname FROM pg_proc WHERE proname LIKE '%webhook%';
--
-- Get webhook stats:
-- SELECT * FROM get_webhook_stats();
--
-- Get webhooks needing retry:
-- SELECT * FROM get_webhooks_for_retry();
-- ============================================
