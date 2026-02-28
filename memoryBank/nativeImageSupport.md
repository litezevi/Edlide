# Native Image Support (Vision Models)

## Дата реализации
2025-02-28 (первичная реализация)
2026-02-28 (фикс: NATIVE VISION инструкция в системном промпте)

---

## Проблема которую решали

До этой реализации **все** модели обрабатывали прикреплённые пользователем изображения одинаково — через вспомогательный тул `analyze_image`:

1. Пользователь прикрепляет фото
2. В текст сообщения вставляется флаг `<has_images>true</has_images>`
3. Основная модель видит флаг → вызывает тул `analyze_image`
4. `analyze_image` отправляет изображение в скрытую vision-модель `zai-org/GLM-4.6V`
5. GLM-4.6V возвращает текстовое описание → основная модель отвечает

**Проблемы:**
- Модели вроде `moonshotai/Kimi-K2.5-TEE` нативно поддерживают multimodal через OpenAI-compatible API (стандартный формат `image_url` в content array). Для них `analyze_image` — лишнее звено.
- При попытке передать большое base64-изображение напрямую без ресайза — ошибка `413 Entity Too Large`.
- Нет гибкого механизма для будущего добавления новых vision-моделей.

---

## Архитектура решения

### Два режима обработки изображений

**Режим 1 — Vision-модели (supportsVision: true)**
```
User прикрепляет фото
→ chatImages сохраняются в ChatMessage.images[]
→ НЕТ <has_images> флага в content
→ convertToLLMMessageService.prepareLLMChatMessages()
    → images ресайзятся до ≤1024×1024 через Canvas API
    → user message трансформируется в multimodal content array:
       [{type:'text', text:'...'}, {type:'image_url', image_url:{url:'data:image/jpeg;base64,...'}}]
→ analyze_image НЕ включается в список доступных tools
→ Kimi-K2.5 нативно видит и обрабатывает изображение
```

**Режим 2 — Обычные модели (без supportsVision)**
```
User прикрепляет фото
→ chatImages сохраняются в ChatMessage.images[]
→ В content добавляется флаг <has_images>true</has_images>
→ Основная модель видит флаг → вызывает analyze_image тул
→ analyze_image → GLM-4.6V → текстовое описание → основная модель
```

### Ключевой параметр

`supportsVision?: boolean` в `VoidStaticModelInfo` — если `true`, модель использует Режим 1.

---

## Изменённые файлы

### 1. `src/vs/workbench/contrib/void/common/modelCapabilities.ts`

**Что изменено:** Добавлено поле `supportsVision` в тип `VoidStaticModelInfo` и установлено `true` для `Kimi-K2.5`.

**Тип (строка ~169):**
```typescript
export type VoidStaticModelInfo = {
  // ...
  supportsFIM: boolean;
  supportsVision?: boolean; // whether the model natively accepts images in messages (multimodal); if true, images are sent directly instead of using analyze_image tool
  // ...
}
```

**Модель Kimi-K2.5 (строка ~1136):**
```typescript
'moonshotai/Kimi-K2.5-TEE': {
  contextWindow: 262_144,
  reservedOutputTokenSpace: 26_014,
  cost: { input: 0, output: 0 },
  downloadable: false,
  supportsFIM: false,
  supportsVision: true, // natively accepts images in multimodal content arrays
  supportsSystemMessage: 'system-role',
  specialToolFormat: 'openai-style',
  reasoningCapabilities: false,
  additionalOpenAIPayload: { chat_template_kwargs: { thinking: false } },
},
```

**Важно:** `supportsVision` НЕ добавлен в `modelOverrideKeys` — пользователь не может переопределить это поле через UI настроек. Это намеренно: vision support — это характеристика модели, а не пользовательская настройка.

---

### 2. `src/vs/workbench/contrib/void/common/sendLLMMessageTypes.ts`

