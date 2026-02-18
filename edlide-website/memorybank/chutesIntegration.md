---
Docs

https://partner-api.chutes.ai/docs
So when you create a user, you'll get back an API key for that user as well which you can use to make requests. You'll also get back things like the fingerprint that can be used to recover the account.

That's the /users POST endpoint.

/codes POST allows you to create a subscription code for which tier you want. You are not charged for creating codes.
/codes/redeem POST allows you to redeem the code for an account, which is a billable event
creating a new user
curl -X 'POST' \
  'https://partner-api.chutes.ai/users' \
  -H 'accept: application/json' \
  -H 'X-API-Key: ide_qhpDVUGFGokpSUDHFOhaNWfE4ADCbfLO' \
  -d ''


{
  "username": "IDE_cg223jc3jlc",
  "user_id": "799d1879-8261-55e0-8b8f-3b2e9769b10f",
  "logo_id": null,
  "created_at": "2026-02-17T18:15:37.249282Z",
  "hotkey": "241a8f5bca51b503ea4a37293b0136f238da09016627c4d8",
  "coldkey": "5Fe63xCJVRp6szqD4kQ8JN7g1gYU1fqXqRyKJj9BgfWrMdNz",
  "payment_address": "5Fe63xCJVRp6szqD4kQ8JN7g1gYU1fqXqRyKJj9BgfWrMdNz",
  "fingerprint": "tKuB3haOEG4qd0P8zUriTZMbnJ9YSlX5",
  "api_key": {
    "api_key_id": "42b0a3bd-1d96-4efa-b7c6-08d35187793a",
    "user_id": "799d1879-8261-55e0-8b8f-3b2e9769b10f",
    "admin": true,
    "name": "IDE",
    "created_at": "2026-02-17T18:15:37.891495",
    "last_used_at": null,
    "scopes": [],
    "secret_key": "cpk_42b0a3bd1d964efab7c608d35187793a.799d1879826155e08b8f3b2e9769b10f.9F1xeaI24OMCN0ExJ0YhHDUl7s7AxpPS"
  },
  "logo": null
}

creating a base subscription code
curl -X 'POST' \
  'https://partner-api.chutes.ai/codes' \
  -H 'accept: application/json' \
  -H 'X-API-Key: ide_qhpDVUGFGokpSUDHFOhaNWfE4ADCbfLO' \
  -H 'Content-Type: application/json' \
  -d '{
  "tier": "base"
}'


{
  "code": "IDE-VOOK-0OQE-209Z",
  "tier": "base",
  "quota_amount": 300,
  "created_at": "2026-02-17T18:16:04.004719"
}

redeeming a code using the code and user id from the create user and create code steps
curl -X 'POST' \
  'https://partner-api.chutes.ai/codes/redeem' \
  -H 'accept: application/json' \
  -H 'X-API-Key: ide_qhpDVUGFGokpSUDHFOhaNWfE4ADCbfLO' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "IDE-VOOK-0OQE-209Z",
  "user_id": "799d1879-8261-55e0-8b8f-3b2e9769b10f"
}'


{
  "success": true,
  "user_id": "799d1879-8261-55e0-8b8f-3b2e9769b10f",
  "code": "IDE-VOOK-0OQE-209Z",
  "tier": "base",
  "quota_amount": 300,
  "redeemed_at": "2026-02-17T18:16:39.004458",
  "expires_at": "2026-03-21T18:16:39.004458",
  "message": "Successfully redeemed base code. Quota set to 300. Expires on 2026-03-21"
}

testing the account using the api key from the create user step after redeeming the subscription code
cxmplex@DESKTOP-T9BFEVV:~$ curl -X POST \
                https://llm.chutes.ai/v1/chat/completions \
                -H "Authorization: Bearer cpk_42b0a3bd1d964efab7c608d35187793a.799d1879826155e08b8f3b2e9769b10f.9F1xeaI24OMCN0ExJ0YhHDUl7s7AxpPS" \
        -H "Content-Type: application/json" \
        -d '  {
    "model": "Qwen/Qwen3-32B",
    "messages": [
      {
        "role": "user",
        "content": "Tell me a 250 word story."
      }
    ],
    "stream": true,
    "max_tokens": 1024,
    "temperature": 0.7
  }'
data: {"id":"0ff9d21adf1d458e9b24575c5b1b8115","object":"chat.completion.chunk","created":1771352259,"model":"Qwen/Qwen3-32B","choices":[{"index":0,"delta":{"role":"assistant","content":"","reasoning_content":null,"tool_calls":null},"logprobs":null,"finish_reason":null,"matched_stop":null}],"usage":null,"chutes_verification":"2b2b847d04afca72b5e532ce3b05feb2"}

cxmplex
 — 00:20
alternatively you do not need to use the API key that's given when the account is created, you can use oauth as well (check chutes api docs), but API key would be the simplest. You also do not need to create accounts if your use-case is different, the codes are not locked to those accounts only.


---

