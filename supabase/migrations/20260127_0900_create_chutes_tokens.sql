-- Migration: Create chutes_tokens table
-- Date: 2026-01-27
-- Purpose: Store Chutes OAuth tokens with encryption

CREATE TABLE IF NOT EXISTS public.chutes_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    chutes_user_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encrypted_access_token TEXT,
    encrypted_refresh_token TEXT,
    encryption_iv TEXT,
    CONSTRAINT chutes_tokens_user_id_unique UNIQUE (user_id),
    CONSTRAINT chutes_tokens_chutes_user_id_unique UNIQUE (chutes_user_id)
);

ALTER TABLE public.chutes_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage chutes_tokens"
ON public.chutes_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can read their own chutes tokens"
ON public.chutes_tokens
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own chutes tokens"
ON public.chutes_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own chutes tokens"
ON public.chutes_tokens
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

COMMENT ON TABLE public.chutes_tokens IS 'Stores Chutes OAuth tokens with automatic 30-day session persistence. Tokens are refreshed proactively on chat requests or via cron monitoring.';
COMMENT ON COLUMN public.chutes_tokens.encrypted_access_token IS 'AES-256-CBC encrypted Chutes access token (never store plain text)';
COMMENT ON COLUMN public.chutes_tokens.encrypted_refresh_token IS 'AES-256-CBC encrypted Chutes refresh token (never store plain text)';
COMMENT ON COLUMN public.chutes_tokens.encryption_iv IS 'Initialization vector for AES encryption';