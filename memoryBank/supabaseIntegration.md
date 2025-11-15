# Supabase Integration Documentation

## Overview

Edlide IDE uses Supabase Edge Functions as a secure proxy layer for the Edlide AI provider, enabling centralized management, enhanced security, and proper environment variable handling.

## Architecture

### Component Overview

```
┌─────────────────┐    ┌────────────────────────────────┐    ┌─────────────────┐
│   Edlide IDE     │    │    Supabase Edge Function     │    │  Chutes AI API   │
│                 │    │    (ai-proxy)                  │    │                 │
│ - Electron App  │──► │ - cors: app://localhost        │──► │ - Real API calls │
│ - Env Vars      │    │ - JWT Verification             │    │ - Streaming      │
│ - Auth Headers  │    │ - Request Logging              │    │ - Models API    │
└─────────────────┘    └────────────────────────────────┘    └─────────────────┘
```

### Security Flow

1. **Authentication**: Edlide client authenticates with Supabase anon key
2. **Verification**: Edge Function validates JWT token and client identity
3. **Proxying**: Requests are forwarded to Chutes AI with real API keys
4. **Response**: Streaming and non-streaming responses are proxied back

## Configuration

### Environment Variables

#### Client Side (`.env`)
```bash
# Supabase Anon Key for AI provider authentication
SUPABASE_ANON_KEY=anon_key
```

#### Supabase Secrets
```bash
# Chutes AI API configuration
ai_base_url=base_url
ai_api_key=api_key
# Supabase service role for JWT verification
SUPABASE_SERVICE_ROLE_KEY=service_role_key_for_jwt_validation
```

### Provider Configuration

```typescript
// sendLLMMessage.impl.ts - Edlide provider setup
else if (providerName === 'edlide') {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error('Edlide: SUPABASE_ANON_KEY environment variable not set. Please check your .env file.');
  }

  return new OpenAI({
    baseURL: 'https://tbbzvijkkrrjqgcftnsm.supabase.co/functions/v1/ai-proxy',
    apiKey: supabaseAnonKey,
    defaultHeaders: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'X-Edlide-Client': 'electron'
    },
    ...commonPayloadOpts
  })
}
```

## Edge Function Implementation

### ai-proxy Function

**Location**: `tbbzvijkkrrjqgcftnsm` project (preview branch)
**Function Name**: `ai-proxy`
**Version**: 6 (active)
**Authentication**: `verify_jwt: true`

### Security Features

1. **CORS Restrictions**: Only allows `app://localhost` for Electron
2. **Client Verification**: Requires `X-Edlide-Client: electron` header
3. **JWT Authentication**: Validates Supabase anon key
4. **Request Logging**: Tracks all requests with user context

### Implementation Code

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'app://localhost',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edlide-client',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify Edlide client
    const edlideClient = req.headers.get('x-edlide-client');
    if (edlideClient !== 'electron') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized client' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify Supabase anon key
    const authHeader = req.headers.get('authorization');
    const expectedAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    if (!authHeader || !authHeader.includes(expectedAnonKey)) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get secrets and proxy request
    const aiBaseUrl = Deno.env.get('ai_base_url');
    const aiApiKey = Deno.env.get('ai_api_key');

    // Handle chat completions and models list...
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Deployment

### Branch Strategy

- **Main Branch**: `main` - Production ready code
- **Development Branch**: `supabase-integration-requests` - Edge Function development
- **Project IDs**:
  - Main: `fkjonloqhzrexbizhiyb`
  - Preview: `tbbzvijkkrrjqgcftnsm`

### Deployment Commands

```bash
# Deploy Edge Function
supabase functions deploy ai-proxy --project-ref tbbzvijkkrrjqgcftnsm

# Set secrets
supabase secrets set ai_base_url=https://llm.chutes.ai/v1 --project-ref tbbzvijkkrrjqgcftnsm
supabase secrets set ai_api_key=your_api_key --project-ref tbbzvijkkrrjqgcftnsm
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key --project-ref tbbzvijkkrrjqgcftnsm

# List functions
supabase functions list --project-ref tbbzvijkkrrjqgcftnsm
```

## Environment Variable Management

### dotenv Integration

The Electron main process uses dotenv to load environment variables:

```typescript
// main.ts - Environment variable loading
import { config } from 'dotenv';

// Force load from Edlide .env file specifically
const envPath = '/Users/litezevin/Desktop/Projects/Edlide/.env';
const result = config({ path: envPath });

if (result.parsed) {
  console.log(`✅ Loaded .env from: ${envPath}`);
  console.log(`✅ Environment variables loaded:`, Object.keys(result.parsed));
} else {
  console.error('❌ Failed to load .env');
}
```

### Required Dependencies

```json
{
  "name": "edlide",
  "dependencies": {
    "dotenv": "^17.2.3"
  }
}
```

### .env.example Template

```bash
# Edlide Supabase Integration Environment Variables
# Copy this file to .env and fill in your actual values

# Supabase Anon Key for supabase-integration-requests branch
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Additional security variables
# EDLIDE_BUILD_SECRET=your_build_secret_here
```

## Request Flow

### Chat Completions

1. **Client Request**:
   ```typescript
   // Edlide client makes request
   const response = await openai.chat.completions.create({
     model: 'zai-org/GLM-4.6:THINKING',
     messages: messages,
     stream: true
   });
   ```

