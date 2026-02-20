# Password Reset System

**Last Updated**: 2026-02-20
**Status**: Implemented — requires Supabase Dashboard email template update

---

## 1. Architecture Overview

Password reset uses a **server-side token verification** approach via Supabase `verifyOtp()`. This bypasses the PKCE code verifier limitation where `exchangeCodeForSession(code)` requires the same browser/device that initiated the reset flow.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Password Reset Flow                                      │
│                                                                              │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────────────────┐   │
│  │  Browser     │    │  Supabase Auth   │    │  edlide.com (Next.js)     │   │
│  │              │    │  Server           │    │                           │   │
│  │ 1. Forgot    │──>│ resetPassword     │    │                           │   │
│  │    Password  │    │ ForEmail()        │    │                           │   │
│  │              │    │                   │    │                           │   │
│  │ 2. Email     │<──│ Sends email with  │    │                           │   │
│  │    received  │    │ recovery link     │    │                           │   │
│  │              │    │                   │    │                           │   │
│  │ 3. Click     │──>│ /auth/v1/verify   │──>│ GET /auth/confirm         │   │
│  │    link      │    │ verifies token    │    │ ?token_hash=xxx           │   │
│  │              │    │ redirects to app  │    │ &type=recovery            │   │
│  │              │    │                   │    │                           │   │
│  │              │    │                   │    │ 4. verifyOtp() server-    │   │
│  │              │    │                   │    │    side → sets cookies    │   │
│  │              │    │                   │    │                           │   │
│  │ 5. Redirect  │<──│                   │<──│ 302 → /account/           │   │
│  │    to reset  │    │                   │    │    reset-password         │   │
│  │    form      │    │                   │    │                           │   │
│  │              │    │                   │    │                           │   │
│  │ 6. Enter new │──>│                   │    │ getUser() → valid session │   │
│  │    password  │    │ updateUser()      │    │ → show form               │   │
│  │              │    │                   │    │                           │   │
│  │ 7. Success   │<──│ Password updated  │    │ signOut() → redirect      │   │
│  │    → /account│    │                   │    │ to /account               │   │
│  └─────────────┘    └──────────────────┘    └───────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why This Architecture

### Problem with Previous Approach

The original implementation created a **separate Supabase client** on the reset-password page without `flowType: 'pkce'`. The global Supabase client uses PKCE, so Supabase redirected with `?code=xxx` instead of `#access_token=xxx`. The local client without PKCE couldn't process the code → `PASSWORD_RECOVERY` event never fired → page showed "Invalid Reset Link" after 3s timeout.

Even after fixing the flowType mismatch, `exchangeCodeForSession(code)` requires a **PKCE code verifier** stored in localStorage of the browser that initiated the flow. If the user opens the email link in a different browser, mail app, or incognito tab — the code verifier is missing and exchange fails.

### Solution: Server-Side `verifyOtp` with `token_hash`

Supabase's `verifyOtp({ type: 'recovery', token_hash })` does **not** require a PKCE code verifier. It verifies the token directly on the server. This works regardless of which browser/device opens the link.

---

## 3. Complete File Map

| # | File | Role |
|---|------|------|
| 1 | `src/lib/supabase-auth.ts` | `resetPassword()` — calls `resetPasswordForEmail()` with `redirectTo: /auth/confirm?next=/account/reset-password` |
| 2 | `src/components/auth/forgot-password-form.tsx` | UI form — email input, calls `resetPassword(email)`, shows success/error states |
| 3 | `src/components/auth/supabase-signin-button.tsx` | Contains "Forgot password?" link that toggles to `ForgotPasswordForm` |
| 4 | `src/app/auth/confirm/route.ts` | **Server-side Route Handler** — verifies `token_hash` via `verifyOtp()`, sets session cookies, redirects to `/account/reset-password` |
| 5 | `src/app/account/reset-password/page.tsx` | **Client-side page** — checks for valid session via `getUser()`, shows new password form, calls `updateUser({ password })` |
| 6 | `middleware.ts` | Skips `updateSession()` for `/auth/confirm` and `/account/reset-password` paths |
| 7 | `src/lib/supabase.ts` | Global Supabase client with `flowType: 'pkce'` and `detectSessionInUrl: true` |

---

## 4. Detailed Flow

### Step 1: User clicks "Forgot password?"

**File**: `src/components/auth/supabase-signin-button.tsx` (line ~96)

```tsx
<button onClick={() => setShowForgotPassword(true)}>
  Forgot password?
</button>
```

Switches to `ForgotPasswordForm` component.

### Step 2: User submits email

**File**: `src/components/auth/forgot-password-form.tsx` → `src/lib/supabase-auth.ts`

```typescript
// supabase-auth.ts line 136-144
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/account/reset-password`,
  })
  if (error) { throw error }
}
```

- `redirectTo` tells Supabase where to redirect AFTER its `/auth/v1/verify` endpoint processes the token
- The `?next=/account/reset-password` param tells our `/auth/confirm` handler where to redirect after verification
- Supabase sends email containing a link to `https://PROJECT.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=https://edlide.com/auth/confirm?next=/account/reset-password`

### Step 3: User clicks email link → Supabase verifies → redirects to `/auth/confirm`

Supabase's `/auth/v1/verify` endpoint:
1. Validates the recovery token
2. Redirects (303) to the `redirect_to` URL

With the **customized email template** (recommended), the link goes directly to:
```
https://edlide.com/auth/confirm?token_hash=TOKEN_HASH&type=recovery
```

With the **default email template**, the link goes through Supabase first:
```
https://PROJECT.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=...
→ redirects to: https://edlide.com/auth/confirm?next=/account/reset-password&code=AUTH_CODE
```

### Step 4: Server-side verification at `/auth/confirm`

