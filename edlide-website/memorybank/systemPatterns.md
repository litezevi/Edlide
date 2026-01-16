# System Patterns: Edlide Website

## System Architecture

### Application Structure (Actual)
```
/Edlide Website/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── layout.tsx         # Root layout with navbar/footer
│   │   ├── page.tsx           # Home page with Hero & Features
│   │   ├── globals.css        # Global styles and Tailwind imports
│   │   ├── docs/              # Documentation section
│   │   │   └── page.tsx       # Documentation index page
│   │   ├── download/          # Download section
│   │   │   └── page.tsx       # Platform-specific download page
│   │   ├── account/           # Account section
│   │   │   ├── page.tsx       # User dashboard with stats
│   │   │   └── reset-password/ # Password reset page (NEW)
│   │   │       └── page.tsx   # Reset password form with token exchange
│   │   ├── chat/              # Chat section
│   │   │   └── page.tsx       # Chat interface page
│   │   ├── auth/              # Authentication pages
│   │   │   ├── chutes/        # Chutes OAuth callback
│   │   │   │   └── callback/page.tsx
│   │   │   └── ...
│   │   └── api/               # API routes
│   │       ├── auth/          # Authentication API
│   │       │   ├── chutes/    # Chutes OAuth token management
│   │       │   │   ├── token/route.ts       # Exchange code for tokens
│   │       │   │   ├── save/route.ts        # Save tokens to Supabase
│   │       │   │   ├── unlink/route.ts      # Unlink Chutes account
│   │       │   │   └── get-token/route.ts   # Get token from Supabase
│   │       │   ├── signup/route.ts
│   │       │   ├── signin/route.ts
│   │       │   └── refresh/route.ts
│   │       ├── chat/route.ts  # Chat completions API
│   │       └── download/route.ts  # R2 presigned URL generation
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI primitives
│   │   │   ├── button.tsx    # Custom white/purple button style
│   │   │   ├── card.tsx      # Card component for content blocks
│   │   │   ├── avatar.tsx    # User avatar component
│   │   │   ├── dropdown-menu.tsx # Account dropdown menu
│   │   │   ├── toast.tsx     # Toast notifications
│   │   │   └── loading-spinner.tsx # Loading states
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.tsx    # Main navigation (centered menu)
│   │   │   ├── Footer.tsx    # Site footer with attribution
│   │   │   ├── MobileMenu.tsx # Responsive mobile menu
│   │   │   ├── supabase-auth-button.tsx  # Supabase auth dropdown
│   │   │   └── chutes-auth-button.tsx    # Chutes auth dropdown (preserved)
│   │   ├── auth/             # Authentication components
│   │   │   ├── supabase-signin-button.tsx    # Supabase sign-in forms + Forgot Password toggle
│   │   │   ├── supabase-signup-button.tsx    # Supabase sign-up forms
│   │   │   ├── google-button.tsx             # Google OAuth button
│   │   │   ├── chutes-signin-button.tsx      # Chutes OAuth sign-in
│   │   │   ├── forgot-password-form.tsx      # Forgot password form (NEW)
│   │   │   └── ...
│   │   ├── chat/             # Chat components
│   │   │   └── ChatInterface.tsx        # Chat UI with message history
│   │   └── sections/         # Page section components
│   │       ├── HeroSection.tsx # Home page hero with CTA
│   │       └── FeaturesSection.tsx # Feature showcase with icons
│   └── lib/                  # Utility functions and libraries
│       ├── supabase.ts             # Supabase client configuration
│       ├── supabase-auth.ts       # React hook for Supabase auth
│       ├── chutes-auth.ts         # Chutes OAuth2 client library
│       ├── chutes-integration.ts  # Chutes + Supabase integration hook
│       └── utils.ts               # cn() function for class merging
├── public/                   # Static assets
│   └── avatars/              # User avatar images
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # White/purple design system
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js settings
├── postcss.config.js        # PostCSS configuration
├── .eslintrc.json           # ESLint rules
└── .gitignore               # Git ignore patterns
```

### Database Structure (Supabase PostgreSQL)

#### Tables in `public` schema:

