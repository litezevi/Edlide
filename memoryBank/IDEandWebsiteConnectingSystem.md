# IDE and Website Connecting System

**Last Updated**: 2026-02-20
**Status**: Production-ready, session persistence fixed (30+ days)

---

## 1. Architecture Overview

The IDE-Website connection uses an **API key-based authentication** model. The API key (`edlide_xxx`) is the **sole auth mechanism** for IDE sessions. It is completely independent of browser sessions, Supabase JWT tokens, and website login state.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IDE ↔ Website Connection Flow                        │
│                                                                         │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────────────┐  │
│  │   IDE        │      │  Website      │      │   Supabase           │  │
│  │ (Electron)  │      │ (Next.js)    │      │   (PostgreSQL)       │  │
│  │             │      │              │      │                      │  │
│  │ Settings UI │──1──>│ /ide-connect │──2──>│ /api/ide/create-     │  │
│  │ "Connect"   │      │  page.tsx     │      │  api-key             │  │
│  │             │      │              │      │                      │  │
│  │             │<─4───│ /api/ide/    │<─3───│ ide_pending_tokens   │  │
│  │ Polls       │      │  tokens      │      │ user_sessions        │  │
│  │ state_id    │      │              │      │                      │  │
│  │             │      │              │      │                      │  │
│  │ Stores      │      │              │      │                      │  │
│  │ edlide_xxx  │──5──>│ /api/ai-     │──6──>│ Validates api_key    │  │
│  │ in Keychain │      │  proxy       │      │ in user_sessions     │  │
│  │             │      │              │      │                      │  │
│  │ Auto-refresh│──7──>│ /api/ide/    │──8──>│ Extends              │  │
│  │ every 12h   │      │  get-access- │      │ api_key_expires_at   │  │
│  │             │      │  token       │      │ by 30 days           │  │
│  └─────────────┘      └──────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Principles
- **No Supabase JWT dependency** — IDE never stores or uses Supabase JWT tokens
- **API key = access_token** — The `edlide_xxx` key is stored as `access_token` in IDE's SecretStorage
- **Rolling expiry** — Every successful refresh extends `api_key_expires_at` by 30 days from now
- **OS-level security** — Tokens encrypted via Electron's SecretStorage (macOS Keychain, Windows DPAPI, Linux libsecret)

---

## 2. Complete File Map

### IDE Files (Electron/TypeScript)

| File | Purpose |
|------|---------|
| `src/vs/workbench/contrib/void/browser/supabaseAuthService.ts` | Core auth service — stores/loads/refreshes tokens, auto-refresh timer |
| `src/vs/workbench/contrib/void/browser/interfaces/supabaseAuthService.ts` | Service interface (ISupabaseAuthService) |
| `src/vs/workbench/contrib/void/common/supabaseAuthTypes.ts` | TypeScript types: `SupabaseTokens`, `IDEAuthState`, `IDEPendingTokensResponse` |
| `src/vs/workbench/contrib/void/common/supabaseAuthHelper.ts` | Static in-memory cache for sync access to access_token |
| `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/AccountSettingsSection.tsx` | React UI: "Connect to your Account" / "Disconnect" buttons, polling logic |
| `src/vs/workbench/contrib/void/browser/void.contribution.ts` | IDE startup: initializes auth service and starts auto-refresh timer (line 76-96) |
| `src/vs/workbench/contrib/void/browser/chatThreadService.ts` | Chat: gets token via `SupabaseAuthHelper.getAccessTokenSync()` (line 916-949) |
| `src/vs/workbench/contrib/void/browser/editCodeService.ts` | Apply: gets token for Edlide provider (lines 1645, 2176) |
| `src/vs/workbench/contrib/void/browser/toolsService.ts` | Agent tools: gets token (lines 718, 736, 820) |
| `src/vs/workbench/contrib/void/browser/compactingService.ts` | Context compacting: gets token (lines 294-314) |
| `src/vs/workbench/contrib/void/browser/voidSCMService.ts` | SCM commit gen: gets token (line 150) |
| `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts` | Sends `Authorization: Bearer edlide_xxx` to ai-proxy (lines 171-187) |

### Website Files (Next.js)