**Что изменено:** Расширен тип `OpenAILLMChatMessage` — user role теперь поддерживает multimodal content array вместо только string. Добавлены экспортируемые типы для content parts.

**Новые типы (строки ~43-46):**
```typescript
// multimodal content part for vision-capable models (image_url with base64 data URI)
export type OpenAIImageContentPart = { type: 'image_url'; image_url: { url: string } }
export type OpenAITextContentPart = { type: 'text'; text: string }
export type OpenAIUserContentPart = OpenAITextContentPart | OpenAIImageContentPart
```

**Обновлённый тип OpenAILLMChatMessage (строки ~48-63):**
```typescript
export type OpenAILLMChatMessage = {
  role: 'system' | 'developer';
  content: string;
} | {
  role: 'user';
  // string for regular messages, array for multimodal (vision-capable models with images)
  content: string | OpenAIUserContentPart[];
} | {
  role: 'assistant',
  content: string | (AnthropicReasoning | { type: 'text'; text: string })[];
  tool_calls?: { type: 'function'; id: string; function: { name: string; arguments: string; } }[];
} | {
  role: 'tool',
  content: string;
  tool_call_id: string;
}
```

До этого изменения: `role: 'system' | 'user' | 'developer'` был единым union с `content: string`. Теперь `user` — отдельный вариант с поддержкой multimodal.

---

### 3. `src/vs/workbench/contrib/void/browser/convertToLLMMessageService.ts`

Основной файл с главной логикой. Здесь 4 изменения.

#### 3.1 Новые импорты (строка 8, 11)
```typescript
import { ChatImageAttachment, ChatMessage } from '../common/chatThreadServiceTypes.js';
import { AnthropicLLMChatMessage, AnthropicReasoning, GeminiLLMChatMessage, LLMChatMessage, LLMFIMMessage, OpenAIImageContentPart, OpenAILLMChatMessage, OpenAITextContentPart, RawToolParamsObj } from '../common/sendLLMMessageTypes.js';
```

#### 3.2 Расширен тип `SimpleLLMMessage` (строки ~27-42)
Добавлено поле `images` для user role:
```typescript
type SimpleLLMMessage = {
  role: 'tool';
  content: string;
  id: string;
  name: ToolName;
  rawParams: RawToolParamsObj;
} | {
  role: 'user';
  content: string;
  // images are carried here so vision-capable models can receive them directly (as multimodal content)
  images?: ChatImageAttachment[];
} | {
  role: 'assistant';
  content: string;
  anthropicReasoning: AnthropicReasoning[] | null;
}
```

#### 3.3 Добавлены vision helper функции (строки ~49-114)

**`resizeImageForVision(dataUrl, maxSize=1024)`** — ресайз через Canvas API (browser-process only):
```typescript
const resizeImageForVision = (dataUrl: string, maxSize = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        // preserve aspect ratio
        if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize }
        else { width = Math.round((width * maxSize) / height); height = maxSize }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
      // Returns base64 without data URI prefix
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1] ?? '')
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
```

**`imagesToOpenAIContentParts(images)`** — конвертация массива ChatImageAttachment в OpenAI image_url parts:
```typescript
const imagesToOpenAIContentParts = async (images: ChatImageAttachment[]): Promise<OpenAIImageContentPart[]> => {
  const parts: OpenAIImageContentPart[] = []
  for (const img of images) {
    try {
      const base64 = await resizeImageForVision(img.previewUrl)
      if (base64) {
        parts.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } })
      }
    } catch (e) {
      console.error('[Vision] Failed to resize image for native vision:', e)
    }
  }
  return parts
}
```

**`buildVisionUserContent(text, images)`** — собирает итоговый multimodal content array:
```typescript
const buildVisionUserContent = async (
  text: string,
  images: ChatImageAttachment[],
): Promise<(OpenAITextContentPart | OpenAIImageContentPart)[]> => {
  const imageParts = await imagesToOpenAIContentParts(images)
  const textPart: OpenAITextContentPart = { type: 'text', text: text || '' }
  return [textPart, ...imageParts]
}
```
Формат на выходе: `[{type:'text', text:'...'}, {type:'image_url', image_url:{url:'data:image/jpeg;base64,...'}}, ...]`

