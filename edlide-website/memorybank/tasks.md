# Task Documentation: Edlide Website

*This file contains documentation of repetitive tasks and their workflows discovered during development.*

---

## Token Encryption Implementation

**Last performed:** Dec 25, 2025
**Complexity:** High
**When needed:** Securing OAuth tokens in database storage

**Files created/modified:**
- `src/lib/token-encryption.ts` - AES-256-CBC encryption utility
- `.env.example` - Added CHUTES_ENCRYPTION_KEY configuration
- `src/app/api/auth/chutes/save/route.ts` - Encrypts tokens before saving
- `src/app/api/chat/route.ts` - Decrypts tokens on-demand + re-encrypts on refresh

**Supabase Migrations Applied:**
1. `add_chutes_token_encryption` - Added encrypted columns + encryption_iv
2. `remove_plain_chutes_tokens` - DELETED plain text columns (access_token, refresh_token)

**Environment Variables Required:**
```env
# Generate secure 256-bit key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CHUTES_ENCRYPTION_KEY=<64-char-hex-key>
```

**Implementation Details:**

**1. Encryption Algorithm:**
- Algorithm: AES-256-CBC
- Key derivation: SHA-256 hash of environment variable
- IV generation: Cryptographically random 16 bytes per token
- Encoding: Base64 for database compatibility
- Key format: 32 bytes (supports 64-char hex or arbitrary string)

**2. Database Schema:**
```sql
CREATE TABLE public.chutes_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chutes_user_id TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,   -- AES-256 encrypted
  encrypted_refresh_token TEXT,            -- AES-256 encrypted
  encryption_iv TEXT NOT NULL,            -- Random IV (base64)
  expires_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(chutes_user_id)
);
```

**3. Token Storage Flow:**
```
Receive plain text token from OAuth provider
    ↓
Generate random IV (16 bytes)
    ↓
Encrypt token using AES-256-CBC with IV
    ↓
Encode result as Base64
    ↓
Store: encrypted_access_token + encryption_iv in database
```

**4. Token Retrieval Flow:**
```
Retrieve encrypted_access_token + encryption_iv from database
    ↓
Decode Base64 → encrypted bytes
    ↓
Decode encryption_iv → bytes
    ↓
Decrypt using AES-256-CBC
    ↓
Get plain text token
    ↓
Use for API calls (never returned to client)
```

**5. Token Refresh Flow:**
```
Detect expired access_token
    ↓
Decrypt encrypted_refresh_token
    ↓
Call OAuth provider refresh endpoint
    ↓
Get new access_token + (optional) new refresh_token
    ↓
Generate NEW random IV
    ↓
Encrypt BOTH new tokens with NEW IV
    ↓
UPDATE database with new encrypted data
```

**6. Security Benefits:**
- 🔒 Database dump protection - Tokens unreadable without encryption key
- 🔒 SQL injection mitigation - Encrypted data useless even if exposed
- 🔒 No plain text anywhere in system
- 🔒 Unique IV per token prevents pattern analysis attacks
- 🔒 Key never logged or exposed

**Best Practices Used:**
- ✅ Never store plain text tokens
- ✅ Unique IV per token (never reuse!)
- ✅ Cryptographically random IV generation
- ✅ Secure key derivation with SHA-256
- ✅ Proper error handling for decryption failures
- ✅ Logging without exposing sensitive data
- ✅ Base64 encoding for database compatibility

**Important Notes:**
- CHUTES_ENCRYPTION_KEY MUST be set in production environment
- If encryption key is lost, ALL tokens become unreadable (users must re-link)
- Cache encrypted tokens in memory if needed (avoid repeated decryption)
- Tokens should be rotated regularly (already handled by refresh mechanism)
- Never log plain text tokens, only metadata (length, status)

**Testing Checklist:**
- [ ] Token encryption creates readable cipher text
- [ ] Token decryption reverses encryption correctly
- [ ] Different IV per token (stored in encryption_iv column)
- [ ] Expired token flow decrypts refresh token correctly
- [ ] Token refresh re-encrypts with new IV
- [ ] Database contains no plain text tokens
- [ ] Console logs show encryption/decryption status
- [ ] Decryption failures are handled gracefully

**Common Issues and Solutions:**

1. **"CHUTES_ENCRYPTION_KEY not set"**
   - Solution: Add environment variable to `.env.local`
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **"Decryption failed" errors**
   - Cause: Wrong encryption key or corrupted IV
   - Solution: Verify CHUTES_ENCRYPTION_KEY matches database format

3. **"Token expired" even after refresh**
   - Cause: Encryption key changed between saves
   - Solution: Keep CHUTES_ENCRYPTION_KEY constant, or re-link accounts