**chutes_tokens** — SUPABASE 🔗 CHUTES INTEGRATION TABLE (ENCRYPTED)
```
Columns:
- id: UUID (primary key, auto-generated)
- user_id: UUID (NOT NULL) → references auth.users(id) ON DELETE CASCADE
- chutes_user_id: TEXT (NOT NULL) — sub from Chutes OAuth
- encrypted_access_token: TEXT (NOT NULL) — AES-256-CBC encrypted access token
- encrypted_refresh_token: TEXT (nullable) — AES-256-CBC encrypted refresh token
- encryption_iv: TEXT (NOT NULL) — Unique IV for AES encryption (16 bytes, base64)
- expires_at: TIMESTAMP WITH TIME ZONE (nullable) — Token expiration time
- username: TEXT (nullable) — Chutes username
- created_at: TIMESTAMP WITH TIME ZONE (default: NOW())
- updated_at: TIMESTAMP WITH TIME ZONE (default: NOW())

Constraints:
- UNIQUE(user_id) — One Chutes account per Supabase user
- UNIQUE(chutes_user_id) — Chutes account only linked to one Supabase user

Indexes:
- idx_chutes_tokens_user_id on user_id
- idx_chutes_tokens_chutes_user_id on chutes_user_id

Triggers:
- update_chutes_tokens_updated_at — Auto-updates updated_at on row update

RLS Policies:
- Service role can manage chutes tokens (full access for backend operations)

Security:
- ❌ DELETED: access_token column (plain text - removed for security)
- ❌ DELETED: refresh_token column (plain text - removed for security)
- ✅ ADDED: encrypted_access_token (AES-256-CBC encrypted)
- ✅ ADDED: encrypted_refresh_token (AES-256-CBC encrypted)
- ✅ ADDED: encryption_iv (Unique IV per token)
```

#### Tables in `auth` schema (system tables):
- **users** — Supabase user accounts
- **sessions** — Active user sessions
- **refresh_tokens** — JWT refresh tokens
- **identities** — User identity providers

### Component Hierarchy
- **App Layout**: Root wrapper with global providers
- **Navbar**: Fixed top navigation with responsive design and authentication status
- **Authentication Components**:
  - Supabase auth (PRIMARY): Sign in/up forms, user dropdown
  - Chutes auth (SECONDARY): OAuth integration for AI features
- **Chat Components**: Chat interface with Supabase auth + Chutes token from DB
- **Page Sections**: Modular content blocks
- **Footer**: Fixed bottom with attribution

### Authentication Architecture

#### Primary: Supabase Auth (ACTIVE)
- **Provider**: Supabase Auth service
- **Authentication Methods**:
  - Email/Password
  - **Google OAuth (NEW)** - "Continue with Google" button
- **Token Management**: Supabase session management with automatic refresh
- **User Storage**: Supabase auth.users table
- **UI Components**: SupabaseSignInForm, SupabaseSignUpForm, SupabaseAuthButton, GoogleButton
- **API Routes**: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/refresh`
- **Google OAuth Redirect URIs**:
  - Local: `http://localhost:3000/auth/v1/callback`
  - Production: `http://localhost:3000/auth/v1/callback`

#### Secondary: Chutes OAuth Integration (LINKED to Supabase)
- **Provider**: Chutes.ai Identity Provider
- **Authentication Method**: OAuth2 + OpenID Connect
- **Token Storage**: Supabase chutes_tokens table (NOT localStorage)
- **Binding**: 1-to-1 relationship between Supabase user and Chutes account
- **Linking**: User must be logged into Supabase first, then link Chutes account
- **Token Flow**:
  1. User clicks "Link Chutes" → OAuth redirect to Chutes
  2. User authenticates → Chutes returns authorization code
  3. `/api/auth/chutes/token` exchanges code for access/refresh tokens
  4. `/api/auth/chutes/save` stores tokens in chutes_tokens table
  5. Chat API reads tokens from chutes_tokens table
  6. Auto-refresh via refresh_token before expiration

### Authentication Components

#### Supabase Auth (Primary)
- **src/lib/supabase.ts**: Supabase client configuration
- **src/lib/supabase-auth.ts**: React hook for session management, sign up, sign in, sign out, signInWithOAuth, signUpWithOAuth, resetPassword, updatePassword
- **src/components/auth/supabase-signin-button.tsx**: Sign-in forms + Google button + Forgot Password toggle
- **src/components/auth/supabase-signup-button.tsx**: Sign-up forms + Google button
- **src/components/auth/google-button.tsx**: Google OAuth button with official Google icon
- **src/components/auth/forgot-password-form.tsx**: Forgot password form + Reset password form (NEW)
- **src/components/layout/supabase-auth-button.tsx**: Navbar dropdown with user menu + Unlink Chutes button
- **API Routes**: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/refresh`

#### Chutes Auth (Secondary - Linked)
- **src/lib/chutes-auth.ts**: OAuth2 client with PKCE support
- **src/lib/chutes-integration.ts**: Hook to manage Chutes linkage status
- **src/app/auth/chutes/callback/page.tsx**: OAuth callback handler (saves to DB)
- **src/components/auth/chutes-signin-button.tsx**: Link Chutes account button
- **API Routes**:
  - `/api/auth/chutes/token` — Exchange code for tokens
  - `/api/auth/chutes/save` — Save tokens to chutes_tokens table
  - `/api/auth/chutes/unlink` — GET: Check linkage, DELETE: Unlink Chutes
  - `/api/auth/chutes/get-token` — Retrieve saved token for IDE

### Download Architecture (Cloudflare R2)

**Cloudflare R2 Integration - ACTIVE ✅**
- **Purpose**: Secure download distribution for all platform binaries
- **Bucket**: `edlideimagev100`
- **Endpoint**: `https://3229678876cd5bd68510871faa81e57d.r2.cloudflarestorage.com`
- **Version**: 1.0.0 (Released: January 9, 2026)
- **Files**:
  - `Edlide-1.0.0-arm64.dmg` - macOS Apple Silicon (M1/M2/M3)
  - `Edlide-1.0.0-x64.dmg` - macOS Intel
  - `edlide-1.0.0-x64.exe` - Windows Intel/AMD 64-bit
  - `edlide-1.0.0-arm64.exe` - Windows ARM64