| File | Purpose |
|------|---------|
| `edlide-website/src/app/ide-connect/page.tsx` | OAuth flow page: user sees "Authorize" button, creates api_key, inserts to ide_pending_tokens |
| `edlide-website/src/app/api/ide/create-api-key/route.ts` | POST: generates `edlide_xxx` api_key (64-char hex), upserts to user_sessions, 30-day expiry |
| `edlide-website/src/app/api/ide/tokens/route.ts` | GET: IDE polls this with `?state={state_id}`, returns pending tokens from ide_pending_tokens (one-time use, deleted after retrieval) |
| `edlide-website/src/app/api/ide/get-access-token/route.ts` | POST: validates api_key, verifies user in auth.users, extends api_key_expires_at by 30 days, returns same api_key back |
| `edlide-website/src/app/api/ai-proxy/[[...path]]/route.ts` | POST: receives `Authorization: Bearer edlide_xxx`, looks up in user_sessions, proxies to Supabase Edge Function with Chutes API key |

### Database Tables (Supabase)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_sessions` | Stores active IDE sessions | `user_id` (unique), `api_key`, `api_key_expires_at`, `status`, `is_ide_device` |
| `ide_pending_tokens` | Temporary storage during OAuth flow (deleted after IDE retrieves) | `state_id` (unique), `access_token` (=api_key), `expires_at`, `user_id`, `user_email` |

---

## 3. Detailed Flow: Initial Connection

### Step 1: User clicks "Connect to your Account" in IDE Settings

**File**: `AccountSettingsSection.tsx` → `handleConnect()`

```
1. Generate random state_id: crypto.randomUUID()
2. Open browser: https://edlide.com/ide-connect?state={state_id}
3. Start polling: GET https://edlide.com/api/ide/tokens?state={state_id}
   - Polls every 1 second, max 10 attempts (10 second timeout)
```

### Step 2: User authorizes on website

**File**: `edlide-website/src/app/ide-connect/page.tsx`

```
1. Check if user has active Supabase session (browser cookie)
2. If not logged in → show SupabaseSignInForm
3. If logged in → auto-connect or show "Authorize" button
4. On authorize:
   a. POST /api/ide/create-api-key with Authorization: Bearer {supabase_jwt}
   b. Server generates: edlide_{randomBytes(32).toString('hex')} = 69 chars
   c. Server upserts to user_sessions:
      - user_id (Supabase UUID)
      - api_key = edlide_xxx
      - api_key_expires_at = now + 30 days
      - status = 'active'
      - is_ide_device = true
   d. INSERT to ide_pending_tokens:
      - state_id = from URL param
      - access_token = api_key (edlide_xxx)
      - refresh_token = api_key (edlide_xxx)
      - expires_at = 30 days from now
      - user_id, user_email
```

### Step 3: IDE receives tokens via polling

**File**: `edlide-website/src/app/api/ide/tokens/route.ts`

```
1. IDE polls GET /api/ide/tokens?state={state_id}
2. Server looks up ide_pending_tokens by state_id
3. If found → returns tokens + deletes the row (one-time use)
4. Response: {
     ready: true,
     tokens: {
       access_token: "edlide_xxx",     // THIS IS THE API KEY
       refresh_token: "edlide_xxx",    // SAME API KEY
       expires_at: "2026-03-22T...",   // 30 days from now
       user_id: "012eb77b-...",
       user_email: "user@email.com"
     }
   }
```

### Step 4: IDE stores tokens securely

**File**: `supabaseAuthService.ts` → `saveTokens()`

```
1. Store in memory: this._tokens = tokens
2. Encrypt and save to SecretStorage: key = "edlide.supabase.tokens"
3. Save auth state: key = "edlide.supabase.authState" = { connected: true, user_email, user_id }
4. Update sync cache: SupabaseAuthHelper.setAccessToken("edlide_xxx")
5. Start auto-refresh timer: setInterval(12 hours)
6. Fire onDidChangeAuthState event → UI updates to "Connected as user@email.com"
```

---

## 4. Detailed Flow: AI Request Authentication

### How AI requests are authenticated

**Files**: `chatThreadService.ts` (line 916-949) → `sendLLMMessage.impl.ts` (line 171-187) → `ai-proxy/route.ts` (line 78-81)