4. **Migration conflicts with old data**
   - Cause: Trying to read non-existent `access_token` column
   - Solution: Apply `remove_plain_chutes_tokens` migration BEFORE updating code

**Future Enhancements:**
- Consider Supabase Vault for encryption key storage
- Implement key rotation mechanism (complex, requires re-encryption of all tokens)
- Add encryption status monitoring (failed decryptions, expired IVs)
- Consider hardware security module (HSM) for key protection

## OAuth2 Authentication Implementation

**Last performed:** Dec 23, 2025
**Complexity:** High
**When needed:** Setting up OAuth2 with Chutes.ai or similar providers

**Files created/modified:**
- `src/lib/chutes-auth.ts` - Core OAuth2 client library
- `src/app/api/auth/chutes/token/route.ts` - Server-side token exchange
- `src/app/auth/chutes/callback/page.tsx` - OAuth callback handler
- `src/components/auth/chutes-signin-button.tsx` - Sign-in button component
- `src/components/layout/chutes-auth-button.tsx` - Navbar auth component
- `src/app/account/page.tsx` - User dashboard integration
- `.env.local` - OAuth credentials configuration

**OAuth Application Setup:**
1. Create OAuth application via Chutes API:
```bash
curl -s -XPOST "https://api.chutes.ai/idp/apps" \
  -H "Authorization: $CHUTES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Edlide Multi-Domain",
    "description": "Edlide IDE - Production + Local",
    "redirect_uris": [
      "http://localhost:3000/auth/chutes/callback",
      "http://localhost:3000/auth/chutes/callback"
    ],
    "homepage_url": "http://localhost:3000",
    "allowed_scopes": ["openid", "profile", "chutes:invoke", "account:read"]
  }'
```

2. Store client_id and client_secret securely

**Environment Variables Setup:**
```env
# Local development (.env.local)
NEXT_PUBLIC_CHUTES_CLIENT_ID=cid_xxxxxxxxxxxxxx
CHUTES_CLIENT_SECRET=csc_xxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000

# Production (Vercel)
NEXT_PUBLIC_CHUTES_CLIENT_ID=cid_xxxxxxxxxxxxxx
CHUTES_CLIENT_SECRET=csc_xxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000
```

**Important Implementation Notes:**
- **Client Secret Protection**: Never expose client_secret on client-side
- **Server-side Token Exchange**: Use API routes for secure token exchange
- **PKCE Support**: OAuth2 authorization must include PKCE parameters
- **State Validation**: Always validate OAuth state parameter
- **Single-use Codes**: Authorization codes can only be used once
- **Error Handling**: Handle invalid_grant, invalid_client, and network errors
- **Multi-domain Support**: Single OAuth app can support multiple redirect URIs

**Common OAuth2 Issues and Solutions:**
1. **"Client Secret exists: false"** - Move token exchange to server-side API route
2. **"invalid_grant" errors** - Authorization code already used or expired
3. **Infinite useEffect loops** - Proper dependency management or use guards
4. **CORS issues** - Ensure correct CORS headers on server endpoints
5. **Redirect URI mismatch** - Exact match required between OAuth app and callback

**Testing OAuth Flow:**
1. Test authorization URL generation
2. Verify state parameter persistence
3. Test successful authorization callback
4. Test error scenarios (user deny, network issues)
5. Verify token refresh mechanism
6. Test logout and token revocation

## Color Scheme Implementation

**Last performed:** Dec 21, 2024
**Complexity:** Medium
**When needed:** When launching new pages or adjusting design elements

**Files to modify:**
- `tailwind.config.js` - Main color definitions
- `src/components/ui/button.tsx` - Button variants
- Component files using colors

**Steps:**
1. Define primary colors in tailwind.config.js
2. Set white backgrounds with purple accents for buttons
3. Ensure foreground text remains white, not purple
4. Only use purple for interactive elements and accents
5. Test contrast ratios for accessibility

