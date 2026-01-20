-- Migration: Remove token columns from user_sessions
-- Date: 2026-01-20
-- Purpose: Use Supabase Admin API for token refresh instead of stored refresh_token
-- This makes refresh independent of browser session state

-- Remove columns that are no longer needed (refresh is done via Admin API)
ALTER TABLE IF EXISTS public.user_sessions
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS expires_at;

-- Ensure required columns exist
ALTER TABLE IF EXISTS public.user_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Recreate indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON public.user_sessions(status);

-- Update RLS policies to allow status-only operations
DROP POLICY IF EXISTS "Users can update their own active sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;

CREATE POLICY "Users can read their own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update status of their own sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

COMMENT ON COLUMN public.user_sessions.status IS 'Session status: active or revoked';
COMMENT ON COLUMN public.user_sessions.user_email IS 'User email for display purposes only';