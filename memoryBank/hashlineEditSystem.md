# Hashline Edit System — Implementation Log

## Концепция (оригинал Бёлюка)

Вместо того чтобы AI воспроизводил старый текст дословно — каждая строка файла получает короткий хеш.
AI адресует строки по хешу, а не по тексту.

```
1:a3f|function hello() {
2:f1c|  return "world";
3:0e2|}
```

AI говорит: `REPLACE 2:f1c → новый код`. Система находит строку по хешу, верифицирует, применяет.

**Ключевые свойства:**
- Модель не угадывает текст — просто ссылается на `"15:a3f"`
- Нет проблем с пробелами и отступами
- Если файл изменился — хеш не совпадёт → ошибка возвращается AI с инструкцией перечитать файл
- Разделение ответственности: модель думает о логике, инструмент думает о механике

---

## Статус реализации

**✅ РЕАЛИЗОВАНО И РАБОТАЕТ** — подтверждено логами от 2026-02-28

Из логов видно:
```
🔧 [HASHLINE] edit_file hashline mode: 9:5d8 → 9:5d8
🔧 [HASHLINE] instantlyApplyHashlineEdit called
🔧 [HASHLINE] Replacement applied. Original length: 250 → New length: 526
🔧 [EDLIDE WRITE] Needs write check: YES - content differs
🔧 [EDLIDE WRITE] Applying edits to model...
🔧 [HASHLINE] instantlyApplyHashlineEdit completed successfully
[text file model] doSave(1) - before write() → file saved to disk
```

AI (GLM-5-TEE) самостоятельно использовал hashline режим:
```xml
<edit_file>
<uri>/path/to/utils.ts</uri>
<from_hash>9:5d8</from_hash>
<to_hash>9:5d8</to_hash>
<new_content>}
...new code...
</new_content>
</edit_file>
```

Файл успешно изменён (250 → 526 chars), сохранён на диск.

---

## Исправленные баги (2026-03-01)

### Баг 1: Неправильная нумерация строк при частичном чтении (КРИТИЧЕСКИЙ)

**Проблема**: При `read_file({ start_line: 22 })` функция `annotateWithHashes` нумеровала строки с 1.
AI получал `"1:a3f|..."` для строки 22, а `edit_file` искал `"22:a3f"` в полном файле → hash mismatch всегда.

**Симптом из логов**:
```
[lines 22:6de → 26:475]   ← первый read_file
[lines 22:ae1 → 42:5f8]   ← второй read_file (полный файл)
```
При частичном чтении хеш строки 22 показывался как `"1:6de"` — номер строки неверный.

**Исправление в `hashlineService.ts`**:
```typescript
// БЫЛО:
export function annotateWithHashes(content: string): string {
    const lines = content.split('\n')
    return lines.map((line, i) => `${i + 1}:${hashLine(line)}|${line}`).join('\n')
}

// СТАЛО — добавлен startLineOffset:
export function annotateWithHashes(content: string, startLineOffset = 1): string {
    const lines = content.split('\n')
    return lines.map((line, i) => `${i + startLineOffset}:${hashLine(line)}|${line}`).join('\n')
}
```

**Исправление в `toolsService.ts`** — `read_file` callTool:
```typescript
// БЫЛО:
const annotated = annotateWithHashes(contents)

// СТАЛО — передаём реальный номер первой строки:
let annotationStartLine = 1
if (startLine !== null || endLine !== null) {
    const startLineNumber = startLine === null ? 1 : startLine
    annotationStartLine = startLineNumber  // строки нумеруются с реального offset
}
const annotated = annotateWithHashes(contents, annotationStartLine)
```

---

### Баг 2: Пагинация обрезала хеши посимвольно

**Проблема**: Старый код пагинации резал аннотированный текст посимвольно:
```typescript
const fileContents = annotated.slice(fromIdx, toIdx + 1)
```
Строка `"22:a3f|const x = 5;"` могла быть обрезана до `"22:a"` — AI получал неполный хеш.

**Симптом из логов**: `[lines ae1 → 5f8]` — вообще без номера строки (строка обрезана так что осталось только `"ae1|..."` без `"22:"`).

