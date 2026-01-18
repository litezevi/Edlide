# Chutes Tokens Update System (On-Demand Refresh)

> Created: January 18, 2026
> Version: 2.0
> Status: ✅ Implemented, Deployed & Working

---

## Overview

New **on-demand token refresh system** that updates Chutes OAuth tokens only when they are expired or about to expire (within 5 minutes). The system consists of two parts:
1. **Website (Vercel)**: Refreshes tokens on-demand before requests
2. **Edge Function (Supabase)**: Receives pre-refreshed token via header

### Key Features

- **On-Demand Refresh**: Token is refreshed only when truly needed (expired or expiring soon)
- **Real Expiration Tracking**: Uses `expires_at` from OAuth response instead of `updated_at`
- **Centralized Manager**: Single source of truth for token operations
- **Race Condition Prevention**: Prevents multiple simultaneous refresh requests for same user
- **Two-Part Architecture**: Website refreshes → passes token to Edge Function via header

---

## Architecture

### Components

| File | Purpose | Platform |
|------|---------|----------|
| `src/lib/chutes-token-manager.ts` | Centralized token management | Vercel (Next.js) |
| `src/app/api/chat/route.ts` | Uses ChutesTokenManager | Vercel |
| `src/app/api/ai-proxy/[[...path]]/route.ts` | Refreshes & passes token to Edge Function | Vercel |
| `src/app/api/auth/chutes/refresh/route.ts` | Uses ChutesTokenManager | Vercel |
| `src/app/auth/chutes/callback/page.tsx` | Saves real `expiresIn` to database | Vercel |
| `src/lib/chutes-auth.ts` | Stores `expires_in` from OAuth response | Vercel |
| `src/lib/token-encryption.ts` | AES-256-CBC encryption/decryption | Vercel |
| Supabase Edge Function `ai-proxy` | Uses token from header or decrypts from DB | Supabase |
| `public.chutes_tokens` | Supabase table with encrypted tokens | Supabase |

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDE (Edlide App)                          │
│  User sends chat message → POST /api/ai-proxy/chat/completions  │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Vercel: /api/ai-proxy                          │
│  1. Authenticate Supabase user                                   │
│  2. Get tokens from chutes_tokens table                          │
│  3. Check expires_at (expired? expiring soon?)                   │
│  4. If needed → refresh via Chutes API                           │
│  5. Pass fresh token in header: x-chutes-access-token           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Edge Function: ai-proxy                    │
│  1. Check for x-chutes-access-token header                       │
│  2. If present → use it directly (skip DB decryption)           │
│  3. If absent → decrypt from chutes_tokens table (fallback)     │
│  4. Call llm.chutes.ai with valid token                         │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
  ┌──────────────┐               ┌──────────────┐
  │ Token from   │               │ Decrypt from │
  │ header (new) │               │ DB (fallback)│
  └──────────────┘               └──────────────┘
```

### Database Schema

```sql
CREATE TABLE public.chutes_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                    -- Supabase user ID
  chutes_user_id TEXT NOT NULL,             -- Chutes user ID
  username TEXT,                            -- @username
  encrypted_access_token TEXT NOT NULL,     -- AES-256-CBC encrypted
  encrypted_refresh_token TEXT NOT NULL,    -- AES-256-CBC encrypted
  encryption_iv TEXT NOT NULL,              -- Base64 IV (same for both tokens)
  expires_at TIMESTAMPTZ,                   -- Token expiration time (CRITICAL!)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chutes_tokens_user_id ON public.chutes_tokens(user_id);
CREATE INDEX idx_chutes_tokens_chutes_user_id ON public.chutes_tokens(chutes_user_id);

-- RLS Policies (service_role has full access, users can only access their own)
```

---

## How It Works

### 1. Initial OAuth Flow (Token Saving)

```
User completes Chutes OAuth
         ↓
Callback page receives tokens
         ↓
src/lib/chutes-auth.ts:
  - Saves access_token to localStorage
  - Saves refresh_token to localStorage
  - Saves expires_in (e.g., 3600) to localStorage as 'chutes_expires_in'
         ↓
src/app/auth/chutes/callback/page.tsx:
  - Calls /api/auth/chutes/save with accessToken, refreshToken, expiresIn
         ↓
