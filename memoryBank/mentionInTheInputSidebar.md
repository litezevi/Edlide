# Mention in the Input Sidebar System

## Date Added: 2025-01-24

## Overview
Implemented inline file/folder mention system using `@filename` syntax directly in chat input. Mentions stay as text in the message and are highlighted in the sent message.

## Changes Made

### 1. inputs.tsx - Modified `insertTextAtCursor` function
**File**: `src/vs/workbench/contrib/void/browser/react/src/util/inputs.tsx`
**Lines**: 387-416

**Change**: Added `includeAtSymbol` parameter to `insertTextAtCursor`
- **Before**: Always deleted the `@` symbol when inserting the filename
- **After**: When `includeAtSymbol=true`, keeps the `@` and inserts `@filename` as text

```typescript
const insertTextAtCursor = (text: string, includeAtSymbol = false) => {
    // ... cursor position logic

    // Insert text with @ symbol if includeAtSymbol is true
    const textToInsert = includeAtSymbol ? `@${text}` : text;
    textarea.value = textBeforeCursor + textToInsert + textAfterCursor;
    // ...
}
```

### 2. inputs.tsx - Modified `onSelectOption` function
**File**: `src/vs/workbench/contrib/void/browser/react/src/util/inputs.tsx`
**Lines**: 419-430

**Change**: Removed `StagingSelectionItem` creation - mentions are now text only with full relative path
- **Before**: Inserted filename, created `StagingSelectionItem`, added to `chatThreadService`
- **After**: Inserts full relative path `@src/components/Button.tsx` as text with `includeAtSymbol=true`

```typescript
if (isLastOption) {
    setIsMenuOpen(false)
    // Insert full relative path (e.g., @src/components/Button.tsx)
    const fullPath = [...newPath].join('/')
    insertTextAtCursor(fullPath, true)
}
```

**Critical Improvement**: Full relative path ensures unique file identification even when multiple files have the same name (e.g., `@src/api/routes/route.ts` vs `@src/web/routes/route.ts`).

**Key Point**: Files/folders selected via `@` menu now stay as text in the input with complete path, not as separate attachments.

### 3. SidebarChat.tsx - Added `MentionHighlight` component
**File**: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines**: Added after `ChatModeDropdown` component (around line 858)

**New Component**: Parses and highlights `@filename` mentions with minimal styling

```typescript
const MentionHighlight = ({ text }: { text: string }) => {
    const result: React.ReactNode[] = []
    const regex = /@([a-zA-Z0-9_\-./\\]+)/g
    let lastIdx = 0
    let match

    while ((match = regex.exec(text)) !== null) {
        // Text before the mention
        if (match.index > lastIdx) {
            result.push(text.slice(lastIdx, match.index))
        }
        
        // Full match includes @ symbol
        const fullMention = match[0]
        const mentionName = match[1]
        const isFolder = !mentionName.includes('.')
        
        result.push(
            <span
                key={match.index}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-white/5 text-void-fg-2 border border-white/10"
            >
                {isFolder ? <Folder size={12} /> : <FileText size={12} />}
                <span>{fullMention}</span>
            </span>
        )
        
        lastIdx = match.index + fullMention.length
    }
    
    if (lastIdx < text.length) {
        result.push(text.slice(lastIdx))
    }
    
    return <>{result.length > 0 ? result : text}</>
}
```

**Styling**:
- `bg-white/5` - Subtle white background (5% opacity)
- `border-white/10` - Light border
- `text-void-fg-2` - Matches Edlide theme colors
- Icons: Folder (no extension) or FileText (with extension)

### 4. SidebarChat.tsx - Modified UserMessageComponent
**File**: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines**: 1716-1727

**Change**: Wrap `displayContent` with `MentionHighlight`

```typescript
if (mode === 'display') {
    chatbubbleContents = <>
        <SelectedFiles type='past' messageIdx={messageIdx} selections={chatMessage.selections || []} />
        <span className='px-0.5'>
            <MentionHighlight text={chatMessage.displayContent || ''} />
        </span>
        {/* ... images ... */}
    </>
}
```

