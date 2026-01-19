# AI Agent Refresh System

**Date**: 2025-01-19
**Status**: Phase 1 Complete - Optimized for Open-Source LLM
**Author**: Edlide Development Team

---

## 1. All Available Tools

### 1.1 Context-Gathering Tools (Read/Search/List)

| Tool | Description | Parameters |
|------|-------------|------------|
| **read_file** | Returns full contents of a file. Always read files before editing. | uri, start_line, end_line, page_number |
| **ls_dir** | Lists all files and folders in a given URI. | uri, page_number |
| **get_dir_tree** | Returns a tree diagram of all files and folders in a folder. | uri |
| **search_pathnames_only** | Returns all pathnames matching a query (searches ONLY file names). | query, include_pattern, page_number |
| **search_for_files** | Returns list of file names whose content matches a query. | query, search_in_folder, is_regex, page_number |
| **search_in_file** | Returns array of start line numbers where content appears in a file. | uri, query, is_regex |
| **read_lint_errors** | View all lint errors on a file. | uri |

### 1.2 Editing Tools (Create/Delete/Modify)

| Tool | Description | When | Speed |
|------|-------------|------|-------|
| **edit_file** | Edit file content. old_string MUST be unique with surrounding context. | Modify existing code | FAST |
| **rewrite_file** | Replace entire file content. For NEW files OR 90%+ changes. | NEW file OR 90%+ changes | SLOW |
| **create_file_or_folder** | Create file or folder. Folders end with '/', files have extensions. | Create empty file/folder | - |
| **delete_file_or_folder** | Delete file or folder at given path. | - | - |

### 1.3 Terminal Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| **run_command** | Runs terminal command, waits for result (times out after 8s inactivity). | command, cwd |
| **run_persistent_command** | Runs command in persistent terminal. | command, persistent_terminal_id |
| **open_persistent_terminal** | Opens terminal indefinitely (e.g., npm run dev). | cwd |
| **kill_persistent_terminal** | Interrupts and closes persistent terminal. | persistent_terminal_id |

---

## 2. Open-Source LLM Principles Applied

### 2.1 Key Design Decisions

| Principle | Application |
|-----------|-------------|
| **TASK first** | All prompts start with "TASK:" |
| **# headers** | For GLM - imperative style |
| **Short tables** | No unnecessary explanations |
| **WORKFLOW steps** | Step-by-step instructions |
| **NO emojis** | No decorative elements |
| **Direct language** | "If uncertain: say I don't know" |
| **Absolute paths ONLY** | Explicit rule |
| **NO hallucinations** | Explicit rule added |

### 2.2 Prompt Structure

```
TASK: [what to do]
# TOOL SUMMARY [table]
# WORKFLOW: [step-by-step]
# CRITICAL [important errors]
# RULES [rules]
# STARTUP [first action]
```

---

## 3. KEY IMPROVEMENTS IMPLEMENTED

### 3.1 edit_file FIRST for Existing Files (Critical)

**Problem**: Agent used rewrite_file for small changes to existing files.

**Solution**: Explicit priority rule

```
# CRITICAL: edit_file FIRST for existing files!
- If file EXISTS → use edit_file (FAST)
- If file NEW → use rewrite_file (after create_file_or_folder)
- If 90%+ content changes → use rewrite_file
```

### 3.2 rewrite_file DOES NOT CREATE FILES (Critical)

**Problem**: Agent called rewrite_file on non-existent files.

**Solution**: Explicit warning with WRONG/CORRECT examples

```
# CRITICAL: rewrite_file DOES NOT CREATE FILES!

WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file
```

### 3.3 Mandatory Verification (Critical)

**Problem**: Agent skipped read_file after create_file_or_folder.

**Solution**: 4-STEP PROCESS with verification

```
# WORKFLOW: CREATE FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "/path/file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1
```

### 3.4 FOLDER vs FILE - Trailing Slash Required

**Problem**: Agent created `ide-connect-v2` as FILE instead of FOLDER.

**Solution**: Explicit examples

```
# CRITICAL: FOLDER vs FILE
FOLDER: ends with "/" → "/app/ide-connect-v2/"
FILE: has extension → "/app/page.ts"

WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" }) // FILE!
CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // FOLDER!
```

### 3.5 Nested Folders - One At A Time

**Problem**: Agent tried to create `auth/ide/refresh/` in one call.

**Solution**: Step-by-step with verification

```
# WORKFLOW: CREATE FOLDERS (ONE LEVEL AT A TIME)
1. create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!
... continue level by level
```