```
1. chatThreadService checks: modelSelection.providerName === 'edlide'
2. Gets token: SupabaseAuthHelper.getAccessTokenSync() → "edlide_xxx"
3. If null → tries authService.whenReady() then retries getAccessTokenSync()
4. Passes supabaseAccessToken to sendLLMMessage

5. sendLLMMessage.impl.ts creates OpenAI client:
   new OpenAI({
     baseURL: 'https://edlide.com/api/ai-proxy',
     apiKey: "edlide_xxx",
     defaultHeaders: {
       'Authorization': 'Bearer edlide_xxx',
       'x-edlide-client': 'electron'
     }
   })

6. ai-proxy/route.ts receives request:
   a. Checks authHeader.startsWith('Bearer edlide_') → TRUE
   b. Extracts api_key from header
   c. Looks up in user_sessions: .eq('api_key', key).eq('is_ide_device', true).eq('status', 'active')
   d. Gets user_id from session
   e. Calls adminSupabase.auth.admin.getUserById(user_id) → verifies user exists
   f. Gets subscription + decrypts chutes_api_key
   g. Checks daily request limits
   h. Proxies request to Supabase Edge Function ai-proxy with chutes API key
```

---

## 5. Detailed Flow: Auto-Refresh (Session Extension)

### How sessions stay alive for 30+ days

**Files**: `supabaseAuthService.ts` → `get-access-token/route.ts`

### IDE Side (supabaseAuthService.ts)

```
Constants:
  REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000    // 12 hours
  REFRESH_BEFORE_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

Timer logic (runs every 12 hours):
  1. getTokens() → load from memory/SecretStorage
  2. isTokenValid() → check if expires_at > now
  3. Calculate timeUntilExpiry = expires_at - now

  IF token expired (isValid = false):
    → refreshTokens() → extends by 30 days

  ELSE IF timeUntilExpiry < 7 days:
    → refreshTokens() → proactive extension by 30 days

  ELSE:
    → do nothing (token still valid with 7+ days remaining)
```

### refreshTokens() method (supabaseAuthService.ts lines 186-238)

```
1. POST https://edlide.com/api/ide/get-access-token
   Headers: { 'X-API-Key': 'edlide_xxx' }

2. Server validates and extends (see below)

3. On success response:
   - SECURITY CHECK: verify returned access_token starts with 'edlide_'
   - If not → keep original api_key (never overwrite with JWT or garbage)
   - Save: {
       access_token: safeAccessToken,     // always edlide_xxx
       refresh_token: safeAccessToken,    // same
       expires_at: newExpiresAt,          // 30 days from now (extended)
       user_id, user_email
     }

4. On failure (401, network error):
   - Return null (old tokens remain in storage, not cleared)
   - IDE continues working with existing api_key
```

### Server Side (get-access-token/route.ts)

```
1. Extract X-API-Key header
2. Validate format: must start with 'edlide_'
3. Look up in user_sessions:
   .eq('api_key', apiKey)
   .eq('is_ide_device', true)
   .eq('status', 'active')
4. Check api_key_expires_at > now (reject if expired)
5. SECURITY: Verify user exists in auth.users via admin API
   - If user deleted → revoke session (status = 'revoked')
6. Extend: UPDATE user_sessions SET api_key_expires_at = now + 30 days
7. Return: { success: true, tokens: { access_token: apiKey, ... expires_at: newExpiresAt } }
   - Returns the SAME api_key back (not a new one)
```

### Timeline Example

```
Day 0:  User connects → api_key valid until Day 30
Day 0:  12h timer starts
Day 0+12h: Timer fires → 30 days remaining > 7 days → no refresh
Day 1:  Timer fires → 29 days remaining > 7 days → no refresh
...
Day 23: Timer fires → 7 days remaining = 7 days → PROACTIVE REFRESH!
        → Server extends to Day 53
Day 23+12h: Timer fires → 30 days remaining > 7 days → no refresh
...
Day 46: Timer fires → 7 days remaining → PROACTIVE REFRESH → extends to Day 76
...
(infinite cycle — session never expires as long as IDE is opened at least once per 30 days)
```

---

## 6. Detailed Flow: Disconnect

**File**: `AccountSettingsSection.tsx` → `handleDisconnect()`

```
1. supabaseAuthService.removeTokens()
   a. this._tokens = null
   b. secretStorage.delete("edlide.supabase.tokens")
   c. secretStorage.delete("edlide.supabase.authState")
   d. SupabaseAuthHelper.setAccessToken(null)
   e. stopAutoRefresh() → clearInterval
   f. Fire onDidChangeAuthState({ connected: false })
2. UI updates to show "Connect to your Account" button
```