#### 3.4 Обновлена `prepareMessages_openai_tools` (строки ~142-176)

При push user-сообщений удаляем поле `images` чтобы оно не попало в OpenAI payload (images туда не нужны в raw виде, они идут через multimodal трансформацию):
```typescript
if (currMsg.role !== 'tool') {
  // strip the `images` field — it's only used for vision pre-processing, not sent to OpenAI directly
  if (currMsg.role === 'user') {
    const { images: _images, ...userMsgWithoutImages } = currMsg
    newMessages.push(userMsgWithoutImages)
  } else {
    newMessages.push(currMsg)
  }
  continue
}
```

#### 3.5 Обновлена `_chatMessagesToSimpleMessages` (строка ~723)

Пробрасываем images из ChatMessage в SimpleLLMMessage:
```typescript
else if (m.role === 'user') {
  simpleLLMMessages.push({
    role: m.role,
    content: m.content,
    images: m.images && m.images.length > 0 ? m.images : undefined,
  })
}
```

#### 3.6 Обновлена `prepareLLMChatMessages` — главная vision-логика (строки ~763-850)

```typescript
prepareLLMChatMessages = async ({ chatMessages, chatMode, modelSelection }) => {
  // ...
  const {
    specialToolFormat,
    contextWindow,
    supportsSystemMessage,
    supportsVision,           // ← новое поле
  } = getModelCapabilities(providerName, modelName, overridesOfModel)

  // ... стандартная подготовка messages ...

  const { messages, separateSystemMessage } = prepareMessages({ ... })

  // Vision post-processing: inject images as multimodal content for vision-capable models
  if (supportsVision) {
    // Build map: original user content string → images
    const userContentToImages = new Map<string, ChatImageAttachment[]>()
    for (const simple of llmMessages) {
      if (simple.role === 'user' && simple.images && simple.images.length > 0) {
        userContentToImages.set(simple.content, simple.images)
      }
    }

    if (userContentToImages.size > 0) {
      const transformedMessages: LLMChatMessage[] = []
      for (const msg of messages) {
        const asOpenAI = msg as OpenAILLMChatMessage
        if (asOpenAI.role === 'user' && typeof asOpenAI.content === 'string') {
          let matchedImages: ChatImageAttachment[] | undefined

          // 1. Exact match
          if (userContentToImages.has(asOpenAI.content)) {
            matchedImages = userContentToImages.get(asOpenAI.content)
          }
          // 2. Prefix match (prepared content may be trimmed from the end)
          if (!matchedImages) {
            for (const [originalContent, imgs] of userContentToImages) {
              const prefix = originalContent.substring(0, Math.min(80, originalContent.length))
              if (prefix.length > 10 && asOpenAI.content.startsWith(prefix)) {
                matchedImages = imgs
                break
              }
            }
          }

          if (matchedImages && matchedImages.length > 0) {
            const multimodalContent = await buildVisionUserContent(asOpenAI.content, matchedImages)
            transformedMessages.push({ role: 'user', content: multimodalContent } as OpenAILLMChatMessage)
            continue
          }
        }
        transformedMessages.push(msg)
      }
      return { messages: transformedMessages, separateSystemMessage }
    }
  }

  return { messages, separateSystemMessage }
}
```

**Логика матчинга messages с images:**
- Строится Map: `originalContent → images[]` из SimpleLLMMessages
- Prepared messages могут быть триммированы (контекст-оптимизация обрезает конец строк)
- Сначала пробуем exact match
- Если нет — prefix match по первым 80 символам
- Если нашли images → вызываем `buildVisionUserContent` → multimodal array

---

### 4. `src/vs/workbench/contrib/void/common/prompt/prompts.ts`