src/app/api/auth/chutes/save/route.ts:
  - Encrypts access_token and refresh_token with SAME IV
  - Calculates expires_at = NOW() + expires_in
  - Upserts to chutes_tokens table
```

**Code Flow:**

```typescript
// src/lib/chutes-auth.ts (lines ~228-238)
const tokenData = await tokenResponse.json()
const user = await auth.getUserInfo(tokenData.access_token)

localStorage.setItem('chutes_access_token', tokenData.access_token)
localStorage.setItem('chutes_refresh_token', tokenData.refresh_token)
localStorage.setItem('chutes_expires_in', String(tokenData.expires_in))  // ← Added

return user
```

```typescript
// src/app/auth/chutes/callback/page.tsx (lines ~97-99)
const accessToken = localStorage.getItem('chutes_access_token')
const refreshToken = localStorage.getItem('chutes_refresh_token')
const expiresIn = parseInt(localStorage.getItem('chutes_expires_in') || '3600', 10)
await saveChutesTokenToDatabase(authenticatedUser, accessToken!, refreshToken || undefined, expiresIn)
```

```typescript
// src/app/api/auth/chutes/save/route.ts (lines ~44-50)
const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(accessToken)
const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(
  refreshToken || '',
  Buffer.from(commonIv, 'base64')  // ← SAME IV for both tokens!
)

await supabase.from('chutes_tokens').upsert({
  expires_at: expiresAt?.toISOString() || null,  // ← Real expiration time
  // ...
})
```

### 2. Token Refresh Logic (On-Demand)

**ChutesTokenManager.getValidAccessToken(userId):**

```
Get tokens from chutes_tokens table
         ↓
Check expires_at:
  - If NOT expired AND NOT expiring soon (<5min) → Return current token
  - If expired OR expiring soon → Proceed to refresh
         ↓
Prevent race conditions:
  - Check if refresh is already in progress for this user
  - If yes → wait for that refresh to complete
  - If no → start new refresh
         ↓
Decrypt refresh_token using encryption_iv
         ↓
Call Chutes API: POST https://idp.chutes.ai/idp/token
  Body: {
    grant_type: "refresh_token",
    refresh_token: <decrypted_refresh_token>,
    client_id: <env>,
    client_secret: <env>
  }
         ↓
Encrypt new tokens with NEW IV:
  - newAccess = encrypt(new_access_token, newIv)
  - newRefresh = encrypt(new_refresh_token, newIv)
         ↓
Update database with new encrypted tokens, new IV, new expires_at
         ↓
Return new access_token
```

**Code - ChutesTokenManager:**

```typescript
// src/lib/chutes-token-manager.ts

private static isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  const expiryTime = new Date(expiresAt).getTime()
  return Date.now() >= expiryTime
}

private static isTokenExpiringSoon(
  expiresAt: string | null,
  thresholdMs: number = REFRESH_THRESHOLD_MS
): boolean {
  if (!expiresAt) return true
  const expiryTime = new Date(expiresAt).getTime()
  return (expiryTime - Date.now()) < thresholdMs
}

static async getValidAccessToken(userId: string): Promise<{
  accessToken: string
  refreshed: boolean
} | null> {
  // 1. Get tokens from database
  const tokens = await supabase
    .from('chutes_tokens')
    .select('encrypted_access_token, encrypted_refresh_token, encryption_iv, expires_at')
    .eq('user_id', userId)
    .single()

  // 2. Check if refresh is needed
  const isExpired = this.isTokenExpired(tokens.expires_at)
  const isExpiringSoon = this.isTokenExpiringSoon(tokens.expires_at)

  if (!isExpired && !isExpiringSoon) {
    // Return current token without refresh
    const accessToken = TokenEncryption.decrypt(
      tokens.encrypted_access_token,
      tokens.encryption_iv
    )
    return { accessToken, refreshed: false }
  }

  // 3. Prevent race conditions - wait for existing refresh
  let refreshPromise = this.refreshInProgress.get(userId)
  if (!refreshPromise) {
    refreshPromise = this.refreshToken(
      userId,
      tokens.encrypted_refresh_token,
      tokens.encryption_iv
    )
    this.refreshInProgress.set(userId, refreshPromise)
  }

  const result = await refreshPromise
  this.refreshInProgress.delete(userId)

  if (result.success && result.accessToken) {
    return { accessToken: result.accessToken, refreshed: true }
  }

  return null
}

