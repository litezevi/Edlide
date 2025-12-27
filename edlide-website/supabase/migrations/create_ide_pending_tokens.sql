-- Create table for IDE pending tokens
-- Stores temporary tokens while IDE polls for them

CREATE TABLE IF NOT EXISTS public.ide_pending_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_in_seconds INT DEFAULT 300  -- 5 minutes storage
);

-- Create index for fast lookups by state_id
CREATE INDEX IF NOT EXISTS idx_ide_pending_tokens_state_id ON public.ide_pending_tokens(state_id);

-- Create index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_ide_pending_tokens_expires_at ON public.ide_pending_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE public.ide_pending_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all pending tokens
CREATE POLICY "Service role can manage ide_pending_tokens"
ON public.ide_pending_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Users can read their own pending tokens (for debugging)
CREATE POLICY "Users can read their own pending tokens"
ON public.ide_pending_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_ide_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ide_pending_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the table
COMMENT ON TABLE public.ide_pending_tokens IS 'Stores pending OAuth tokens for IDE connections. Tokens are picked up by IDE via polling and automatically cleaned up after 5 minutes.';