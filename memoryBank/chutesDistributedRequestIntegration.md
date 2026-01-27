# Chutes Pool Account Distribution System

> Status: Implemented
> Date: January 27, 2026
> Version: 1.0

## Overview

Replaced individual user Chutes OAuth accounts with a centralized pool of Chutes API accounts managed by the admin. All AI requests now go through the pool using the best available account.

## Architecture

### Before (User-Linked Chutes)
```
User → IDE → /api/ai-proxy → User's Chutes Account → Chutes API
```

### After (Pool Distribution)
```
User → IDE → /api/ai-proxy → Pool Manager → Best Available Account → Chutes API
                                      ↓
                               Record Usage & Limits
```

---

## Database Schema

### Table: `public.chutes_pool_accounts`

**Location:** `edlide-website/supabase/migrations/create_chutes_pool_accounts.sql`

```sql
CREATE TABLE public.chutes_pool_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,           -- Admin-friendly name
  access_key TEXT NOT NULL,             -- Public Chutes access key
  encrypted_access_token TEXT NOT NULL, -- AES-256 encrypted
  encrypted_refresh_token TEXT,         -- AES-256 encrypted
  encryption_iv TEXT NOT NULL,          -- AES IV for decryption
  expires_at TIMESTAMP WITH TIME ZONE,  -- Token expiration
  daily_limit INT DEFAULT 5000,         -- 5000 requests/day
  rpm_limit INT DEFAULT 180,            -- 180 requests/minute
  used_today INT DEFAULT 0,             -- Counter (resets 00:00 UTC)
  requests_per_minute INT DEFAULT 0,    -- RPM counter
  last_request_at TIMESTAMP WITH TIME ZONE,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

| Function | Purpose |
|----------|---------|
| `reset_chutes_pool_daily_limits()` | Reset all `used_today` and `requests_per_minute` at 00:00 UTC |
| `chutes_account_has_capacity(id)` | Check if account has available capacity |
| `record_chutes_pool_usage(id)` | Increment counters after each request |
| `get_next_chutes_account()` | Find best available account (lowest usage %) |

---

## Files Created

### 1. Database Migration
**Path:** `edlide-website/supabase/migrations/create_chutes_pool_accounts.sql`

Creates:
- `chutes_pool_accounts` table
- Indexes for fast lookups
- RLS policies (service_role only)
- Helper functions for capacity checking and usage recording

### 2. Pool Manager Library
**Path:** `edlide-website/src/lib/chutes-pool-manager.ts`

Main class: `ChutesAccountPoolManager`

**Methods:**
| Method | Purpose |
|--------|---------|
| `getAvailableAccount()` | Get best account with available capacity |
| `recordUsage(accountId)` | Update counters after request |
| `addAccount(params)` | Add new account to pool |
| `removeAccount(id)` | Remove account from pool |
| `getAllAccounts()` | List all accounts |
| `getAccountById(id)` | Get single account details |
| `setAccountActive(id, active)` | Toggle account status |
| `getPoolStats()` | Get pool statistics |

### 3. Admin API Endpoints

#### GET /api/admin/pool/accounts
List all accounts in pool.

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "accountName": "Account 1",
      "accessKey": "key_xxx...",
      "expiresAt": "2026-01-28T00:00:00Z",
      "dailyLimit": 5000,
      "rpmLimit": 180,
      "usedToday": 1250,
      "requestsPerMinute": 5,
      "lastRequestAt": "2026-01-27T12:30:00Z",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/admin/pool/accounts
Add new account to pool.

**Body:**
```json
{
  "accountName": "Account 1",
  "accessKey": "public_key",
  "accessToken": "encrypted_token",
  "refreshToken": "encrypted_refresh_token", // optional
  "expiresIn": 3600 // optional
}
```

#### GET /api/admin/pool/accounts/:id
Get account details.

#### DELETE /api/admin/pool/accounts/:id
Remove account from pool.

#### PATCH /api/admin/pool/accounts/:id
Toggle account active status.

**Body:**
```json
{
  "isActive": false
}
```

#### GET /api/admin/pool/stats
Get pool statistics.

**Response:**
```json
{
  "stats": {
    "totalAccounts": 5,
    "activeAccounts": 4,
    "totalUsedToday": 5432,
    "avgUsagePercent": 27.16
  }
}
```

---

## Updated Files

### 1. AI Proxy Route
**Path:** `edlide-website/src/app/api/ai-proxy/[[...path]]/route.ts`

**Changes:**
- Replaced `ChutesTokenManager` with `ChutesAccountPoolManager`
- Gets available account from pool instead of user's tokens
- Records usage after each request
- Passes `x-pool-account-id` header to Edge Function

**Flow:**
```
1. Authenticate user
2. Get available account from pool
3. If no account available → 503 Service Unavailable
4. Forward request with fresh access token
5. Record usage in pool
6. Return response
```

---

## Admin Panel

**Path:** `/admin/pool`

**Features:**
- Dashboard with pool statistics (total, active, usage%)
- List of all accounts with:
  - Account name
  - Access key (masked)
  - Daily usage progress bar
  - RPM counter
  - Last request time
  - Active/Inactive status
- Add new account modal
- Toggle account active/inactive
- Remove account

**Access:** Available in Navbar under "Admin Pool" link

---

## How to Add a New Chutes Account

### Option 1: Via Admin Panel
1. Go to `/admin/pool`
2. Click "Add Account"
3. Enter:
   - Account Name (e.g., "Account 1")
   - Access Key (from Chutes dashboard)
   - Access Token (encrypted)
   - Refresh Token (encrypted, optional)
   - Expires In (seconds, optional)

### Option 2: Via API
```bash
curl -X POST https://edlide.com/api/admin/pool/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "Account 2",
    "accessKey": "ak_xxx...",
    "accessToken": "encrypted_token_here",
    "refreshToken": "encrypted_refresh_here"
  }'
