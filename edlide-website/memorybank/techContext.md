# Tech Context: Edlide Website

## Technology Stack

### Core Framework
- **Next.js 16.1.0**: Latest stable version with App Router for optimal performance
- **TypeScript**: Strict mode enabled for type safety
- **React 19.2.3**: Latest React version with enhanced performance features

### Authentication Architecture (DUAL SYSTEM)

#### Primary: Supabase Auth
- **Provider**: Supabase Auth service
- **Method**: Email/Password authentication
- **Client SDK**: `@supabase/supabase-js`
- **Custom Hook**: `src/lib/supabase-auth.ts` — Session management, sign up, sign in, sign out
- **Session Management**: Automatic JWT refresh, HttpOnly cookies
- **User Storage**: Supabase `auth.users` table

#### Secondary: Chutes OAuth Integration (LINKED)
- **Provider**: Chutes.ai Identity Provider
- **Method**: OAuth2 + OpenID Connect
- **Purpose**: AI model access for chat functionality
- **Token Storage**: Supabase `chutes_tokens` table (NOT localStorage)
- **Binding Model**: 1-to-1 relationship (Supabase user ↔ Chutes account)
- **Auto-Refresh**: Uses `refresh_token` before expiration
- **Scope**: `openid profile chutes:invoke account:read billing:read`

### Database Schema (Supabase PostgreSQL)

#### Table: `public.chutes_tokens` (ENCRYPTED - AES-256-CBC)
Stores ENCRYPTED Chutes OAuth tokens linked to Supabase users

```sql
CREATE TABLE public.chutes_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chutes_user_id TEXT NOT NULL,           -- sub from Chutes OAuth
  encrypted_access_token TEXT NOT NULL,  -- AES-256-CBC encrypted access token
  encrypted_refresh_token TEXT,           -- AES-256-CBC encrypted refresh token
  encryption_iv TEXT NOT NULL,           -- Initialization vector (16 bytes, base64)
  expires_at TIMESTAMP WITH TIME ZONE,   -- Token expiration
  username TEXT,                         -- Chutes username
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),                      -- One Chutes per Supabase user
  UNIQUE(chutes_user_id)                 -- Chutes only linked once
);
```

**Security Implementation:**
- Encryption Algorithm: AES-256-CBC
- Key Source: `CHUTES_ENCRYPTION_KEY` environment variable (SHA-256 hashed to 32 bytes)
- IV Generation: Cryptographically random 16 bytes per token
- Encoding: Base64 for database storage
- Decryption: On-the-fly when tokens needed (chat, refresh)
- Auto-refresh: Decrypts refresh token → gets new access → re-encrypts both

**Triggers**:
- `update_chutes_tokens_updated_at` — Auto-updates `updated_at` on row modification

**RLS Policies**:
- Service role has full access (for backend token management)

**Indexes**: 
- `idx_chutes_tokens_user_id` on `user_id`
- `idx_chutes_tokens_chutes_user_id` on `chutes_user_id`

### Styling & UI
- **Tailwind CSS 3.3.0**: Utility-first CSS framework with custom design system
- **shadcn/ui**: Component library built on Radix UI primitives
- **Framer Motion 12.23.26**: Advanced animations and micro-interactions
- **Lucide React 0.562.0**: Modern icon library
- **PostCSS**: CSS processing pipeline
- **Autoprefixer**: Browser compatibility

### Infrastructure & Storage
- **Supabase**: 
  - Authentication and database service
  - User authentication (Supabase Auth)
  - Chutes token storage (chutes_tokens table)
  - PostgreSQL 17.6.1 with row-level security
- **Cloudflare R2**: Object storage for binary files (planned)
- **Cloudflare Workers**: Edge computing for download distribution (planned)
- **Cloudflare Pages**: Potential deployment target (alternative to Vercel)

### Development Tooling
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatter
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Staged file linting

## Development Setup

### Prerequisites
- Node.js 18+ (for Next.js 17 compatibility)
- npm or pnpm package manager
- Git with proper SSH keys setup
- Supabase account with project configured

