# Context Compacting System

## Overview
The Context Compacting System is a complete 4-stage implementation that automatically triggers when the AI context window reaches 80% capacity. It summarizes the conversation and resets the context window while preserving the conversation history.

## 4-Stage Compacting Process

### Stage 1: Detection & Trigger
- **Trigger**: Context reaches 80% capacity
- **Action**: Automatically starts compacting process
- **UI**: Shows "compacting..." animation

### Stage 2: Summary Request
- **Action**: Sends prompt "Сделай саммари того что ты сделал и что нужно сделать" to AI
- **Context**: Uses AI's existing context window (no message history sent)
- **Goal**: Get concise summary of conversation

### Stage 3: Real-time Streaming
- **Action**: Receives summary from AI in real-time
- **UI**: Shows progress bar and streaming text
- **Progress**: Updates as summary is generated

### Stage 4: Context Reset & Integration
- **Action**: Resets context token counters
- **Integration**: Adds summary as first message in new context window
- **Result**: Continues conversation with summarized context

## Implementation Details

### 1. Type Definitions (`chatThreadServiceTypes.ts`)
**Added Compacting types**:
```typescript
export type CompactingState = {
    isActive: boolean;
    summaryText: string;
    progress: number; // 0-100
    error: string | null;
    retryCount: number;
    threadId: string;
    startedAt: number; // timestamp
};

export type CompactingMessage = {
    role: 'compacting';
    content: string;
    displayContent: string;
    state: CompactingState;
};

// Added to ChatMessage union type:
export type ChatMessage =
    | { role: 'user'; ... }
    | { role: 'assistant'; ... }
    | ToolMessage<ToolName>
    | DecorativeCanceledTool
    | CheckpointEntry
    | CompactingMessage;  // NEW
```

### 2. Compacting Service (`compactingService.ts`)
**Complete backend service implementation**:

```typescript
export interface ICompactingService {
    readonly _serviceBrand: undefined;
    readonly onDidChangeCompactingState: Event<{ threadId: string; state: CompactingState }>;
    
    isCompacting(threadId: string): boolean;
    getCompactingState(threadId: string): CompactingState | undefined;
    startCompacting(threadId: string): Promise<void>;
    cancelCompacting(threadId: string): void;
    getSummary(threadId: string): string;
}
```

**Key Methods**:
- `startCompacting(threadId)`: Main entry point for 4-stage process
- `sendSummarizationRequest()`: Sends prompt to AI using existing context
- `resetContextTokens()`: Resets token counters after successful compacting
- `addSummaryToChat()`: Adds summary message to chat history

**Error Handling**:
- Automatic retry up to 3 times on failure
- Cancellation support with `CancellationTokenSource`
- State management for progress tracking

### 3. Service Registration (`void.contribution.ts`)
**Added to dependency injection**:
```typescript
// register Thread History
import './chatThreadService.js'

// register Compacting service
import './compactingService.js'  // NEW
```

### 4. React Service Integration (`services.tsx`)
**Added to useAccessor hook**:
```typescript
import { ICompactingService } from '../../../compactingService.js';

// In getReactAccessor function:
const stateServices = {
    // ... existing services
    compactingService: accessor.get(ICompactingService),  // NEW
};

// In return object:
ICompactingService: compactingService,  // NEW
```

### 5. UI Integration (`SidebarChat.tsx` - partial)
**Added compacting service access**:
```typescript
const useContextTracker = (threadId: string, featureName: FeatureName) => {
    const accessor = useAccessor();
    const voidSettingsService = accessor.get('IVoidSettingsService');
    const chatThreadService = accessor.get('IChatThreadService');
    const storageService = accessor.get('IStorageService');
    const compactingService = accessor.get('ICompactingService');  // NEW
    
    const [compactingState, setCompactingState] = useState<CompactingState | null>(null);  // NEW
    // ... rest of hook
};
```

## Technical Architecture

### Service Dependencies
```
CompactingService
├── ILLMMessageService (send summarization requests)
├── IChatThreadService (manage chat threads)
├── IVoidSettingsService (get model settings)
└── IStorageService (reset token counters)
```

### State Management
```typescript
interface CompactingState {
    isActive: boolean;      // Stage 1: Detection
    summaryText: string;    // Stage 3: Streaming text
    progress: number;       // Stage 3: Progress (0-100%)
    error: string | null;   // Error handling
    retryCount: number;     // Retry logic (max 3)
    threadId: string;       // Target chat thread
    startedAt: number;      // Timestamp for tracking
}
```

### Event Flow
```
1. Context reaches 80% → isContextHigh = true
2. UI shows CompactingSystemMessage with animation
3. compactingService.startCompacting(threadId) called
4. Service stops current streaming if any
5. Sends summarization prompt to AI
6. Streams response with progress updates
7. Resets context token counters
8. Adds summary to chat as compacting message
9. Continues conversation with fresh context
```