**File**: `src/app/auth/confirm/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  // Creates server-side Supabase client with cookie read/write
  const supabase = createServerClient(...)

  // Approach 1: token_hash + verifyOtp (preferred, no code verifier needed)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) verified = true
  }

  // Approach 2: PKCE code exchange (fallback)
  if (!verified && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) verified = true
  }

  if (verified) {
    // For recovery → redirect to /account/reset-password
    // Session cookies are set on the redirect response
    const redirect = NextResponse.redirect('/account/reset-password')
    // Copy session cookies from supabaseResponse to redirect
    return redirect
  }

  // Failed → redirect to /account with error
  return NextResponse.redirect('/account?error=invalid_recovery_link')
}
```

Key details:
- Uses `createServerClient` from `@supabase/ssr` — reads/writes cookies
- `verifyOtp()` verifies the token server-side without needing PKCE code verifier
- Sets session cookies on the response so the browser carries them forward
- Redirects to `/account/reset-password` where the client page picks up the session

### Step 5: Password reset form

**File**: `src/app/account/reset-password/page.tsx`

```typescript
// Check for existing session (set by /auth/confirm via cookies)
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  setIsValidSession(true)  // → show password form
}

// Also listens for PASSWORD_RECOVERY event (backup)
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    setIsValidSession(true)
  }
})

// Fallback: 4s timeout → "Invalid Reset Link"
```

On form submit:
```typescript
const { error } = await supabase.auth.updateUser({ password })
await supabase.auth.signOut()  // clear recovery session
router.push('/account')         // redirect after 2s
```

Uses the **global** Supabase client from `@/lib/supabase` (not a separate one).

### Step 6: Middleware bypass

**File**: `middleware.ts`

```typescript
if (pathname === '/auth/confirm' || pathname === '/account/reset-password') {
  return NextResponse.next()  // skip updateSession()
}
```

Why:
- `/auth/confirm` handles its own token verification — middleware's `getUser()` would interfere
- `/account/reset-password` reads the session set by `/auth/confirm` — middleware session refresh could cause race conditions

---

## 5. Global Auth Guard for PASSWORD_RECOVERY

**File**: `src/lib/supabase-auth.ts` (lines 34-38, 70)

The global `useSupabaseAuth()` hook (used by Navbar on every page) has two guards:

```typescript
// Guard 1: Skip getSession on reset-password page (line 34-38)
if (window.location.pathname === '/account/reset-password') {
  setIsLoading(false)
  return  // Don't establish global session from recovery
}

// Guard 2: Ignore PASSWORD_RECOVERY event globally (line 70)
if (event === 'PASSWORD_RECOVERY') return
```

This prevents the recovery session from being picked up as a regular user session in the Navbar.

---

## 6. Password Validation Requirements

The reset-password page enforces:
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*(),.?":{}|<>)
- Password confirmation must match

Visual feedback: green checkmarks for met requirements, red border for mismatched confirmation.

---

## 7. Supabase Dashboard Configuration Required

### Redirect URLs

In **Authentication → URL Configuration → Redirect URLs**, ensure these are allowed:
```
https://edlide.com/auth/confirm
https://edlide.com/account/reset-password
```
(Or use wildcard: `https://edlide.com/**`)

### Email Template (Recommended)

In **Authentication → Email Templates → Reset Password**, replace the link with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

This sends the `token_hash` directly to our `/auth/confirm` route handler, bypassing Supabase's `/auth/v1/verify` redirect. Most reliable approach — works from any browser/device.

If the email template is NOT customized, the default `{{ .ConfirmationURL }}` flow still works via the `code` fallback in `/auth/confirm`, but requires the same browser session (PKCE code verifier limitation).

---

## 8. Error Scenarios

| Scenario | What Happens |
|----------|-------------|
| User opens link in same browser | `verifyOtp` succeeds → form shows |
| User opens link in different browser | `verifyOtp` succeeds → form shows (with custom email template) |
| Link expired (>1 hour by default) | `verifyOtp` fails → "Invalid Reset Link" |
| Link already used | `verifyOtp` fails → "Invalid Reset Link" |
| User navigates to `/account/reset-password` directly | No session → 4s timeout → "Invalid Reset Link" |
| Password doesn't meet requirements | Client-side validation prevents submit |
| `updateUser` fails | Error shown below form |

---

## 9. Changes Log

### 2026-02-20: Complete Rewrite of Password Reset Flow

**Root Cause of Bug**: Reset-password page created a separate Supabase client without `flowType: 'pkce'`. With PKCE enabled, Supabase redirected with `?code=xxx` but the client expected `#access_token=xxx`. Additionally, `exchangeCodeForSession(code)` requires a PKCE code verifier stored in the same browser that initiated the flow — fails when email is opened elsewhere.

**Files Changed**:

1. **`middleware.ts`** — Added bypass for `/auth/confirm` and `/account/reset-password`
2. **`src/app/auth/confirm/route.ts`** — NEW: Server-side Route Handler for `verifyOtp` + `token_hash`
3. **`src/app/account/reset-password/page.tsx`** — Rewritten: uses global Supabase client, checks session via `getUser()` instead of waiting for `PASSWORD_RECOVERY` event from PKCE code exchange
4. **`src/lib/supabase-auth.ts`** — Changed `redirectTo` from `/account/reset-password` to `/auth/confirm?next=/account/reset-password`

**Files NOT Changed** (working correctly):
- `src/components/auth/forgot-password-form.tsx` — UI unchanged
- `src/components/auth/supabase-signin-button.tsx` — "Forgot password?" link unchanged
- `src/lib/supabase.ts` — Global client config unchanged

**Supabase Dashboard Required**:
- Email template for "Reset Password" should use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
- Redirect URL `https://edlide.com/auth/confirm` must be allowed