---

## 4. IMPLEMENTED WORKFLOWS

### 4.1 EDIT EXISTING FILE (99%)

```
# WORKFLOW: EDIT EXISTING FILE
1. read_file({ uri: "/path/file.ts" })
2. edit_file({ uri, old_string: "exact", new_string: "new" })
```

### 4.2 CREATE NEW FILE

```
# WORKFLOW: CREATE NEW FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "/path/file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1
```

### 4.3 CREATE NESTED FOLDERS

```
# WORKFLOW: CREATE FOLDERS (ONE LEVEL AT A TIME)
1. create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!
... continue level by level
```

### 4.4 COMPLETE RESTRUCTURE (90%+)

```
# WORKFLOW: COMPLETE RESTRUCTURE
1. read_file({ uri: "/path/file.ts" })
2. rewrite_file({ uri, new_content: "..." })
```

---

## 5. COMMON ERRORS & SOLUTIONS

### 5.1 Error: rewrite_file on Non-Existent File

```
❌ WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })
✅ CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file
```

### 5.2 Error: Skipping Verification

```
❌ WRONG: create_file_or_folder → rewrite_file (no read_file)
✅ CORRECT: create_file_or_folder → read_file → rewrite_file
```

### 5.3 Error: No Trailing Slash for Folders

```
❌ WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" })
✅ CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" })
```

### 5.4 Error: No Extension for Files

```
❌ WRONG: create_file_or_folder({ uri: "/app/types" })
✅ CORRECT: create_file_or_folder({ uri: "/app/types.ts" })
```

### 5.5 Error: rewrite_file for Small Changes

```
❌ WRONG: rewrite_file({ new_content: "..." }) for 5 line change
✅ CORRECT: edit_file({ old_string: "...", new_string: "..." })
```

### 5.6 Error: old_string Not Unique

```
❌ WRONG: edit_file({ old_string: "const add = (a, b) =>" })
✅ CORRECT: edit_file({ old_string: "// Section\nconst add = (a, b) => {\n  return a + b;\n}\nconst multiply" })
```

---

## 6. Tool Usage Matrix by Mode

| Tool | Plan Mode | Ask Mode | Agent Mode |
|------|-----------|----------|------------|
| read_file | ✅ | ❌ | ✅ |
| ls_dir | ✅ | ❌ | ✅ |
| get_dir_tree | ✅ | ❌ | ✅ |
| search_pathnames_only | ✅ | ❌ | ✅ |
| search_for_files | ✅ | ❌ | ✅ |
| search_in_file | ✅ | ❌ | ✅ |
| read_lint_errors | ✅ | ❌ | ✅ |
| create_file_or_folder | ❌ | ❌ | ✅ |
| delete_file_or_folder | ❌ | ❌ | ✅ |
| edit_file | ❌ | ❌ | ✅ |
| rewrite_file | ❌ | ❌ | ✅ |
| run_command | ❌ | ❌ | ✅ |
| MCP Tools | Read-only | ❌ | ✅ Full |

---

## 7. RULES Summary

- **old_string**: 5+ lines context, MUST be unique
- **If uncertain**: say "I don't know"
- **Absolute paths ONLY**
- **NO hallucinations**
- **If request unclear**: ask clarification
- **STARTUP**: get_dir_tree on workspace root first

---

## 8. Files Modified

1. `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
   - `createOpenCodeToolCalls_systemMessage`
   - `toolCallXMLGuidelines`
   - `agentSystemMessageText`
   - `create_file_or_folder` description
   - `rewrite_file` description
   - `edit_file` description
   - `chat_systemMessage` agent section (details.push)

---

## 9. Key Principles

1. **edit_file FIRST** - Use for existing files (FAST)
2. **rewrite_file ONLY for new files or 90%+ changes**
3. **rewrite_file DOES NOT CREATE FILES** - Must create first!
4. **VERIFICATION IS MANDATORY** - Always read_file after create_file_or_folder
5. **FOLDERS END WITH /** - "/app/ide-connect-v2/" not "/app/ide-connect-v2"
6. **FILES HAVE EXTENSIONS** - "types.ts" not "types"
7. **NESTED FOLDERS ONE AT A TIME** - Verify each level
8. **old_string MUST BE UNIQUE** - 5+ lines context

---

**Document Status**: Phase 1 Implementation Complete
**Status**: Optimized for DeepSeek, GLM, MiniMax
**Next Action**: Phase 2 - Testing and validation