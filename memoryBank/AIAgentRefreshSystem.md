# AI Agent Refresh System

**Date**: 2025-01-18
**Status**: Analysis & Planning Phase
**Author**: Edlide Development Team

---

## 1. All Available Tools

### 1.1 Context-Gathering Tools (Read/Search/List)

| Tool | Description | Parameters |
|------|-------------|------------|
| **read_file** | Returns full contents of a file. Always read files before editing. | uri, start_line, end_line, page_number |
| **ls_dir** | Lists all files and folders in a given URI. | uri, page_number |
| **get_dir_tree** | Returns a tree diagram of all files and folders in a folder. Excellent for learning codebase structure. | uri |
| **search_pathnames_only** | Returns all pathnames matching a query (searches ONLY file names). | query, include_pattern, page_number |
| **search_for_files** | Returns list of file names whose content matches a query (substring or regex). | query, search_in_folder, is_regex, page_number |
| **search_in_file** | Returns array of start line numbers where content appears in a file. | uri, query, is_regex |
| **read_lint_errors** | View all lint errors on a file. | uri |

### 1.2 Editing Tools (Create/Delete/Modify)

| Tool | Description | Parameters |
|------|-------------|------------|
| **create_file_or_folder** | Create file or folder. Folders end with '/', files have extensions. | uri |
| **delete_file_or_folder** | Delete file or folder at given path. | uri, is_recursive |
| **edit_file** | Edit file content. old_string MUST be unique with surrounding context. | uri, old_string, new_string, replace_all |
| **rewrite_file** | Replace entire file content. Slow - prefer edit_file. | uri, new_content |

### 1.3 Terminal Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| **run_command** | Runs terminal command, waits for result (times out after 8s inactivity). | command, cwd |
| **run_persistent_command** | Runs command in persistent terminal (results after 5s, continues in background). | command, persistent_terminal_id |
| **open_persistent_terminal** | Opens terminal indefinitely (e.g., npm run dev). | cwd |
| **kill_persistent_terminal** | Interrupts and closes persistent terminal. | persistent_terminal_id |

---

## 2. Current Problems & Issues

### 2.1 Critical Issues Summary

| Issue | Frequency | Impact | Root Cause |
|-------|-----------|--------|------------|
| File edits not applied | ~15% | Critical | No verification after edit_file |
| Files created in wrong directory | Common | High | No mandatory directory inspection |
| No workspace awareness at startup | Always | High | No startup protocol enforced |
| Freezing on vague requests | Common | Medium | No clarification protocol |
| Mode transitions unclear | Occasional | Medium | Plan mode doesn't enforce switch |
| old_string not unique | ~10% | Medium | Instructions not strict enough |
| No absolute path usage | Common | High | Path construction rules missing |

### 2.2 Detailed Problem Analysis

#### Problem 1: File Editing Failures (~15%)

**Symptoms**:
- Agent reports "edited" but file content unchanged
- Diff shows in chat but actual file not modified
- User sees "Success" but changes don't persist

**Root Cause**:
```
editCodeService.ts was calling _instantlyApplySRBlocks() instead of instantlyApplyOpenCodeEdit()
```

**Status**: Fixed 2025-01-13 (from memory bank), but agent still doesn't verify

**Current Agent Behavior**:
```
1. user: "add return type to function"
2. agent: edit_file(...)
3. agent: "File edited successfully"
4. user: opens file - NO CHANGES
```

**Required Behavior**:
```
1. user: "add return type to function"
2. agent: read_file → edit_file → read_file
3. agent: "SUCCESS: File X modified, lines Y-Z changed"
4. user: opens file - CHANGES PRESENT
```

---

#### Problem 2: File Creation in Wrong Directory

**Symptoms**:
- Agent creates `Button.tsx` in project root instead of `src/components/ui/Button.tsx`
- Agent creates files in completely wrong project or path

**Root Cause**:
- No mandatory `get_dir_tree` before file creation
- No path construction rules with workspace root
- Instructions are advisory ("Always inspect") not mandatory ("MUST inspect")