private static async refreshToken(
  userId: string,
  encryptedRefreshToken: string,
  encryptionIv: string
): Promise<RefreshResult> {
  // Decrypt refresh token
  const decryptedRefreshToken = TokenEncryption.decrypt(
    encryptedRefreshToken,
    encryptionIv
  )

  // Call Chutes refresh API
  const response = await fetch('https://idp.chutes.ai/idp/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptedRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const newTokens = await response.json()

  // Encrypt with NEW IV
  const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(
    newTokens.access_token
  )
  const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
    newTokens.refresh_token || decryptedRefreshToken,
    Buffer.from(newIv, 'base64')
  )

  // Update database
  await adminSupabase
    .from('chutes_tokens')
    .update({
      encrypted_access_token: newEncryptedAccess,
      encrypted_refresh_token: newEncryptedRefresh,
      encryption_iv: newIv,
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return { success: true, accessToken: newTokens.access_token }
}
```

### 3. AI Proxy API (Website → Edge Function)

This is the main entry point for IDE requests:

```typescript
// src/app/api/ai-proxy/[[...path]]/route.ts

export async function POST(request: NextRequest) {
  // 1. Validate Supabase user
  const { user, error: userError } = await supabase.auth.getUser(userToken)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 2. Check and refresh Chutes token if needed
  const tokenResult = await ChutesTokenManager.getValidAccessToken(user.id)

  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Chutes account not linked' },
      { status: 403 }
    )
  }

  const { accessToken: freshAccessToken, refreshed } = tokenResult
  console.log(`[AI Proxy] Chutes token ready, refreshed: ${refreshed}, length: ${freshAccessToken.length}`)

  // 3. Forward to Edge Function with FRESH token in header
  const response = await fetch(supabaseFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-email': user.email!,
      'x-request-source': 'ide',
      'x-edlide-client': 'electron',
      'x-chutes-access-token': freshAccessToken  // ← Fresh token!
    },
    body: JSON.stringify(requestBody)
  })

  // 4. Return response to IDE
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders
  })
}
```

### 4. Edge Function (Supabase)

Receives pre-refreshed token from website:

```typescript
// Supabase Edge Function: ai-proxy