**API Route**: `/api/download?file=arm64|x64`
- Generates presigned URLs with 1-hour expiration
- Uses AWS SDK v3 for S3-compatible R2 API
- Reads credentials from environment variables

**Download Flow**:
```
1. User clicks download button on /download page
   ↓
2. Client calls /api/download?file=<version>
   ↓
3. Server generates presigned URL via AWS SDK
   ↓
4. Server returns { url: "https://..." }
   ↓
5. Client redirects to presigned URL
   ↓
6. Browser downloads directly from R2
```

**Environment Variables Required**:
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY_ID`

### Chat Integration Architecture (UPDATED FOR Vercel AI Proxy)

**COMPLETE DATABASE-DRIVEN FLOW WITH Vercel BACKEND**

**Website Chat Flow**:
1. User sends message → `/api/chat` endpoint
2. Request includes Supabase session token (NOT Chutes token)
3. **Chat API validates Supabase token** → Gets user ID
4. **Chat API reads chutes_tokens table** by user_id
5. **Decrypts encrypted_access_token using encryption_iv** via TokenEncryption class
6. Validates Chutes token with `/idp/userinfo` endpoint
7. If token expired → decrypts refresh_token, gets new access token, re-encrypts both, updates database
8. Calls `https://llm.chutes.ai/v1/chat/completions` with Chutes token
9. Returns AI response to client

**IDE Chat Flow (Via Vercel Proxy)**:
1. IDE authenticates via website (Supabase OAuth)
2. IDE stores Supabase JWT in SecretStorage
3. User sends message in IDE
4. **IDE retrieves Supabase JWT from SecretStorage** (cached via SupabaseAuthHelper)
5. IDE forwards request to **Vercel backend: `/api/ai-proxy/chat/completions`**
6. **Vercel backend validates Supabase JWT** via `supabase.auth.getUser()`
7. **Vercel forwards request to Supabase Edge Function** with:
   - Authorization: service_role key
   - x-user-id: user_id from JWT
   - x-user-email: user_email from JWT
   - x-edlide-client: electron
8. **Supabase Edge Function queries chutes_tokens table** for encrypted token
9. **Edge Function decrypts encrypted_access_token** using:
   - `encryption_iv` from database (16 bytes)
   - `CHUTES_ENCRYPTION_KEY` from environment (AES-256-CBC via Web Crypto API)
10. **Edge Function calls Chutes AI API** with decrypted token as Bearer
11. **Edge Function streams AI response back** through Vercel to IDE
12. IDE displays AI chat response

**Website Chat Flow**:
1. User sends message → `/api/chat` endpoint
2. Request includes Supabase session token (NOT Chutes token)
3. **Chat API validates Supabase token** → Gets user ID
4. **Chat API reads chutes_tokens table** by user_id
5. **Decrypts encrypted_access_token using encryption_iv** via TokenEncryption class
6. Validates Chutes token with `/idp/userinfo` endpoint
7. If token expired → decrypts refresh_token, gets new access token, re-encrypts both, updates database
8. Calls `https://llm.chutes.ai/v1/chat/completions` with Chutes token
9. Returns AI response to client

**Key Technical Insights**:

**Key Technical Insights**:
- Chutes tokens stored in Supabase chutes_tokens table
- Chat API uses Supabase session for auth, not Chutes tokens directly
- Auto-refresh mechanism prevents session loss after sign out
- Unlinking Chutes account removes row from chutes_tokens table + clears localStorage

## Key Technical Decisions

### Routing Strategy
- App Router for optimized performance and streaming
- File-based routing for automatic route generation
- Route groups for organization (/(marketing), /(auth))

### State Management
- Server state via Next.js Server Components
- Client state via React hooks for interactivity
- Supabase for persistent state (chutes_tokens table)
- localStorage only for temporary caching (cleared on sign out)