**Что изменено:** Функция `availableTools` получила третий параметр `supportsVision`. Если vision-модель — `analyze_image` исключается из доступных инструментов.

```typescript
export const availableTools = (
  chatMode: ChatMode | null,
  mcpTools: InternalToolInfo[] | undefined,
  // if model natively handles images (supportsVision), exclude analyze_image
  supportsVision?: boolean,
) => {
  const builtinToolNames: BuiltinToolName[] | undefined = /* ... режимы ask/plan/agent ... */

  // Vision-capable models don't need analyze_image — they receive images natively
  const filteredBuiltinToolNames = supportsVision
    ? builtinToolNames?.filter(toolName => toolName !== 'analyze_image')
    : builtinToolNames

  const effectiveBuiltinTools = filteredBuiltinToolNames?.map(toolName => builtinTools[toolName]) ?? undefined
  const effectiveMCPTools = (chatMode === 'agent' || chatMode === 'plan') ? mcpTools : undefined

  const tools = !(filteredBuiltinToolNames || mcpTools) ? undefined
    : [...effectiveBuiltinTools ?? [], ...effectiveMCPTools ?? []]

  return tools
}
```

**Backward compatibility:** Все существующие вызовы `availableTools(chatMode, mcpTools)` не передают `supportsVision` → `undefined` → поведение без изменений, `analyze_image` остаётся в списке.

---

### 5. `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts`

**Что изменено:** Функция `openAITools` и `_sendOpenAICompatibleChat` передают `supportsVision` для фильтрации тулов на уровне main process (это дублирует фильтрацию, но нужно т.к. `openAITools` вызывается здесь независимо).

**`openAITools` (строки ~251-264):**
```typescript
const openAITools = (
  chatMode: ChatMode | null,
  mcpTools: InternalToolInfo[] | undefined,
  supportsVision?: boolean,  // ← новый параметр
) => {
  const allowedTools = availableTools(chatMode, mcpTools, supportsVision)
  // ...
}
```

**`_sendOpenAICompatibleChat` (строки ~295-315):**
```typescript
const {
  modelName,
  specialToolFormat,
  reasoningCapabilities,
  additionalOpenAIPayload,
  supportsVision,  // ← извлекаем из capabilities
} = getModelCapabilities(providerName, modelName_, overridesOfModel)

// tools — vision-capable models don't get analyze_image (they receive images natively)
const potentialTools = openAITools(chatMode, mcpTools, supportsVision)  // ← передаём supportsVision
```

---

### 6. `src/vs/workbench/contrib/void/browser/chatThreadService.ts`

**Что изменено:** Добавлен импорт `getModelCapabilities`. В `_addUserMessageAndStreamResponse` логика добавления флага `<has_images>` теперь зависит от `supportsVision` текущей модели.

**Новый импорт (строка ~17):**
```typescript
import { getModelCapabilities } from '../common/modelCapabilities.js';
```

**Обновлённая логика флага (строки ~1434-1461):**
```typescript
const chatImages = this.getCurrentChatImages()

// For vision-capable models, images are sent natively — no <has_images> flag needed.
// For other models, the flag signals the model to call the analyze_image tool.
const { modelSelection } = this._currentModelSelectionProps()
const { overridesOfModel } = this._settingsService.state
const currentModelSupportsVision = modelSelection
  ? getModelCapabilities(modelSelection.providerName, modelSelection.modelName, overridesOfModel).supportsVision === true
  : false

let messageContent: string
if (currentModelSupportsVision) {
  // Vision model: no flag, images are injected as multimodal content by convertToLLMMessageService
  messageContent = userMessageContent
} else {
  // Non-vision model: add has_images flag so the model knows to call analyze_image tool
  const hasImagesFlag = chatImages.length > 0 ? '<has_images>true</has_images>\n' : '<has_images>false</has_images>\n'
  messageContent = hasImagesFlag + userMessageContent
}

const userHistoryElt: ChatMessage = {
  role: 'user',
  content: messageContent,
  displayContent: instructions,
  selections: currSelns,
  images: chatImages,  // всегда сохраняем images в ChatMessage
  state: defaultMessageState
}
```