try {
  // Check for pre-refreshed token from website
  const passedToken = req.headers.get('x-chutes-access-token')
  if (passedToken) {
    console.log('[AI Proxy] Using token from request header (pre-refreshed by website)')
    decryptedToken = passedToken
  } else {
    // Fallback: decrypt from database (for backward compatibility)
    console.log('[AI Proxy] Decrypting token from database')
    decryptedToken = await decryptToken(
      chutesData.encrypted_access_token,
      chutesData.encryption_iv || '',
      encryptionKey
    )
  }

  // Use token for Chutes API calls
  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${decryptedToken}`
    },
    body: JSON.stringify(requestBody)
  })
} catch (error) {
  // Handle errors
}
```

---

## Configuration

### Environment Variables

#### Vercel (Website)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Chutes OAuth
NEXT_PUBLIC_CHUTES_CLIENT_ID=cid_xxx
CHUTES_CLIENT_SECRET=csc_xxx

# Encryption (from Vercel Secrets)
CHUTES_ENCRYPTION_KEY=your_32_or_64_char_hex_key
```

#### Supabase (Edge Function)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
CHUTES_ENCRYPTION_KEY=your_32_or_64_char_hex_key
ai_base_url=https://llm.chutes.ai/v1
```

### Constants

```typescript
// src/lib/chutes-token-manager.ts
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes before expiration
```

---

## Encryption Details

### Algorithm: AES-256-CBC

```typescript
// src/lib/token-encryption.ts

export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-cbc'
  private static readonly IV_LENGTH = 16
  private static readonly KEY_HASH_ALGORITHM = 'sha256'

  private static getEncryptionKey(): Buffer {
    const keyEnv = process.env.CHUTES_ENCRYPTION_KEY
    if (keyEnv.length === 32) {
      return Buffer.from(keyEnv, 'hex')
    }
    return crypto.createHash(this.KEY_HASH_ALGORITHM).update(keyEnv).digest()
  }

  public static encrypt(text: string, providedIv?: Buffer): {
    encrypted: string
    iv: string
  } {
    const key = this.getEncryptionKey()
    const iv = providedIv || crypto.randomBytes(this.IV_LENGTH)
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv)
    const encryptedBuffer = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ])
    return {
      encrypted: encryptedBuffer.toString('base64'),
      iv: iv.toString('base64'),
    }
  }

  public static decrypt(encryptedBase64: string, ivBase64: string): string {
    const key = this.getEncryptionKey()
    const iv = Buffer.from(ivBase64, 'base64')
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv)
    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    return decryptedBuffer.toString('utf8')
  }
}
```

### Critical: Same IV for Access and Refresh Tokens

Both access_token and refresh_token must be encrypted with the **same IV** to work correctly:

```typescript
// When saving new tokens:
const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(accessToken)
const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(
  refreshToken,
  Buffer.from(commonIv, 'base64')  // ← SAME IV!
)

// When refreshing:
const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(newAccess)
const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
  newRefresh,
  Buffer.from(newIv, 'base64')  // ← SAME IV for new tokens!
)
```

---

## Expected Logs

### Scenario 1: Valid Token (No Refresh Needed)

```
[AI Proxy] User authenticated: { user_id: 'abc123', email: 'user@example.com' }
[AI Proxy] Checking and refreshing Chutes token if needed...
[AI Proxy] Chutes token ready, refreshed: false, length: 89
[AI Proxy] AI request from user: { user_id: 'abc123', model: 'Qwen/Qwen3-32B', tokenRefreshed: false }
POST /api/ai-proxy/chat/completions 200 in 150ms
```

### Scenario 2: Token Expiring Soon (Proactive Refresh)

```
[AI Proxy] User authenticated: { user_id: 'abc123', email: 'user@example.com' }
[AI Proxy] Checking and refreshing Chutes token if needed...
[ChutesTokenManager] Token expired=false, expiringSoon=true, refreshing...
[ChutesTokenManager] Refreshing token for user: abc123
[ChutesTokenManager] Token refreshed successfully for user: abc123
[AI Proxy] Chutes token ready, refreshed: true, length: 89
[AI Proxy] AI request from user: { user_id: 'abc123', model: 'Qwen/Qwen3-32B', tokenRefreshed: true }
POST /api/ai-proxy/chat/completions 200 in 350ms
```

### Scenario 3: Token Expired (Forced Refresh)

```
[AI Proxy] User authenticated: { user_id: 'abc123', email: 'user@example.com' }
[AI Proxy] Checking and refreshing Chutes token if needed...
[ChutesTokenManager] Token expired=true, expiringSoon=true, refreshing...
[ChutesTokenManager] Refreshing token for user: abc123
[ChutesTokenManager] Token refreshed successfully for user: abc123
[AI Proxy] Chutes token ready, refreshed: true, length: 89
POST /api/ai-proxy/chat/completions 200 in 380ms
```

### Scenario 4: No Linked Account

```
[AI Proxy] User authenticated: { user_id: 'abc123', email: 'user@example.com' }
[AI Proxy] Checking and refreshing Chutes token if needed...
[ChutesTokenManager] No tokens found for user: abc123
POST /api/ai-proxy/chat/completions 403 in 50ms
```

### Scenario 5: Refresh Failed (Invalid Grant)

```
[AI Proxy] User authenticated: { user_id: 'abc123', email: 'user@example.com' }
[AI Proxy] Checking and refreshing Chutes token if needed...
[ChutesTokenManager] Token expired=true, expiringSoon=true, refreshing...
[ChutesTokenManager] Refresh failed: invalid_grant
POST /api/ai-proxy/chat/completions 403 in 200ms
```

---

## Testing

### Check Token Status

```sql
-- See current token status for a user
SELECT
  user_id,
  expires_at,
  NOW() as now,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry,
  CASE
    WHEN expires_at IS NULL THEN 'NULL'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN expires_at < NOW() + INTERVAL '5 minutes' THEN 'EXPIRING SOON'
    ELSE 'VALID'
  END as status
FROM public.chutes_tokens
WHERE user_id = 'your-user-id';
```

### Force Token Expiration for Testing

```sql
-- Set expires_at to 1 minute in the past
UPDATE public.chutes_tokens
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE user_id = 'your-user-id';

-- Or set expires_at to 3 minutes in the future (will trigger refresh)
UPDATE public.chutes_tokens
SET expires_at = NOW() + INTERVAL '3 minutes'
WHERE user_id = 'your-user-id';
```

### Monitor Logs in Vercel

```bash
# View live logs
vercel logs --follow
```

Filter for Chutes operations:
```
vercel logs | grep "ChutesTokenManager"
```

---

## Files Modified

### New Files

1. **`src/lib/chutes-token-manager.ts`**
   - `ChutesTokenManager` class with static methods
   - `getValidAccessToken(userId)`
   - `refreshIfNeeded(userId)`
   - `getTokensInfo(userId)`
   - Race condition prevention via `refreshInProgress` Map
   - Proper IV handling for token encryption

### Modified Files

1. **`src/app/api/chat/route.ts`**
   - Removed inline refresh logic
   - Now uses `ChutesTokenManager.getValidAccessToken()`

2. **`src/app/api/ai-proxy/[[...path]]/route.ts`**
   - Added `ChutesTokenManager.getValidAccessToken()` call
   - Passes fresh token in `x-chutes-access-token` header to Edge Function

3. **`src/app/api/auth/chutes/refresh/route.ts`**
   - Simplified to use `ChutesTokenManager`
   - Returns proper status information

4. **`src/app/api/auth/chutes/get-token/route.ts`**
   - Fixed to use correct column names (encrypted columns)
   - Returns only public info, not encrypted tokens

5. **`src/app/auth/chutes/callback/page.tsx`**
   - Now passes real `expiresIn` to save endpoint

6. **`src/lib/chutes-auth.ts`**
   - Added `chutes_expires_in` storage in localStorage
   - Captures `expires_in` from OAuth token response

7. **`supabase/.temp/functions/index.ts` (Edge Function)**
   - Added support for `x-chutes-access-token` header
   - Uses pre-refreshed token if available (skips DB decryption)
   - Falls back to DB decryption for backward compatibility

---

## Deployment

### Deploy Website (Vercel)

```bash
cd edlide-website
vercel deploy --prod
```

### Deploy Edge Function (Supabase)

```bash
cd edlide-website/supabase
supabase functions deploy ai-proxy --project-id kvftejfolyrfdxppbcqk
```

Or download, modify, and deploy:

```bash
supabase functions download ai-proxy --project-id kvftejfolyrfdxppbcqk
# Edit supabase/functions/ai-proxy/index.ts
supabase functions deploy ai-proxy --project-id kvftejfolyrfdxppbcqk
```

---

## Error Handling

### Invalid Grant (Refresh Token Revoked)

When Chutes returns `invalid_grant`, the token is NOT deleted from database:

```typescript
// ChutesTokenManager.refreshToken()
const response = await fetch('https://idp.chutes.ai/idp/token', { ... })
if (!response.ok) {
  const errorText = await response.text()
  console.error(`[ChutesTokenManager] Refresh failed: ${errorText}`)
  return { success: false, error: `Refresh failed: ${response.status}` }
}
```

User sees: "Please re-link your Chutes account" and can re-authenticate.

### Decryption Failure

If `TokenEncryption.decrypt()` returns empty string:

```typescript
const decryptedRefreshToken = TokenEncryption.decrypt(encryptedRefreshToken, encryptionIv)
if (!decryptedRefreshToken) {
  return { success: false, error: 'Failed to decrypt refresh token' }
}
```

### Database Errors

If Supabase update fails:

```typescript
const { error: updateError } = await adminSupabase
  .from('chutes_tokens')
  .update({ ... })
  .eq('user_id', userId)

if (updateError) {
  return { success: false, error: 'Failed to save new token' }
}
```

---

## Security Architecture

### Data Flow Security

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  - Only sends Supabase JWT                                       │
│  - Never sees Chutes tokens                                      │
│  - Never has encryption keys                                     │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Website)                             │
│  Server-side:                                                    │
│  ✓ Reads encrypted tokens from Supabase                          │
│  ✓ Decrypts using CHUTES_ENCRYPTION_KEY (Vercel Secrets)        │
│  ✓ Calls Chutes API for refresh if needed                        │
│  ✓ Passes FRESH token to Edge Function via header               │
│  Never exposes to browser:                                       │
│  ✗ Encryption keys                                               │
│  ✗ client_secret                                                 │
│  ✗ Decrypted tokens                                              │
└────────────────────────┬────────────────────────────────────────┘
                         ↓ (x-chutes-access-token header)
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE (Edge Function)                       │
│  Server-side:                                                    │
│  ✓ Receives fresh token from header (preferred)                  │
│  ✓ OR decrypts from DB (fallback)                                │
│  ✓ Calls llm.chutes.ai with valid token                          │
│  Never exposes to caller:                                        │
│  ✗ Encryption keys                                               │
│  ✗ Refresh tokens                                                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                       CHUTES AI                                  │
│  Receives valid access_token                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Security Matrix