**Current Agent Behavior**:
```
user: "create Button component"
agent: create_file_or_folder({uri: "Button.tsx"})
Result: /Users/user/project/Button.tsx (wrong!)
```

**Required Behavior**:
```
user: "create Button component"
agent: get_dir_tree({uri: "/Users/user/project/src/components/"})
agent: create_file_or_folder({uri: "/Users/user/project/src/components/ui/"})
agent: create_file_or_folder({uri: "/Users/user/project/src/components/ui/Button.tsx"})
agent: rewrite_file({uri: "/Users/user/project/src/components/ui/Button.tsx", ...})
agent: read_file({uri: "/Users/user/project/src/components/ui/Button.tsx"})
agent: "SUCCESS: Created /Users/user/project/src/components/ui/Button.tsx"
```

---

#### Problem 3: No Startup Protocol

**Symptoms**:
- Agent doesn't know project structure before starting
- Agent creates files with relative paths like "src/utils/helper.ts"
- Agent works in wrong directory

**Root Cause**:
- No "STARTUP PROTOCOL" section in prompts
- Agent doesn't automatically read workspace root

**Required Startup Sequence**:
```
1. agent: get_dir_tree({uri: "/Users/user/project/"})
2. agent: "Working directory: /Users/user/project/
          Structure:
          - src/
          - package.json
          - README.md"
3. All file paths use: /Users/user/project/ + relative
```

---

#### Problem 4: Freezing on Vague Requests

**Symptoms**:
- Agent creates random files when user says "make site better"
- Agent creates unrelated code when request is unclear
- No clarification before action

**Root Cause**:
- No "REQUEST CLARIFICATION PROTOCOL"
- Agent tries to interpret vague requests instead of asking

**Current Behavior**:
```
user: "создай сайт" (create a site)
agent: creates random files, unclear what to build
Result: User gets frustrated, files unusable
```

**Required Behavior**:
```
user: "создай сайт"
agent: "Уточните:
        1. Какой тип сайта? (лендинг, блог, веб-приложение, API?)
        2. Какие технологии? (React, Vue, Node.js?)
        3. Есть ли структура проекта?
        4. Какие файлы нужно создать?"
user: "React лендинг с Hero секцией"
agent: (now has clear direction)
```

---

#### Problem 5: Mode Transition Issues

**Symptoms**:
- Agent in Plan mode tries to edit files
- User doesn't know when to switch modes
- Agent says "suggest" instead of "command" switch

**Root Cause**:
- Plan mode says "ask user to switch" but doesn't enforce
- "Please switch to Agent mode" is too soft
- No clear consequences of wrong mode

**Current Plan Mode Response**:
```
user: "создай компонент"
agent: (in Plan mode)
"I suggest you switch to Agent mode..."
```

**Required Plan Mode Response**:
```
user: "создай компонент"
agent: (in Plan mode)
"## Analysis Complete
Files examined: [...]

Plan:
1. Create Button.tsx in src/components/
2. Add React.FC<ButtonProps> type
3. Add onClick handler

I CANNOT EDIT FILES IN PLAN MODE.
Please switch to AGENT MODE so I can implement these changes."
```

---

#### Problem 6: old_string Not Unique

**Symptoms**:
- "multiple matches" errors from edit_file
- Agent gives up or edits wrong location
- Agent tries same old_string repeatedly

**Root Cause**:
- Instructions say "include enough context" but don't show examples
- No clear pattern for uniqueness

**Current Behavior**:
```
agent: edit_file({old_string: "const add = (a, b) =>"})
Error: multiple matches
agent: (gives up or tries same)
```

**Required Behavior**:
```
agent: edit_file({
  old_string: `// Math helpers section
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;`,
  new_string: `// Math helpers section
const add = (a: number, b: number): number => a + b;
const multiply = (a: number, b: number): number => a * b;`
})
SUCCESS
```

---

#### Problem 7: No Absolute Paths

**Symptoms**:
- Agent uses relative paths
- Agent creates files in wrong directory
- Different behavior in different contexts