**Important notes:**
- Primary color: #9b88c8 (soft purple) - calm, intelligent, futuristic
- Always use white (#f8f9fa) for main text content
- Buttons: white background, purple text, light purple border
- Avoid aggressive neon purples or pure purple backgrounds

## Navigation Layout Implementation

**Last performed:** Dec 21, 2024
**Complexity:** Easy
**When needed:** Adjusting navbar layout or adding new items

**Files to modify:**
- `src/components/Navbar.tsx` - Main navigation component
- `src/components/MobileMenu.tsx` - Mobile responsive menu

**Steps:**
1. Structure navbar with flex layout:
   - Logo on left
   - Navigation items centered with `flex-1 justify-center`
   - Account avatar on right
2. Ensure mobile menu is also centered
3. Remove duplicate navigation links from footer
4. Test responsive behavior

**Important notes:**
- Navigation order: Home | Docs | Download (center)
- Logo: "Edlide" (left)
- Account: Circular avatar (right)
- Mobile: Menu button with centered dropdown

## UI Component Creation Pattern

**Last performed:** Dec 21, 2024
**Complexity:** Medium
**When needed:** Creating new reusable UI components

**Files to modify:**
- `src/components/ui/[component].tsx` - New component
- Update exports if needed
- Test component usage

**Steps:**
1. Use Radix UI primitives as base when available
2. Implement with TypeScript and proper typing
3. Use class-variance-authority (cva) for variants
4. Include forwardRef for composition
5. Use cn() utility for class merging
6. Add proper displayName for debugging
7. Follow shadcn/ui patterns

**Example Implementation:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

**Important notes:**
- Always use forwardRef for component composition
- Include proper TypeScript interfaces
- Add variant patterns with cva when multiple styles needed
- Follow consistent naming conventions

## Next.js App Router Page Structure

**Last performed:** Dec 21, 2024
**Complexity:** Easy
**When needed:** Adding new pages or routes

**Files to modify:**
- `src/app/[route]/page.tsx` - New page component
- May need layout.tsx for route-specific layouts

**Steps:**
1. Create new folder under src/app for route
2. Add page.tsx with default export React component
3. Use proper TypeScript typing
4. Import UI components as needed
5. Follow server component pattern by default

**Layout Pattern:**
- Server components by default
- 'use client' only when interactivity needed
- Import components with @/ prefix for path aliases

**Important notes:**
- No need for explicit routing in Next.js 13+
- File-based routing automatically handles routes
- Use loading.tsx for route-specific loading states
- Error boundaries with error.tsx for route-specific errors

## Tailwind Color Updates

**Last performed:** Dec 21, 2024
**Complexity:** Easy
**When needed:** Adjusting colors or creating new variants

**Files to modify:**
- `tailwind.config.js` - Color definitions

**Steps:**
1. Update colors in theme.extend.colors
2. Restart dev server to see changes
3. Test all affected components
4. Check color contrast for accessibility

**Important notes:**
- Primary is used for interactive elements
- Secondary for secondary text (should remain white)
- Muted for subtle text (light gray)
- Background and surface for dark theme elements
- Always preserve white text for readability

---

## Password Reset System Implementation

**Last performed:** Dec 31, 2025
**Complexity:** Medium
**When needed:** Adding password recovery to authentication system

**Files created:**
- `src/components/auth/forgot-password-form.tsx` - ForgotPasswordForm component + ForgotPasswordCard
- `src/app/account/reset-password/page.tsx` - Reset password page with token exchange

**Files modified:**
- `src/components/auth/supabase-signin-button.tsx` - Added showForgotPassword state + toggle to ForgotPasswordForm

**Supabase Dashboard configuration:**
1. Go to Authentication → Providers → Email
2. Enable "Enable email password resets"
3. Configure SMTP settings for password reset emails

**Environment variables (automatic):**
- Uses existing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- No additional env vars needed

**Steps:**

1. **Create ForgotPasswordForm component:**
   - Email input field with Mail icon
   - "Send Reset Link" button with loading state
   - Success state showing "Check your email" message
   - "Send to another email" button to reset form
   - "Back to Sign In" button to return to login

2. **Create reset-password page:**
   - Use Suspense for useSearchParams
   - Extract `access_token` and `type` from URL params
   - Exchange recovery token for session via `exchangeCodeForSession()`
   - New password input with show/hide toggle (eye icon)
   - Confirm password input with real-time match validation
   - Password requirements checklist (same as sign-up):
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter
     - One number
     - One special character
   - Loading state while verifying recovery link
   - Error state for invalid/expired links
   - Success state with redirect to /account after 2 seconds

3. **Update sign-in form:**
   - Add "Forgot password?" link under password field
   - Add showForgotPassword state
   - Toggle between SignInForm and ForgotPasswordForm

4. **Test the flow:**
   - Click "Forgot password?" on sign-in page
   - Enter email and click "Send Reset Link"
   - Check email for recovery link
   - Click link and verify page loads
   - Enter new password and confirm
   - Verify success message and redirect

**Important notes:**
- Supabase sends the recovery email automatically
- Recovery link contains `access_token` and `type=recovery`
- Token exchange must happen client-side via `exchangeCodeForSession()`
- Password validation same as sign-up for consistency
- Show/hide password toggle improves UX
- Confirm password prevents typos in new password
- Auto-redirect after successful reset improves UX

**Common issues:**
- "Invalid Reset Link" - recovery token expired or already used
- Email not received - check spam folder or SMTP configuration
- Session not restored - verify `exchangeCodeForSession()` is called

**Future enhancements:**
- Add resend email functionality
- Add email verification before reset
- Add countdown timer for resend button