**Исправление в `toolsService.ts`** — пагинация по целым строкам:
```typescript
// БЫЛО (символьная пагинация — обрезает строки):
const fromIdx = MAX_FILE_CHARS_PAGE * (pageNumber - 1)
const toIdx = MAX_FILE_CHARS_PAGE * pageNumber - 1
const fileContents = annotated.slice(fromIdx, toIdx + 1)

// СТАЛО (страничная пагинация по строкам):
const annotatedLines = annotated.split('\n')
const totalPages = Math.max(1, Math.ceil(annotated.length / MAX_FILE_CHARS_PAGE))
const linesPerPage = Math.ceil(annotatedLines.length / totalPages)
const pageStart = (pageNumber - 1) * linesPerPage
const pageEnd = pageNumber * linesPerPage
const fileContents = annotatedLines.slice(pageStart, pageEnd).join('\n')
const hasNextPage = pageEnd < annotatedLines.length
```

---

### Баг 3: AI вставлял хеш-аннотации в new_content (2026-03-01)

**Проблема**: AI иногда копировал аннотированные строки целиком в `new_content`, включая `"lineNum:hash|"` префикс:
```
132:7b9|| Ultra       | `pro`         | `pdt_0NX7uQKJc1elOk1df38G7` | $34.99  | 5,000       |
```
В результате в файл записывалось `"132:7b9|| Ultra..."` вместо `"| Ultra..."`.

**Исправление в `editCodeService.ts`**:
```typescript
// Добавлен импорт:
import { applyHashlineEdit, extractOriginalBlock, isHashlineError, stripHashAnnotations } from '../common/hashlineService.js';

// В instantlyApplyHashlineEdit() перед применением:
// Strip hash annotations from newContent in case AI accidentally included them
// e.g. "132:7b9|| Ultra..." → "| Ultra..."
const cleanNewContent = stripHashAnnotations(newContent)

// Далее используется cleanNewContent вместо newContent:
const newCode = applyHashlineEdit(modelStr, fromHash, toHash, cleanNewContent)
const searchReplaceBlocks = `<<<<<<< ORIGINAL\n${originalBlock}\n=======\n${cleanNewContent}\n>>>>>>> UPDATED`
```

`stripHashAnnotations` уже существовала в `hashlineService.ts` — просто не использовалась в этом месте. Убирает только строки где префикс совпадает с паттерном `^\d+:[0-9a-f]{3}$`, остальное не трогает.

---

### Баг 4: AI дублировал граничные строки блока в new_content (2026-03-01)

**Проблема**: AI неправильно понимал семантику `from_hash` — думал что это "точка вставки", а не "начало заменяемого блока". В результате включал граничную строку в `new_content`, хотя она уже была в файле:

```
Файл:                          AI отправил new_content:
    id: 'ultra',           →       id: 'ultra',     ← дубликат!
    name: 'Ultra',                 id: 'ultra',
    price: 34.99,                  name: 'Ultra',
                                   price: 34.99,

Результат в файле:
    id: 'ultra',    ← оригинальная (not replaced)
    id: 'ultra',    ← из new_content
    name: 'Ultra',
```

**Важно**: алгоритм `applyHashlineEdit` в `hashlineService.ts` был правильным с самого начала — баг только поведенческий (AI неправильно формировал `new_content`).

**Исправление — `prompts.ts`**, 3 места:

`edit_file` description:
```
REPLACEMENT RULE: new_content FULLY REPLACES lines from_hash..to_hash (inclusive).
Do NOT repeat from_hash/to_hash lines inside new_content — they are removed automatically.
WRONG: from_hash line is "id: 'ultra'", new_content starts with "id: 'ultra'," → DUPLICATE!
RIGHT: new_content contains only the new code that should appear instead.
```

`agentSystemMessageText`:
```
REPLACEMENT RULE: new_content FULLY REPLACES lines from_hash..to_hash (inclusive).
Do NOT repeat from_hash/to_hash lines inside new_content — they are removed automatically.
WRONG: from_hash="id: 'ultra'", new_content="id: 'ultra',\nname: 'Ultra'," → DUPLICATE!
RIGHT: new_content = only the new code that replaces the addressed block.
```