**Before**: Plain text display
**After**: Text with `@` mentions highlighted

### 5. SidebarChat.tsx - Added FileText import
**File**: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines**: ~27

```typescript
import { ..., FileText } from 'lucide-react';
```

Added `FileText` icon for file mentions.

### 6. prompts.ts - Added mention instructions to system messages
**File**: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
**Lines**: Added after "STARTUP" section (around line 23 in `agentSystemMessageText`)

**Added to `agentSystemMessageText`**:
```markdown
# FILE MENTIONS (@filename)
Users can reference files/folders in prompts using @syntax:
- @src/components/Button.tsx → User mentions a file with relative path
- @src/api → User mentions a folder with relative path
- When you see @path, use tools to find and read that file/folder
- Search for the path, then read with read_file or explore with ls_dir

EXAMPLE:
User: "Check @src/components/Button.tsx and update styles"
YOU: ls_dir @src/components → read_file(uri) → make edits
```

**Added to `chat_systemMessage`** (same instructions for all modes):
```markdown
 FILE MENTIONS (@filename):
Users can reference files/folders in prompts using @syntax with relative paths:
- @src/components/Button.tsx → File mention with relative path
- @src/api → Folder mention with relative path
- When you see @path, use tools to find and read that file/folder
- Search for path, then read with read_file or explore with ls_dir

EXAMPLE: "Check @src/api/routes/route.ts and fix the handler"
→ search_pathnames_only("route.ts") or ls_dir @src/api/routes → read_file(uri) → make edits
```

**Purpose**: AI now knows that mentions include relative paths and how to locate the exact file even with duplicate names.

## How It Works

### User Flow:
1. User types `@` in the chat input
2. Dropdown appears with files/folders options (navigating folders)
3. User selects a file (e.g., navigates to `src/components/` and selects `Button.tsx`)
4. Input shows: `@src/components/Button.tsx` (full relative path with `@` symbol)
5. User sends message: "Check @src/components/Button.tsx and fix errors"
6. The message displays with `@src/components/Button.tsx` highlighted (subtle background + icon)

### AI Processing:
1. AI sees the prompt with `@src/components/Button.tsx`
2. AI parses the relative path and uses `search_pathnames_only` or `ls_dir` to locate the file
3. AI reads the file with `read_file` tool using the full path
4. AI provides response based on file content

### Key Points:
- **Full relative path sent**: Users send `@src/components/Button.tsx` not just `@Button.tsx`
- **Handles duplicate filenames**: Multiple `route.ts` files are uniquely identified by their paths
- **No file content sent**: Only the `@path` text is in the user message
- **No StagingSelectionItem**: Mentions are plain text, not attachments
- **AI discovers files**: AI uses tools with paths to find and read mentioned files
- **Clean UI**: Mentions stay inline with the message text, highlighted with subtle styling

## Files Modified Summary

1. `src/vs/workbench/contrib/void/browser/react/src/util/inputs.tsx`
   - Modified `insertTextAtCursor()` - Added `includeAtSymbol` parameter
   - Modified `onSelectOption()` - Removed `StagingSelectionItem` creation

2. `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
   - Added `FileText` import from lucide-react
   - Added `MentionHighlight` component
   - Modified `UserMessageComponent` - Wrap `displayContent` with `MentionHighlight`

3. `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
   - Added mention instructions to `agentSystemMessageText`
   - Added mention instructions to `chat_systemMessage`

## Next Steps / Future Enhancements

- [ ] Consider adding click-to-open functionality for mentions
- [ ] Perhaps add autocomplete for file paths after `@`
- [ ] Could support range mentions like `@file.py:10-20`
- [ ] Add keyboard navigation for quick file insertion

## Notes

- The regex `/@([a-zA-Z0-9_\-./\\]+)/g` matches `@` followed by valid filename characters
- Folder detection: if no dot `.` in name, it's a folder (shows Folder icon)
- File detection: if dot `.` in name, it's a file (shows FileText icon)
- Styling uses Tailwind utility classes for theme consistency