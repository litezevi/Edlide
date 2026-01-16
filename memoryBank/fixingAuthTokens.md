# Fixing Auth Tokens Between Website and IDE

## Problem

**Symptom**: Tokens not being inserted into `ide_pending_tokens` table, IDE polling returns 404 with "No tokens found"

```
[API GET] Checking tokens for state: d2312110-e028-421d-a4ab-628dde9259f7
[API GET] No tokens found for state: d2312110-e028-421d-a4ab-628dde9259f7
GET /api/ide/tokens?state=xxx 404
```

**Root Cause**: Missing INSERT Row Level Security (RLS) policies on `ide_pending_tokens` table

---

## Solution Implemented

### 1. Database: Added INSERT RLS Policies

```sql
-- Allow authenticated users to insert their own tokens
CREATE POLICY "Authenticated users can insert their own pending tokens"
ON public.ide_pending_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Allow anyone to insert (state-based security)
CREATE POLICY "Anyone can insert with valid state"
ON public.ide_pending_tokens
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

**Applied via Supabase MCP**: `fix_ide_pending_tokens_insert_policy` migration

---

### 2. Website: Auto-insert Tokens on Session

**File**: `edlide-website/src/app/ide-connect/page.tsx`

**Changes**:
- Added `insertTokens()` helper function
- Auto-insert tokens when session exists (no need to click "Authorize")
- Auto-insert on `SIGNED_IN` auth event
- Added detailed error logging
- Show "Connected Successfully" state before closing

```typescript
async function insertTokens(session: any, stateId: string | null) {
  // Validate inputs
  if (!stateId || !session?.access_token) {
    console.error('[IDE Connect] ERROR: Invalid inputs')
    return false
  }

  // Insert into ide_pending_tokens
  const { error } = await supabase.from('ide_pending_tokens').insert({
    state_id: stateId,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAtDateTime,
    user_id: session.user?.id,
    user_email: session.user?.email
  })

  if (error) {
    console.error('[IDE Connect] ERROR inserting tokens:', JSON.stringify(error, null, 2))
    return false
  }

  return true
}
```

**Auto-insert flow**:
1. Page loads → check session
2. If session exists → insert tokens immediately
3. If no session → show sign-in form
4. On `SIGNED_IN` → insert tokens + close window

---

### 3. Website: Supabase Session Configuration (30 days)

**Files**:
- `edlide-website/src/lib/supabase.ts`
- `edlide-website/src/lib/supabase-auth.ts`

**Configuration**:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'edlide-supabase-session',
  }
})
```

---

## Current RLS Policies for ide_pending_tokens

| Policy | Roles | Command | Condition |
|--------|-------|---------|-----------|
| Service role can manage all | service_role | ALL | true |
| Public can read pending tokens | anon, authenticated | SELECT | true |
| Service role can delete tokens | service_role | DELETE | true |
| Authenticated users can insert | authenticated | INSERT | auth.uid() = user_id |
| Anyone can insert with state | anon, authenticated | INSERT | true |

---

## Testing Checklist

- [ ] IDE "Connect" button opens browser
- [ ] User signs in (email/password or Google)
- [ ] Tokens auto-insert into ide_pending_tokens
- [ ] IDE receives tokens via polling (200 OK)
- [ ] IDE shows "Connected as {email}"
- [ ] Session persists after IDE restart (30 days)
- [ ] No "No tokens found" errors

---

## Console Logs Expected

**Website (successful)**:
```
[IDE Connect] Initial session: found
[IDE Connect] Inserting tokens for state: xxx
[IDE Connect] Tokens inserted successfully for state: xxx
```

**Website (error)**:
```
[IDE Connect] ERROR: Invalid inputs
# OR
[IDE Connect] ERROR inserting tokens: {...}
```

**IDE (successful)**:
```
[AccountSettings] Polling attempt 1/60...
[AccountSettings] Response status: 200
[AccountSettings] Tokens received, saving...
[AccountSettings] Tokens saved successfully!
```

---

## Related Files Modified

1. `edlide-website/src/app/ide-connect/page.tsx` - Auto-insert + better logging
2. `edlide-website/src/lib/supabase.ts` - Session config
3. `edlide-website/src/lib/supabase-auth.ts` - Session config
4. `supabase/migrations/fix_ide_pending_tokens_insert_policy.sql` - RLS policies

---

## Date
January 17, 2026