# 🚀 Edlide Backend - Полная техническая документация и план (ЕДИНАЯ АВТОРИЗАЦИЯ)

## 📋 **TO-DO LIST - План реализации**

### ✅ **Phase 1: Foundation (3-4 дня)**
- [ ] Настроить Supabase проект
- [ ] Создать таблицы БД (users, chutes_accounts, subscriptions, usage_logs, user_sessions)
- [ ] Настроить Environment Variables
- [ ] Создать базовую структуру проекта
- [ ] Настроить локальную разработку

### ✅ **Phase 2: Unified Authentication (4-5 дней)**
- [ ] Реализовать `/api/auth/register` (единая регистрация)
- [ ] Реализовать `/api/auth/login` (единый вход для сайта и IDE)
- [ ] Создать JWT middleware для проверки токенов
- [ ] Реализовать `/api/auth/verify` для валидации токена
- [ ] Создать `/api/auth/logout` для выхода
- [ ] Добавить device_info отслеживание (Web vs IDE)
- [ ] Тестирование единой авторизации

### ✅ **Phase 3: Website Frontend (5-6 дней)**
- [ ] Создать Next.js сайт с edlide.com
- [ ] Реализовать главную страницу (Landing)
- [ ] Создать страницу `/pricing` с 3 тарифами
- [ ] Реализовать `/login` и `/register` страницы
- [ ] Создать `/dashboard` с UUID и статистикой
- [ ] Добавить `/profile` для управления аккаунтом
- [ ] Интегрировать Supabase Auth

### ✅ **Phase 4: Core API & Chutes Integration (4-5 дней)**
- [ ] Реализовать `/api/chat` прокси с JWT middleware
- [ ] Добавить систему дневных лимитов (100/2000/5000)
- [ ] Реализовать `/api/user/usage` для статистики
- [ ] Создать `/api/user/status` для IDE
- [ ] Добавить автоматический сброс daily counter
- [ ] Добавить логирование всех запросов
- [ ] Интегрировать Chutes API ключи

### ✅ **Phase 5: Payments & Subscriptions (3-4 дня)**
- [ ] Интегрировать Dodo Payments
- [ ] Создать webhook обработчик для платежей
- [ ] Реализовать автоматическое создание Chutes аккаунтов
- [ ] Добавить управление подписками
- [ ] Создать систему уведомлений в Telegram
- [ ] Тестирование платежного цикла

### ✅ **Phase 6: IDE Integration (3-4 дня)**
- [ ] Создать систему авторизации в IDE через JWT
- [ ] Реализовать UI для входа (email/password)
- [ ] Интегрировать `/api/chat` прокси в IDE
- [ ] Добавить отображение лимитов в IDE
- [ ] Создать настройки для управления аккаунтом
- [ ] Тестирование IDE + Backend интеграции

### ✅ **Phase 7: Admin & Monitoring (2-3 дня)**
- [ ] Создать `/api/admin/users` с полной статистикой
- [ ] Реализовать `/api/admin/chutes-keys` для управления API ключами
- [ ] Добавить `/api/admin/logs` для мониторинга
- [ ] Создать `/api/admin/subscription-management`
- [ ] Добавить basic auth для админки
- [ ] Создать простые админские страницы

### ✅ **Phase 8: Testing & Deploy (2-3 дня)**
- [ ] Написать тесты для всех эндпоинтов
- [ ] Load testing для /api/chat
- [ ] Деплой сайта на Vercel
- [ ] Деплой Supabase функций
- [ ] Мониторинг и логирование
- [ ] Финальное тестирование всей экосистемы

**Итого: 26-34 дня (~5-7 недель)**

---

## 🏗️ **Архитектура проекта**

```
edlide-ecosystem/
├── backend/
│   └── supabase/
│       ├── migrations/
│       │   ├── 001_create_users.sql
│       │   ├── 002_create_chutes_accounts.sql
│       │   ├── 003_create_subscriptions.sql
│       │   ├── 004_create_usage_logs.sql
│       │   └── 005_create_user_sessions.sql
│       ├── functions/
│       │   ├── auth/
│       │   │   ├── register.ts         # Единая регистрация
│       │   │   ├── login.ts            # Единый вход (сайт + IDE)
│       │   │   ├── verify.ts           # Проверка токена
│       │   │   └── logout.ts           # Выход
│       │   ├── chat/
│       │   │   ├── proxy.ts            # Прокси к Chutes AI
│       │   │   └── context.ts          # Контекст чата
│       │   ├── user/
│       │   │   ├── usage.ts            # Статистика использования
│       │   │   ├── status.ts           # Статус для IDE
│       │   │   └── profile.ts          # Управление профилем
│       │   ├── payments/
│       │   │   ├── dodo-webhook.ts     # Обработка платежей
│       │   │   ├── subscription-manager.ts
│       │   │   └── chutes-account-creator.ts
│       │   ├── admin/
│       │   │   ├── users.ts            # Управление пользователями
│       │   │   ├── chutes-keys.ts      # Управление API ключами
│       │   │   ├── logs.ts             # Логи и мониторинг
│       │   │   └── subscriptions.ts    # Управление подписками
│       │   └── middleware/
│       │       ├── auth.ts             # JWT middleware
│       │       ├── rate-limit.ts       # Проверка лимитов
│       │       └── logging.ts          # Логирование запросов
│       └── types/
│           └── database.ts
├── website/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx      # Личный кабинет
│   │   │   └── profile/page.tsx        # Профиль
│   │   ├── pricing/page.tsx            # Тарифы
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Landing
│   ├── components/
│   │   ├── auth/
│   │   ├── pricing/
│   │   ├── dashboard/
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── payments.ts
│   │   └── api.ts
│   └── types/
├── ide-integration/
│   ├── src/
│   │   ├── edlideAuth.ts               # Сервис авторизации IDE
│   │   ├── chatService.ts              # Интеграция с /api/chat
│   │   └── settingsUI.tsx              # UI для настроек
│   └── docs/
│       └── integration-guide.md
└── docs/
    ├── api-documentation.md
    ├── website-guide.md
    └── ide-integration.md
```