`toolCallXMLGuidelines` — аналогично.

Также обновлены описания параметров `from_hash`, `to_hash`, `new_content`:
```
from_hash: Lines from_hash..to_hash are REMOVED and replaced by new_content.
           Do NOT repeat these lines in new_content.
new_content: Replacement that substitutes lines from_hash..to_hash.
             Do NOT include the from_hash line at the start unless you intend to keep it.
```

---

### Изменения промптов для принудительного re-read (2026-03-01)

**Проблема**: AI после успешного `edit_file` не перечитывал файл и использовал старые хеши для следующего редактирования → hash mismatch.

**Решение 1 — `toolsService.ts` `stringOfResult.edit_file`**:
Результат инструмента теперь содержит явную инструкцию для AI:
```typescript
// Hashline mode:
`REQUIRED NEXT STEP: Call read_file({ uri: "...", start_line: N-2, end_line: M+5 }) — hashes have changed after this edit`

// Legacy mode:
`NEXT STEP: Call read_file({ uri: "..." }) to verify changes and get updated line hashes`
```

**Решение 2 — `prompts.ts`** — 4 места обновлены:
- `edit_file` description: шаг 3 теперь `REQUIRED` с `start_line`/`end_line`
- `agentSystemMessageText`: шаг 3 `MANDATORY` с формулой `fromLine-2` / `toLine+5`
- `toolCallXMLGuidelines`: аналогично
- `chat_systemMessage` agent section: добавлены строки про hash mismatch и re-read

---

## Изменённые файлы

### 1. НОВЫЙ: `src/vs/workbench/contrib/void/common/hashlineService.ts`

Ядро системы. Все функции без зависимостей.

**Экспорты:**
- `hashLine(line: string): string` — djb2 хеш, 3 hex символа (4096 вариантов)
- `annotateWithHashes(content: string, startLineOffset = 1): string` — возвращает `"N:a3f|code"` с правильными номерами строк
- `stripHashAnnotations(annotated: string): string` — убирает аннотации
- `parseHashRef(ref: string)` — парсит `"15:a3f"` → `{ lineNum, hash }`
- `verifyHashRef(content, ref)` — верифицирует хеш, возвращает строку или `{ error }`
- `applyHashlineEdit(content, fromHash, toHash, newContent)` — применяет замену
- `extractOriginalBlock(content, fromHash, toHash)` — извлекает оригинальный блок (для UI diff)
- `isHashlineError(value)` — type guard

**Алгоритм хеша (djb2):**
```typescript
function hashLine(line: string): string {
  let h = 5381
  for (let i = 0; i < line.length; i++) {
    h = ((h << 5) + h) ^ line.charCodeAt(i)
  }
  return ((h >>> 0) % 0x1000).toString(16).padStart(3, '0')
}
```

**Верификация при hash mismatch:**
Если файл изменился между `read_file` и `edit_file` → возвращает:
```
"Hash mismatch at line 15: expected hash "a3f" but got "b2c". The file has changed since you last read it. Use read_file to get fresh content."
```

---

### 2. ИЗМЕНЁН: `src/vs/workbench/contrib/void/browser/editCodeService.ts`

**Добавлен импорт:**
```typescript
import { applyHashlineEdit, extractOriginalBlock, isHashlineError, stripHashAnnotations } from '../common/hashlineService.js';
```

**Добавлен метод `instantlyApplyHashlineEdit()`:**
```typescript
public instantlyApplyHashlineEdit({ uri, fromHash, toHash, newContent }) {
  // 1. Получает содержимое модели
  // 2. Извлекает оригинальный блок (для UI diff)
  // 3. Применяет applyHashlineEdit() — находит строки по хешам
  // 4. При HashlineError → throws с понятным сообщением для AI
  // 5. Запускает _startStreamingDiffZone() + _writeURIText() — пишет в файл
  // 6. Вызывает onDone() → обновляет UI diff zones
}
```

Метод находится рядом с `instantlyApplyOpenCodeEdit()` (~line 1367).

---

### 3. ИЗМЕНЁН: `src/vs/workbench/contrib/void/browser/editCodeServiceInterface.ts`

