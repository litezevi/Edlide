🎯 OpenCode Edit System Migration Plan for Edlide
📋 Current Project Context
Existing Implementation Status
Edlide уже имеет частичную реализацию 9-уровневой системы:

✅ edlideCodeApplySystem.ts - Полный набор replacer функций (уровни 1-9)
✅ editCodeService.ts - Интеграция с 9-уровневой системой
✅ toolsService.ts - Tool call handling
✅ Проблема: Все вышеперечисленное НЕ ИСПОЛЬЗУЕТСЯ в реальной работе

Current Architecture Flow

AI Response → SEARCH/REPLACE blocks → extractSearchReplaceBlocks() → findTextInCode() → slice() replacement

What Already Exists
9-Level Replacers: Полностью соответствуют OpenCode реализации
ApplyLevel Detection: getApplyLevel() для определения уровня совпадения
Logging Infrastructure: Детальное логирование apply levels
Service Integration: editCodeService готов к использованию edlideReplace()
🔄 OpenCode System Analysis (from MCP investigation)
OpenCode Edit Tool Architecture

// OpenCode использует Tool-based подход:
{
  "filePath": "/absolute/path/to/file",
  "oldString": "exact text to replace",
  "newString": "new text to insert",
  "replaceAll": false
}

OpenCode Replace Function

// ИДЕАЛЬНАЯ реализация - использует 9 уровней progressive fallback:
replace(content: string, oldString: string, newString: string, replaceAll = false): string {
  for (const replacer of [
    SimpleReplacer,           // Level 1: Exact match
    LineTrimmedReplacer,      // Level 2: Trim whitespace
    BlockAnchorReplacer,       // Level 3: First/last anchors
    WhitespaceNormalizedReplacer, // Level 4: Normalize all whitespace
    IndentationFlexibleReplacer,  // Level 5: Ignore indentation
    EscapeNormalizedReplacer,     // Level 6: Handle escapes
    TrimmedBoundaryReplacer,      // Level 7: Trim boundaries
    ContextAwareReplacer,         // Level 8: Context matching
    MultiOccurrenceReplacer,      // Level 9: Multiple matches
  ]) {
    // Progressive escalation until match found
  }
}

Key Insight: Edlide vs OpenCode
Edlide already HAS identical replacer functions (97% match)
Edlide DOES NOT USE the replace() function (uses slice() instead)
Edlide continues using SEARCH/REPLACE blocks (OpenCode uses tool calls)

🎯 Migration Objective
ЗАМЕНИТЬ текущую систему на точную OpenCode реализацию:

Удалить SEARCH/REPLACE блоки полностью
Внедрить OpenCode tool-based подход
Активировать 9-уровневую replace() функцию
Единая система edit - NO fast/slow apply distinction

📋 Implementation Plan
Phase 1: Prompt System Overhaul
Что делать: Полностью переписать AI prompts для генерации tool calls вместо SEARCH/REPLACE блоков

Удалить все упоминания SEARCH/REPLACE блоков из prompts.ts
Добавить инструкции для edit_file tool с параметрами: filePath, oldString, newString, replaceAll
Обновить system messages с объяснением новой архитектуры
Примеры правильных tool call форматирований вместо блоков
Phase 2: Tool Call Processing
Что делать: Создать обработчик OpenCode-style tool calls

Изменить toolsService.ts для обработки edit_file с новыми параметрами
Создать parser для извлечения tool calls из AI response
Валидация tool parameters (filePath абсолютный путь, oldString != newString)
Удалить extractSearchReplaceBlocks() - больше не нужно
Phase 3: Activate 9-Level Replace Engine
Что делать: Включить существующую edlideReplace() функцию

Изменить editCodeService.ts: ЗАМЕНИТЬ newCode.slice() НА edlideReplace()
Вызвать replace() из edlideCodeApplySystem.ts с правильными параметрами
Убедиться что используются ВСЕ 9 уровней progressive matching
Сохранить apply level логирование для отладки
Phase 4: System Integration
Что делать: Обновить все компоненты для работы с новой системой

Удалить Fast/Slow Apply логику - единая Opencode система
Обновить UI для отображения tool calls вместо блоков
Модифицировать diff visualization для tool-based изменений
Интегрировать с VSCode undo/redo system
🔧 Technical Changes Required
Prompts.ts

// УДАЛИТЬ эти инструкции:
"Use SEARCH/REPLACE blocks format: <<<<<<< ORIGINAL ..."

// ДОБАВИТЬ эти инструкции:
"Use edit_file tool with parameters: filePath, oldString, newString"

ToolsService.ts

// ИЗМЕНИТЬ edit_file tool:
edit_file: {
  params: {
    uri: { description: "Absolute path to file" },
    oldString: { description: "Exact text to replace" },
    newString: { description: "Replacement text" },
    replaceAll: { description: "Replace all occurrences" }
  }
}

EditCodeService.ts

// ЗАМЕНИТЬ:
const result = findTextInCode(b.orig, modelStr, true, { returnType: 'lines' })
newCode = newCode.slice(0, origStart) + block.final + newCode.slice(origEnd + 1)

// НА:
const newContent = replace(modelStr, oldString, newString, replaceAll)

edlideCodeApplySystem.ts

// УБЕДИТЬСЯ что replace() функция:
// - Использует ВСЕ 9 уровней
// - Имеет правильную обработку ошибок
// - Возвращает meaningful error messages
// - Поддерживает replaceAll = true

🎯 Expected Result

Before Migration:

AI: <<<<<<< ORIGINAL
const x = 5;
=======
const x = 10;
>>>>>>> UPDATED

System: extractSearchReplaceBlocks() → slice() replacement

After Migration:

AI: edit_file(filePath="/src/app.js", oldString="const x = 5;", newString="const x = 10;")

System: replace() → 9-level progressive matching → replacement

✅ Success Criteria
No SEARCH/REPLACE blocks generated by AI
OpenCode tool calls working 100%
All 9 levels active in replace() function
95%+ success rate for edits (vs current ~70%)
Single unified system - no fast/slow distinction
Maintain existing debug logging and apply level tracking

🚨 Critical Dependencies
edlideCodeApplySystem.ts already exists and works correctly
All 9 replacer functions already implemented
Main change is ACTIVATION of existing code instead of slice()
AI prompt overhaul is the biggest effort required
Ключевое преимущество: 90% кода уже написано и протестировано. Нужно только активировать существующую систему и изменить AI prompts!