---

## 🗄️ **Supabase Database Schema**

### **Migration 1: Users table (единая авторизация)**
```sql
-- supabase/migrations/001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_last_login_idx ON users(last_login);
```

### **Migration 2: Chutes Accounts (привязка к провайдеру)**
```sql
-- supabase/migrations/002_create_chutes_accounts.sql
CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE account_status AS ENUM ('active', 'expired', 'suspended');

CREATE TABLE chutes_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chutes_api_key TEXT UNIQUE NOT NULL,
  chutes_email TEXT UNIQUE NOT NULL,
  subscription_plan subscription_plan NOT NULL,
  status account_status NOT NULL DEFAULT 'active',
  requests_per_day INTEGER NOT NULL, -- 100, 2000, 5000
  requests_used_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX chutes_accounts_user_id_idx ON chutes_accounts(user_id);
CREATE INDEX chutes_accounts_status_idx ON chutes_accounts(status);
CREATE INDEX chutes_accounts_expires_at_idx ON chutes_accounts(expires_at);
```

### **Migration 3: Subscriptions (история платежей)**
```sql
-- supabase/migrations/003_create_subscriptions.sql
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount INTEGER NOT NULL, -- в копейках/центах
  dodo_payment_id TEXT UNIQUE,
  chutes_account_id UUID REFERENCES chutes_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_dodo_payment_id_idx ON subscriptions(dodo_payment_id);
```

### **Migration 4: Usage Logs (статистика)**
```sql
-- supabase/migrations/004_create_usage_logs.sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chutes_account_id UUID REFERENCES chutes_accounts(id),
  chat_id TEXT,
  model TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 1,
  device_info TEXT, -- 'Edlide IDE Windows', 'Web Browser Chrome'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX usage_logs_user_id_idx ON usage_logs(user_id);
CREATE INDEX usage_logs_created_at_idx ON usage_logs(created_at);
CREATE INDEX usage_logs_chat_id_idx ON usage_logs(chat_id);
CREATE INDEX usage_logs_device_info_idx ON usage_logs(device_info);
```

### **Migration 5: User Sessions (JWT токены)**
```sql
-- supabase/migrations/005_create_user_sessions.sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  jwt_token TEXT UNIQUE NOT NULL,
  device_info TEXT, -- 'Edlide IDE Windows', 'Web Browser Chrome', 'iOS Safari'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX user_sessions_jwt_token_idx ON user_sessions(jwt_token);
CREATE INDEX user_sessions_expires_at_idx ON user_sessions(expires_at);
CREATE INDEX user_sessions_device_info_idx ON user_sessions(device_info);
```

---

## 🔐 **Unified Authentication Flow**

### **1. Единая регистрация (сайт + IDE)**
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt-token-here",
  "message": "User registered successfully"
}
```

### **2. Единый вход (сайт + IDE)**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "deviceInfo": "Edlide IDE Windows" // или "Web Browser Chrome"
}

Response (SUCCESS):
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "subscription": {
    "active": true,
    "plan": "pro",
    "requestsPerDay": 2000,
    "requestsUsedToday": 45,
    "expiresAt": "2024-12-01T23:59:59Z"
  },
  "token": "jwt-token-here",
  "message": "Login successful"
}

Response (NO SUBSCRIPTION):
{
  "success": true,
  "user": { ... },
  "subscription": {
    "active": false,
    "plan": null,
    "message": "No active subscription"
  },
  "token": "jwt-token-here",
  "message": "Login successful (no subscription)"
}

Response (INVALID CREDENTIALS):
{
  "success": false,
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

### **3. Проверка токена (для IDE)**
```
POST /api/auth/verify
Headers: {
  "Authorization": "Bearer jwt-token-here"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "subscription": {
    "active": true,
    "plan": "pro",
    "requestsPerDay": 2000,
    "requestsUsedToday": 45
  }
}

Response (INVALID TOKEN):
{
  "success": false,
  "error": "invalid_token",
  "message": "Token expired or invalid"
}
```

---

## 🌐 **Website Frontend Structure**

### **Next.js App Router структура:**
```
website/
├── app/
│   ├── layout.tsx                    # Главный layout с навигацией
│   ├── page.tsx                      # Landing page
│   ├── pricing/
│   │   └── page.tsx                  # Страница тарифов
│   ├── (auth)/
│   │   ├── layout.tsx                # Layout для авторизованных
│   │   ├── login/
│   │   │   └── page.tsx              # Вход
│   │   ├── register/
│   │   │   └── page.tsx              # Регистрация
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Личный кабинет
│   │   └── profile/
│   │       └── page.tsx              # Профиль
│   └── api/
│       └── auth/
│           ├── login/route.ts        # API route для логина
│           └── register/route.ts     # API route для регистрации
├── components/
│   ├── ui/                           # Базовые UI компоненты
│   ├── auth/                         # Компоненты авторизации
│   ├── pricing/                      # Карточки тарифов
│   ├── dashboard/                    # Dashboard компоненты
│   └── layout/                       # Navigation, Footer
├── lib/
│   ├── supabase.ts                   # Supabase клиент
│   ├── auth.ts                       # Auth функции
│   ├── api.ts                        # API запросы
│   └── utils.ts                      # Утилиты
└── types/
    └── auth.ts                       # TypeScript типы
```