**Note**: The api_key in `user_sessions` is NOT revoked on disconnect. It simply becomes orphaned. If user reconnects, a new api_key is upserted (old one overwritten because `onConflict: 'user_id'`).

---

## 7. IDE Startup (Reconnecting After Restart)

**Files**: `supabaseAuthService.ts` constructor → `void.contribution.ts` (line 76-96) → `AccountSettingsSection.tsx` useEffect

```
1. SupabaseAuthService constructor (Eager instantiation):
   a. _initialize() → getTokens() → loads from encrypted SecretStorage
   b. If tokens found → SupabaseAuthHelper.setAccessToken("edlide_xxx")

2. void.contribution.ts (100ms after startup):
   a. Gets authService from service container
   b. Checks SupabaseAuthHelper.getAccessTokenSync() → "edlide_xxx" or null
   c. Calls authService.startAutoRefresh() → starts 12h timer

3. AccountSettingsSection.tsx useEffect:
   a. Calls authService.getAuthState()
   b. If connected → shows "Connected as user@email.com"
   c. Also calls authService.startAutoRefresh() (redundant but safe)

4. First AI request:
   a. chatThreadService → SupabaseAuthHelper.getAccessTokenSync() → "edlide_xxx"
   b. If null → authService.whenReady() → waits for init → retries
   c. Sends request with Authorization: Bearer edlide_xxx → works!
```

---

## 8. Security Model

### API Key Format
- Pattern: `edlide_` + 64 hex characters (from `randomBytes(32)`)
- Example: `edlide_ea2dcb113e9b281d8fe5dea7a1b3c4d5e6f7890a1b2c3d4e5f6a7b8c9d0e1f2`
- Total length: 71 characters
- Entropy: 256 bits (cryptographically secure)

### Storage Security
| Location | Encryption | Persistence |
|----------|-----------|-------------|
| IDE SecretStorage | OS-level (Keychain/DPAPI/libsecret) | Survives IDE restarts |
| SupabaseAuthHelper cache | None (in-memory only) | Lost on IDE close, rebuilt on startup |
| user_sessions (DB) | Plain text (server-side, service_role access only) | Persistent until overwritten |
| ide_pending_tokens (DB) | Plain text | Deleted after IDE retrieves (one-time use) |

### Validation Chain (per AI request)
```
1. IDE sends: Authorization: Bearer edlide_xxx
2. ai-proxy checks: header starts with 'Bearer edlide_' (format validation)
3. ai-proxy queries: user_sessions WHERE api_key = 'edlide_xxx' AND is_ide_device = true AND status = 'active'
4. ai-proxy verifies: adminSupabase.auth.admin.getUserById(user_id) (user exists in auth.users)
5. ai-proxy checks: subscription exists with encrypted chutes_api_key
6. ai-proxy checks: daily request limit not exceeded
```

### Security: refreshTokens() protection
The IDE's `refreshTokens()` has a guard to prevent the api_key from being overwritten with a JWT or any non-edlide token:
```typescript
const safeAccessToken = (returnedAccessToken && returnedAccessToken.startsWith('edlide_'))
  ? returnedAccessToken
  : tokens.access_token; // keep original api_key
```

### Security: get-access-token protection
The server's `get-access-token` endpoint:
1. Rejects keys not starting with `edlide_`
2. Validates key exists in DB with active status
3. Checks api_key_expires_at hasn't passed
4. Verifies user exists via admin API (auto-revokes if user deleted)
5. Returns the SAME api_key (never generates a new one or returns JWT)

---

## 9. Database Schema Details

### user_sessions (for IDE auth)

```sql
CREATE TABLE public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text UNIQUE NOT NULL,           -- Supabase auth.users.id (UUID format)
  user_email text,
  status text DEFAULT 'active'::text,     -- CHECK: 'active' | 'revoked'
  api_key text,                           -- edlide_xxx (64 hex chars)
  api_key_expires_at timestamptz,         -- Rolling 30-day window
  is_ide_device boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Legacy columns (unused, may be dropped):
  access_token text,                      -- NULL (not used)
  refresh_token text,                     -- NULL (not used)
  expires_at timestamptz,                 -- NULL (not used)
  ide_refresh_token text                  -- NULL (not used)
);
```

