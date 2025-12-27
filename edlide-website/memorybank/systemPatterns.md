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
│   │   │   └── page.tsx       # User dashboard with stats
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
│   │       └── chat/route.ts  # Chat completions API
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
│   │   │   ├── supabase-signin-button.tsx    # Supabase sign-in forms
│   │   │   ├── supabase-signup-button.tsx    # Supabase sign-up forms
│   │   │   ├── chutes-signin-button.tsx      # Chutes OAuth sign-in
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
- **Authentication Method**: Email/Password
- **Token Management**: Supabase session management with automatic refresh
- **User Storage**: Supabase auth.users table
- **UI Components**: SupabaseSignInForm, SupabaseSignUpForm, SupabaseAuthButton
- **API Routes**: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/refresh`

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
- **src/lib/supabase/auth.ts**: Supabase client configuration
- **src/lib/supabase-auth.ts**: React hook for session management, sign up, sign in, sign out
- **src/components/auth/supabase-signin-button.tsx**: Sign-in forms and cards
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

### Chat Integration Architecture (UPDATED)

**COMPLETE DATABASE DRIVEN FLOW**

1. User sends message → `/api/chat` endpoint
2. Request includes Supabase session token (NOT Chutes token)
3. **Chat API validates Supabase token** → Gets user ID
4. **Chat API reads chutes_tokens table** by user_id
5. **Auto-refreshes Chutes token** if expired using refresh_token
6. Validates Chutes token with `/idp/userinfo` endpoint
7. Calls `https://llm.chutes.ai/v1/chat/completions` with Chutes token
8. Returns AI response to client
9. All tokens stored/retrieved from Supabase database — NO localStorage dependency

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
1. User registers/logs in via email/password
2. Supabase creates session with JWT
3. Session stored in HttpOnly cookies
4. User gets Supabase user account

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