### Styling Architecture
- Tailwind CSS for utility-first styling
- shadcn/ui for component primitives
- CSS Variables for theme consistency
- 8px grid system for spacing

### Data Fetching
- Static generation for marketing pages
- Server Actions for dynamic content
- Client components for interactive features
- Supabase queries for persistent data (chutes_tokens)

## Critical Implementation Paths

### Navigation Flow
1. User lands on Home page
2. Navigation provides access to main sections
3. Account section handles authentication state
4. Chutes linking available for AI features
5. Contextual navigation in docs

### Authentication Flow (Supabase)

#### Email/Password Flow
1. User registers/logs in via email/password
2. Supabase creates session with JWT
3. Session stored in HttpOnly cookies
4. User gets Supabase user account

#### Google OAuth Flow (NEW - Dec 31, 2025)
1. User clicks "Continue with Google" on Sign In or Sign Up page
2. Redirect to `https://kvftejfolyrfdxppbcqk.supabase.co/auth/v1/authorize?provider=google`
3. User authenticates with Google
4. Google redirects to `http://localhost:3000/auth/v1/callback` or `http://localhost:3000/auth/v1/callback`
5. Supabase creates session + user account automatically
6. Redirects to `/account` with session active
7. Google user metadata (name, avatar) stored in `auth.users.user_metadata`

#### Sign Up Flow with Password Validation (NEW - Dec 31, 2025)
1. User fills in Full Name, Email, Password
2. **Real-time password validation**:
   - Minimum 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character (!@#$%^&*...)
3. Password requirements shown with green checkmarks
4. User must confirm password (match validation)
5. User must accept Terms of Use and Privacy Policy (checkbox)
6. **Create Account button disabled** until all requirements met
7. Button text is black for better visibility

#### Password Reset Flow (NEW - Dec 31, 2025)
1. User clicks "Forgot password?" on sign-in page
2. User enters email address
3. User clicks "Send Reset Link"
4. Supabase sends email with recovery link to user's email
5. User clicks link in email → redirects to `/account/reset-password?access_token=xxx&type=recovery`
6. Page exchanges recovery token for session via `exchangeCodeForSession()`
7. User enters new password + confirm password
8. Password validated (same requirements as sign-up)
9. User clicks "Update Password"
10. `updateUser({ password: newPassword })` called
11. Success message shown → Redirect to `/account` after 2 seconds

**Error Cases:**
- Invalid recovery link → Show "Invalid Reset Link" card with "Go to Sign In" button
- Expired recovery link → Same error card
- Password requirements not met → Show error message
- Passwords don't match → Show error message

**Supabase Dashboard Settings:**
- Enable "Email Password Resets" in Authentication → Providers → Email
- Configure SMTP for password reset emails

### Chutes Linking Flow
1. User logs into Supabase first (REQUIRED)
2. User clicks "Link Chutes Account"
3. OAuth redirect to Chutes.ai/idp/authorize
4. User authenticates with Chutes
5. Chutes redirects back with authorization code
6. `/api/auth/chutes/token` exchanges code for access/refresh tokens
7. `/api/auth/chutes/save` stores tokens in chutes_tokens table
8. UI shows Chutes account as linked
9. tokens NO LONGER stored in localStorage

### Chat Flow (DATABASE DRIVEN)
1. User logs into Supabase (REQUIRED)
2. User must have Chutes account linked
3. ChatInterface checks Supabase session + Chutes linkage
4. User sends message → POST to `/api/chat`
5. API receives Supabase token in Authorization header
6. API validates Supabase session → gets user_id
7. API reads chutes_tokens table for that user_id
8. If token expired → use refresh_token to get new access_token
9. UPDATE chutes_tokens table with new tokens
10. Use Chutes token for chat API call
11. Return AI response
12. No localStorage used — all database-driven

### Sign Out Flow
1. User clicks "Sign Out"
2. Supabase session invalidated
3. localStorage cleared (chutes_access_token, chutes_refresh_token, chutes_user)
4. **chutes_tokens table NOT MODIFIED** — link persists for next login
5. User logs back in → SUPABASE session restored → CHUTES link still active

## Development Patterns

### Component Patterns
- Compound components for complex UI (Navbar with sub-components)
- Server-first approach using RSC
- Progressive enhancement for client features
- Database-first approach for persistent state

### File Organization
- Co-location of related files
- barrel exports for clean imports
- index files for folder exports
- API routes grouped by function (/auth/chutes/*, /auth/*)

### Error Handling
- Error boundaries for graceful failures
- Proper 404 page implementation
- API route error responses with descriptive messages
- Graceful handling of expired tokens with auto-refresh