## Error Handling & Retry Logic

### Retry Mechanism
```typescript
try {
    await this.compactingService.startCompacting(threadId);
} catch (error) {
    // Retry up to 3 times
    if (currentState.retryCount < 3) {
        setTimeout(() => this.startCompacting(threadId), 1000);
    }
}
```

### Cancellation Support
- Uses `CancellationTokenSource` for proper cleanup
- Can be cancelled by user or system
- Proper disposal of resources

## Integration Points

### With Existing Chat System
- **Thread Management**: Works with existing `IChatThreadService`
- **Message Flow**: Integrates with `ILLMMessageService` for AI communication
- **Token Tracking**: Resets counters in persistent storage
- **UI Updates**: Uses existing React state management

### With Context Tracking
- **80% Detection**: Leverages existing `useContextTracker` logic
- **Token Reset**: Clears both persistent and window storage
- **Progress Display**: Integrates with existing UI components

## Current Status

### ✅ Completed Backend Implementation
- [x] **Type System**: Added `CompactingState` and `CompactingMessage` types
- [x] **Service Layer**: Full `CompactingService` implementation
- [x] **Dependency Injection**: Registered in `void.contribution.ts`
- [x] **React Integration**: Added to `useAccessor` hook
- [x] **Error Handling**: Retry logic and cancellation support
- [x] **Token Management**: Context reset functionality
- [x] **AI Integration**: Uses existing `sendLLMMessageService`

### 🔄 Pending UI Integration
- [ ] **Trigger Integration**: Connect `isContextHigh` to `startCompacting()`
- [ ] **Progress Display**: Show real-time compacting progress in UI
- [ ] **State Management**: Update `useContextTracker` with compacting state
- [ ] **Error Display**: Show compacting errors in UI
- [ ] **Summary Display**: Show summarized message in chat

### 📋 Next Steps
1. **Connect Trigger**: Call `compactingService.startCompacting()` when `isContextHigh = true`
2. **Update CompactingSystemMessage**: Show progress and summary text
3. **Add Summary Message**: Insert compacting message into chat thread
4. **Test Integration**: Verify 4-stage flow works end-to-end
5. **Error UI**: Add error states and retry buttons

## File Changes Summary

### 1. `src/vs/workbench/contrib/void/common/chatThreadServiceTypes.ts`
- Added `CompactingState` type definition
- Added `CompactingMessage` type definition  
- Extended `ChatMessage` union type to include `CompactingMessage`

### 2. `src/vs/workbench/contrib/void/browser/compactingService.ts` (NEW)
- Complete service implementation with 4-stage compacting
- Error handling with retry logic (3 attempts)
- Cancellation support with `CancellationTokenSource`
- Integration with existing chat and AI services
- Token reset functionality
- **Исправление циклической зависимости**: Использован локальный интерфейс `IChatThreadService` вместо импорта для избежания циклической зависимости
- **Ленивая загрузка сервиса**: `chatThreadService` получается через `instantiationService.invokeFunction` при первом использовании

### 3. `src/vs/workbench/contrib/void/browser/void.contribution.ts`
- Added import: `import './compactingService.js'`
- Service automatically registered via `registerSingleton`

### 4. `src/vs/workbench/contrib/void/browser/react/src/util/services.tsx`
- Added import: `import { ICompactingService } from '../../../compactingService.js';`
- Added to `stateServices` object: `compactingService: accessor.get(ICompactingService)`
- Added to return object: `ICompactingService: compactingService`

### 5. `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
- Added import: `import { CompactingState } from '../../../../common/chatThreadServiceTypes.js';`
- Added service access: `const compactingService = accessor.get('ICompactingService');`
- Added state: `const [compactingState, setCompactingState] = useState<CompactingState | null>(null);`

## Technical Notes

### Key Design Decisions
1. **No Message History Sent**: Uses AI's existing context window instead of sending history
2. **Real-time Streaming**: Shows progress as summary is generated
3. **Same Thread**: Compacting happens in current thread, doesn't create new one
4. **No Cancellation**: Once started, cannot be cancelled (as per requirements)
5. **Automatic Retry**: 3 retries on failure with 1-second delays

### Performance Considerations
- **Minimal Overhead**: Uses existing AI infrastructure
- **Efficient State**: Only tracks necessary compacting state
- **Proper Cleanup**: Cancellation tokens prevent memory leaks
- **Storage Reset**: Clears both persistent and window storage

### Testing Requirements
1. **Context Threshold**: Verify 80% detection triggers compacting
2. **AI Integration**: Test summarization prompt with different models
3. **Error Handling**: Verify retry logic works correctly
4. **Token Reset**: Confirm context counters are properly cleared
5. **UI Integration**: Test progress display and error states

