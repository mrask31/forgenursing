-- Email Queue Table Migration
-- Unified email queue for onboarding and beta re-engagement sequences

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  resend_email_id TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT email_queue_status_check CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT email_queue_email_type_check CHECK (email_type IN (
    'onboarding_day_0',
    'onboarding_day_3',
    'onboarding_day_6',
    'beta_day_7_reengagement'
  )),
  CONSTRAINT email_queue_unique_user_type UNIQUE (user_id, email_type)
);

-- Enable Row Level Security
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write
CREATE POLICY "Service role full access" ON public.email_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for efficient pending email queries
CREATE INDEX idx_email_queue_status_type ON public.email_queue (status, email_type);
