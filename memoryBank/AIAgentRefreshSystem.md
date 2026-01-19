# AI Agent Refresh System

**Date**: 2025-01-19
**Status**: Implemented - Phase 1 Complete
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

| Tool | Description | Speed |
|------|-------------|-------|
| **edit_file** | Edit file content. old_string MUST be unique with surrounding context. | FAST |
| **rewrite_file** | Replace entire file content. For NEW files OR 90%+ changes. | SLOW |
| **create_file_or_folder** | Create file or folder. Folders end with '/', files have extensions. | - |
| **delete_file_or_folder** | Delete file or folder at given path. | - |

### 1.3 Terminal Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| **run_command** | Runs terminal command, waits for result (times out after 8s inactivity). | command, cwd |
| **run_persistent_command** | Runs command in persistent terminal. | command, persistent_terminal_id |
| **open_persistent_terminal** | Opens terminal indefinitely (e.g., npm run dev). | cwd |
| **kill_persistent_terminal** | Interrupts and closes persistent terminal. | persistent_terminal_id |

---

## 2. KEY IMPROVEMENTS IMPLEMENTED

### 2.1 Simplified Workflows

**BEFORE**: Complex multi-step instructions with "always inspect", "always verify"
**AFTER**: Simple numbered workflows with clear order

```
### CREATE NEW FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })
2. read_file({ uri: "/path/file.ts" }) // MANDATORY!
3. Only if read SUCCESS → rewrite_file({ uri, new_content: "..." })
4. Only if read FAIL → retry create_file_or_folder
```

### 2.2 Mandatory Verification (Critical Fix)

**Problem**: Agent skipped read_file after create_file_or_folder, causing write to non-existent file.

**Solution**: 4-STEP PROCESS with verification

```
WRONG (causes failure):
create_file_or_folder({ uri: "/types.ts" })
rewrite_file({ uri, new_content: "..." }) // ❌ SKIPPED read_file!

CORRECT (always works):
create_file_or_folder({ uri: "/types.ts" })
read_file({ uri: "/types.ts" }) // ✅ VERIFY FIRST!
rewrite_file({ uri, new_content: "..." }) // Only after verify!
```

### 2.3 FOLDER vs FILE - Trailing Slash Required

**Problem**: Agent created `ide-connect-v2` as FILE instead of FOLDER.

**Solution**: Explicit examples with WRONG/CORRECT patterns

```
## CRITICAL: FOLDER vs FILE - MUST ADD SLASH!

FOLDER = ends with "/" → create_file_or_folder({ uri: "/app/ide-connect-v2/" })
FILE = has extension → create_file_or_folder({ uri: "/app/page.ts" })

❌ WRONG - creates FILE instead of FOLDER:
create_file_or_folder({ uri: "/app/ide-connect-v2" }) // No slash = FILE!

✅ CORRECT - creates FOLDER:
create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // Slash = FOLDER!
```

### 2.4 Nested Folders - One At A Time

**Problem**: Agent tried to create `auth/ide/refresh/` in one call.

**Solution**: Explicit step-by-step with verification

```
### CREATE NESTED FOLDERS - ONE AT A TIME!
1. create_file_or_folder({ uri: "/auth/" }) // MUST END WITH /
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" }) // MUST END WITH /
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!
... continue level by level
```

### 2.5 edit_file vs rewrite_file Priority

**Problem**: Agent used rewrite_file for small changes.

**Solution**: Clear speed comparison

```
## TOOL SUMMARY
| Tool | When | Speed |
|------|------|-------|
| **edit_file** | Any modification | FAST |
| **rewrite_file** | NEW file OR 90%+ changes | SLOW |
```

---

## 3. IMPLEMENTED WORKFLOWS

### 3.1 EDIT EXISTING FILE (99%)

```
1. read_file({ uri: "/path/file.ts" })
2. edit_file({ uri, old_string: "exact code", new_string: "new code" })
```

### 3.2 CREATE NEW FILE

```
1. create_file_or_folder({ uri: "/path/file.ts" })
2. read_file({ uri: "/path/file.ts" }) // MANDATORY!
3. Only if read SUCCESS → rewrite_file({ uri, new_content: "..." })
4. Only if read FAIL → retry create_file_or_folder
```

### 3.3 CREATE NESTED FOLDERS

```
1. create_file_or_folder({ uri: "/auth/" })
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!
... continue level by level
```

### 3.4 COMPLETE RESTRUCTURE (90%+)

```
1. read_file({ uri: "/path/file.ts" })
2. rewrite_file({ uri, new_content: "..." })
```

---

## 4. COMMON ERRORS & SOLUTIONS

### 4.1 Error: Skipping Verification

```
❌ WRONG: create_file_or_folder → rewrite_file (no read_file)
✅ CORRECT: create_file_or_folder → read_file → rewrite_file
```

### 4.2 Error: No Trailing Slash for Folders

```
❌ WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" })
✅ CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" })
```

### 4.3 Error: No Extension for Files

```
❌ WRONG: create_file_or_folder({ uri: "/app/types" })
✅ CORRECT: create_file_or_folder({ uri: "/app/types.ts" })
```

### 4.4 Error: rewrite_file for Small Changes

```
❌ WRONG: rewrite_file({ new_content: "..." }) for 5 line change
✅ CORRECT: edit_file({ old_string: "...", new_string: "..." })
```

### 4.5 Error: old_string Not Unique

```
❌ WRONG: edit_file({ old_string: "const add = (a, b) =>" })
✅ CORRECT: edit_file({ old_string: "// Math helpers\nconst add = (a, b) => {\n..." })
```

---

## 5. Tool Usage Matrix by Mode

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

## 6. old_string Rules

- Must be unique (5+ lines context)
- Too short = "multiple matches" error
- Include surrounding lines to make unique

```
WRONG: "const add = (a, b) =>" (too short)
CORRECT: "// Section\nconst add = (a, b) => {\n  return a + b;\n}\nconst multiply"
```

---

## 7. Success Metrics

| Metric | Before | After Target |
|--------|--------|--------------|
| File creation success rate | 70% | 95%+ |
| File edit success rate | 85% | 99%+ |
| Verification compliance | 0% | 100% |
| Folder/file syntax errors | Common | 0% |
| Nested folder creation | Failed | 100% |

---

## 8. Files Modified

1. `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
   - `createOpenCodeToolCalls_systemMessage`
   - `toolCallXMLGuidelines`
   - `agentSystemMessageText`
   - `create_file_or_folder` description
   - `rewrite_file` description
   - `chat_systemMessage` agent section

---

## 9. Key Principles

1. **VERIFICATION IS MANDATORY** - Always read_file after create_file_or_folder
2. **FOLDERS END WITH /** - "/app/ide-connect-v2/" not "/app/ide-connect-v2"
3. **FILES HAVE EXTENSIONS** - "types.ts" not "types"
4. **edit_file IS FASTER** - Use for 99% of modifications
5. **NESTED FOLDERS ONE AT A TIME** - Verify each level
6. **old_string MUST BE UNIQUE** - 5+ lines context

---

**Document Status**: Phase 1 Implementation Complete
**Next Action**: Phase 2 - Add more examples and test cases