## Current Implementation Status & Issues

### ✅ What's Working
1. **Context Detection**: ✅ Correctly detects when context reaches 80% capacity
2. **Chat Stopping**: ✅ Chat is properly stopped when compacting begins
3. **Animation Trigger**: ✅ "Compacting..." animation shows correctly
4. **Service Integration**: ✅ CompactingService is registered and accessible
5. **State Management**: ✅ CompactingState tracking works properly

### ❌ Current Issues
1. **Summarization Request**: ❌ Request is sent but no response is received
2. **Real-time Streaming**: ❌ No streaming summary text appears in UI
3. **Context Reset**: ❌ Context tokens are not reset after compacting
4. **Summary Message**: ❌ Summary is not added as first message in new context window

### 🔧 Recent Changes Made

#### 1. Fixed Circular Dependency Issues
**Problem**: `IChatThreadService` import caused circular dependency
**Solution**: 
- Removed direct import of `IChatThreadService` from `compactingService.ts`
- Used `any` type and global service accessor pattern
- Added `setChatThreadService()` method to `ICompactingService` interface

#### 2. Enhanced Chat Stopping Logic
**Problem**: Chat wasn't stopping when compacting started
**Solution**:
- Added explicit `chatThreadService.abortRunning(threadId)` call in `useContextTracker`
- Chat stops BEFORE compacting process begins (not during)
- Added error handling for chat stopping failures

#### 3. Improved Service Access Pattern
**Problem**: `ChatThreadService` was not available in `CompactingService`
**Solution**:
- Set global service reference in `useContextTracker` 
- Added fallback to global window object
- Added direct service injection via `setChatThreadService()` method

#### 4. Updated React Integration
**Files Modified**: `SidebarChat.tsx`
- Added `compactingService` to `useAccessor()`
- Enhanced `useContextTracker` with compacting state management
- Added global service registration for compacting service
- Connected `CompactingSystemMessage` with real compacting state

#### 5. Fixed Type System
**Files Modified**: `chatThreadServiceTypes.ts`
- ✅ `CompactingState` type already defined
- ✅ `CompactingMessage` type already defined  
- ✅ `CompactingMessage` already added to `ChatMessage` union

### 📋 Technical Implementation Details

#### Service Registration (void.contribution.ts)
```typescript
// register Compacting service
import './compactingService.js'  // ✅ Already registered
```

#### React Service Integration (services.tsx)
```typescript
// ✅ Already integrated in useAccessor hook
const compactingService = accessor.get(ICompactingService);
```

#### UI Integration (SidebarChat.tsx)
```typescript
// ✅ CompactingSystemMessage shows when isContextHigh = true
{showContextBar && isContextHigh && (
    <CompactingSystemMessage compactingState={compactingState} />
)}
```

### 🐛 Debug Information

#### Current Flow
1. ✅ Context reaches 80% → `isContextHigh = true`
2. ✅ `useContextTracker` detects high context
3. ✅ `chatThreadService.abortRunning(threadId)` called
4. ✅ `CompactingSystemMessage` shows "Compacting..." animation
5. ✅ `compactingService.startCompacting(threadId)` called
6. ❌ `sendSummarizationRequest()` sends request but no response
7. ❌ No streaming updates in UI
8. ❌ Context tokens not reset
9. ❌ Summary message not added to chat

#### Error Logs
```
[COMPACTING] Context at 94.375%, starting compacting for thread xxx
[COMPACTING] startCompacting called for thread xxx
[COMPACTING] Starting compacting for thread xxx
[COMPACTING] Error during compacting: Error: ChatThreadService not available
```

### 🎯 Next Steps to Fix Issues

#### 1. Fix Summarization Request Response
- Check if `ILLMMessageService` is properly configured
- Verify model selection for Chat feature
- Add error handling for summarization request failures
- Debug why `onText` and `onFinalMessage` callbacks aren't triggered

#### 2. Fix Context Token Reset
- Verify storage service integration
- Check if `CHAT_TOKENS_STORAGE_KEY` is correct
- Debug token reset logic in `resetContextTokens()`

#### 3. Fix Summary Message Addition
- Verify `dangerousSetState()` method works correctly
- Check if `CompactingMessage` type is properly handled in UI
- Debug message addition in `addSummaryToChat()`

#### 4. Add Error Handling & UI Feedback
- Show error states in `CompactingSystemMessage`
- Add retry buttons for failed compacting attempts
- Display progress indicators during summarization

---

**Last Updated**: 2025-12-10  
**Status**: Partially Working ⚠️  
**Issues**: Summarization response, context reset, and message addition not working  
**Next Phase**: Debug summarization request and fix remaining functionality