**Важно:** `images` всегда сохраняются в `ChatMessage.images[]` независимо от режима. Это позволяет при переключении модели корректно переобработать историю.

---

## Полный поток данных для vision-модели (Kimi-K2.5)

```
1. SidebarChat.tsx
   └── Пользователь прикрепляет фото
   └── chatImages хранятся в thread.state.chatImages

2. chatThreadService._addUserMessageAndStreamResponse()
   └── currentModelSupportsVision = true (Kimi-K2.5)
   └── messageContent = userMessageContent (БЕЗ <has_images> флага)
   └── ChatMessage { role:'user', content: messageContent, images: chatImages }
   └── this.clearChatImages()

3. chatThreadService._runChatAgent()
   └── convertToLLMMessageService.prepareLLMChatMessages()

4. convertToLLMMessageService.prepareLLMChatMessages()
   └── getModelCapabilities() → supportsVision: true
   └── _chatMessagesToSimpleMessages():
       SimpleLLMMessage { role:'user', content: '...', images: [ChatImageAttachment] }
   └── prepareMessages() → стандартный pipeline (trim, system msg, etc.)
       └── prepareMessages_openai_tools():
           strip images from user msg → { role:'user', content: '...' }
   └── POST-PROCESSING (supportsVision === true):
       └── buildVisionUserContent():
           └── resizeImageForVision() → base64 jpeg ≤1024px
           └── returns [ {type:'text',text:'...'}, {type:'image_url',image_url:{url:'data:image/jpeg;base64,...'}} ]
       └── Final message: { role:'user', content: [{type:'text',...},{type:'image_url',...}] }

5. openAITools(chatMode, mcpTools, supportsVision=true)
   └── availableTools() → analyze_image ИСКЛЮЧАЕТСЯ
   └── Kimi-K2.5 получает tools БЕЗ analyze_image

6. sendLLMMessageService → IPC → sendLLMMessage.impl.ts
   └── _sendOpenAICompatibleChat()
   └── OpenAI SDK chat.completions.create()
   └── messages: [ ..., { role:'user', content:[{type:'text'},{type:'image_url'}] } ]
   └── tools: [...без analyze_image...]

7. Kimi-K2.5 нативно обрабатывает изображение
   └── Отвечает напрямую без вызова analyze_image
```

---

## Полный поток данных для обычной модели (GLM-4.7, MiniMax, etc.)

```
1-2. Аналогично, НО:
   └── currentModelSupportsVision = false
   └── messageContent = '<has_images>true</has_images>\n' + userMessageContent

3-6. Аналогично, НО:
   └── supportsVision = false/undefined
   └── openAITools() → analyze_image ВКЛЮЧЁН
   └── Сообщения: [ ..., { role:'user', content:'<has_images>true</has_images>\n...' } ]

7. Модель видит флаг → вызывает analyze_image тул
   └── toolsService.callTool('analyze_image') → GLM-4.6V
   └── GLM-4.6V возвращает описание → основная модель отвечает
```

---

## Как добавить новую vision-модель

Единственное что нужно — добавить `supportsVision: true` в конфиг модели в `modelCapabilities.ts`:

```typescript
// Пример: добавляем поддержку vision для новой модели
'new-provider/new-vision-model': {
  contextWindow: 200_000,
  reservedOutputTokenSpace: 20_000,
  cost: { input: 0, output: 0 },
  downloadable: false,
  supportsFIM: false,
  supportsVision: true,  // ← это всё что нужно
  supportsSystemMessage: 'system-role',
  specialToolFormat: 'openai-style',
  reasoningCapabilities: false,
},
```

После этого:
- `analyze_image` автоматически исключится из инструментов модели
- Флаг `<has_images>` не будет добавляться
- Изображения будут автоматически ресайзиться до 1024×1024 и передаваться напрямую