Добавлен в интерфейс `IEditCodeService`:
```typescript
instantlyApplyHashlineEdit(opts: { uri: URI; fromHash: string; toHash: string; newContent: string }): string | undefined;
```

---

### 4. ИЗМЕНЁН: `src/vs/workbench/contrib/void/browser/toolsService.ts`

**Добавлен импорт:**
```typescript
import { annotateWithHashes } from '../common/hashlineService.js'
```

**`read_file` callTool** — исправлены два бага:

1. Правильный offset нумерации при частичном чтении:
```typescript
let annotationStartLine = 1
if (startLine !== null || endLine !== null) {
    annotationStartLine = startLine === null ? 1 : startLine
}
const annotated = annotateWithHashes(contents, annotationStartLine)
// При start_line=22: "22:a3f|code" а не "1:a3f|code"
```

2. Пагинация по целым строкам:
```typescript
const annotatedLines = annotated.split('\n')
const totalPages = Math.max(1, Math.ceil(annotated.length / MAX_FILE_CHARS_PAGE))
const linesPerPage = Math.ceil(annotatedLines.length / totalPages)
const pageStart = (pageNumber - 1) * linesPerPage
const pageEnd = pageNumber * linesPerPage
const fileContents = annotatedLines.slice(pageStart, pageEnd).join('\n')
```

**`stringOfResult.edit_file`** — добавлена инструкция re-read:
```typescript
// Hashline mode: вычисляет диапазон из fromHash/toHash и требует read_file
readBackInstruction = `REQUIRED NEXT STEP: Call read_file({ uri, start_line: ${startLine}, end_line: ${endLine} }) — hashes have changed`
```

**`edit_file` validateParams** — поддержка обоих режимов:
```typescript
// Hashline mode (from_hash + to_hash + new_content):
return { uri, fromHash, toHash, newContent, oldString: null, newString: null, replaceAll: false }

// Legacy mode (old_string + new_string):
return { uri, fromHash: null, toHash: null, newContent: null, oldString, newString, replaceAll }
```

**`edit_file` callTool** — роутинг:
```typescript
if (fromHash !== null && toHash !== null && newContent !== null) {
  // Hashline path — точное нахождение по хешу
  editCodeService.instantlyApplyHashlineEdit({ uri, fromHash, toHash, newContent })
} else if (oldString !== null && newString !== null) {
  // Legacy path — 9-level fuzzy matching (fallback)
  editCodeService.instantlyApplyOpenCodeEdit({ uri, oldString, newString, replaceAll })
}
```

---

### 5. ИЗМЕНЁН: `src/vs/workbench/contrib/void/common/toolsServiceTypes.ts`

Тип `BuiltinToolCallParams['edit_file']` расширен:
```typescript
'edit_file': {
  uri: URI,
  fromHash: string | null,    // hashline mode
  toHash: string | null,
  newContent: string | null,
  oldString: string | null,   // legacy mode
  newString: string | null,
  replaceAll: boolean,
},
```

---

### 6. ИЗМЕНЁН: `src/vs/workbench/contrib/void/common/prompt/prompts.ts`

**Изменения (2026-03-01, сессия 2):**

1. **Удалён `createOpenCodeToolCalls_systemMessage`** — старая система с `old_string/new_string` убрана полностью. Заменена минимальным `searchReplaceApply_systemMessage` только для fast apply pipeline.

2. **`searchReplaceGivenDescription_systemMessage`** теперь ссылается на `searchReplaceApply_systemMessage`.

3. **Убраны все `LEGACY FALLBACK`** с `old_string/new_string` из:
   - `agentSystemMessageText`
   - `toolCallXMLGuidelines`
   - `chat_systemMessage` agent details (строка FALLBACK с old_string)

4. **Упрощён `edit_file` description** — только hashline, без LEGACY MODE секции в основном тексте. Params `old_string/new_string` сохранены (нужны для парсинга).

