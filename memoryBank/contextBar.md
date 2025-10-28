# Context Bar Implementation

## Overview
Context bar tracks real-time token usage for Edlide provider models to prevent context window overflow.

## Implementation Details

### 1. Event System Integration
**Files Modified:** `sendLLMMessageTypes.ts`, `sendLLMMessage.impl.ts`

- Added `totalTokens?: number` parameter to `OnText` event type
- Modified main process to extract `usage.total_tokens` from JSON response
- Real-time token data flows from API → Main Process → React Components

### 2. Chat Thread Service Updates  
**File Modified:** `chatThreadService.ts`

- Added `totalTokens?: number` to `llmInfo` type in `StreamState`
- Updated `onText` callback to pass `totalTokens` from API response
- Stream state now carries real token counts alongside content

### 3. React Component Enhancement
**File Modified:** `SidebarChat.tsx`

#### useContextTracker Hook Updates:
- Added `actualTotalTokens` state for real API data
- Added `isApiVerified` state to track data source
- Modified `calculateContextUsage()` to prioritize real tokens over estimates
- Calculates estimates only when no real token data available

#### Token Logic:
```typescript
// Use actual total_tokens from API if available, otherwise calculate estimates
let totalTokens: number = actualTotalTokens || 0;

if (!actualTotalTokens) {
    // Calculate approximate context usage only if no real data available
    totalTokens = 0;
    // ... estimation logic from messages and selections
    setIsApiVerified(false);
} else {
    setIsApiVerified(true);
}
```

#### Real-time Updates:
- Added `useChatThreadsStreamState()` integration
- Automatic updates when `totalTokens` available in stream state
- Reset when switching threads or starting new chat

#### UI Enhancement:
- Updated tooltip to show "(API verified)" when using real data
- Format: `50739 / 202752 tokens used (API verified)`
- Falls back to estimates when API data unavailable

### 4. Data Flow Architecture

```
Edlide API Response
    ↓ (total_tokens from usage object)
Main Process (sendLLMMessage.impl.ts)
    ↓ (onText callback with totalTokens)
Chat Thread Service (streamState.llmInfo.totalTokens)
    ↓ (useChatThreadsStreamState hook)
React Component (useContextTracker)
    ↓ (actualTotalTokens state)
Context Bar UI (shows real tokens + "(API verified)")
```

### 5. Provider Detection
- Context bar appears only for Edlide provider models
- Model-specific context limits preserved:
  - GLM-4.6-FP8: 202,752 tokens
  - Kimi-K2: 262,144 tokens  
  - DeepSeek-V3.1-Terminus: 163,840 tokens
  - Default: 128,000 tokens

### 6. Error Handling & Fallbacks
- Graceful degradation to estimates when API data unavailable
- TypeScript null safety for optional token data
- Component rebuild successful with no lint errors

### 7. User Experience
- **Before**: Context bar showed estimates like "15234 / 162000 tokens used"
- **After**: Context bar shows verified data like "50739 / 202752 tokens used (API verified)"
- Real-time updates during streaming responses
- Clear indication when data comes from API vs estimates

## Technical Achievement
✅ **Complete Integration**: End-to-end flow from API JSON response to UI display
✅ **Real-time Updates**: Context updates immediately when token data available
✅ **Fallback System**: Estimates used when API data missing
✅ **Type Safety**: Full TypeScript support with proper null handling
✅ **Performance**: Simple useEffect-based updates without complex state management

The context bar now accurately reflects the actual token usage from Edlide's API responses instead of relying on rough calculations.