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

---

**Last Updated**: 2025-12-10  
**Status**: Backend Implementation Complete ✅  
**Next Phase**: UI Integration & Testing