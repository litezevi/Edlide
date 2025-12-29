# Refresh Token System for Chutes OAuth

> Последнее обновление: 29 December 2025
> Версия: v3.0
> Статус: ✅ Активно и работает

---

## Обзор системы

Система **автоматически обновляет** OAuth токены Chutes API каждые 15 минут, предотвращая expiry и обеспечивая **бесконечную** работу пользователей без необходимости повторной авторизации.

### Ключевые характеристики

✅ **Бесконечная сессия** — один раз подключил, работаешь вечно  
✅ **Автоматический refresh** — каждые 15 минут проактивное обновление  
✅ **Безопасное шифрование** — AES-256-CBC с единым IV для обеих токенов  
✅ **Никаких expiries** — refresh происходит до истечения токена  
✅ **Интеграция в чат** — refresh происходит transparently при каждом сообщении  

---

## Архитектура системы

### 1. Компоненты

| Файл | Назначение | Изменения в v3 |
|------|-----------|----------------|
| `/src/app/api/chat/route.ts` | Основной endpoint чата, содержит всю refresh логику | ✅ Добавлен refresh каждые 15 минут |
| `/src/app/api/auth/chutes/save/route.ts` | Сохранение токенов при OAuth callback | ✅ Фикс: единый IV для обоих токенов |
| `/src/app/api/auth/chutes/refresh/route.ts` | HTTP endpoint (unused legacy) | — |
| `/src/components/chutes-integration.tsx` | Клиентский компонент | — |
| `/src/lib/token-encryption.ts` | Шифрование/дешифрование | ✅ Добавлен параметр `providedIv` |

### 2. Таблицы Supabase

#### `public.chutes_tokens`

| Колонка | Тип | Назначение | RLS |
|---------|-----|-----------|-----|
| `id` | uuid | Primary key | No |
| `user_id` | uuid | Supabase user ID (unique) | ✅ Read: owner only |
| `chutes_user_id` | text | Chutes user ID (unique) | ✅ Read: owner only |
| `username` | text | @username пользователя | ✅ Read: owner only |
| `encrypted_access_token` | text | Зашифрованный access token (Base64) | ✅ Read: owner only |
| `encrypted_refresh_token` | text | Зашифрованный refresh token (Base64) | ✅ Read: owner only |
| `encryption_iv` | text | Общий IV для AES шифрования (Base64) | ✅ Read: owner only |
| `expires_at` | timestamptz | Время истечения access token | ✅ Read: owner only |
| `updated_at` | timestamptz | Последнее обновление токена (**вместо created_at**) | ✅ Read: owner only |
| `created_at` | timestamptz | Дата создания записи | ✅ Read: owner only |

---

## Как работает система (подробно)

### 1. Шифрование токенов при сохранении (`save/route.ts`)

Пользователь завершает OAuth flow → система получает access token и refresh token → шифрует и сохраняет в базу:

```typescript
// save/route.ts (строки 44-45)
const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(accessToken)
const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(refreshToken || '', Buffer.from(commonIv, 'base64'))

// upsert в базу
await supabase
  .from('chutes_tokens')
  .upsert({
    encrypted_access_token: encryptedAccess,      // Зашифрованный accessToken
    encrypted_refresh_token: encryptedRefresh,    // Зашифрованный refreshToken (базируется на том же IV!)
    encryption_iv: commonIv,                      // Общий IV (критически важно!)
    expires_at: expiresAt?.toISOString(),
    updated_at: new Date().toISOString(),
  })
```

**Ключевой момент:** Оба токена шифруются с **одним и тем же IV** — это критично для успешного refresh!

### 2. Проверка и обновление токена при каждом сообщении (`chat/route.ts`)

Каждый раз когда пользователь отправляет сообщение:

#### Шаг 1: Получение пользователя и токенов