2. **Edge Function Processing**:
   ```typescript
   // Verify authentication
   const authHeader = req.headers.get('authorization');
   if (!authHeader.includes(expectedAnonKey)) return 401;

   // Proxy to Chutes AI
   const response = await fetch(`${aiBaseUrl}/chat/completions`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${aiApiKey}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestBody)
   });
   ```

3. **Streaming Response**:
   ```typescript
   // Handle streaming responses
   const readableStream = new ReadableStream({
     async start(controller) {
       const reader = response.body?.getReader();
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         controller.enqueue(value);
       }
     }
   });

   return new Response(readableStream, {
     headers: { 'Content-Type': 'text/event-stream' }
   });
   ```

## Security Considerations

### Threat Mitigation

1. **API Key Exposure**: No API keys in client code
2. **Unauthorized Access**: JWT verification + client validation
3. **CORS Attacks**: Strict origin restrictions
4. **Request Forgery**: Client identity verification

### Best Practices

1. **Secret Rotation**: Regular rotation of AI API keys
2. **Monitoring**: Request logging for security analysis
3. **Rate Limiting**: Consider future implementation for abuse prevention
4. **Audit Trail**: Log all proxy requests with user context

## Error Handling

### Client-Side Errors

```typescript
// Missing environment variable
if (!supabaseAnonKey) {
  throw new Error('Edlide: SUPABASE_ANON_KEY environment variable not set.');
}

// Network errors
if (!response.ok) {
  throw new Error(`Edge Function error: ${response.status}`);
}
```

### Edge Function Errors

```typescript
// Authentication errors
return new Response(
  JSON.stringify({ error: 'Invalid authorization token' }),
  { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
);

// Upstream API errors
return new Response(
  JSON.stringify({ error: `Chutes AI API error: ${response.status}` }),
  { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
);
```

## Monitoring and Debugging

### Console Logging

**Environment Variable Loading**:
```
✅ Loaded .env from: /Users/litezevin/Desktop/Projects/Edlide/.env
✅ Environment variables loaded: [ 'SUPABASE_ANON_KEY' ]
```

**Request Tracking**:
```
Request from Edlide client: { client: 'electron', timestamp: '2025-11-15T11:37:38.253Z' }
Chat completion request: { model: 'zai-org/GLM-4.6:THINKING', stream: true }
Chat completion completed for Edlide client
```

### Error Response Format

```json
{
  "error": "Chutes AI API error: 401 Unauthorized",
  "status": 401,
  "headers": {
    "content-type": "application/json",
    "access-control-allow-origin": "app://localhost"
  }
}
```

## Integration Scope

### Current Implementation

- **Edlide Provider**: ✅ Uses Supabase proxy
- **Other Providers**: ❌ Direct connections (Anthropic, OpenAI, etc.)
- **Authentication**: ✅ JWT-based with anon key
- **Streaming**: ✅ Full support maintained
- **Error Handling**: ✅ Comprehensive error proxying

### Future Enhancements

1. **Multiple Provider Support**: Extend to other providers
2. **Load Balancing**: Multiple Edge Function instances
3. **Rate Limiting**: Request rate management
4. **Analytics**: Usage tracking and reporting
5. **Caching**: Response caching for common requests

## Testing

### Unit Tests

```typescript
// Environment variable loading
test('loads environment variables correctly', () => {
  config({ path: './test.env' });
  expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
});
```

### Integration Tests

```typescript
// Authenticated request flow
test('proxies authenticated requests to Chutes AI', async () => {
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'X-Edlide-Client': 'electron'
    },
    body: JSON.stringify({ model: 'test', messages: [] })
  });
  expect(response.ok).toBe(true);
});
```

### Manual Testing

1. **Environment Setup**: Verify .env file loading
2. **Authentication**: Test invalid/missing tokens
3. **Proxy Functionality**: Test chat completions and models list
4. **Error Scenarios**: Test network failures and API errors
5. **Streaming**: Validate real-time response streaming

## Troubleshooting

### Common Issues

**Environment Variable Not Found**:
```
Error: Edlide: SUPABASE_ANON_KEY environment variable not set.
```
- Solution: Check .env file exists and contains valid key
- Verify dotenv is properly loading in main.ts

**Authentication Failed**:
```
401 "Invalid authorization token"
```
- Solution: Verify Supabase anon key is correct
- Check Edge Function secrets are properly set

**CORS Errors**:
```
Access-Control-Allow-Origin header is present on the requested resource
```
- Solution: Ensure origin is `app://localhost` for Electron
- Check Edge Function CORS configuration

### Debug Commands

```bash
# Check environment variables
echo $SUPABASE_ANON_KEY

# Test Edge Function directly
curl -X POST https://tbbzvijkkrrjqgcftnsm.supabase.co/functions/v1/ai-proxy \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "X-Edlide-Client: electron" \
  -H "Content-Type: application/json" \
  -d '{"model":"test","messages":[{"role":"user","content":"test"}]}'

# List Supabase secrets
supabase secrets list --project-ref tbbzvijkkrrjqgcftnsm

# Check Edge Function logs
supabase functions logs ai-proxy --project-ref tbbzvijkkrrjqgcftnsm
```

## Summary

The Supabase integration provides a secure, scalable, and maintainable proxy layer for Edlide's AI provider connections. It enhances security while maintaining full functionality for end users and providing a foundation for future enhancements.

**Key Benefits**:
- ✅ Enhanced security with environment variable management
- ✅ Centralized configuration through Supabase secrets
- ✅ Request isolation and logging for better debugging
- ✅ Streaming support maintained for real-time AI responses
- ✅ Zero impact on existing functionality for other providers
- ✅ Production-ready with comprehensive error handling
