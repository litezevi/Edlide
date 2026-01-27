-- Migration: Fix user_sessions table structure
-- Date: 2026-01-27
-- Purpose: Ensure correct column structure for user_sessions

-- Remove old token columns if they still exist (leftover from failed migration)
ALTER TABLE IF EXISTS public.user_sessions
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS expires_at;

-- Ensure required columns exist with correct defaults
ALTER TABLE IF EXISTS public.user_sessions
ALTER COLUMN status SET DEFAULT 'active'::text,
ALTER COLUMN status DROP DEFAULT;

-- Add missing columns if they don't exist
ALTER TABLE IF EXISTS public.user_sessions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure ide_refresh_token exists (for IDE device refresh tokens)
ALTER TABLE IF EXISTS public.user_sessions
ADD COLUMN IF NOT EXISTS ide_refresh_token TEXT;

-- Ensure is_ide_device exists
ALTER TABLE IF EXISTS public.user_sessions
ADD COLUMN IF NOT EXISTS is_ide_device BOOLEAN DEFAULT false;

-- Add API key columns if they don't exist
ALTER TABLE IF EXISTS public.user_sessions
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS api_key_expires_at TIMESTAMP WITH TIME ZONE;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON public.user_sessions(status);

-- Ensure RLS is enabled
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Users can read their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update status of their own sessions" ON public.user_sessions;
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
COMMENT ON COLUMN public.user_sessions.api_key IS 'API key for authenticated requests';