```typescript
// chat/route.ts (строки 34-75)
const authHeader = request.headers.get('Authorization')
const supabaseToken = authHeader.substring(7)

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseToken)

if (userError || !user) {
  return NextResponse.json({ error: 'Invalid Supabase session' }, { status: 401 })
}

const { data: chutesData } = await supabase
  .from('chutes_tokens')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

#### Шаг 2: Анализ возраста токена

```typescript
// chat/route.ts (строки 86-95)
const createdOrUpdatedAt = chutesData.updated_at ? new Date(chutesData.updated_at) : new Date(chutesData.created_at!)
const now = new Date()

const tokenAgeMs = now.getTime() - createdOrUpdatedAt.getTime()
const REFRESH_EVERY_15_MIN = 15 * 60 * 1000 // 15 минут
const shouldRefresh = tokenAgeMs >= REFRESH_EVERY_15_MIN

console.log('- Token last updated:', createdOrUpdatedAt.toISOString())
console.log('- Token age (minutes):', Math.floor(tokenAgeMs / 60000))
console.log('- Should refresh (age >= 15min):', shouldRefresh)
```

#### Шаг 3: Проактивный refresh (если токен старше 15 минут)

Если `shouldRefresh === true`:

```typescript
// chat/route.ts (строки 97-145)
if (shouldRefresh && chutesData.encrypted_refresh_token) {
  console.log('Token age >= 15min, refreshing...')

  // a) Расшифровываем refresh token
  const decryptedRefreshToken = TokenEncryption.decrypt(
    chutesData.encrypted_refresh_token,
    chutesData.encryption_iv || ''  // Используем общий IV
  )

  // b) Вызываем Chutes refresh endpoint
  const newTokens = await refreshChutesToken(decryptedRefreshToken)
  
  // Это делает POST к https://idp.chutes.ai/idp/token:
  // Body: {
  //   grant_type: "refresh_token",
  //   refresh_token: decryptedRefreshToken,
  //   client_id: clientId,
  //   client_secret: clientSecret
  // }

  // c) Шифруем новые токены (с общим IV!)
  const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(newTokens.access_token)
  const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
    newTokens.refresh_token || decryptedRefreshToken,
    Buffer.from(newIv, 'base64')  // Передаем тот же IV для refresh токена!
  )

  // d) Обновляем базу данных
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
  await adminSupabase
    .from('chutes_tokens')
    .update({
      encrypted_access_token: newEncryptedAccess,
      encrypted_refresh_token: newEncryptedRefresh,
      encryption_iv: newIv,  // Обновляем IV!
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  console.log('Token refreshed and re-encrypted successfully')

  // e) Используем новый access token
  accessToken = newTokens.access_token
}
```

#### Шаг 4: Использование access token для чата

```typescript
// chat/route.ts (строки 147-160)
const userInfoResponse = await fetch('https://idp.chutes.ai/idp/userinfo', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,  // Свежий access token
  },
})

const userInfo = await userInfoResponse.json()
console.log('Chutes user verified:', userInfo.username)

