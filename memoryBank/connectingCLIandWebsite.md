# CLI ↔ Website Connection System

**Last Updated**: 2026-02-22
**Status**: Production-ready

---

## 1. Architecture Overview

CLI использует браузерный OAuth flow через `edlide.com/cli-connect`. Пользователь авторизуется на сайте, сайт сохраняет `edlide_xxx` API ключ в БД, CLI поллит и получает его. После этого все AI запросы идут через `https://edlide.com/api/ai-proxy` (не напрямую на chutes).

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLI ↔ Website Connection Flow                 │
│                                                                  │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────────┐  │
│  │   CLI        │      │   Website    │      │   Supabase     │  │
│  │ (Terminal)  │      │  (Next.js)   │      │  (PostgreSQL)  │  │
│  │             │      │              │      │                │  │
│  │ /connect    │──1──>│/cli-connect  │──2──>│/api/cli/       │  │
│  │ generates   │      │ page.tsx     │      │create-api-key  │  │
│  │ state_id    │      │              │      │                │  │
│  │             │      │              │      │ upserts        │  │
│  │             │      │              │      │ cli_api_key    │  │
│  │             │      │              │      │ in             │  │
│  │             │      │              │      │ user_sessions  │  │
│  │             │      │              │      │                │  │
│  │             │      │              │      │ inserts into   │  │
│  │             │      │              │      │cli_pending_    │  │
│  │             │      │              │      │tokens          │  │
│  │             │<─3───│/api/cli/     │      │                │  │
│  │ polls every │      │tokens        │      │                │  │
│  │ 2 seconds   │      │(one-time)    │      │                │  │
│  │             │      │              │      │                │  │
│  │ stores      │──4──>│/api/ai-proxy │──5──>│ validates      │  │
│  │ edlide_xxx  │      │              │      │ cli_api_key    │  │
│  │ in auth.json│      │              │      │ in             │  │
│  │             │      │              │      │ user_sessions  │  │
│  └─────────────┘      └──────────────┘      └────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Ключевые принципы

- **CLI хранит `cli_api_key`** — отдельно от IDE `api_key`, один `user_id` = две колонки в `user_sessions`
- **Все AI запросы через `ai-proxy`** — CLI не обращается напрямую к chutes, только через `edlide.com/api/ai-proxy`
- **Bearer edlide_xxx** — CLI передаёт ключ как `Authorization: Bearer edlide_xxx` в ai-proxy
- **30-дневный rolling expiry** — каждый refresh продлевает `cli_api_key_expires_at` на 30 дней
- **OS-level storage** — ключ хранится в `~/.edlide-cli/auth.json` с `chmod 600`

---

## 2. File Map

### CLI Files (Edlide-CLI)

| Файл                                                                  | Изменение   | Что делает                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/opencode/src/server/server.ts`                              | **ИЗМЕНЁН** | Добавлены 3 новых endpoint: `GET /auth/edlide/info`, `POST /auth/edlide/connect`, `POST /auth/edlide/logout`                                           |
| `packages/opencode/src/auth/index.ts`                                 | **ИЗМЕНЁН** | Добавлено поле `email?: string` в `Api` schema — хранит email пользователя рядом с ключом                                                              |
| `packages/opencode/src/provider/provider.ts`                          | **ИЗМЕНЁН** | Для chutes моделей `api.url` переопределён на `https://edlide.com/api/ai-proxy`. Фильтрация и переименование моделей                                   |
| `packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx`     | **ИЗМЕНЁН** | Для chutes провайдера — вместо API key диалога открывается `EdlideConnectMethod` компонент. Показывает статус connected/waiting/error                  |
| `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx` | **ИЗМЕНЁН** | Добавлена команда `/logout` в autocomplete                                                                                                             |
| `packages/opencode/src/cli/cmd/tui/app.tsx`                           | **ИЗМЕНЁН** | Добавлена команда `Logout` в command palette. `useSDK()` вынесен на уровень App                                                                        |
| `packages/opencode/src/cli/cmd/tui/context/sdk.tsx`                   | **ИЗМЕНЁН** | Добавлен `baseUrl` в возвращаемый объект контекста — нужен для прямых fetch запросов                                                                   |
| `packages/opencode/src/cli/cmd/auth.ts`                               | **ИЗМЕНЁН** | Добавлен `connectEdlide()` и константы `EDLIDE_CONNECT_URL`, `EDLIDE_TOKENS_URL`. При `auth login` — сначала предлагает Edlide через браузер или Other |

### Website Files (edlide-website)