### Environment Configuration
```env
# Supabase Configuration (PRIMARY)
NEXT_PUBLIC_SUPABASE_URL=https://kvftejfolyrfdxppbcqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Chutes OAuth Configuration (SECONDARY - for AI chat)
NEXT_PUBLIC_CHUTES_CLIENT_ID=cid_za1t2dbofb9uvtex03x0jfc3
CHUTES_CLIENT_SECRET=<your-chutes-client-secret>
CHUTES_API_URL=https://idp.chutes.ai

# Token Encryption (AES-256-CBC) - REQUIRED FOR PRODUCTION
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CHUTES_ENCRYPTION_KEY=b5af41d2c5ed4f95b8f9ce7a1fa8d7a7f61cc86fc2c7d2b48c3bd10f73f2897c

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<auth-secret>

# Analytics (if needed)
VERCEL_ANALYTICS_ID=<analytics-id>
```

### Build & Deploy Pipeline
1. **Development**: `npm run dev` - Development server with hot reload
2. **Build**: `npm run build` - Production build optimization
3. **Deploy**: `npm run deploy` - Deploy to production (Vercel/Cloudflare Pages)

## Technical Constraints

### Performance Requirements
- Lighthouse scores: Performance >90, SEO >95
- Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1
- First Contentful Paint <1.5s
- Time to Interactive <3s

### Browser Support
- Modern browsers with ES2020+ support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- No IE support (deprecated)

### Security Requirements
- HTTPS enforced in production
- CSP headers configured
- Rate limiting on API endpoints
- Input sanitization and validation
- Secure token management (Supabase sessions)
- No client secrets in client code

## Dependencies (Current)

### Production Dependencies
```json
{
  "next": "^16.1.0",
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "@supabase/supabase-js": "^2.x",
  "@supabase/auth-helpers-nextjs": "^0.x",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-slot": "^1.0.2",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "framer-motion": "^12.23.26",
  "lucide-react": "^0.562.0",
  "tailwind-merge": "^2.0.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "autoprefixer": "^10.0.1",
  "postcss": "^8",
  "tailwindcss": "^3.3.0",
  "eslint": "^8",
  "eslint-config-next": "14.0.3"
}
```

## Integration Points

### Supabase Authentication - ACTIVE ✅
**Purpose**: Primary user authentication and session management

**Features**:
- Email/password authentication
- User session management with automatic JWT refresh
- Secure password storage (bcrypt)
- Email verification ready
- Password reset flow (ready to implement)