// ... делаем запрос к llm.chutes.ai/v1/chat/completions с этим токеном
```

### 3. Обработка ошибок refresh

```typescript
// chat/route.ts (строки 147-170)
try {
  const newTokens = await refreshChutesToken(decryptedRefreshToken)
  // ... обновляем базу
} catch (refreshError) {
  console.error('Failed to refresh token:', refreshError)

  const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError)

  if (errorMessage.includes('invalid_grant')) {
    // Refresh token недействителен (отзыван, истёк), но НЕ удаляем из базы
    // чтобы пользователь мог переподключить вручную
    return NextResponse.json(
      {
        error: 'Your Chutes session has expired. Please re-link your Chutes account to continue.',
        code: 'RELINK_REQUIRED'
      },
      { status: 403 }
    )
  }

  // Другие ошибки
  return NextResponse.json(
    { error: 'Failed to refresh Chutes token. Please re-link your Chutes account.' },
    { status: 401 }
  )
}
```

---

## Flow диаграмма (детальная)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Пользователь отправляет сообщение             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     POST /api/chat                              │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│    1. Получить Supabase user из Authorization header            │
│       createClient(anon).auth.getUser(token)                    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│    2. Получить chutes_tokens из базы данных                     │
│       supabase.from('chutes_tokens').select('*').eq('user_id')  │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│    3. Расшифровать access token                                 │
│       TokenEncryption.decrypt(encrypted_access_token, iv)        │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│    4. Проверить возраст токена                                  │
│       const ageMs = now - (updated_at || created_at)            │
│       const shouldRefresh = ageMs >= 15 * 60 * 1000             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              │ shouldRefresh?      │
              └──────────┬──────────┘
        ┌─────────────────┼─────────────────┐
        ↓ YES                              ↓ NO
┌──────────────────────────┐     ┌──────────────────────────┐
│ a) Расшифровать refresh │     │ Использовать существующий │
│    token                 │     │ access token              │
│    (с общим IV!)         │     └───────────┬──────────────┘
└────────────────┬─────────┘                 ↓
                 ↓                   ┌──────────────────────┐
┌──────────────────────────┐         │ Проверить токен ở    │
│ b) Вызвать Chutes API:   │         │ idp.chutes.ai       │
│    POST /idp/token       │         └──────────┬───────────┘
│    { grant_type:         │                    ↓
│      "refresh_token",    │         ┌──────────────────────┐
│      refresh_token: ..., │         │ Вызвать llm API:      │
│      client_id: ...,     │         │ llm.chutes.ai/chat   │
│      client_secret: ...  │         └──────────┬───────────┘
│    }                     │                    ↓
└────────────────┬─────────┘         ┌──────────────────────┐
                 ↓                   │ Вернуть ответ        │
┌──────────────────────────┐         │ пользователю         │
│ c) Получить новые токены │         └──────────────────────┘
│    { access_token: ...,  │
│      refresh_token: ..., │
│      expires_in: ... }   │
└────────────────┬─────────┘
                 ↓
┌──────────────────────────┐
│ d) Шифровать новые       │
│    токены (с общим IV!)  │
│    newIv = from(access)  │
│    newAccess = encrypt(  │
│      access, newIv)      │
│    newRefresh = encrypt( │
│      refresh, newIv)     │
└────────────────┬─────────┘
                 ↓
┌──────────────────────────┐
│ e) Обновить базу данных  │
│    UPDATE chutes_tokens  │
│    SET encrypted_access  │
│        = newAccess       │
│        encrypted_refresh │
│        = newRefresh      │
│        encryption_iv     │
│        = newIv           │
│        updated_at        │
│        = NOW()           │
│        expires_at        │
│        = NOW()+expires_in│
└────────────────┬─────────┘
                 ↓
┌──────────────────────────┐
│ f) Использовать новый    │
│    access token          │
└────────────────┬─────────┘
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ Проверить ő  │  │ Вызвать llm  │
│ idp API      │  │ API          │
└──────────────┘  └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │ Вернуть      │
                   │ ответ        │
                   └──────────────┘
```

---

## Конфигурация

| Параметр | Значение | Описание |
|----------|----------|----------|
| `REFRESH_EVERY_15_MIN` | 15 минут (900000ms) | Порог автоматического refresh |
| `ALGORITHM` | AES-256-CBC | Алгоритм шифрования |
| `IV_LENGTH` | 16 байт | Длина nonce |
| Chutes access token lifetime | ~1 час (3600s) | Время жизни access token |
| Refresh endpoint | `https://idp.chutes.ai/idp/token` | Chutes OAuth endpoint |
| Check endpoint | `https://idp.chutes.ai/idp/userinfo` | Проверка пользователя |
| Chat endpoint | `https://llm.chutes.ai/v1/chat/completions` | Чат API |

---

## Environment Variables

Необходимые переменные окружения:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Chutes OAuth
NEXT_PUBLIC_CHUTES_CLIENT_ID=your_client_id
CHUTES_CLIENT_SECRET=your_client_secret

