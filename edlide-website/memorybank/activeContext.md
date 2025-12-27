# Active Context: Edlide Website

## Current Focus
Chutes OAuth Integration with Supabase + Token Encryption - **COMPLETE!** All Chutes tokens encrypted with AES-256-CBC!

## Recent MAJOR Changes ✅

### Chutes OAuth + Supabase Database Integration + AES-256 Encryption (NEW - Dec 25, 2025) ✅
**This is the MAJOR SECURITY IMPLEMENTATION that just completed:**

**Problem Solved:**
- Previously Chutes tokens were stored in localStorage only
- Chutes tokens weren't linked to Supabase accounts
- Sign out from Supabase didn't affect Chutes access (bug)
- Chat still worked after sign out (security issue)
- **CRITICAL:** Tokens stored in plain text in database (security risk)

**Solution Implemented:**
1. ✅ Created `chutes_tokens` table in Supabase PostgreSQL
2. ✅ 1-to-1 binding: Supabase user ↔ Chutes account
3. ✅ Chutes tokens stored in database (NOT localStorage)
4. ✅ **AES-256-CBC encryption** for all tokens via pgcrypto
5. ✅ Auto-refresh mechanism using refresh_token
6. ✅ Sign out clears localStorage AND disconnects from chat
7. ✅ Re-linking Supabase account restores Chutes access
8. ✅ Chat API uses Supabase session + Chutes from DB
9. ✅ **No plain text tokens anywhere in system**

### Database Structure Created ✅
**Table: public.chutes_tokens (ENCRYPTED)**
```sql
CREATE TABLE public.chutes_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chutes_user_id TEXT NOT NULL,           -- Chutes account sub
  encrypted_access_token TEXT NOT NULL,  -- AES-256 encrypted access token
  encrypted_refresh_token TEXT,           -- AES-256 encrypted refresh token
  encryption_iv TEXT NOT NULL,           -- Initialization vector for AES
  expires_at TIMESTAMP WITH TIME ZONE,   -- Token expiration
  username TEXT,                         -- Chutes username
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id),                      -- One Chutes per Supabase user
  UNIQUE(chutes_user_id)                 -- Chutes only linked once
);
```

**Security Notes:**
- ❌ **REMOVED:** `access_token` column (plain text - DELETED)
- ❌ **REMOVED:** `refresh_token` column (plain text - DELETED)
- ✅ **ADDED:** `encrypted_access_token` (AES-256-CBC encrypted)
- ✅ **ADDED:** `encrypted_refresh_token` (AES-256-CBC encrypted)
- ✅ **ADDED:** `encryption_iv` (Unique IV per token for extra security)
- 🔒 **Protection:** Database dump safe - tokens unreadable without encryption key
- 🔒 **Protection:** SQL injection attacks yield encrypted data only

**Migrations Applied**:
1. `create_chutes_tokens_table` - Initial table with RLS
2. `fix_chutes_tokens_rls_policies` - Fixed RLS for service role access
3. `add_chutes_token_encryption` - Added encrypted columns + encryption_iv
4. `remove_plain_chutes_tokens` - REMOVED plain text columns (access_token, refresh_token)

### New API Endpoints Created ✅

**`/api/auth/chutes/save` (POST)**
- Saves Chutes OAuth tokens to chutes_tokens table
- **NEW:** Encrypts tokens using AES-256-CBC before saving
- Generates unique IV for each token
- Validates Supabase session first
- Associates tokens with current Supabase user
- Returns saved token data (without plaintext)
- Logs encryption status for debugging

**`/api/auth/chutes/unlink` (GET / DELETE)**
- GET: Check if Chutes account is linked for current user
- DELETE: Unlink Chutes account from current Supabase user
- Deletes encrypted tokens from database
- Clears localStorage: chutes_access_token, chutes_refresh_token, chutes_user
- Uses Supabase service role for table operations

**`/api/auth/chutes/get-token` (GET)**
- **DEPRECATED:** Now implemented in Chat API directly
- No longer needed for IDE integration (use Supabase Edge Functions)

### Updated Files ✅

**Frontend**:
- `src/lib/chutes-integration.ts` - Hook to manage Chutes linkage
- `src/components/chat/ChatInterface.tsx` - Uses Supabase alerting + Chutes from DB
- `src/lib/supabase-auth.ts` - signOut() now clears Chutes localStorage
- `src/components/layout/supabase-auth-button.tsx` - Added "Unlink Chutes" button
- `src/app/account/page.tsx` - Shows Chutes linkage status from DB
- `src/app/auth/chutes/callback/page.tsx` - Saves ENCRYPTED tokens to database after OAuth

**Backend**:
- `src/app/api/chat/route.ts` - **NEW:** Decrypts tokens, auto-refresh + re-encodes
- `src/app/api/auth/chutes/save/route.ts` - **NEW:** Encrypts tokens with AES-256-CBC
- `src/app/api/auth/chutes/unlink/route.ts` - Manages Chutes linkage

**Encryption Utility**:
- `src/lib/token-encryption.ts` - **NEW:** AES-256-CBC encryption/decryption
  - Uses 256-bit key from environment variable
  - Random IV per token (16 bytes)
  - Base64 encoding for database storage
  - Secure key derivation with SHA-256 hash
  - Error handling for decryption failures

### Updated Chat Flow ✅