**Root Cause**:
- No "PATH CONSTRUCTION RULES" section
- No examples of correct vs incorrect paths

**Current Behavior**:
```
agent: create_file_or_folder({uri: "utils/helper.ts"})
Result: unpredictable location
```

**Required Behavior**:
```
agent: create_file_or_folder({uri: "/Users/user/project/src/utils/helper.ts"})
Result: /Users/user/project/src/utils/helper.ts
```

---

## 3. Plan to Fix All Issues

### Phase 1: Core Protocol Overhaul (Week 1)

- [ ] Add STARTUP PROTOCOL to prompts.ts
- [ ] Add FILE CREATION WORKFLOW with mandatory inspection
- [ ] Add EDIT PROTOCOL with mandatory verification
- [ ] Add PATH CONSTRUCTION RULES
- [ ] Add REQUEST CLARIFICATION PROTOCOL
- [ ] Add MODE TRANSITION ENFORCEMENT

### Phase 2: Examples & Templates (Week 2)

- [ ] Add 5+ correct examples for file creation
- [ ] Add 5+ correct examples for editing
- [ ] Add examples of unique old_string
- [ ] Add examples of vague request handling
- [ ] Add template responses for each mode

### Phase 3: Testing & Validation (Week 3)

- [ ] Create test cases for each protocol
- [ ] Verify 95%+ success rate on file operations
- [ ] Test mode transitions
- [ ] Test clarification protocol

### Phase 4: Documentation (Week 4)

- [ ] Update agent documentation
- [ ] Create user guide for mode usage
- [ ] Document all tool behaviors

---

## 4. Implementation Details

### 4.1 STARTUP PROTOCOL

```markdown
## STARTUP PROTOCOL - REQUIRED BEFORE ANY ACTION

Upon first interaction:

1. READ workspace root structure:
   <get_dir_tree>
   <uri>/Users/user/project/</uri>
   </get_dir_tree>

2. CONFIRM working directory:
   "Working directory: /Users/user/project/
    Files: src/, package.json, README.md"

3. FOR ALL file operations:
   - Use absolute paths: /Users/user/project/src/file.ts
   - NEVER use relative paths
   - ALWAYS construct: workspaceRoot + relativePath
```

### 4.2 FILE CREATION WORKFLOW

```markdown
## FILE CREATION - STRICT REQUIREMENTS

1. INSPECT target directory:
   <get_dir_tree>
   <uri>/Users/user/project/src/components/</uri>
   </get_dir_tree>

2. VERIFY parent directories exist:
   If not found, create level by level:
   <create_file_or_folder>
   <uri>/Users/user/project/src/components/ui/</uri>
   </create_file_or_folder>

3. CREATE file with extension:
   <create_file_or_folder>
   <uri>/Users/user/project/src/components/ui/Button.tsx</uri>
   </create_file_or_folder>

4. WRITE content:
   <rewrite_file>
   <uri>/Users/user/project/src/components/ui/Button.tsx</uri>
   <new_content>...code...</new_content>
   </rewrite_file>

5. VERIFY:
   <read_file>
   <uri>/Users/user/project/src/components/ui/Button.tsx</uri>
   </read_file>

## CORRECT EXAMPLES:
- /Users/user/project/src/components/ui/Button.tsx
- /Users/user/project/src/utils/helpers.ts
- /Users/user/project/package.json

## INCORRECT EXAMPLES:
- "components/ui/Button.tsx" (relative)
- "src/components/ui" (no extension)
- "Button.tsx" (no path)
```

### 4.3 EDIT PROTOCOL