5. **Добавлена секция `# HASHLINE EXAMPLES`** в `agentSystemMessageText` и `toolCallXMLGuidelines` — 4 примера с реальными хешами:
   - Example 1: замена одной строки
   - Example 2: замена блока строк
   - Example 3: вставка строк после N
   - Example 4: удаление блока
   - WRONG vs RIGHT — явный запрет на `old_string/new_string` когда есть хеши

6. **Добавлена секция `# CODE QUALITY — NEVER WRITE DUPLICATES`** в `agentSystemMessageText` и `toolCallXMLGuidelines`:
   ```
   WRONG: duplicate object key — { 'pro': 34.99, 'pro': 34.99 }
   WRONG: duplicate variable — const x = 1; ... const x = 2;
   WRONG: duplicate interface — interface Foo {} ... interface Foo {}
   RIGHT: if the name exists → edit the existing declaration, never add a second one.
   ```

**`read_file` tool description** — объяснён формат хешей:
```
Returns file contents with hash annotations for precise editing.
Each line is prefixed: "lineNumber:hash|content" (e.g. "15:a3f|const x = 5;").
Use the hash references with edit_file (from_hash/to_hash) — no text reproduction needed.
```

**`edit_file` tool description** — только hashline, без legacy секции:
```
WORKFLOW:
1. read_file({ uri })  // get hashes
2. edit_file({ uri, from_hash: "15:a3f", to_hash: "17:cd1", new_content: "replacement" })
3. read_file({ uri, start_line: 13, end_line: 22 })  // REQUIRED after every edit
HASH MISMATCH: call read_file to get fresh hashes.
```

**`agentSystemMessageText`** и **`toolCallXMLGuidelines`** — добавлены примеры hashline + CODE QUALITY правила.

---

### 7. ИЗМЕНЁН: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

`edit_file` resultWrapper обновлён для поддержки обоих режимов.
Читает `from_hash/fromHash` и `to_hash/toHash` (snake_case и camelCase) из params.

**Статус UI**: Файл редактируется корректно, UI отображение diff — минорная проблема (показывает `null null` в legacy ветке когда параметры hashline). Это косметическая проблема, не влияет на работу системы. UI будет доработан отдельно.

---

## Архитектура pipeline

```
AI получает read_file → видит "15:a3f|const x = 5;"  (номера строк = реальные позиции в файле)
    ↓
AI генерирует:
  <edit_file>
  <from_hash>15:a3f</from_hash>
  <to_hash>17:cd1</to_hash>
  <new_content>новый код</new_content>
  </edit_file>
    ↓
toolsService.validateParams.edit_file()
  → видит from_hash + to_hash → hashline mode
  → возвращает { uri, fromHash, toHash, newContent, oldString: null, ... }
    ↓
toolsService.callTool.edit_file()
  → fromHash !== null → hashline path
  → editCodeService.instantlyApplyHashlineEdit()
    ↓
hashlineService.verifyHashRef() → проверяет хеш совпадает
hashlineService.applyHashlineEdit() → заменяет блок строк
    ↓
editCodeService._writeURIText() → пишет в VSCode model
editCodeService.onFinishEdit() → сохраняет на диск
    ↓
✅ Файл сохранён, diff zone обновлён
    ↓
stringOfResult.edit_file() → возвращает AI:
  "REQUIRED NEXT STEP: read_file({ uri, start_line: 13, end_line: 22 })"
    ↓
AI перечитывает изменённый регион → получает новые хеши → готов к следующему edit
```

---

## Что НЕ изменялось

- `edlideCodeApplySystem.ts` — 9-level system сохранена как fallback для old_string
- `rewrite_file` — без изменений
- `extractCodeFromResult.ts` — без изменений (Fast Apply legacy path)
- Все остальные tools — без изменений

---

## Известные проблемы / TODO

1. **UI diff display** — при hashline mode в SidebarChat показывает `null null` вместо diff.
   Причина: React build не пересобран, или params читаются из старого треда.
   Решение: пересобрать React build + доработать SidebarChat.tsx resultWrapper.
   **Не критично** — файлы редактируются корректно, это только визуальный баг в чате.

2. **Большие файлы** — аннотация хешами увеличивает размер файла ~20% (6 символов на строку). При 1000 строк = ~1750 токенов дополнительно. Приемлемо.
