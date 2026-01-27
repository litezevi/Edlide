-- Create Chutes Pool Accounts table
-- Stores Chutes API accounts for centralized request distribution
-- Each account provides: 5000 requests/day, 180 RPM

CREATE TABLE IF NOT EXISTS public.chutes_pool_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  access_key TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  encryption_iv TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  daily_limit INT DEFAULT 5000,
  rpm_limit INT DEFAULT 180,
  used_today INT DEFAULT 0,
  requests_per_minute INT DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding available accounts
CREATE INDEX IF NOT EXISTS idx_chutes_pool_accounts_active ON public.chutes_pool_accounts(is_active);

-- Index for availability check
CREATE INDEX IF NOT EXISTS idx_chutes_pool_accounts_limits ON public.chutes_pool_accounts(used_today, requests_per_minute, is_active);

-- Enable Row Level Security
ALTER TABLE public.chutes_pool_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can manage pool accounts (admin only)
CREATE POLICY "Service role can manage chutes_pool_accounts"
ON public.chutes_pool_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: No other access allowed
CREATE POLICY "No public access to chutes_pool_accounts"
ON public.chutes_pool_accounts
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Function to reset daily counters (called at 00:00 UTC)
CREATE OR REPLACE FUNCTION reset_chutes_pool_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.chutes_pool_accounts
  SET used_today = 0,
      requests_per_minute = 0,
      last_reset_at = NOW(),
      updated_at = NOW()
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if account has available capacity
CREATE OR REPLACE FUNCTION chutes_account_has_capacity(p_account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used_today INT;
  v_requests_per_minute INT;
  v_daily_limit INT;
  v_rpm_limit INT;
  v_last_request_at TIMESTAMP WITH TIME ZONE;
  v_current_minute TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT used_today, requests_per_minute, daily_limit, rpm_limit, last_request_at
  INTO v_used_today, v_requests_per_minute, v_daily_limit, v_rpm_limit, v_last_request_at
  FROM public.chutes_pool_accounts
  WHERE id = p_account_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check daily limit
  IF v_used_today >= v_daily_limit THEN
    RETURN FALSE;
  END IF;

  -- Check RPM limit
  v_current_minute := DATE_TRUNC('minute', NOW());
  
  IF v_last_request_at IS NULL OR DATE_TRUNC('minute', v_last_request_at) < v_current_minute THEN
    -- New minute, reset counter
    RETURN TRUE;
  END IF;

  IF v_requests_per_minute >= v_rpm_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record request usage
CREATE OR REPLACE FUNCTION record_chutes_pool_usage(p_account_id UUID)
RETURNS void AS $$
DECLARE
  v_last_request_at TIMESTAMP WITH TIME ZONE;
  v_current_minute TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_request_at INTO v_last_request_at
  FROM public.chutes_pool_accounts
  WHERE id = p_account_id;

  v_current_minute := DATE_TRUNC('minute', NOW());

  IF v_last_request_at IS NULL OR DATE_TRUNC('minute', v_last_request_at) < v_current_minute THEN
    -- New minute, reset RPM counter
    UPDATE public.chutes_pool_accounts
    SET used_today = used_today + 1,
        requests_per_minute = 1,
        last_request_at = NOW(),
        updated_at = NOW()
    WHERE id = p_account_id;
  ELSE
    -- Same minute, increment
    UPDATE public.chutes_pool_accounts
    SET used_today = used_today + 1,
        requests_per_minute = requests_per_minute + 1,
        last_request_at = NOW(),
        updated_at = NOW()
    WHERE id = p_account_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get next available account
CREATE OR REPLACE FUNCTION get_next_chutes_account()
RETURNS TABLE (
  id UUID,
  account_name TEXT,
  access_key TEXT,
  encrypted_access_token TEXT,
  encryption_iv TEXT
) AS $$
DECLARE
  v_account RECORD;
BEGIN
  FOR v_account IN
    SELECT id, account_name, access_key, encrypted_access_token, encryption_iv
    FROM public.chutes_pool_accounts
    WHERE is_active = true
    ORDER BY (used_today::FLOAT / NULLIF(daily_limit, 0)) ASC, last_request_at ASC NULLS FIRST
  LOOP
    IF chutes_account_has_capacity(v_account.id) THEN
      RETURN QUERY SELECT 
        v_account.id, 
        v_account.account_name, 
        v_account.access_key, 
        v_account.encrypted_access_token, 
        v_account.encryption_iv;
      RETURN;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.chutes_pool_accounts IS 'Pool of Chutes API accounts for centralized request distribution. Each account provides 5000 requests/day and 180 RPM.';
COMMENT ON COLUMN public.chutes_pool_accounts.access_key IS 'Public access key for Chutes API identification';
COMMENT ON COLUMN public.chutes_pool_accounts.encrypted_access_token IS 'AES-256 encrypted access token';
COMMENT ON COLUMN public.chutes_pool_accounts.encrypted_refresh_token IS 'AES-256 encrypted refresh token';
COMMENT ON COLUMN public.chutes_pool_accounts.encryption_iv IS 'Initialization vector for AES encryption';
COMMENT ON COLUMN public.chutes_pool_accounts.used_today IS 'Requests used today (resets at 00:00 UTC)';
COMMENT ON COLUMN public.chutes_pool_accounts.requests_per_minute IS 'Requests in current minute (resets each minute)';