```markdown
## EDIT PROTOCOL - REQUIRED VERIFICATION

1. READ before editing:
   <read_file>
   <uri>/Users/user/project/src/utils.ts</uri>
   </read_file>

2. EDIT with unique old_string:
   <edit_file>
   <uri>/Users/user/project/src/utils.ts</uri>
   <old_string>// Math helpers
const add = (a, b) => a + b;</old_string>
   <new_string>// Math helpers
const add = (a: number, b: number): number => a + b;</new_string>
   </edit_file>

3. VERIFY after editing:
   <read_file>
   <uri>/Users/user/project/src/utils.ts</uri>
   </read_file>

4. REPORT success/failure:
   - "SUCCESS: src/utils.ts:2 - добавлена типизация"
   - "FAILED: old_string not found, retrying..."

## old_string UNIQUENESS RULES:
- WRONG: "const add = (a, b) =>" (too short, multiple matches)
- CORRECT: "export class Calculator {\n  const add = (a, b) => {\n    return a + b;\n  }\n}"
```

### 4.4 REQUEST CLARIFICATION PROTOCOL

```markdown
## REQUEST CLARIFICATION PROTOCOL

When request is ambiguous:

### Examples:

user: "создай сайт"

agent: "Уточните:
1. Тип сайта? (лендинг, блог, веб-приложение, API?)
2. Технологии? (React, Vue, Node.js?)
3. Структура проекта?
4. Какие файлы создать?"

---

user: "исправь баг"

agent: "Нужен контекст:
1. Где баг? (файл, функция?)
2. Ожидаемое поведение?
3. Текущее поведение?
4. Error message?"

---

user: "добавь авторизацию"

agent: "Какой тип?
- JWT токены?
- OAuth (Google, GitHub)?
- Сессии?

Какие файлы затронуть?"
```

### 4.5 MODE TRANSITION ENFORCEMENT

```markdown
## MODE RULES - STRICT ENFORCEMENT

### PLAN MODE:
CAN: read_file, get_dir_tree, ls_dir, search_in_file, search_pathnames_only
CANNOT: create_file_or_folder, edit_file, rewrite_file, run_command

Response when user asks to edit:
"## Analysis Complete

Files examined: [...]

Plan:
1. Create Button.tsx in src/components/
2. Add React.FC<ButtonProps> type
3. Add onClick handler

I CANNOT EDIT FILES IN PLAN MODE.
Please switch to AGENT MODE to implement these changes."

### ASK MODE:
CANNOT: use ANY tools
Response: "I cannot access files in ASK mode. Switch to PLAN or AGENT mode."

### AGENT MODE:
CAN: use ALL tools (read, edit, create, run)
```

---

## 5. Examples of Correct Behavior

### Example 1: Complete File Creation

```markdown
user: создай компонент Button в src/components/ui/

agent: <get_dir_tree>
<uri>/Users/user/project/src/components/</uri>
</get_dir_tree>

Response: "Button.tsx, Card.tsx"

agent: <create_file_or_folder>
<uri>/Users/user/project/src/components/ui/</uri>
</create_file_or_folder>

agent: <create_file_or_folder>
<uri>/Users/user/project/src/components/ui/Button.tsx</uri>
</create_file_or_folder>

agent: <rewrite_file>
<uri>/Users/user/project/src/components/ui/Button.tsx</uri>
<new_content>import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};
</new_content>
</rewrite_file>

agent: <read_file>
<uri>/Users/user/project/src/components/ui/Button.tsx</uri>
</read_file>

agent: SUCCESS: создан /Users/user/project/src/components/ui/Button.tsx (14 строк)
```

### Example 2: Complete Edit with Verification

```markdown
user: добавь типизацию в calculateTax в src/utils.ts

agent: <read_file>
<uri>/Users/user/project/src/utils.ts</uri>
</read_file>

Response: "export const calculateTax = (amount, rate) => amount * rate / 100;"

agent: 
<uri>/Users/user/project/src/utils.ts</uri>
<old_string>export const calculateTax = (amount, rate) => amount * rate / 100;</old_string>
<new_string>export const calculateTax = (amount: number, rate: number): number => 
  amount * rate / 100;</new_string>
</edit_file>

agent: <read_file>
<uri>/Users/user/project/src/utils.ts</uri>
</read_file>

agent: SUCCESS: src/utils.ts:1 — добавлена типизация (amount: number, rate: number): number
```

### Example 3: Error Recovery