Контекст который в данный момент

У нас после того как пользователь зарегался он должен подключить аккаунт chutes ai так вот у нас полностью меняется логика в данный момент как видишь из логики свверху теперь нам нужно привязывать к каждому аккаунту edlide свой chutes api ключ если пользователь оплатил!

Такой план

1. Сначала убираем chutes ai integration который есть у нас в данный момент!

2. Делаем интеграцию Dodo payments! найди их документацию через context7 mcp


3. После того как человек оплатил подписку у нас автомаотически создается в бэкэнде аккаунт chutes ai пока тестовый мы в процессе теста то есть без настоящего продление и получения плана!

---

## Изменения от 18.02.2026

### Что сделано:

#### 1. Удалён старый Chutes OAuth integration
Удалены файлы и компоненты:
- `src/components/layout/chutes-auth-button.tsx` - удалён
- `src/components/auth/chutes-signin-button.tsx` - удалён (ссылка есть в import)
- `src/lib/chutes-auth.ts` - удалён
- `src/lib/chutes-integration.ts` - удалён
- `src/lib/chutes-token-manager.ts` - удалён
- `src/app/auth/chutes/callback/page.tsx` - удалён
- `src/app/api/auth/chutes/*` - все роуты удалены

Обновлены файлы (убраны ссылки на Chutes):
- `src/components/layout/supabase-auth-button.tsx` - убран import useChutesIntegration, убран Chutes link/unlink из dropdown
- `src/app/account/page.tsx` - убран ChutesSignInButton, убран useChutesIntegration
- `src/components/chat/ChatInterface.tsx` - убран useChutesIntegration
- `src/app/api/chat/route.ts` - убран ChutesTokenManager import
- `src/app/api/ai-proxy/[[...path]]/route.ts` - убран ChutesTokenManager import

#### 2. Создана Pricing страница
- Файл: `src/app/pricing/page.tsx`
- 3 тарифа: Starter ($6.99, 300 req/day), Pro ($19.99, 2000 req/day), Ultra ($34.99, 5000 req/day)
- Модели: GLM-4.7, Kimi-K2.5, Minimax-M2.5
- FAQ секция с 2 вопросами

#### 3. Обновлена навигация
- Файл: `src/components/Navbar.tsx`
- Добавлена ссылка /pricing
- Убран ChutesAuthButton

### Текущий статус:
- Pricing page: ✅ Готово
- Dodo Payments API: ⏳ Создан роут /api/payments/create-checkout но ПОКА НЕ ИСПОЛЬЗУЕТСЯ (пользователь удалил)
- Chutes Partner API integration: ⏳ Не сделано
- Webhook для платежей: ⏳ Не сделано

### Следующие шаги:
1. Подключить Dodo Payments (раскомментировать роут)
2. Создать webhook handler для обработки успешных платежей
3. При успешной оплате - автоматически создавать Chutes аккаунт через Partner API и привязывать к пользователю

---

## Как будет работать новая система:

1. Пользователь регистрируется на сайте
2. Пользователь оплачивает подписку через Dodo Payments
3. Webhook получает успешный платёж
4. На сервере создаём Chutes аккаунт через Partner API (/users POST)
5. Создаём код подписки (/codes POST) и редием его (/codes/redeem POST) (Критически важная информация делаем redim только в production для тестов в началае мы просто создаем аккаунт получаем api ключ к определенному пользователю)
6. Сохраняем Chutes API ключ (зашифрованный) в базу данных Supabase
7. При запросах к AI - используем API ключ пользователя из базы

Примечание: Критически важная информация делаем redim только в production для тестов в началае мы просто создаем аккаунт получаем api ключ к определенному пользователю

---

## Изменения от 18.02.2026 (продолжение)

### Реализованная интеграция Dodo Payments + Chutes

#### Созданные файлы:

1. **`src/app/api/payments/create-checkout/route.ts`**
   - Создаёт checkout сессию в Dodo Payments
   - Принимает productId, userId, userEmail
   - Возвращает checkout_url для редиректа на оплату

2. **`src/app/api/webhooks/dodo/route.ts`**
   - Webhook handler для Dodo Payments
   - URL: `https://edlide.com/api/webhooks/dodo`
   - Верифицирует подпись через DodoPayments SDK
   - Обрабатывает события: `payment.succeeded`, `subscription.active`
   - При успешной оплате:
     - Создаёт Chutes аккаунт через Partner API (/users POST)
     - В production: создаёт и редимит код подписки (/codes POST, /codes/redeem POST)
     - Сохраняет данные в Supabase таблицу subscriptions
   - Маппинг продуктов:
     - `prod_starter_monthly` → tier: base
     - `prod_pro_monthly` → tier: plus
     - `prod_ultra_monthly` → tier: pro

3. **Обновлён `src/app/pricing/page.tsx`**
   - Добавлен маппинг productId на Dodo product IDs
   - Передаёт dodoProductId в API