**Требования к vision-модели для совместимости:**
1. Должна поддерживать OpenAI-compatible API (`specialToolFormat: 'openai-style'`)
2. Должна принимать `content: array` в user-сообщениях с `{type:'image_url', image_url:{url:'data:image/jpeg;base64,...'}}`
3. Должна работать через наш proxy (`edlide` provider)

---

## Технические детали

### Ресайз изображений
- Ресайз происходит **только при отправке** в vision-моделях, не при прикреплении
- Максимальный размер: 1024×1024 px (соотношение сторон сохраняется)
- Формат вывода: JPEG quality 0.8
- Функция использует `HTMLImageElement` + `HTMLCanvasElement` → только browser process
- `convertToLLMMessageService` работает в browser process → всё совместимо

### Матчинг messages с images
- Проблема: после `prepareMessages()` текст может быть триммирован (контекст-оптимизация обрезает конец)
- Решение: двухшаговый матчинг
  1. Точное совпадение (exact match по content string)
  2. Prefix match — сравниваем первые 80 символов оригинального content со `startsWith` у prepared content
- Порог prefix: минимум 10 символов (защита от ложных срабатываний на коротких текстах)

### Почему images хранятся в SimpleLLMMessage но стрипаются в prepareMessages_openai_tools
- `SimpleLLMMessage` — промежуточный тип, используется внутри convertToLLMMessageService
- `images` нужны для vision post-processing ПОСЛЕ `prepareMessages()`
- В `prepareMessages_openai_tools` images стрипаются при push (`const { images: _images, ...rest } = currMsg`)
- Это предотвращает попадание поля `images` в финальный OpenAI payload (OpenAI SDK его не ожидает в этом поле)

### Backward compatibility
- Все существующие вызовы `availableTools(chatMode, mcpTools)` продолжают работать без изменений
- Модели без `supportsVision` ведут себя ровно как раньше
- `OpenAILLMChatMessage` тип расширен но не сломан (user role теперь `string | array`, где string — стандартное сообщение)

---

## Файлы: итоговая таблица изменений

| Файл | Что изменено | Строки |
|------|-------------|--------|
| `common/modelCapabilities.ts` | Добавлен `supportsVision?: boolean` в тип `VoidStaticModelInfo`; `supportsVision: true` для `moonshotai/Kimi-K2.5-TEE` | ~169, ~1142 |
| `common/sendLLMMessageTypes.ts` | Новые типы `OpenAIImageContentPart`, `OpenAITextContentPart`, `OpenAIUserContentPart`; user role в `OpenAILLMChatMessage` поддерживает `content: string \| OpenAIUserContentPart[]` | ~43-63 |
| `browser/convertToLLMMessageService.ts` | Новые импорты; `images` в `SimpleLLMMessage` user; 3 vision helper функции; strip images в `prepareMessages_openai_tools`; передача images в `_chatMessagesToSimpleMessages`; vision post-processing в `prepareLLMChatMessages` | ~8-11, ~27-42, ~49-114, ~149-157, ~720-724, ~763-850 |
| `common/prompt/prompts.ts` | `availableTools` получила `supportsVision?`; `systemToolsXMLPrompt`, `agentSystemMessage`, `chat_systemMessage` получили `supportsVision?`; в Plan и Agent mode: условная замена IMAGE HANDLING RULE → NATIVE VISION инструкция; `agentSystemMessage` добавляет NATIVE VISION в `parts[]` | ~377-404, ~428, ~560-568, ~571-689 |
| `electron-main/llmMessage/sendLLMMessage.impl.ts` | `openAITools` получила `supportsVision?`; `_sendOpenAICompatibleChat` извлекает и передаёт `supportsVision` | ~251-264, ~295-315 |
| `browser/chatThreadService.ts` | Импорт `getModelCapabilities`; условное добавление `<has_images>` флага в зависимости от `supportsVision` модели | ~17, ~1434-1461 |
| `browser/convertToLLMMessageService.ts` | `_generateChatMessagesSystemMessage` получила `supportsVision?`; пробрасывается в `agentSystemMessage` и `chat_systemMessage`; вызов из `prepareLLMChatMessages` передаёт `supportsVision` | ~669, ~687-688, ~777 |