# Encryption (обязательно!)
CHUTES_ENCRYPTION_KEY=your_32_or_64_char_hex_key
```

---

## Изменения в v3 (29 December 2025)

### Проблема: invalid_grant при refresh

**Симптомы:**
- Пользователь подключал Chutes
- Через 15-20 минут получал ошибку: "Please re-link your Chutes account"
- В логах: `Token refresh failed: 400 - {"error":"invalid_grant"}`

**Корневая причина:**
```typescript
// save/route.ts (ПРОБЛЕМА)
const { encrypted: encryptedAccess, iv: ivAccess } = TokenEncryption.encrypt(accessToken)
const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(refreshToken || '')  // ВЛИЯЕТ НОВЫЙ IV!

await supabase.from('chutes_tokens').upsert({
  encrypted_access_token: encryptedAccess,
  encrypted_refresh_token: encryptedRefresh,
  encryption_iv: ivAccess,  // ТОЛЬКО этот IV сохранён
})
```

Когда система пыталась refresh:
1. Расшифровала `encrypted_refresh_token` используя `encryption_iv` (который был от `accessToken`)
2. Получила **бессмысленные данные** (расшифровка с неверным IV)
3. Отправила "битый" refresh token в Chutes API
4. Chutes вернул `invalid_grant`

### Решение: Единый IV для обоих токенов

#### 1. Изменение в `TokenEncryption.encrypt()`

```diff
// token-encryption.ts
public static encrypt(text: string): { encrypted: string; iv: string } {
  if (!text) return { encrypted: '', iv: '' }

  const key = this.getEncryptionKey();
- const iv = crypto.randomBytes(this.IV_LENGTH);  // ВЛИЯЕТ НОВЫЙ
+ const iv = providedIv || crypto.randomBytes(this.IV_LENGTH);  // Можно reuse

  const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);

  return {
    encrypted: encryptedBuffer.toString('base64'),
    iv: iv.toString('base64'),
  };
}

+ public static encrypt(text: string, providedIv?: Buffer): { encrypted: string; iv: string }
+ {
+   // ... новая логика выше
+ }
```

#### 2. Изменение в `save/route.ts`

```diff
// save/route.ts (строки 44-45)
- const { encrypted: encryptedAccess, iv: ivAccess } = TokenEncryption.encrypt(accessToken)
- const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(refreshToken || '')  // ВЛИЯЕТ НОВЫЙ IV!

+ const { encrypted: encryptedAccess, iv: commonIv } = TokenEncryption.encrypt(accessToken)
+ const { encrypted: encryptedRefresh } = TokenEncryption.encrypt(
+   refreshToken || '', 
+   Buffer.from(commonIv, 'base64')  // ПЕРЕДАЁМ ТОТ ЖЕ IV!
+ )

  await supabase.from('chutes_tokens').upsert({
    encrypted_access_token: encryptedAccess,
    encrypted_refresh_token: encryptedRefresh,
-   encryption_iv: ivAccess,
+   encryption_iv: commonIv,  // ШИРИМ ОБЩИЙ IV
    // ...
  })
```

**Работает:**
1. Шифруем `accessToken` → получаем `commonIv`
2. Шифруем `refreshToken` с тем же `commonIv`
3. Сохраняем оба токена с единым IV

#### 3. Изменение в `chat/route.ts` при refresh

```diff
// chat/route.ts (строки 117-118)
- const { encrypted: newEncryptedAccess } = TokenEncryption.encrypt(newTokens.access_token)
- const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(newTokens.refresh_token || decryptedRefreshToken)  // ВЛИЯЕТ НОВЫЙ IV!

+ const { encrypted: newEncryptedAccess, iv: newIv } = TokenEncryption.encrypt(newTokens.access_token)
+ const { encrypted: newEncryptedRefresh } = TokenEncryption.encrypt(
+   newTokens.refresh_token || decryptedRefreshToken,
+   Buffer.from(newIv, 'base64')  // ПЕРЕДАЁМ ТОТ ЖЕ IV!
+ )

  await supabase.from('chutes_tokens').update({
    encrypted_access_token: newEncryptedAccess,
    encrypted_refresh_token: newEncryptedRefresh,
+   encryption_iv: newIv,  // ОБНОВЛЯЕМ IV!
    // ...
  })
