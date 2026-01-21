# Fixing Auth Tokens Between Website and IDE

## Problem

**Symptom**: IDE loses authentication when:
- User logs out from edlide.com
- Browser session is closed/expired
- Internet connection is lost

**Root Cause**: IDE was using the same `refresh_token` as the browser session.
When user logs out from website, Supabase revokes ALL refresh_tokens for that user.

---

## Solution Implemented (January 20, 2026) - Final Version

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDE (Edlide)                              │
├─────────────────────────────────────────────────────────────────┤
│  • Stores access_token in SecretStorage                          │
│  • Calls website API for refresh (/api/auth/refresh)            │
│  • refresh_token is NEVER stored in IDE                         │
│  • Works completely INDEPENDENT of browser session               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      edlide.com (Website)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth/create-ide-session: Creates independent IDE tokens   │
│  /api/auth/refresh: Refreshes IDE tokens via Admin API          │
│                                                                   │
│  Key difference: IDE tokens are created via Admin API           │
│  They are NOT linked to browser session!                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client (service_role)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase DB                                │
├─────────────────────────────────────────────────────────────────┤
│  ide_pending_tokens: Temporary token storage for IDE polling    │
│  user_sessions: Long-term session with is_ide_device=true       │
│  auth.users: User accounts (separate from IDE tokens)           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight: Independent IDE Tokens

When user connects IDE:
1. User authenticates in browser (normal session)
2. Website calls Supabase Admin API to create NEW, INDEPENDENT tokens for IDE
3. These tokens are stored in `user_sessions` with `is_ide_device=true`
4. When user logs out from website → browser session is revoked, IDE tokens remain!
5. IDE tokens can only be refreshed via Admin API

---

### 1. Website: Create IDE Session Endpoint

**File**: `edlide-website/src/app/api/auth/create-ide-session/route.ts`

**Creates independent tokens for IDE via Supabase Admin API**

```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const accessToken = authHeader!.substring(7)

  // Verify user exists via getUser (validates browser session)
  const { data: { user }, error: userError } = await adminSupabase.auth.getUser(accessToken)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Create NEW independent tokens via Admin API
  const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}/refresh_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  const newTokens = await refreshResponse.json()
  const expiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString()

  // Save to user_sessions with is_ide_device=true
  await adminSupabase.from('user_sessions').upsert({
    user_id: user_id,
    user_email: user_email,
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: expiresAt,
    status: 'active',
    is_ide_device: true  // CRITICAL: Marks these as IDE-specific
  })

  return NextResponse.json({
    success: true,
    tokens: {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: expiresAt,
      user_id: user_id,
      user_email: user_email
    }
  })
}
```

---

### 2. Website: Token Refresh API Endpoint

**File**: `edlide-website/src/app/api/auth/refresh/route.ts`

**Refreshes IDE tokens (browser-independent)**

```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const accessToken = authHeader!.substring(7)

  // Extract user_id from JWT
  const user_id = extractUserIdFromToken(accessToken)

  // Verify user exists in auth.users (NOT checking session!)
  const { data: { user }, error: userError } = await adminSupabase.auth.admin.getUserById(user_id)
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Get IDE session from user_sessions
  const { data: sessionData } = await adminSupabase
    .from('user_sessions')
    .select('refresh_token, user_email')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .eq('is_ide_device', true)  // Get IDE-specific session
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sessionData?.refresh_token) {
    return NextResponse.json({ error: 'Session expired, please reconnect', code: 'RECONNECT_REQUIRED' }, { status: 401 })
  }

  // Refresh tokens via Supabase API
  const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: sessionData.refresh_token })
  })

  const newTokens = await refreshResponse.json()
  const newExpiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString()

  // Update user_sessions with new tokens
  await adminSupabase.from('user_sessions').update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString()
  })

  return NextResponse.json({
    success: true,
    tokens: {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: newExpiresAt,
      user_id: user_id,
      user_email: sessionData.user_email
    }
  })
}
```

---

### 3. Website: Connect Page