4. **Обновлён `src/app/account/page.tsx`**
   - Загружает подписку из Supabase при загрузке страницы
   - Показывает план подписки (base/plus/pro)
   - Показывает дату окончания подписки справа

#### Supabase таблица:

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'base',
  chutes_user_id TEXT,
  chutes_api_key TEXT,
  chutes_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Environment переменные:

```
DODO_PAYMENTS_API_KEY=eWdUruCeZ78u847f...
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_ysMA2zL
CHUTES_PARTNER_API_KEY=ide_qhp
```

#### Product IDs в Dodo:

- Starter: `pdt_0NX7tjKSxW7Dn1oGBdMbE`
- Pro: `pdt_0NX7uDmO6LQ1tZPva4I5A`
- Ultra: `pdt_0NX7uQKJc1elOk1df38G7`

#### Логика работы (текущая):

1. Пользователь выбирает план на /pricing
2. Нажимает "Subscribe Now"
3. Создаётся checkout сессия → редирект на оплату Dodo
4. После оплаты Dodo отправляет webhook
5. Webhook проверяет подпись, создаёт Chutes аккаунт
6. Данные сохраняются в subscriptions таблицу
7. На /account отображается план и дата окончания

#### Важно:

- **test_mode**: Chutes аккаунт создаётся, но код подписки НЕ редимится (только в production)
- **live_mode**: Полный цикл - создание аккаунта + redeem кода

---

## Новая система AI API (без OAuth)

### Удалённая логика (старый подход):
- ❌ Chutes OAuth flow (authorize, callback, token exchange)
- ❌ Шифрование токенов в базе (AES-256-CBC)
- ❌ Refresh токен каждые 15 минут
- ❌ Файлы: chutes-auth.ts, chutes-integration.ts, chutes-token-manager.ts
- ❌ Роуты: /auth/chutes/*, /api/auth/chutes/*

### Новый подход (API Key из подписки):

#### Файлы:

1. **`src/app/api/ai-proxy/[[...path]]/route.ts`**
   - Принимает запрос от IDE с API ключом пользователя
   - Проверяет подписку в таблице `subscriptions`
   - Получает `chutes_api_key` из подписки
   - Передаёт ключ в Edge Function через заголовок `x-chutes-api-key`

2. **`src/app/api/chat/route.ts`**
   - Проверяет подписку пользователя
   - Получает `chutes_api_key` из `subscriptions`
   - Проксирует запрос в Supabase Edge Function

3. **`src/components/chat/ChatInterface.tsx`**
   - Удалена логика Chutes account linking
   - Теперь просто проверяет авторизацию через Supabase

#### Supabase Edge Function (ai-proxy):
- Уже настроена принимать `x-chutes-api-key` заголовок
- Использует API ключ напрямую для запросов к Chutes AI

#### Как работает:

```
IDE → /api/ai-proxy (с edlide_xxx API ключом)
  ↓
Проверка сессии пользователя
  ↓
Запрос к subscriptions: SELECT chutes_api_key WHERE user_id = ?
  ↓
Получение Chutes API ключа (cpk_xxx...)
  ↓
Запрос к Edge Function с x-chutes-api-key: cpk_xxx...
  ↓
Edge Function → llm.chutes.ai (с Bearer cpk_xxx...)
  ↓
Ответ обратно в IDE
```

#### Преимущества:
- ✅ Никакого OAuth - простой API ключ
- ✅ Никакого refresh - ключ вечный
- ✅ API ключ и fingerprint зашифрованы в базе (AES-256-CBC)

### Supabase таблица (текущая):

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'base',
  chutes_user_id TEXT,  -- raw (не шифруем)
  chutes_api_key_encrypted TEXT,  -- зашифровано
  chutes_api_key_iv TEXT,         -- IV для дешифрования
  chutes_fingerprint_encrypted TEXT,  -- зашифровано
  chutes_fingerprint_iv TEXT,          -- IV для дешифрования
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Шифрование:

- Используется `CHUTES_ENCRYPTION_KEY` из .env
- Библиотека: `src/lib/token-encryption.ts`
- Метод: AES-256-CBC
- Сохраняем: encrypted + IV

### Удалённые файлы:

- `src/app/api/chat/route.ts` - удалён
- `src/components/chat/ChatInterface.tsx` - удалён
- `src/app/chat/page.tsx` - удалён
- `src/app/auth/chutes/*` - удалена папка
- `src/app/api/auth/chutes/*` - удалена папка
- `src/components/layout/chutes-auth-button.tsx` - удалён
- `src/components/auth/chutes-signin-button.tsx` - удалён

### Как дешифровать API ключ:

```typescript
import { TokenEncryption } from '@/lib/token-encryption'

const chutesApiKey = TokenEncryption.decrypt(
  subscription.chutes_api_key_encrypted,
  subscription.chutes_api_key_iv
)
```
- ✅ Никакого шифрования - ключ хранится как есть
- ✅ Автоматическое создание аккаунта при оплате

---