| Component | What It Sees | What It Protects |
|-----------|-------------|------------------|
| Browser | Supabase JWT only | No Chutes tokens, no keys |
| Vercel (Website) | CHUTES_ENCRYPTION_KEY, client_secret, encrypted tokens | Decrypts/refreshes tokens, passes via header |
| Supabase Edge Function | Encryption key, fresh token | Makes API calls to Chutes |
| Chutes API | Valid access_token | Validates and processes requests |

---

## Migration from v3.0

### What Changed

| Aspect | v3.0 (Old) | v4.0 (New) |
|--------|-----------|-----------|
| Refresh Trigger | Every 15 minutes (age-based) | When expired or expiring soon (expiration-based) |
| Time Tracking | `updated_at` | `expires_at` |
| Architecture | Single (chat/route.ts only) | Two-part (Website + Edge Function) |
| Token to Edge Function | Decrypt in Edge Function | Pass pre-refreshed token via header |
| Race Conditions | None | Prevented via `refreshInProgress` Map |
| expiresIn Saving | Hardcoded 3600 | Real value from OAuth response |
| Fallback | N/A | Edge Function can still decrypt from DB |

### Migration Steps

1. ✅ Deploy website with new ChutesTokenManager
2. ✅ Deploy Edge Function with header support
3. ✅ New tokens saved with proper `expires_at`
4. ✅ Existing tokens will be refreshed on first use (with new logic)
5. ✅ After refresh, all tokens have correct `expires_at`

