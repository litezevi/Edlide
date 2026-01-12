# Chat Modes Refactoring

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