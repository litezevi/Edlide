# Internet Search Support in Edlide IDE

## ✅ Status: Fully Implemented (2026-01-25)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDE (Edlide)                              │
├─────────────────────────────────────────────────────────────────┤
│  User asks about weather/current info                           │
│       ↓                                                          │
│  AI model (MiniMaxAI/MiniMax-M2.1-TEE) decides to use search_web │
│       ↓                                                          │
│  toolsService.ts validates and executes search_web tool          │
│       ↓                                                          │
│  Fetch to: https://edlide.com/api/ai-proxy/brave-search          │
│       ↓                                                          │
│  Vercel API Route validates auth → calls Brave Search API        │
│       ↓                                                          │
│  Results returned to IDE → displayed in chat                     │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
IDE (SupabaseAuthHelper.getAccessTokenSync()) → API Key (edlide_xxx...)
    ↓
Vercel /api/ai-proxy/brave-search validates against user_sessions table
    ↓
If valid → calls Brave Search API
```

## Files Modified

### 1. IDE Types
**File**: `src/vs/workbench/contrib/void/common/toolsServiceTypes.ts`

Added `search_web` tool types:
```typescript
// PARAMS OF TOOL CALL
'search_web': { query: string },

// RESULT OF TOOL CALL  
'search_web': { results: Array<{ title: string; url: string; description: string }> },
```

### 2. IDE Tools Implementation
**File**: `src/vs/workbench/contrib/void/browser/toolsService.ts`

Added three sections:

**validateParams.search_web**:
```typescript
search_web: (params: RawToolParamsObj) => {
    const { query: queryUnknown } = params
    const query = validateStr('query', queryUnknown)
    return { query }
}
```

**callTool.search_web**:
```typescript
search_web: async ({ query }) => {
    const abortController = new AbortController()

    const searchPromise = new Promise<{ results: ... }>((resolve, reject) => {
        const apiKey = SupabaseAuthHelper.getAccessTokenSync()
        
        fetch(`https://edlide.com/api/ai-proxy/brave-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ query })
        }).then(async (response) => {
            if (abortController.signal.aborted) {
                reject(new Error('search_web aborted'))
                return
            }
            if (!response.ok) {
                reject(new Error(`search_web failed: ${response.statusText}`))
                return
            }
            const data = await response.json()
            resolve(data)
        }).catch((err) => {
            reject(new Error(`search_web failed: ${err.message}`))
        })
    })

    return {
        result: Promise.race([...]),
        interruptTool: () => { abortController.abort() }
    }
}
```

**stringOfResult.search_web**:
```typescript
search_web: (_params, result) => {
    const formattedResults = result.results.map((r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`
    ).join('\n\n')
    return `[WEB SEARCH RESULTS]\n${formattedResults}\n[/WEB SEARCH RESULTS]`
}
```

### 3. LLM Prompts
**File**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`

**Added tool description**:
```typescript
search_web: {
    name: 'search_web',
    description: `Searches the internet for current information. Use this when you need up-to-date information, documentation, API references, or answers that require web access. Returns top 5 results with title, URL, and description.`,
    params: { query: { description: `Search query to find relevant information. Be specific and include key terms.` } }
}
```

**Updated AGENT mode system message** (line 621-638):
```typescript
: `YOUR CURRENT MODE: AGENT - FULL ACCESS

ALL TOOLS AVAILABLE:
✅ read_file, ls_dir, get_dir_tree, search tools
✅ create_file_or_folder, delete_file_or_folder
✅ edit_file, rewrite_file
✅ run_command, run_persistent_command
✅ open_persistent_terminal, kill_persistent_terminal
✅ analyze_image - Analyze images from user messages
✅ search_web - Search the internet for current information

YOUR GOAL: Complete tasks autonomously using all available tools.
```

**Updated PLAN mode system message** (line 563-582):
```typescript
TOOLS YOU CAN USE:
✅ read_file - Read file contents
✅ ls_dir - List directory contents
✅ get_dir_tree - View directory tree structure
✅ search_pathnames_only - Search file names
✅ search_for_files - Search file contents
✅ search_in_file - Search within file
✅ read_lint_errors - View lint errors
✅ search_web - Search the internet for current information
✅ analyze_image - Analyze images from user messages
```

**Updated availableTools function** (line 379-382):
```typescript
const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'ask' ? undefined
    : chatMode === 'plan' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
        : chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
            : undefined
```

**Note**: `search_web` is NOT in `approvalTypeOfBuiltinToolName`, so it's available in both Agent and Plan modes (no approval needed).

### 4. Vercel API Route
**File**: `edlide-website/src/app/api/ai-proxy/brave-search/route.ts` (NEW FILE)

Complete implementation:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const braveApiKey = process.env.BRAVE_SEARCH_API_KEY!

const authenticateViaApiKey = async (key: string) => {
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: sessionData, error } = await adminSupabase
        .from('user_sessions')
        .select('user_id, user_email, status')
        .eq('api_key', key)
        .eq('is_ide_device', true)
        .eq('status', 'active')
        .maybeSingle()

    if (error || !sessionData) return null
    
    const { data: userData } = await adminSupabase.auth.admin.getUserById(sessionData.user_id)
    return userData?.user || null
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        const apiKeyHeader = request.headers.get('X-API-Key')

        // Authenticate
        let user = null
        if (authHeader?.startsWith('Bearer edlide_')) {
            const apiKey = authHeader.substring(7)
            user = await authenticateViaApiKey(apiKey)
        } else if (apiKeyHeader) {
            user = await authenticateViaApiKey(apiKeyHeader)
        }

        if (!user) {
            const res = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
            res.headers.set('Access-Control-Allow-Origin', '*')
            return res
        }

        const { query } = await request.json()
        
        if (!query || typeof query !== 'string') {
            const res = NextResponse.json({ error: 'Missing query' }, { status: 400 })
            res.headers.set('Access-Control-Allow-Origin', '*')
            return res
        }

        // Call Brave Search API
        const braveResponse = await fetch(
            'https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(query),
            {
                headers: {
                    'X-Subscription-Token': braveApiKey,
                    'Accept': 'application/json',
                }
            }
        )

        if (!braveResponse.ok) {
            const res = NextResponse.json({ error: 'Search service error' }, { status: 502 })
            res.headers.set('Access-Control-Allow-Origin', '*')
            return res
        }

        const data = await braveResponse.json()

        const results = (data.web?.results || []).slice(0, 5).map((r: any) => ({
            title: r.title || '',
            url: r.url || '',
            description: r.description || ''
        }))

        const res = NextResponse.json({ results })
        res.headers.set('Access-Control-Allow-Origin', '*')
        return res

    } catch (error) {
        const res = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        res.headers.set('Access-Control-Allow-Origin', '*')
        return res
    }
}
```

### 5. UI Components
**File**: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

**Added toolTitles entry** (around line 2109):
```typescript
'search_web': { done: 'Searched web', proposed: 'Search web', running: loadingTitleWrapper('Searching web') },
```

**Added resultWrapper component** (before line 3228):
```typescript
'search_web': {
    resultWrapper: ({ toolMessage, threadId }) => {
        const title = getTitle(toolMessage)
        const isRejected = toolMessage.type === 'rejected'
        const isRunning = toolMessage.type === 'running_now' || toolMessage.type === 'tool_request'

        const componentParams: ToolHeaderParams = {
            title,
            desc1: '',
            isError: false,
            icon: null,
            isRejected,
            isOpen: false,
            onClick: () => {},
        }

        const renderContent = (results: Array<{ title: string; url: string; description: string }>) => (
            <div className='px-2 py-1 space-y-2'>
                {results.map((r, i) => (
                    <div key={i} className='border-b border-void-border-1 pb-1 last:border-0'>
                        <div className='font-medium text-void-fg-1 text-sm'>{r.title}</div>
                        <a href={r.url} target='_blank' rel='noopener noreferrer' 
                           className='text-xs text-blue-400 hover:underline truncate block'>{r.url}</a>
                        <div className='text-xs text-void-fg-3 mt-1'>{r.description}</div>
                    </div>
                ))}
            </div>
        )

        if (toolMessage.type === 'success') {
            const { result } = toolMessage as any
            const results = (result as any)?.results || []
            componentParams.children = renderContent(results)
        }
        else if (toolMessage.type === 'tool_error') {
            componentParams.children = <div className='px-2 py-1 text-red-400 text-sm'>{result || 'Search failed'}</div>
        }

        return <ToolHeaderWrapper {...componentParams} />
    },
}
```

## Environment Variables

### Vercel (edlide-website)
```env
BRAVE_SEARCH_API_KEY=your_brave_api_key_here
```

**Important**: Brave Search API key must be 31 characters long.

## Rate Limits

- **Brave Search API**: 1 request/second, 1000 requests/month (managed by Brave)
- **No per-user tracking** in Supabase (trust-based for now)

## Mode Availability

| Mode    | search_web available | Requires Approval |
|---------|---------------------|-------------------|
| ask     | ❌ No               | N/A               |
| plan    | ✅ Yes              | ❌ No              |
| agent   | ✅ Yes              | ❌ No              |

## Brave Search API Details

- **Endpoint**: `https://api.search.brave.com/res/v1/web/search`
- **Method**: GET with query parameter
- **Headers**: 
    - `X-Subscription-Token`: API key
    - `Accept`: `application/json`
- **Response**: Returns `web.results` array with `title`, `url`, `description`, `snippet`, etc.

## Example Usage

```
User: "What's the weather in Bishkek today?"

AI model decides to call search_web({ query: "weather Bishkek today" })

IDE calls: https://edlide.com/api/ai-proxy/brave-search
    with: { "query": "weather Bishkek today" }

Vercel validates auth, calls Brave API, returns:
{
    "results": [
        {
            "title": "Weather Bishkek - AccuWeather",
            "url": "https://www.accuweather.com/en/kg/bishkek/..."
            "description": "Currently: -5°C Partly Cloudy..."
        },
        ...
    ]
}

IDE displays results with clickable URLs
```

## Debug Logs

### IDE Side
```
[SEND LLM] 🎯 CALLING onText with TOTAL TOKENS: ...
[EDLIDE JSON RAW CHUNK] ...search_web...
[EDLIDE JSON RESPONSE COMPLETE] ...response_reasoning: "The web search failed"...
```

### Vercel Side
```
[info] [Brave Search] User: 7c1953c7-94ce-4e82-98b6-d12df2828502 Query: weather Bishkek today
[info] [Brave Search] API key present: true length: 31
[info] [Brave Search] Brave API response status: 200
```

## Known Issues / Fixes Applied

1. **CORS Error**: Origin `vscode-file://vscode-app` blocked
   - **Fix**: Added CORS headers (Access-Control-Allow-Origin: *) to all responses including OPTIONS

2. **Build Mode**: User had 'build' chatMode showing in logs
   - **Cause**: Mode not in ChatMode type definition
   - **Fix**: Mode was removed/ignored in availableTools logic

3. **API Key Access**: Initially used `ISupabaseAuthService.getTokens()` (async)
   - **Fix**: Changed to `SupabaseAuthHelper.getAccessTokenSync()` for synchronous access in fetch

## Related Documentation

- `/memoryBank/fixingAuthTokens.md` - Authentication architecture between IDE and Vercel
- `/memoryBank/imageSupport.md` - Similar tool integration pattern for `analyze_image`