**Important**: The `access_token`, `refresh_token`, `expires_at` columns in `user_sessions` are **NOT used** by the current system. Only `api_key` and `api_key_expires_at` matter. There was a migration `alter_user_sessions_remove_tokens_20260120.sql` to drop these columns but it may or may not have been applied. The current code does NOT read or write to these columns.

### ide_pending_tokens (temporary OAuth flow)

```sql
CREATE TABLE public.ide_pending_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state_id text UNIQUE NOT NULL,          -- UUID generated by IDE
  access_token text NOT NULL,             -- = api_key (edlide_xxx)
  refresh_token text,                     -- = api_key (edlide_xxx)
  expires_at timestamptz NOT NULL,        -- 30 days from creation
  user_id text NOT NULL,
  user_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_in_seconds integer DEFAULT 300, -- Auto-cleanup after 5 min (unused)
  api_key text                            -- NULL (not used)
);
```

**Lifecycle**: Row is inserted when user authorizes on website → IDE polls and retrieves → row is deleted. Expired rows are cleaned up on each poll request.

---

## 10. Common Scenarios

### Scenario: User reconnects (clicks "Connect" again)
1. `removeTokens()` clears old tokens from IDE
2. New state_id generated
3. Website creates NEW api_key via `create-api-key`
4. `create-api-key` does UPSERT on `user_id` → old api_key overwritten
5. IDE receives new api_key → old one is now invalid in DB

### Scenario: User deleted from auth.users
1. Next time `get-access-token` is called (auto-refresh timer)
2. Server calls `getUserById()` → user not found
3. Server sets session `status = 'revoked'`
4. IDE refresh fails → returns null → old tokens remain but AI requests will fail
5. `ai-proxy` also calls `getUserById()` → will fail → 401

### Scenario: IDE closed for 25 days, then reopened
1. On startup: loads tokens from SecretStorage (they persist)
2. `expires_at` is 5 days away (30 - 25 = 5)
3. Auto-refresh timer fires → 5 days < 7 days → proactive refresh
4. Server extends api_key_expires_at by 30 more days
5. Session continues seamlessly

### Scenario: IDE not opened for 31 days
1. On startup: loads tokens from SecretStorage
2. `isTokenValid()` → `expires_at` has passed → false
3. Auto-refresh timer fires → token expired → calls refreshTokens()
4. Server returns 401: "API key expired, RECONNECT_REQUIRED"
5. IDE refresh fails → UI shows "Connected" but AI requests fail
6. User must click "Disconnect" then "Connect" to get new api_key

---

## 11. Changes Log

### 2026-02-20: Fixed Session Expiry (was dying after ~1 day)

**Root Cause**: The `get-access-token` endpoint had broken Supabase JWT refresh logic. It tried to use `access_token/refresh_token/expires_at` columns from `user_sessions`, but `create-api-key` never populated these columns (they were always NULL). This caused the endpoint to always return `401 "Session expired, RECONNECT_REQUIRED"`.

Additionally, the IDE's `refreshTokens()` method would overwrite the api_key (`edlide_xxx`) with a Supabase JWT token if the refresh ever succeeded, which would break `ai-proxy` authentication (it checks for `edlide_` prefix).

The auto-refresh timer was set to 60 seconds (testing value), spamming the server with failing requests.

**Files Changed**:

1. **`edlide-website/src/app/api/ide/get-access-token/route.ts`** — Complete rewrite
   - Removed broken Supabase JWT refresh logic (lines 56-134 of old code)
   - Now validates api_key format (`edlide_` prefix)
   - Verifies user exists in auth.users via admin API
   - Extends `api_key_expires_at` by 30 days on each successful call (rolling window)
   - Returns the SAME api_key as access_token (never generates new token)
   - Auto-revokes session if user was deleted from auth.users

2. **`src/vs/workbench/contrib/void/browser/supabaseAuthService.ts`** — 3 changes
   - `REFRESH_INTERVAL_MS`: 60 seconds → **12 hours** (was spamming server every minute)
   - `REFRESH_BEFORE_EXPIRE_MS`: 30 seconds → **7 days** (proactive extension well before expiry)
   - `refreshTokens()`: Added security guard — if server returns access_token not starting with `edlide_`, keeps original api_key (prevents JWT overwrite)