| Файл                                        | Изменение   | Что делает                                                                                                                                                   |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/cli-connect/page.tsx`              | **СОЗДАН**  | Страница авторизации. Автоконнектится если пользователь уже залогинен. Вызывает `/api/cli/create-api-key` с `state_id` в body                                |
| `src/app/api/cli/create-api-key/route.ts`   | **СОЗДАН**  | POST. Верифицирует JWT, генерирует `edlide_xxx`, upsert в `user_sessions.cli_api_key`, вставляет в `cli_pending_tokens` — всё server-side через service_role |
| `src/app/api/cli/tokens/route.ts`           | **СОЗДАН**  | GET `?state={state_id}`. CLI поллит каждые 2 сек. Возвращает токен и удаляет строку (one-time use). Чистит expired токены                                    |
| `src/app/api/cli/get-access-token/route.ts` | **СОЗДАН**  | POST. Принимает `X-API-Key: edlide_xxx`. Проверяет expiry, верифицирует user в `auth.users`, продлевает на 30 дней                                           |
| `src/app/api/ai-proxy/[[...path]]/route.ts` | **ИЗМЕНЁН** | `authenticateViaApiKey` теперь проверяет сначала IDE `api_key`, потом CLI `cli_api_key` — оба типа принимаются                                               |

### Database (Supabase)

| Изменение                    | Что добавлено                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `user_sessions` таблица      | Колонки `cli_api_key TEXT` и `cli_api_key_expires_at TIMESTAMPTZ`                                                          |
| `cli_pending_tokens` таблица | Новая таблица, идентична `ide_pending_tokens`. RLS: только service_role                                                    |
| `ide_pending_tokens` RLS     | Удалена политика `Anyone can insert with valid state` (WITH CHECK true). Теперь только service_role                        |
| Functions search_path        | Исправлен mutable search_path для `increment_request_count`, `update_updated_at_column`, `update_request_usage_updated_at` |

---

## 3. Detailed Flow: Initial Connection

### Step 1: Пользователь вводит `/connect` в CLI TUI

```
dialog-provider.tsx → createDialogProviderOptions()
→ provider.id === "chutes" → dialog.replace(() => <EdlideConnectMethod />)
```

### Step 2: EdlideConnectMethod монтируется

```
1. GET {server}/auth/edlide/info
   → если connected: true → показывает "Connected as user@email.com", останавливается
   → если connected: false → продолжает

2. POST {server}/auth/edlide/connect
   → server генерирует state_id = randomUUID()
   → открывает браузер: https://edlide.com/cli-connect?state={state_id}
   → поллит GET https://edlide.com/api/cli/tokens?state={state_id} каждые 2 сек
   → таймаут 60 секунд
```

### Step 3: Пользователь авторизуется на сайте

```
edlide.com/cli-connect?state=XXX
→ если не залогинен → показывает SupabaseSignInForm
→ если залогинен → автоматически вызывает doConnect()

doConnect():
→ POST /api/cli/create-api-key
  Body: { state_id: "XXX" }
  Headers: { Authorization: "Bearer {supabase_jwt}" }

create-api-key/route.ts:
→ adminSupabase.auth.getUser(jwt) → верифицирует пользователя
→ generateApiKey() → "edlide_" + randomBytes(32).toString("hex")  // 71 chars
→ upsert user_sessions SET cli_api_key = "edlide_xxx", cli_api_key_expires_at = now + 30d
→ insert cli_pending_tokens (state_id, access_token, expires_at, user_id, user_email)
→ страница показывает "Connected Successfully!" и закрывается
```

### Step 4: CLI получает токен

```
server.ts polling loop:
→ GET https://edlide.com/api/cli/tokens?state={state_id}
→ tokens/route.ts:
   - clean up expired tokens
   - SELECT * FROM cli_pending_tokens WHERE state_id = ?
   - DELETE row (one-time use)
   - return { ready: true, tokens: { access_token, user_email, ... } }

→ key.startsWith("edlide_") — security check
→ Auth.set("chutes", { type: "api", key, email: user_email })
   → сохраняет в ~/.edlide-cli/auth.json с chmod 600
→ c.json({ user_email })
```

### Step 5: EdlideConnectMethod получает ответ

```
→ setState({ status: "success", email: data.user_email })
→ sdk.client.instance.dispose()
→ sync.bootstrap() — перезагружает провайдеры
→ через 1 сек → dialog.replace(() => <DialogModel providerID="chutes" />)
```

---

## 4. AI Request Flow

```
CLI TUI → AI запрос
→ provider: "chutes", model: "zai-org/GLM-4.7-TEE"
→ model.api.url = "https://edlide.com/api/ai-proxy"  ← переопределено в provider.ts
→ auth: Auth.get("chutes") → { type: "api", key: "edlide_xxx" }
→ HTTP POST https://edlide.com/api/ai-proxy
  Headers: { Authorization: "Bearer edlide_xxx" }

ai-proxy/route.ts:
→ authHeader.startsWith("Bearer edlide_") → true
→ authenticateViaApiKey("edlide_xxx"):
   1. Try: user_sessions WHERE api_key = ? AND is_ide_device = true AND status = active
   2. Fallback: user_sessions WHERE cli_api_key = ? AND status = active  ← CLI path