```markdown
agent: 
<uri>/Users/user/project/src/utils.ts</uri>
<old_string>const add = (a, b) => a + b;</old_string>
<new_string>const add = (a: number, b: number): number => a + b;</new_string>
</edit_file>

Response: ERROR: multiple matches

agent: <read_file>
<uri>/Users/user/project/src/utils.ts</uri>
</read_file>

agent: 
<uri>/Users/user/project/src/utils.ts</uri>
<old_string>// Math helpers
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;</old_string>
<new_string>// Math helpers
const add = (a: number, b: number): number => a + b;
const multiply = (a: number, b: number): number => a * b;</new_string>
</edit_file>

agent: SUCCESS: src/utils.ts:2-3 — добавлена типизация для add и multiply
```

### Example 4: Vague Request Handling

```markdown
user: сделай сайт лучше

agent: "Уточните, что именно улучшить:
1. UI/UX дизайн?
2. Производительность?
3. Функциональность?
4. Код качество?

Конкретные области:
- Навигация?
- Стили?
- Скорость загрузки?
- Баги?"

user: добавь красивую анимацию при загрузке

agent: <get_dir_tree>
<uri>/Users/user/project/src/</uri>
</get_dir_tree>

agent: (proceeds with specific request)
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
| run_persistent_command | ❌ | ❌ | ✅ |
| open_persistent_terminal | ❌ | ❌ | ✅ |
| kill_persistent_terminal | ❌ | ❌ | ✅ |
| MCP Tools | Read-only | ❌ | ✅ Full |

---

## 7. Checklist for Every Action

### File Creation Checklist
- [ ] Inspect target directory with get_dir_tree
- [ ] Verify/create parent directories
- [ ] Use absolute path with extension
- [ ] Use create_file_or_folder then rewrite_file
- [ ] Verify with read_file
- [ ] Report success with file path and line count

### File Edit Checklist
- [ ] Read file with read_file
- [ ] Use unique old_string (5+ lines context)
- [ ] Edit with edit_file
- [ ] Verify with read_file
- [ ] Report success/failure with details

### Mode Transition Checklist
- [ ] Plan mode: Read-only, ask user to switch
- [ ] Ask mode: No tools, explain limitation
- [ ] Agent mode: Full tool access

### Request Handling Checklist
- [ ] Request clear? → Proceed
- [ ] Request vague? → Ask clarification
- [ ] Mode correct? → Proceed
- [ ] Mode wrong? → Enforce transition

---

## 8. Expected Outcomes

### After Phase 1 Implementation:
- **File creation success rate**: 95%+ (was ~70%)
- **File edit success rate**: 99%+ (was ~85%)
- **Correct directory usage**: 100%
- **Startup awareness**: 100%

### After Phase 2 Implementation:
- **Clarification for vague requests**: 100%
- **Unique old_string usage**: 95%+
- **Mode compliance**: 100%

### After Phase 3+4:
- **Overall agent stability**: 95%+
- **User satisfaction**: Significantly improved
- **Task completion rate**: 95%+

---

## 9. Files to Modify

1. `src/vs/workbench/contrib/void/common/prompt/prompts.ts`
   - Add STARTUP PROTOCOL
   - Add FILE CREATION WORKFLOW
   - Add EDIT PROTOCOL
   - Add REQUEST CLARIFICATION PROTOCOL
   - Enhance MODE TRANSITION rules

2. `src/vs/workbench/contrib/void/electron-main/toolsService.ts`
   - Add verification logging
   - Add path validation

3. `src/vs/workbench/contrib/void/browser/editCodeService.ts`
   - Add success/failure reporting
   - Add verification calls

---

## 10. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| File edit success rate | 85% | 99% |
| File creation success rate | 70% | 95% |
| Correct directory usage | 50% | 100% |
| Mode compliance | 80% | 100% |
| Clarification on vague requests | 0% | 100% |
| Verification after edits | 0% | 100% |
| Startup directory awareness | 0% | 100% |

---

**Document Status**: Complete Analysis & Planning
**Next Action**: Phase 1 Implementation
**Estimated Timeline**: 2-3 weeks for full implementation