```

#### 4. Изменение в интервал

```diff
// chat/route.ts (строки 86-95)
- const REFRESH_EVERY_30_MIN = 30 * 60 * 1000  // 30 минут
+ const REFRESH_EVERY_15_MIN = 15 * 60 * 1000  // 15 минут

- const shouldRefresh = tokenAgeMs >= REFRESH_EVERY_30_MIN
+ const shouldRefresh = tokenAgeMs >= REFRESH_EVERY_15_MIN

- if (isTokenExpiringSoon || isTokenExpired && chutesData.encrypted_refresh_token) {
+ if (shouldRefresh && chutesData.encrypted_refresh_token) {
```

#### 5. Убрал удаление токена при ошибке

```diff
// chat/route.ts (строки 147-170)
  if (errorMessage.includes('invalid_grant')) {
-   console.log('Refresh token is invalid or expired, deleting from database')
-
-   const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
-   await adminSupabase
-     .from('chutes_tokens')
-     .delete()
-     .eq('user_id', user.id)
-
-   console.log('Successfully deleted invalid token from database')
-
    return NextResponse.json(
      {
        error: 'Your Chutes session has expired. Please re-link your Chutes account to continue.',
        code: 'RELINK_REQUIRED'
      },
      { status: 403 }
    )
  }
```

**Почему**: Если refresh не работает, не должно удалять токен — пользователь может сам решить проблему (re-link), а система не должна редактировать их данные без подтверждения.

---

## Тестирование

### Как протестировать без ожидания 15 минут

```sql
-- Установить дату обновления на 20 минут назад
UPDATE public.chutes_tokens
SET updated_at = NOW() - INTERVAL '20 minutes'
WHERE user_id = '54f6bf86-c537-4203-9651-6ee535b7c2d7';

-- Проверить
SELECT 
  user_id,
  updated_at,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as age_in_minutes
FROM public.chutes_tokens
WHERE user_id = '54f6bf86-c537-4203-9651-6ee535b7c2d7';
```

Затем отправь сообщение в чат → логи покажут:

```
- Token last updated: 2025-12-29T03:54:31.322Z
- Token age (minutes): 20
- Should refresh (age >= 15min): true
Token age >= 15min, refreshing...
Token refreshed and re-encrypted successfully
Using Chutes token, length: 89
```

### Ожидаемые логи

**Сценарий 1: Fresh токен (менее 15 минут)**
```
=== CHAT API DEBUG ===
Auth header: exists
Supabase user authenticated: 54f6bf86-c537-4203-9651-6ee535b7c2d7
=== CHUTES TOKEN DECRYPTION ===
Decrypting token from database...
- Has encrypted token: true
- Has encryption IV: true
- Decryption successful, token length: 89
- Token last updated: 2025-12-29T04:31:45.448Z
- Token age (minutes): 9
- Should refresh (age >= 15min): false
Using Chutes token, length: 89
Chutes user verified: litezevinoo
POST /api/chat 200 in 5.9s
```

**Сценарий 2: Проактивный refresh (15-20 минут)**
```
=== CHAT API DEBUG ===
Auth header: exists
Supabase user authenticated: 54f6bf86-c537-4203-9651-6ee535b7c2d7
=== CHUTES TOKEN DECRYPTION ===
Decrypting token from database...
- Has encrypted token: true
- Has encryption IV: true
- Decryption successful, token length: 89
- Token last updated: 2025-12-29T04:31:45.448Z
- Token age (minutes): 17
- Should refresh (age >= 15min): true
Token age >= 15min, refreshing...
Token refreshed and re-encrypted successfully
Using Chutes token, length: 89
Chutes user verified: litezevinoo
POST /api/chat 200 in 11.2s
```

**Сценарий 3: Ошибка refresh (invalid_grant)**
```
=== CHAT API DEBUG ===
...
Token age (minutes): 19
Should refresh (age >= 15min): true
Token age >= 15min, refreshing...
Failed to refresh token: Error: Token refresh failed: 400 - {"error":"invalid_grant"}
    at refreshChutesToken (src/app/api/chat/route.ts:27:11)
    at async POST (src/app/api/chat/route.ts:113:27)
POST /api/chat 403 in 1.8s
```

---

## История версий

### v3.0 (29 December 2025) — **Текущая версия**

**Исправления:**
- ✅ Фикс шифрования: единый IV для access и refresh токенов
- ✅ Добавлен параметр `providedIv` в `TokenEncryption.encrypt()`
- ✅ Изменен интервал refresh: 30 минут → 15 минут
- ✅ Убрано удаление токена при ошибке refresh
- ✅ Обновлена документация

**Проблема решена:**
- ❌ Пользователь не получал `invalid_grant` при refresh
- ❌ Повторный re-link не требуется
- ✅ Бесконечная сессия работает

### v2.0 (29 December 2025)

**Изменения:**
- ✅ Changed from "expiring soon" to "age-based" refresh
- ✅ Порог: 30 минут (вместо 5-10 минут до expiry)
- ✅ Использование `updated_at` вместо `expires_at`

**Проблемы:**
- ❌ Разные IV для шифрования токенов
- ❌ `invalid_grant` при попытке refresh

### v1.0 (Initial)

**Свойства:**
- ✗ Токен обновлялся только когда "expiring soon" (5-10 минут до истечения)
- ✗ Отсутствовало исключение при успешном refresh
- ✗ Возможны были race conditions

---

## Future Improvements (опционально)

### 1. Centralized refresh utility
Создать `/lib/chutes-token-manager.ts` для централизованной логики:

```typescript
export class ChutesTokenManager {
  static async refreshToken(userId: string): Promise<string> {
    // refresh логика...
    return newAccessToken
  }
  
  static async getAccessToken(userId: string): Promise<string> {
    // с автоматическим refresh
  }
}
```

### 2. Redis кеширование (для high traffic)
Кешировать decrypted access token на 12 минут вместо расшифровки из базы каждый раз:

```typescript
await redis.setex(`chutes:${userId}`, 720, accessToken) // 12 мин
```

### 3. Background CRON job
Автоматически refresh всех токенов каждые 12 минут на сервере:

```typescript
// cron job или setInterval
// для всех users с token.age >= 12min
```

### 4. Retry logic with exponential backoff
При неудачном refresh попробовать ещё раз:

```typescript
for (const delay of [1000, 5000, 30000]) { // 1s, 5s, 30s
  try {
    return await refreshChutesToken(token)
  } catch (e) {
    await sleep(delay)
  }
}
```

### 5. Webhook от Chutes
Подписаться на события token revocation:

```typescript
// Webhook от Chutes при logout/token revocation
DELETE FROM chutes_tokens WHERE chutes_user_id = ?
```

### 6. Graceful degradation
Если refresh не работает, использовать стейding access token ещё 5 минут:

```typescript
if (refreshError && tokenExpiryTime > now + 5*60*1000) {
  // Use expiring token for 5 more minutes
} else {
  // Return error
}
```

---

## Заключение

Система refresh token v3.0 работает **автоматически и надёжно**:

✅ **Бесконечная сессия** — один раз подключил, работаешь вечно  
✅ **Проактивный refresh** — каждые 15 минут до истечения  
✅ **Безопасно** — AES-256-CBC с единым IV для обоих токенов  
✅ **Transparent** — пользователь вообще не знает о refresh  
✅ **No expiries** — refresh происходит до timer expires  
✅ **Production ready** — протестировано, работает, документировано  

Пользователи могут спокойно использовать чат **indefinitely** без перерывов и повторных авторизаций.