**BEFORE (LocalStorage) - VULNERABLE**:
1. Client gets Chutes token from localStorage
2. Sends Chutes token directly to /api/chat
3. Chat validates Chutes token
4. Calls Chutes API
5. ❌ Problem: Sign out didn't affect chat access
6. ❌ Problem: Tokens exposed in localStorage

**AFTER (Database Driven + ENCRYPTED)**:
1. Client sends Supabase session token to /api/chat
2. Chat validates Supabase session → gets user_id
3. Chat reads `encrypted_access_token` from chutes_tokens table
4. **DECRYPT** token using `encryption_iv` → get plaintext token
5. If token expired → decrypt `encrypted_refresh_token`
6. Use refresh_token to get new access_token from Chutes
7. **RE-ENCRYPT** new tokens with new IV → update database
8. Call Chutes API with decrypted plaintext token
9. ✅ Sign out invalidates Supabase session → Chat blocked
10. ✅ Re-login restores Supabase session → Chutes link still active
11. 🔒 Tokens never leave server unencrypted
12. 🔒 Database dumps contain only encrypted, unreadable tokens

### Authentication System Architecture (CURRENT)

#### Supabase Auth (PRIMARY) ✅
- **Provider**: Supabase Auth service
- **Method**: Email/Password
- **Session**: Automatic JWT refresh, HttpOnly cookies
- **Storage**: auth.users table
- **Required**: User MUST login to Supabase FIRST
- **Purpose**: Primary authentication for entire application

#### Chutes OAuth (LINKED TO SUPABASE) ✅
- **Provider**: Chutes.ai Identity Provider
- **Method**: OAuth2 + OpenID Connect
- **Binding**: 1-to-1 with Supabase user (via chutes_tokens table)
- **Storage**: public.chutes_tokens table (NOT localStorage!)
- **Condition**: Chutes can only be linked AFTER Supabase login
- **Purpose**: AI model access for chat functionality
- **Auto-refresh**: refresh_token updates before expiration

## Technical Flow Diagrams

### Linking Chutes to Supabase
```
User logged in to Supabase (email/password)
         ↓
Click "Link Chutes Account" 
         ↓
OAuth redirect to Chutes.ai/idp/authorize
         ↓
User authenticates with Chutes
         ↓
Chutes redirects with authorization code
         ↓
POST /api/auth/chutes/token → Exchange code for tokens
         ↓
POST /api/auth/chutes/save →  
  - Validate Supabase session
  - Get user_id from Supabase
  - INSERT/UPDATE chutes_tokens table
  - Tokens now stored in database
         ↓
UI shows Chutes as linked (@username)
```

### Chat with Database Tokens
```
User logged in to Supabase + Chutes linked
         ↓
User sends message in chat
         ↓
POST /api/chat Authorization: Bearer <Supabase JWT>
         ↓
Validate Supabase JWT → Get user_id
         ↓
SELECT * FROM chutes_tokens WHERE user_id = <user_id>
         ↓
Check expires_at
         ↓
If expired → Use refresh_token → Get new access_token
         ↓
UPDATE chutes_tokens SET access_token = new_token
         ↓
Call https://llm.chutes.ai/v1/chat/completions
         ↓
Return AI response
```

### Unlinking Chutes
```
User clicks "Unlink Chutes" in navbar dropdown
         ↓
DELETE /api/auth/chutes/unlink
         ↓
DELETE FROM chutes_tokens WHERE user_id = <current_user>
         ↓
localStorage cleared: chutes_access_token, chutes_refresh_token, chutes_user
         ↓
UI updates to show "Link Chutes Account"
         ↓
Chat shows "Chutes account not linked. Please link your Chutes account first."
```

### Sign Out Flow (Fixed)
```
User clicks "Sign Out"
         ↓
Supabase.signOut() → Session invalidated
         ↓
localStorage cleared: chutes_access_token, chutes_refresh_token, chutes_user
         ↓
⚠️ chutes_tokens table NOT deleted (link persists)
         ↓
User logs back in to Supabase
         ↓
Supabase session restored
         ↓
Chutes link still active in database
         ↓
Chat works immediately without re-linking
```

## Current Implementation Status
- ✅ **Supabase Authentication**: Email/password working
- ✅ **Chutes OAuth Integration**: Tokens stored ENCRYPTED in database
- ✅ **AES-256-CBC Encryption**: All tokens encrypted with unique IV
- ✅ **Chutes Linking**: 1-to-1 binding with Supabase users
- ✅ **Chat API**: Decrypts tokens on-the-fly + re-encrypts on refresh
- ✅ **Token Auto-refresh**: Decrypts refresh token, gets new access, re-encrypts both
- ✅ **Sign Out**: Clears localStorage correctly
- ✅ **Re-login**: Restores Chutes access without re-linking
- ✅ **Unlink Chutes**: Removes encrypted tokens from database
- ✅ **Security**: No plain text tokens anywhere in system
- ✅ **Ready for IDE Integration**: Uses encryption-safe pattern

## Next Steps
1. 🚀 **Deploy to production** with database integration
2. 🎨 **Enhance chat UI** with streaming support
3. 📊 **Add chat analytics** for message tracking
4. 📦 **Implement Cloudflare R2 integration** for downloads

## Project Status
**Phase**: Chutes-Supabase Integration - **COMPLETED** ✅
**Progress**: 100% - Database-driven token management implemented
**Current Focus**: Production deployment and next feature development
**Supabase Project**: `https://kvftejfolyrfdxppbcqk.supabase.co`