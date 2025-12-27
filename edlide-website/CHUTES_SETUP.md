# Chutes Authentication Setup Guide

This guide will help you set up "Sign in with Chutes" functionality on your Edlide website.

## Overview

We've implemented a complete OAuth2 + OpenID Connect integration with Chutes.ai that allows users to:

- Sign in with their existing Chutes account
- Access AI model management tools
- Maintain secure authentication sessions
- Use Single Sign-On (SSO) across Chutes ecosystem

## Prerequisites

1. **Chutes Account**: You need a Chutes account to create an OAuth application
2. **Environment Variables**: Proper configuration of client credentials

## Step 1: Create OAuth Application on Chutes

1. Visit [Chutes Developer Dashboard](https://chutes.ai/developer)
2. Navigate to "Applications" section
3. Click "Create New Application"
4. Fill in the application details:
   - **Name**: "Edlide Website"
   - **Description**: "Official Edlide IDE website with Chutes integration"
   - **Homepage URL**: `https://your-domain.com`
   - **Redirect URI**: `https://your-domain.com/auth/chutes/callback`
   - **Scopes**: `openid profile`

5. Save the application and note down:
   - **Client ID**
   - **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Chutes OAuth Configuration
NEXT_PUBLIC_CHUTES_CLIENT_ID=your_chutes_client_id_here
CHUTES_CLIENT_SECRET=your_chutes_client_secret_here

# Update the redirect URI in your Chutes app to match your domain
NEXTAUTH_URL=https://your-domain.com
```

For local development:
```env
NEXT_PUBLIC_CHUTES_CLIENT_ID=your_local_client_id
CHUTES_CLIENT_SECRET=your_local_client_secret
NEXTAUTH_URL=http://localhost:3001
```

## Step 3: Update Chutes Application

Make sure your Chutes OAuth application has the correct redirect URIs:

- **Production**: `https://your-domain.com/auth/chutes/callback`
- **Development**: `http://localhost:3001/auth/chutes/callback`

## Implementation Details

### Files Created/Modified:

1. **`src/lib/chutes-auth.ts`** - Core authentication library
2. **`src/components/auth/chutes-signin-button.tsx`** - Sign-in button components
3. **`src/app/auth/chutes/callback/page.tsx`** - OAuth callback handler
4. **`src/app/api/auth/chutes/callback/route.ts`** - Server-side token exchange
5. **`src/components/layout/chutes-auth-button.tsx`** - Navbar auth button
6. **`src/app/account/page.tsx`** - Updated account page with Chutes integration

### Key Features:

- **OAuth2 Flow**: Standard authorization code flow with PKCE support
- **Token Management**: Automatic token refresh and secure storage
- **SSO Detection**: Checks for existing Chutes sessions
- **User Interface**: Seamless integration with existing design
- **Security**: HttpOnly cookies, CSRF protection, secure token storage

## Step 4: Testing the Integration

### Local Development:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/account`
3. Click "Sign in with Chutes"
4. Complete the OAuth flow
5. Verify you're redirected back with authentication

### Production:

1. Deploy your changes
2. Update your Chutes application with production URLs
3. Test the complete flow

## Troubleshooting

### Common Issues:

1. **"Invalid redirect_uri"**
   - Ensure the redirect URI in Chutes matches exactly
   - Check for trailing slashes

2. **"No authorization code received"**
   - Verify the OAuth flow completed successfully
   - Check browser console for errors

3. **"Token exchange failed"**
   - Verify client credentials are correct
   - Check that `CHUTES_CLIENT_SECRET` is set

4. **CORS Issues**
   - Ensure your domain is added to allowed origins in Chutes

### Debug Mode:

Add logging to troubleshoot:

```typescript
// In chutes-auth.ts
console.log('Client ID:', clientId)
console.log('Redirect URI:', redirectUri)
console.log('Auth URL:', auth.getAuthorizationUrl(state))
```

## Security Considerations

- **Client Secret**: Never expose client-side
- **Redirect URIs**: Always use HTTPS in production
- **Token Storage**: Tokens are stored in localStorage for demo purposes
- **Session Management**: Consider implementing server-side sessions for production

## Next Steps

1. **Production Deployment**: Update environment variables
2. **Monitoring**: Add error tracking for authentication failures
3. **Features**: Implement Chutes-specific features (model deployment, etc.)
4. **Testing**: Add automated tests for authentication flows

## Support

- **Chutes Documentation**: https://docs.chutes.ai
- **OAuth2 Specification**: https://oauth.net/2/
- **OpenID Connect**: https://openid.net/connect/

## Example Environment Configuration

```env
# .env.local
NEXT_PUBLIC_CHUTES_CLIENT_ID=chutes_prod_1234567890abcdef
CHUTES_CLIENT_SECRET=chutes_secret_1234567890abcdef1234567890abcdef
NEXTAUTH_URL=https://edlide.com
```

Make sure to replace the placeholder values with your actual credentials from the Chutes developer dashboard.