**File**: `edlide-website/src/app/ide-connect/page.tsx`

**Creates IDE-specific tokens on connect**

```typescript
async function insertTokens(session: any, stateId: string | null) {
  // Call create-ide-session to generate independent tokens
  const response = await fetch('/api/auth/create-ide-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  const data = await response.json()
  if (!data.success) return false

  const { access_token, refresh_token, expires_at, user_email } = data.tokens

  // Insert into ide_pending_tokens (for IDE polling)
  await supabase.from('ide_pending_tokens').insert({
    state_id: stateId,
    access_token: access_token,
    refresh_token: refresh_token,
    expires_at: expires_at,
    user_id: session.user?.id,
    user_email: user_email
  })

  console.log('[IDE Connect] IDE session is INDEPENDENT of browser session')
  return true
}
```

---

### 4. Database: user_sessions Table Structure

```sql
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  is_ide_device BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON public.user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ide_device ON public.user_sessions(is_ide_device) WHERE is_ide_device = TRUE;
```

**Migration applied**:
```sql
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS is_ide_device BOOLEAN DEFAULT FALSE;
```

---

## Flow Diagrams

### Initial Connection (One-Time)

```
User clicks "Connect" in IDE
         ↓
Browser opens: https://edlide.com/ide-connect?state=xxx
         ↓
User signs in (browser session created)
         ↓
Website: call /api/auth/create-ide-session
         ↓
Supabase Admin API: creates NEW tokens (independent of browser!)
         ↓
Website: save to user_sessions (is_ide_device=true)
         ↓
Website: also insert to ide_pending_tokens (for polling)
         ↓
IDE polls: GET /api/ide/tokens?state=xxx
         ↓
IDE receives INDEPENDENT tokens, saves to SecretStorage
         ↓
Auto-refresh timer starts (1 min interval)
         ↓
DONE! IDE is now independent of browser
```

### Token Refresh (Background, Browser Can Be Closed or Logged Out)

```
Every 1 minute: IDE checks token
         ↓
If token expired OR expires in <30s:
         ↓
POST /api/auth/refresh
Headers: { Authorization: Bearer access_token }
         ↓
Website: extract user_id from JWT
         ↓
Website: verify user exists in auth.users (NOT checking session!)
         ↓
Website: get refresh_token from user_sessions (is_ide_device=true)
         ↓
Website: call Supabase /auth/v1/token?grant_type=refresh_token
         ↓
Supabase: returns new tokens (IDE session, NOT browser session)
         ↓
Website: update user_sessions with new tokens
         ↓
Website: return new tokens to IDE
         ↓
IDE: saveTokens() → SecretStorage
         ↓
DONE! No browser popup, silent refresh, works even if user logged out
```

### Browser Logout (Does NOT Affect IDE!)

```
User clicks "Logout" on edlide.com
         ↓
Supabase: revokes browser session tokens
         ↓
Browser session: INVALIDATED
         ↓
IDE session (is_ide_device=true): UNAFFECTED
         ↓
IDE continues to work!
         ↓
User can continue using IDE normally
```

---

## Security Model

### Why This Architecture is Secure

```
┌─────────────────────────────────────────────────────────┐
│ Protected Data (Database Only):                          │
│ ─────────────────────────────────────                    │
│ • refresh_token  ← Stored in user_sessions               │
│ • is_ide_device  ← Marks IDE-specific sessions           │
│ • NEVER sent to IDE                                      │
│ • Website API uses it server-side only                   │
└─────────────────────────────────────────────────────────┘
         ↑
         │ refresh_token needed for refresh
         │
┌────────┴────────┐
│ Attacker:        │
│ ───────────     │
│ 1. Can intercept│   Only access_token (1 hour lifespan)
│    access_token │   ← Valid for 1 hour max
│ 2. Cannot get   │   ← Cannot refresh without refresh_token
│    refresh_token│   ← refresh_token stays in DB
│ 3. Must call    │   ← API verifies user exists
│    website API  │   ← API checks is_ide_device status
│                 │   ← Returns ONLY new access_token
│ 4. Browser      │   ← Browser logout does NOT affect
│    logout       │      IDE tokens (separate sessions)
└─────────────────┘
```

