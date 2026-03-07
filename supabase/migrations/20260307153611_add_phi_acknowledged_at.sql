-- Add phi_acknowledged_at column to profiles table
-- This tracks when users acknowledge the PHI policy (legal protection layer)
-- NULL = not acknowledged yet, timestamptz = acknowledged at this time

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phi_acknowledged_at timestamptz DEFAULT NULL;
