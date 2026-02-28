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

## Изменённые файлы

### 1. НОВЫЙ: `src/vs/workbench/contrib/void/common/hashlineService.ts`

Ядро системы. Все функции без зависимостей.

**Экспорты:**
- `hashLine(line: string): string` — djb2 хеш, 3 hex символа (4096 вариантов)
- `annotateWithHashes(content: string): string` — возвращает `"1:a3f|code"`
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
import { applyHashlineEdit, extractOriginalBlock, isHashlineError } from '../common/hashlineService.js';
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

**`read_file` callTool** — файл теперь аннотируется хешами перед отправкой AI:
```typescript
const annotated = annotateWithHashes(contents)
// fileContents теперь: "1:a3f|import React...\n2:b1c|\n3:0e2|function App() {"
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

**`read_file` tool description** — объяснён формат хешей:
```
Returns file contents with hash annotations for precise editing.
Each line is prefixed: "lineNumber:hash|content" (e.g. "15:a3f|const x = 5;").
Use the hash references with edit_file (from_hash/to_hash) — no text reproduction needed.
```

**`edit_file` tool description** — полная документация hashline режима:
```
HASHLINE MODE (preferred):
edit_file({ uri, from_hash: "15:a3f", to_hash: "17:cd1", new_content: "code" })
LEGACY FALLBACK: edit_file({ uri, old_string: "5+ unique lines", new_string: "new" })
```

**`agentSystemMessageText`** — добавлено объяснение hashline workflow:
```
# HASHLINE EDIT SYSTEM (use this for all edits)
read_file returns lines with hash annotations: "15:a3f|const x = 5;"
Use from_hash + to_hash — no text reproduction needed.
```

**`toolCallXMLGuidelines`** — то же для XML tool mode.

**`chat_systemMessage` agent mode** — обновлён EDIT FILE protocol.

---

### 7. ИЗМЕНЁН: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

`edit_file` resultWrapper обновлён для поддержки обоих режимов.
Читает `from_hash/fromHash` и `to_hash/toHash` (snake_case и camelCase) из params.

**Статус UI**: Файл редактируется корректно, UI отображение diff — минорная проблема (показывает `null null` в legacy ветке когда параметры hashline). Это косметическая проблема, не влияет на работу системы. UI будет доработан отдельно.

---

## Архитектура pipeline

```
AI получает read_file → видит "15:a3f|const x = 5;"
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

2. **start_line / end_line в read_file** — при частичном чтении файла (с `start_line`) хеши остаются правильными (номера строк соответствуют реальным), но AI должен учитывать что видит только часть файла.

3. **Большие файлы** — аннотация хешами увеличивает размер файла ~20% (6 символов на строку). При 1000 строк = ~1750 токенов дополнительно. Приемлемо.
