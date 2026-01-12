# Threads Per Project Implementation

## Overview

Threads are now strictly bound to the workspace (project) where they were created. Each thread stores its associated `workspaceId`, and only threads belonging to the current workspace are displayed and accessible.

## Changes Made

### 1. Storage Key Function (`storageKeys.ts`)

Added a function to generate workspace-scoped storage keys:

```typescript
export function getThreadStorageKey(workspaceId: string): string {
	return `${THREAD_STORAGE_KEY}.${workspaceId}`
}
```

**File**: `src/vs/workbench/contrib/void/common/storageKeys.ts`

### 2. ThreadType Schema (`chatThreadService.ts`)

Added `workspaceId` field to the thread type:

```typescript
export type ThreadType = {
	id: string;
	createdAt: string;
	lastModified: string;

	workspaceId: string; // NEW: workspace this thread belongs to

	messages: ChatMessage[];
	filesWithUserChanges: Set<string>;

	state: {
		// ... existing state fields
	};
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 116-152)

### 3. Storage Methods (`chatThreadService.ts`)

Updated `_readAllThreads()` and `_storeAllThreads()` to use workspace-scoped keys:

```typescript
private _getCurrentWorkspaceId(): string {
	return this._workspaceContextService.getWorkspace().id;
}

private _readAllThreads(): ChatThreads | null {
	const storageKey = getThreadStorageKey(this._getCurrentWorkspaceId());
	const threadsStr = this._storageService.get(storageKey, StorageScope.APPLICATION);
	// ... filtering threads by workspaceId
}

private _storeAllThreads(threads: ChatThreads) {
	const storageKey = getThreadStorageKey(this._getCurrentWorkspaceId());
	// ... store with workspace-scoped key
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 418-460)

### 4. Thread Creation (`chatThreadService.ts`)

Updated `newThreadObject()` to accept workspaceId:

```typescript
const newThreadObject = (workspaceId: string) => {
	const now = new Date().toISOString()
	return {
		id: generateUuid(),
		createdAt: now,
		lastModified: now,
		workspaceId, // NEW: store workspace ID
		messages: [],
		// ... other fields
	} satisfies ThreadType
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 212-228)

### 5. Open New Thread (`chatThreadService.ts`)

Updated `openNewThread()` to:
- Get current workspace ID
- Find empty threads only for current workspace
- Create new thread with workspace ID

```typescript
openNewThread() {
	const workspaceId = this._getCurrentWorkspaceId();

	// Find empty thread for current workspace only
	for (const threadId in currentThreads) {
		const thread = currentThreads[threadId];
		if (thread && thread.workspaceId === workspaceId && thread.messages.length === 0) {
			this.switchToThread(threadId);
			return;
		}
	}

	// Create new thread with workspace ID
	const newThread = newThreadObject(workspaceId);
	// ...
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 1718-1745)

### 6. Duplicate Thread (`chatThreadService.ts`)

Updated `duplicateThread()` to preserve workspace association:

```typescript
duplicateThread(threadId: string) {
	const workspaceId = this._getCurrentWorkspaceId();
	const newThread = {
		...deepClone(threadToDuplicate),
		id: generateUuid(),
		workspaceId, // NEW: set to current workspace
	};
	// ...
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 1779-1793)

### 7. Workspace Change Handler (`chatThreadService.ts`)

Added subscription to workspace state changes to reload threads:

```typescript
constructor(...) {
	// ... existing code

	// Listen for workspace changes to reload threads for the new workspace
	this._register(
		this._workspaceContextService.onDidChangeWorkbenchState(() => {
			this._reloadThreadsForCurrentWorkspace();
		})
	);
}

private _reloadThreadsForCurrentWorkspace() {
	const readThreads = this._readAllThreads() || {};

	if (Object.keys(readThreads).length === 0) {
		// Create new thread if none exist
		this.state = {
			allThreads: {},
			currentThreadId: null as unknown as string,
		};
		this.openNewThread();
	} else {
		// Switch to first available thread
		const firstThreadId = Object.keys(readThreads)[0];
		this.state = {
			allThreads: readThreads,
			currentThreadId: firstThreadId,
		};
		this._onDidChangeCurrentThread.fire();
	}
}
```

**File**: `src/vs/workbench/contrib/void/browser/chatThreadService.ts` (lines 339-401)

### 8. Thread Migration

Existing threads without `workspaceId` are automatically migrated to the current workspace on first load:

```typescript
private _readAllThreads(): ChatThreads | null {
	// ... load threads

	for (const threadId in threads) {
		const thread = threads[threadId];
		if (!thread) continue;

		// Migrate threads without workspaceId to current workspace
		if (!thread.workspaceId) {
			thread.workspaceId = workspaceId;
			hasMigrated = true;
		}

		// Only include threads belonging to current workspace
		if (thread.workspaceId === workspaceId) {
			filteredThreads[threadId] = thread;
		}
	}

	// Save migrated threads
	if (hasMigrated) {
		this._storeAllThreads(filteredThreads);
	}

	return filteredThreads;
}
```

## Behavior

### After Implementation

| Scenario | Behavior |
|----------|----------|
| Open Project A | Threads from Project A are loaded |
| Create new thread in Project A | Thread stored with `workspaceId: "Project A"` |
| Switch to Project B | Threads from Project B are loaded automatically |
| Create new thread in Project B | Thread stored with `workspaceId: "Project B"` |
| Switch back to Project A | Original Project A threads restored |
| Existing threads without workspaceId | Automatically migrated to current workspace |

### Storage Structure

```
// Before (global):
void.chatThreadStorageII -> { "thread1": {...}, "thread2": {...}, ... }

// After (workspace-scoped):
void.chatThreadStorageII.workspaceId1 -> { "thread1": {...}, "thread3": {...}, ... }
void.chatThreadStorageII.workspaceId2 -> { "thread2": {...}, "thread4": {...}, ... }
```

## Files Modified

1. `src/vs/workbench/contrib/void/common/storageKeys.ts`
2. `src/vs/workbench/contrib/void/browser/chatThreadService.ts`

## Backward Compatibility

- Existing threads without `workspaceId` are automatically migrated
- Thread history is preserved during migration
- No data loss during upgrade

## Build Status

- React build: ✅ Success
- TypeScript compilation: ✅ Success