```

---

## Daily Reset (00:00 UTC)

The system automatically resets counters via database function:

```sql
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
```

**To automate:** Set up a cron job or Supabase edge function to call this at 00:00 UTC daily.

---

## Account Selection Algorithm

`get_next_chutes_account()` finds the best account by:

1. Filter active accounts only
2. Sort by lowest usage percentage (used_today / daily_limit)
3. For ties, use earliest last_request_at
4. Return first account that passes capacity check

This ensures:
- Even distribution across accounts
- Load balancing
- No single account overload

---

## Usage Flow

```
User Request
    ↓
Authenticate user (Supabase/JWT/API key)
    ↓
PoolManager.getAvailableAccount()
    ↓
Account found?
    ├─ No → Return 503
    └─ Yes → Continue
    ↓
RecordUsage(account.id)
    ↓
Forward to Supabase Edge Function
    ↓
Return streaming response
```

---

## Environment Variables Required

No new environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_ENCRYPTION_KEY` (for token encryption)

---

## Supabase Edge Function Updates Needed

The Edge Function (`ai-proxy`) needs to accept `x-pool-account-id` header for tracking:

```typescript
// In Edge Function
const poolAccountId = req.headers.get('x-pool-account-id')
// Log or track which pool account was used
```

---

## To Do / Future Improvements

1. **Daily Reset Automation**
   - Set up Vercel Cron or Supabase Edge Function
   - Call `reset_chutes_pool_daily_limits()` at 00:00 UTC

2. **Admin Authentication**
   - Currently open - add admin-only access check
   - Use environment variable for admin email(s)

3. **Usage Analytics**
   - Track historical usage per account
   - Show charts in admin panel
   - Alert when accounts near limits

4. **Auto-Scale**
   - Notify admin when all accounts near capacity
   - Suggest adding new accounts

5. **Per-User Limits**
   - Track requests per user
   - Implement user-level rate limiting
   - Support subscription tiers

---

## Security

- Only `service_role` can access `chutes_pool_accounts` table
- Tokens encrypted with AES-256-CBC before storage
- No plain-text tokens anywhere
- All operations server-side only

---

## Rollback Plan

To revert to per-user Chutes accounts:

1. Update `ai-proxy/[[...path]]/route.ts` to use `ChutesTokenManager` instead
2. Keep migration file (doesn't hurt)
3. Optionally remove admin panel page
4. Restore user-facing "Link Chutes Account" UI