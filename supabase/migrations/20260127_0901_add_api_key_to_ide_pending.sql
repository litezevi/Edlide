-- Migration: Add api_key column to ide_pending_tokens
-- Date: 2026-01-27
-- Purpose: Add missing api_key column for IDE API key storage

ALTER TABLE IF EXISTS public.ide_pending_tokens
ADD COLUMN IF NOT EXISTS api_key TEXT;

COMMENT ON COLUMN public.ide_pending_tokens.api_key IS 'Optional API key for direct API access';