→ adminSupabase.auth.admin.getUserById(user_id) — верифицирует юзера
→ subscriptions WHERE user_id = ? AND status = active → достаёт chutes_api_key_encrypted
→ TokenEncryption.decrypt(...) → реальный chutes API key
→ check daily request limit (TIER_REQUEST_LIMITS по plan_tier)
→ proxy → Supabase Edge Function ai-proxy → Chutes API
→ increment_request_count
→ return streaming response
```

---

## 5. Logout Flow

```
/logout команда в TUI
→ command.trigger("edlide.logout")
→ POST {server}/auth/edlide/logout
→ Auth.remove("chutes") → удаляет из ~/.edlide-cli/auth.json
→ sdk.client.instance.dispose()
→ dialog.clear()
```

---

## 6. Info / Already Connected Check

```
При открытии /connect:
→ GET {server}/auth/edlide/info
→ Auth.get("chutes") → если type === "api" → { connected: true, email: auth.email }
→ TUI показывает: "Connected as user@email.com" + "Already connected. Press esc to close."
```

---

## 7. Database Schema

### user_sessions (дополнено для CLI)

```sql
ALTER TABLE public.user_sessions
  ADD COLUMN cli_api_key TEXT,                    -- edlide_xxx для CLI
  ADD COLUMN cli_api_key_expires_at TIMESTAMPTZ;  -- rolling 30-day expiry
```

Один `user_id` = одна строка. IDE и CLI имеют независимые ключи:

- `api_key` + `api_key_expires_at` → IDE (is_ide_device = true)
- `cli_api_key` + `cli_api_key_expires_at` → CLI

### cli_pending_tokens (новая таблица)

```sql
CREATE TABLE public.cli_pending_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_id TEXT UNIQUE NOT NULL,     -- UUID от CLI
  access_token TEXT NOT NULL,        -- = cli_api_key (edlide_xxx)
  refresh_token TEXT,                -- = cli_api_key (edlide_xxx)
  expires_at TIMESTAMPTZ NOT NULL,   -- 30 дней
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: только service_role
```

Lifecycle: insert при авторизации на сайте → CLI получает → строка удаляется (one-time use).

---

## 8. Security Model

### API Key Format

- Pattern: `edlide_` + 64 hex символа (randomBytes(32))
- Длина: 71 символ
- Энтропия: 256 бит

### Validation Chain (каждый AI запрос)

```
1. CLI отправляет: Authorization: Bearer edlide_xxx
2. ai-proxy проверяет: startsWith("Bearer edlide_")
3. ai-proxy ищет: user_sessions WHERE cli_api_key = ? AND status = active
4. ai-proxy верифицирует: auth.admin.getUserById(user_id) — юзер существует
5. ai-proxy проверяет: активная подписка + chutes_api_key_encrypted
6. ai-proxy проверяет: daily request limit не превышен
```

### RLS политики

- `cli_pending_tokens` — только `service_role` (insert делается server-side)
- `user_sessions` — service_role full access; authenticated — только своя строка
- `ide_pending_tokens` — исправлено: убрана `Anyone can insert` политика, теперь только service_role

### Хранение на CLI

- `~/.edlide-cli/auth.json` — `chmod 600`, только владелец читает
- Email пользователя хранится рядом с ключом: `{ type: "api", key: "edlide_xxx", email: "user@email.com" }`

---

## 9. Server Endpoints (CLI server)

| Endpoint                    | Метод | Что делает                                                    |
| --------------------------- | ----- | ------------------------------------------------------------- |
| `GET /auth/edlide/info`     | GET   | Возвращает `{ connected: bool, email?: string }` из auth.json |
| `POST /auth/edlide/connect` | POST  | Открывает браузер, поллит tokens endpoint, сохраняет ключ     |
| `POST /auth/edlide/logout`  | POST  | Вызывает `Auth.remove("chutes")`                              |

---

## 10. Model Configuration

Chutes провайдер в CLI перенастроен в `provider.ts`:

```typescript
// Разрешённые модели с UI именами
const allowedModels = {
  "MiniMaxAI/MiniMax-M2.5-TEE": "minimax-m2.5",
  "zai-org/GLM-4.7-TEE": "glm-4.7",
  "moonshotai/Kimi-K2.5-TEE": "kimi-k2.5",
  "XiaomiMiMo/MiMo-V2-Flash": "mimo-v2-flash",
  "deepseek-ai/DeepSeek-V3.2-TEE": "deepseek-v3.2",
}

// api.url переопределён на ai-proxy для всех chutes моделей
model.api.url = "https://edlide.com/api/ai-proxy"

// Провайдер отображается как "Edlide" в UI
name: provider.id === "chutes" ? "Edlide" : provider.name
```

---

## 11. что НЕ изменялось

- `src/app/api/ide/*` — IDE endpoints не тронуты
- `src/app/ide-connect/page.tsx` — IDE connect страница не тронута
- `user_sessions.api_key` / `is_ide_device` — IDE ключи не затронуты
- Вся остальная логика CLI (sessions, tools, LSP, MCP и т.д.)
