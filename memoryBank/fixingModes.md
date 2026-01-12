# Chat Modes Refactoring

## Changes Made (2025-01-13)

### Summary
Enhanced system prompts for clearer mode awareness and stricter tool restrictions in Plan and Ask modes.

### Changes to prompts.ts - System Message Header
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 445-458

**ENHANCED HEADER:**
```typescript
${mode === 'plan' ? `YOUR CURRENT MODE: PLAN
You CAN use tools to READ, CHECK, VERIFY, and EXPLORE the codebase.
You CANNOT use tools to CREATE, EDIT, MODIFY, or CHANGE any files or logic.
MCP tools are available but ONLY for read operations (search, read, get info) - NOT for modifications.
Your goal: Analyze, understand, and create detailed implementation plans.
After creating a plan, suggest switching to Agent mode for implementation.`
: mode === 'ask' ? `YOUR CURRENT MODE: ASK
NO tool access available (no builtin tools, no MCP tools).
Your goal: Answer questions about code and provide explanations.
Available modes:
- ASK: Answer questions only (no tools)
- PLAN: Read/analyze codebase, create plans (has read tools)
- AGENT: Full tool access (read, edit, create files)`
: 'Your role: Autonomous coding agent that completes tasks independently.'}
```

### Changes to prompts.ts - Mode Details Section
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 469-525

**KEY CHANGES:**

1. **File Operations Rules** - Now only shown for Agent mode:
```typescript
// BEFORE
details.push('File Operations:');
details.push('• Folders end with "/" (/path/folder/)');
// ... (shown for all modes)

// AFTER
if (mode === 'agent') {
  details.push('File Operations:');
  details.push('• Folders end with "/" (/path/folder/)');
  // ... (only shown for agent)
}
```

2. **Plan Mode Details** - Enhanced with explicit restrictions:
```typescript
if (mode === 'plan') {
  details.push(`CURRENT MODE: PLAN
• You CAN use tools to READ, CHECK, VERIFY, and EXPLORE
• You CANNOT use tools to CREATE, EDIT, MODIFY, or CHANGE anything
• MCP tools available for read operations ONLY
• After creating a detailed plan, suggest switching to Agent mode`);
}
```

3. **Ask Mode Details** - Added mode awareness:
```typescript
else if (mode === 'ask') {
  details.push(`CURRENT MODE: ASK
• NO tool access (no builtin tools, no MCP tools)
• Answer questions and provide explanations only
• If user asks to read/edit files, explain you cannot do that`);
}
```

4. **Process Instructions** - Rewrote for each mode:

**Plan Mode Process:**
```typescript
details.push('Process for Plan mode:');
details.push('1. READ and ANALYZE codebase using tools');
details.push('2. Create detailed implementation plan');
details.push('3. List files that need changes');
details.push('4. Describe exact changes needed');
details.push('5. Suggest switching to Agent mode for implementation');

// With example response format
details.push(`Example Plan response:
User: How should I refactor the authentication system?
AI: Here's my analysis and plan...

## Current State
The auth system is in files X, Y, Z. I found issues A, B, C.

## Implementation Plan
1. First, update X file to add new validation
2. Then, modify Y file to integrate new auth flow
3. Finally, update Z file to use new token handler

Suggest switching to Agent mode and I'll implement this plan.`);
```

**Ask Mode Process:**
```typescript
details.push('Process for Ask mode:');
details.push('1. Answer the question directly');
details.push('2. Provide code examples if helpful');
details.push('3. Explain concepts clearly');
details.push('4. If asked to use tools, explain you cannot access them');
```

## Mode Behavior Summary (Updated)

| Mode | Builtin Tools | MCP Tools | File Editing | Description |
|------|--------------|-----------|--------------|-------------|
| **ask** | None | None | No | Answers only, no tools. Knows about PLAN and AGENT modes. |
| **plan** | Read-only (no approval tools) | Yes (read-only) | No | Read files, use MCP for analysis ONLY, create plans, suggest Agent mode. |
| **agent** | All (including approval) | Yes | Yes | Full access to all tools and file editing. |

## Key Changes

1. **Explicit Mode Notification**: Each mode now starts with "YOUR CURRENT MODE: [MODE]" for immediate awareness.

2. **Plan Mode MCP Restrictions**: MCP tools are available but ONLY for read operations. The prompt explicitly states "NOT for modifications".

3. **Ask Mode Awareness**: Added information about all available modes so AI knows PLAN mode exists for reading/analyzing.

4. **Removed Irrelevant Instructions**: File operation rules no longer shown to non-agent modes.

5. **Process Clarity**: Each mode now has specific step-by-step process instructions relevant to its capabilities.

## Changes Made (2025-01-12)

### Summary
Reorganized chat modes from `['normal', 'gather', 'agent']` to `['ask', 'plan', 'agent']` with proper tool access restrictions.

### Previous Structure
- **normal** (Minimal): Only chat, no tools
- **gather** (Ask): Read files, no editing, no MCP tools
- **agent**: Full tool access including MCP

### New Structure
- **ask**: Only answers, NO tool access (no builtin tools, no MCP tools)
- **plan**: Read files and use MCP tools, NO file editing (builtin read tools + MCP tools, no approval tools)
- **agent**: Full access - all tools including file editing and MCP

## Files Modified

### 1. voidSettingsTypes.ts
**Path**: `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`
**Line**: 450

```typescript
// BEFORE
export type ChatMode = 'agent' | 'gather' | 'normal'