---

## Future Improvements

### 1. Background Refresh (Cron)

For Pro plans, add proactive refresh for all users:

```typescript
// Run every 8 minutes via Vercel Cron
async function refreshAllExpiringTokens() {
  const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const expiringUsers = await supabase
    .from('chutes_tokens')
    .select('user_id')
    .lt('expires_at', soon)

  for (const user of expiringUsers.data) {
    await ChutesTokenManager.refreshIfNeeded(user.user_id)
  }
}
```

### 2. Token Revocation Webhook

Listen for Chutes webhooks when user revokes access:

```typescript
// POST /api/webhooks/chutes
// Chutes sends POST when user revokes token
DELETE FROM chutes_tokens WHERE chutes_user_id = ?
```

### 3. Redis Caching

Cache decrypted access tokens for performance:

```typescript
const cached = await redis.get(`chutes:access:${userId}`)
if (cached) return cached

const result = await ChutesTokenManager.getValidAccessToken(userId)
await redis.setex(`chutes:access:${userId}`, 3500, result.accessToken) // 58 min
return result
```

---

## Support

For issues:
1. Check Vercel logs: `vercel logs | grep "ChutesTokenManager"`
2. Check Supabase Edge Function logs: `supabase functions logs ai-proxy`
3. Check Supabase RLS policies on `chutes_tokens` table
4. Verify `CHUTES_ENCRYPTION_KEY` is set in both Vercel Secrets and Supabase
5. Confirm `expires_in` is being saved correctly