---

## Текущие vision-модели (supportsVision: true)

| Модель | Provider | Статус |
|--------|----------|--------|
| `moonshotai/Kimi-K2.5-TEE` | edlide | ✅ Активна |
| `Qwen/Qwen3.5-397B-A17B-TEE` | edlide | ✅ Активна |

---

## ✅ Фикс: NATIVE VISION инструкция в системном промпте (2026-02-28)

**Проблема:** Vision-модели (Kimi-K2.5-TEE, Qwen3.5-397B) всё равно пытались вызвать `analyze_image` tool, хотя:
- tool был исключён из API tools list ✅
- tool был исключён из XML tool definitions ✅
- флаг `<has_images>` не добавлялся ✅

**Причина:** Системный промпт не содержал **позитивной инструкции** о том, что модель нативно видит изображения. Модель получала multimodal content с картинками, но не знала, что может их обрабатывать сама. Особенно критично для моделей с XML tool format — они могли галлюцинировать XML-вызов `analyze_image` из обучающих данных.

**Решение:** Добавлена трёхслойная защита:

1. **`systemToolsXMLPrompt()`** — добавлен `supportsVision?` параметр, пробрасывается в `availableTools()`
2. **`agentSystemMessage()`** — добавлен `supportsVision?`; если `true` — в `parts[]` добавляется:
   ```
   NATIVE VISION: You natively support images and can see them directly in user messages.
   Do NOT call analyze_image — process images yourself without any tool.
   ```
3. **`chat_systemMessage()` Plan + Agent mode** — условная замена:
   - **Было** (для всех моделей): `IMAGE HANDLING RULE: When you see <has_images>true</has_images>, you MUST call analyze_image tool first.`
   - **Стало** (для vision-моделей): `NATIVE VISION: You natively support images. You can see and analyze images directly in user messages. Do NOT call analyze_image — process images yourself without any tool.`
   - **Стало** (для обычных моделей): прежняя инструкция без изменений

**`convertToLLMMessageService.ts`** — `_generateChatMessagesSystemMessage()` получила `supportsVision?` параметр, который теперь извлекается в `prepareLLMChatMessages()` через `getModelCapabilities()` и передаётся по всей цепочке.

**Итог трёх слоёв защиты:**
- Layer 1 (API tools list): `availableTools()` фильтрует `analyze_image` ✅
- Layer 2 (`<has_images>` flag): `chatThreadService` не добавляет флаг ✅
- Layer 3 (system prompt text): явная инструкция "ты нативно видишь картинки, не вызывай analyze_image" ✅

---

## Известные ограничения и потенциальные улучшения

1. **Матчинг по prefix** — работает в 99% случаев, но теоретически может дать неверный match если два разных сообщения с images начинаются на одинаковые 80+ символов. Более надёжное решение — передавать message ID вместо content matching. Текущее решение принято как pragmatic trade-off.

2. **Ресайз только JPEG** — изображения всегда конвертируются в JPEG. PNG с прозрачностью теряют альфа-канал. Если будет нужно — добавить определение формата и PNG output.

3. **Только OpenAI-compatible vision** — текущая реализация работает только для моделей с `specialToolFormat: 'openai-style'`. Для Anthropic vision потребуется отдельная реализация (у них другой формат: `{type:'image', source:{type:'base64', media_type:'image/jpeg', data:'...'}}`).

4. **Нет vision в prepareLLMSimpleMessages** — метод `prepareLLMSimpleMessages` (используется для Apply, Autocomplete) не реализует vision post-processing. Это намеренно — Apply/Autocomplete не поддерживают изображения.