**Files**:
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/supabase-auth.ts` - React hook (auth state, signUp, signIn, signOut)
- `src/app/api/auth/signup/route.ts` - Registration endpoint
- `src/app/api/auth/signin/route.ts` - Sign-in endpoint
- `src/app/api/auth/refresh/route.ts` - Token refresh endpoint

**Storage**: Supabase `auth.users` table

### Chutes OAuth Integration - LINKED TO SUPABASE ✅
**Purpose**: AI model access for chat functionality

**Features**:
- OAuth2 + OpenID Connect flow
- Server-side token exchange
- Token storage in Supabase database (NOT localStorage)
- Auto-refresh via refresh_token
- 1-to-1 binding with Supabase user accounts
- RLS policies for secure access

**Files**:
- `src/lib/chutes-auth.ts` - OAuth2 client with PKCE support
- `src/lib/chutes-integration.ts` - Hook for managing Chutes linkage
- `src/lib/token-encryption.ts` - **NEW** - AES-256-CBC encryption/decryption
- `src/app/auth/chutes/callback/page.tsx` - OAuth callback handler (saves ENCRYPTED to DB)
- `src/app/api/auth/chutes/token/route.ts` - Exchange code for tokens
- `src/app/api/auth/chutes/save/route.ts` - Encrypts & saves tokens to chutes_tokens table
- `src/app/api/auth/chutes/unlink/route.ts` - GET: Check linkage, DELETE: Unlink
- `src/components/auth/chutes-signin-button.tsx` - Link Chutes button
- `src/components/layout/supabase-auth-button.tsx` - Navbar with Unlink button

**Storage**: Supabase `chutes_tokens` table

**OAuth Credentials**:
- Client ID: `cid_za1t2dbofb9uvtex03x0jfc3`
- Client Secret: Configured in environment
- OAuth App: Works for both localhost and production

### Chat API Integration - DATABASE DRIVEN ✅
**Purpose**: AI chat functionality using Chutes models

**Architecture**:
1. **Client** sends Supabase session token (NOT Chutes token)
2. **API** validates Supabase session → gets user_id
3. **API** reads `encrypted_access_token` from chutes_tokens table
4. **DECRYPT** token using `encryption_iv` → get plaintext token
5. **Auto-refresh** if expired:
   - Decrypt `encrypted_refresh_token`
   - Call Chutes token endpoint with refresh token
   - **ENCRYPT** new access_token with new IV
   - **ENCRYPT** new refresh_token (if provided) with new IV
   - UPDATE chutes_tokens table
6. **Chat** calls Chutes API with decrypted plaintext token
7. **All tokens** always encrypted in database — NO plain text anywhere

**Files**:
- `src/app/api/chat/route.ts` - Chat completions API (Supabase auth + Chutes from DB)
- `src/components/chat/ChatInterface.tsx` - Chat UI (checks Supabase auth + Chutes linkage)

**Model**: Qwen/Qwen3-32B confirmed working

**Features**:
- Real-time messaging interface
- Token validation before chat
- Auto-refresh of expired tokens
- Error handling and loading states
- Message history

### Database Migrations (Applied)
1. **create_chutes_tokens_table** - Initial table with RLS
2. **fix_chutes_tokens_rls_policies** - Fixed RLS for service role access
3. **add_chutes_token_encryption** - Added encrypted columns + encryption_iv
4. **remove_plain_chutes_tokens** - Removed plain text columns (DELETED access_token, refresh_token)

### Cloudflare R2 Integration - PLANNED 📋
- Presigned URLs for secure downloads
- Automatic CDN distribution
- Analytics and usage tracking
- Edge computing for download distribution

### Documentation System - PLANNED 📋
- MDX for interactive documentation
- Code highlighting with Prism.js/shiki
- Automatic navigation generation

## Chutes-Supabase Integration Flow

### Linking Flow
```
1. User logs into Supabase (email/password)
   ↓
2. User clicks "Link Chutes Account"
   ↓
3. OAuth redirect to Chutes.ai/idp/authorize
   ↓
4. User authenticates with Chutes
   ↓
5. Chutes redirects with authorization code
   ↓
6. /api/auth/chutes/token exchanges code for tokens
   ↓
7. /api/auth/chutes/save tokens to chutes_tokens table
   ↓
8. UI shows Chutes account as linked
```

### Chat Flow (Database Driven)
```
1. User logs into Supabase
   ↓
2. Chutes account must be linked
   ↓
3. User sends message in chat
   ↓
4. POST /api/chat with Supabase token in header
   ↓
5. API validates Supabase session
   ↓
6. API reads chutes_tokens table by user_id
   ↓
7. If token expired: use refresh_token to get new access_token
   ↓
8. Update chutes_tokens table with new tokens
   ↓
9. Call Chutes chat API with token
   ↓
10. Return AI response
```

### Unlinking Flow
```
1. User clicks "Unlink Chutes" in dropdown
   ↓
2. DELETE /api/auth/chutes/unlink
   ↓
3. Database: DELETE FROM chutes_tokens WHERE user_id = current_user
   ↓
4. localStorage cleared: chutes_access_token, chutes_refresh_token, chutes_user
   ↓
5. UI updates: Shows "Link Chutes Account" button
```

### Sign Out Flow
```
1. User clicks "Sign Out"
   ↓
2. Supabase session invalidated (signOut)
   ↓
3. localStorage cleared
   ↓
4. CHUTES TOKENS IN DATABASE NOT DELETED
   ↓
5. User logs back in → Supabase session restored → Chutes link still active
```