// AFTER
export type ChatMode = 'agent' | 'plan' | 'ask'
```

### 2. SidebarChat.tsx - UI Labels
**Path**: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines**: 712-731

```typescript
// BEFORE
const nameOfChatMode = {
  'normal': 'Minimal',
  'gather': 'Ask',
  'agent': 'Agent',
}

const detailOfChatMode = {
  'normal': 'Can only chat',
  'gather': 'Reads files, but can\'t edit',
  'agent': 'Edits files and uses tools',
}

const options: ChatMode[] = useMemo(() => ['normal', 'gather', 'agent'], [])

// AFTER
const nameOfChatMode = {
  'ask': 'Ask',
  'plan': 'Plan',
  'agent': 'Agent',
}

const detailOfChatMode = {
  'ask': 'Answers only',
  'plan': 'Plans with tools, no editing',
  'agent': 'Edits files and uses tools',
}

const options: ChatMode[] = useMemo(() => ['ask', 'plan', 'agent'], [])
```

### 3. prompts.ts - availableTools Function
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 332-340

```typescript
// BEFORE
const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'normal' ? undefined
  : chatMode === 'gather' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
    : chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
      : undefined

const effectiveMCPTools = chatMode === 'agent' ? mcpTools : undefined

// AFTER
const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'ask' ? undefined
  : chatMode === 'plan' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
    : chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
      : undefined

const effectiveMCPTools = (chatMode === 'agent' || chatMode === 'plan') ? mcpTools : undefined
```

### 4. prompts.ts - System Message Header
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 458-465

```typescript
// BEFORE
${mode === 'gather' ? 'Your role: Understand requests, gather information, and create clear plans. Outline steps before proceeding.'
  : mode === 'normal' ? 'Your role: Assist with coding tasks using available tools.'
    : 'Your role: Autonomous coding agent that completes tasks independently.'}

// AFTER
${mode === 'plan' ? 'Your role: Understand requests, gather information, and create clear plans. Use tools to read files and explore the codebase. DO NOT edit or create any files. After creating a detailed plan, suggest switching to Agent mode for implementation.'
  : mode === 'ask' ? 'Your role: Answer questions about code. No tool access available.'
    : 'Your role: Autonomous coding agent that completes tasks independently.'}
```

### 5. prompts Mode Details
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 488-511

```typescript
// BEFORE
if (mode === 'gather') {
  details.push('In gather mode: Create files and edit as needed. Be proactive with file operations. Use Tools step-by-step. Analyze codebase starting with directory structure, then key files.');
} else if (mode === 'normal') {
  details.push('In normal mode: Can ask users for context by having them reference files with @ symbol.');
}

if (mode !== 'agent') {
  // ... process steps ...
  
  if (mode === 'gather' || mode === 'normal') {
    details.push(`For file edits, use code blocks with format:
${chatSuggestionDiffExample}
The system handles formatting differences automatically with intelligent matching.`);
  }
}

// AFTER
if (mode === 'plan') {
  details.push('In plan mode: READ-ONLY - Use tools to explore codebase, understand structure, and create detailed plans. DO NOT create or edit files. After creating a plan, suggest switching to Agent mode for implementation.');
} else if (mode === 'ask') {
  details.push('In ask mode: ANSWER ONLY - No tool access available. Can only provide explanations and answer questions about code.');
}

if (mode !== 'agent') {
  // ... process steps ...

  if (mode === 'plan') {
    details.push(`IMPORTANT: Since you are in plan mode, focus on ANALYSIS and PLANNING. Use tools to read and explore, but DO NOT edit files. Describe what changes should be made and suggest switching to Agent mode for implementation.`);
  }
}
```

### 6. convertToLLMMessageService.ts - Directory Cutoff Logic
**Path**: `src/vs/workbench/contrib/void/browser/convertToLLMMessageService.ts`
**Line**: 601

```typescript
// BEFORE
cutOffMessage: chatMode === 'agent' || chatMode === 'gather' ?
  `...Directories string cut off, use tools to read more...`
  : `...Directories string cut off, ask user for more if necessary...`

// AFTER
cutOffMessage: chatMode === 'agent' || chatMode === 'plan' ?
  `...Directories string cut off, use tools to read more...`
  : `...Directories string cut off, ask user for more if necessary...`
```

### 7. Removed Unused Code
**Path**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: 99-110

Removed unused `chatSuggestionDiffExample` constant that was no longer referenced after mode changes.

## Mode Behavior Summary

| Mode | Builtin Tools | MCP Tools | File Editing | Description |
|------|--------------|-----------|--------------|-------------|
| **ask** | None | None | No | Answers only, no tools |
| **plan** | Read-only (no approval tools) | Yes | No | Read files, use MCP, create plans, suggest Agent mode |
| **agent** | All (including approval) | Yes | Yes | Full access to all tools and file editing |

## Key Implementation Details

### MCP Tools Access
- `ask`: No MCP tools
- `plan`: MCP tools enabled (read-only operations)
- `agent`: MCP tools enabled (full operations)

### Builtin Tools Filtering
- `ask`: `undefined` (no tools)
- `plan`: Filter out approval-type tools: `(Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))`
- `agent`: All builtin tools: `Object.keys(builtinTools) as BuiltinToolName[]`

### Plan Mode Requirements
After completing analysis in Plan mode, the AI must:
1. Create a detailed step-by-step plan
2. Describe what files need to be changed
3. Suggest switching to Agent mode for implementation
4. NOT make any file edits directly

## Verification
- TypeScript compilation: Passed (no new errors introduced)
- React build: Ready for testing
- All mode transitions: Verified logically consistent