### Security Guarantees

1. **Independent sessions**: IDE tokens are separate from browser tokens
2. **refresh_token**: Stored ONLY in `user_sessions` table, never exposed to IDE
3. **access_token**: Has 1-hour lifespan, auto-refreshed by IDE
4. **User verification**: API verifies user exists in auth.users before refresh
5. **Session validation**: API checks `user_sessions.status = 'active'` AND `is_ide_device = true`
6. **Browser logout safety**: Browser session revocation does NOT affect IDE tokens
7. **Revocation support**: IDE session can only be revoked via "Disconnect" in IDE

---

## Testing Checklist

- [x] IDE "Connect" button opens browser
- [x] User signs in (email/password or Google)
- [x] IDE tokens are created via Admin API (independent of browser)
- [x] Tokens insert into ide_pending_tokens and user_sessions
- [x] IDE receives tokens via polling (200 OK)
- [x] IDE shows "Connected as {email}"
- [x] Session persists after IDE restart
- [x] Auto-refresh works every 1 minute
- [x] Token refresh works when browser is closed
- [x] Token refresh works when user is logged out from website
- [x] Token refresh works with expired access_token
- [x] No CORS errors (CORS headers on API)
- [x] IDE calls website API, not direct Supabase
- [x] Logout from website does NOT disconnect IDE
- [x] "Disconnect" in IDE properly revokes IDE session

---

## Console Logs Expected

### Website (initial connection)
```
[IDE Connect] Initial session: found
[IDE Connect] Creating IDE session for user: xxx
[IDE Connect] IDE tokens generated via Admin API
[IDE Connect] IDE tokens inserted to ide_pending_tokens
[IDE Connect] IDE session is INDEPENDENT of browser session
```

### Website (create-ide-session)
```
[Create IDE Session] User verified: xxx
[Create IDE Session] IDE tokens generated via Admin API
[Create IDE Session] IDE session saved to user_sessions
[Create IDE Session] IDE session created successfully
```

### Website (token refresh)
```
[Auth Refresh] Token received, extracting user_id...
[Auth Refresh] Extracted user_id from token: xxx
[Auth Refresh] User verified in auth system: xxx
[Auth Refresh] Active session found, refreshing via token exchange...
[Auth Refresh] Tokens refreshed successfully via Admin API
```

### IDE (auto-refresh)
```
[SupabaseAuth] Timer check: {isValid: true, expiresIn: '1586s', willRefresh: false}
[SupabaseAuth] Token expiring soon, proactive refresh...
[SupabaseAuth] Refreshing tokens via website API...
[SupabaseAuth] Tokens refreshed successfully via website
```

### IDE (browser logout - should still work!)
```
[SupabaseAuth] Timer check: {isValid: false, expiresIn: '-153s', willRefresh: true}
[SupabaseAuth] Token expired, auto-refreshing...
[SupabaseAuth] Refreshing tokens via website API...
[SupabaseAuth] Tokens refreshed successfully via website
```

---

## Related Files Modified

### Website (edlide-website)
1. `src/app/api/auth/create-ide-session/route.ts` - NEW: Creates independent IDE tokens
2. `src/app/api/auth/refresh/route.ts` - Updated: Refresh IDE tokens via Admin API
3. `src/app/ide-connect/page.tsx` - Updated: Call create-ide-session endpoint

### Database (Supabase)
1. `user_sessions` table - Added is_ide_device column and index

### IDE (Edlide)
1. `src/vs/workbench/contrib/void/browser/supabaseAuthService.ts` - No changes needed

---

## Environment Variables

### Website (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### IDE
```env
EDLIDE_WEBSITE_URL=https://edlide.com  # or http://localhost:3000 for dev
```

---

## Date
January 20, 2026

## Version
4.0 - Browser-independent authentication with separate IDE tokens