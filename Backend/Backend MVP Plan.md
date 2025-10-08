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

### **Navigation компонент:**
```typescript
// components/layout/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('edlide_token');
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          }
        } catch {
          localStorage.removeItem('edlide_token');
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('edlide_token');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-black text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link href="/" className="text-2xl font-bold text-white">
            Edlide
          </Link>
          
          {/* Главное меню */}
          <div className="hidden md:flex space-x-8">
            <Link href="/features" className="text-gray-300 hover:text-white">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-300 hover:text-white">
              Docs
            </Link>
          </div>
          
          {/* Авторизация */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-white"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-300 hover:text-white"
                >
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white"
                >
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 💰 **Website Pricing Page**

```typescript
// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals',
    price: '$3',
    period: '/month',
    requestsPerDay: 100,
    chutesPlan: 'starter',
    features: [
      { text: '100 AI requests per day', included: true },
      { text: 'All AI models', included: true },
      { text: 'Basic support', included: true },
      { text: 'API access', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom integrations', included: false }
    ],
    highlighted: false
  },
  {
    name: 'Pro',
    description: 'Most popular for developers',
    price: '$10',
    period: '/month',
    requestsPerDay: 2000,
    chutesPlan: 'pro',
    features: [
      { text: '2,000 AI requests per day', included: true },
      { text: 'All AI models', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
      { text: 'Advanced features', included: true },
      { text: 'Custom integrations', included: false }
    ],
    highlighted: true
  },
  {
    name: 'Enterprise',
    description: 'For teams and power users',
    price: '$20',
    period: '/month',
    requestsPerDay: 5000,
    chutesPlan: 'enterprise',
    features: [
      { text: '5,000 AI requests per day', included: true },
      { text: 'All AI models', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'API access', included: true },
      { text: 'Advanced features', included: true },
      { text: 'Custom integrations', included: true }
    ],
    highlighted: false
  }
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePurchase = async (plan) => {
    const token = localStorage.getItem('edlide_token');
    if (!token) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan.chutesPlan,
          amount: plan.price.replace('$', '') * 100 // в центах
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Dodo Payments
        window.location.href = data.paymentUrl;
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto py-16 px-4">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include access to 
            all AI models and core Edlide features.
          </p>
        </div>

        {/* Карточки тарифов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border ${
                plan.highlighted 
                  ? 'border-blue-500 bg-gray-900' 
                  : 'border-gray-800 bg-gray-900'
              } p-8`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold">
                  {plan.price}
                  <span className="text-lg text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {plan.requestsPerDay} requests per day
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(plan)}
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ или дополнительная информация */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            All plans include full access to Edlide IDE and website
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ Cancel anytime</span>
            <span>✓ 30-day money back</span>
            <span>✓ No setup fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎛️ **Website Dashboard**

```typescript
// app/(auth)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const [userData, setUserData] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('edlide_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch('/api/user/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success) {
          setUserData(data.user);
          setUsage(data.usage);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Показать уведомление
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Loading...
    </div>;
  }

  if (!userData) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Please login to access dashboard
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {userData.firstName}!
          </h1>
          <p className="text-gray-400">
            Manage your Edlide subscription and usage
          </p>
        </div>

        {/* Статус подписки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Daily Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{usage?.requestsUsedToday || 0} used</span>
                    <span>{usage?.requestsPerDay} total</span>
                  </div>
                  <Progress 
                    value={(usage?.requestsUsedToday || 0) / (usage?.requestsPerDay) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Resets at midnight UTC
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold capitalize">
                  {userData.subscription?.plan || 'No Active Plan'}
                </p>
                {userData.subscription?.active ? (
                  <>
                    <p className="text-sm text-gray-400">
                      Expires: {new Date(userData.subscription.expiresAt).toLocaleDateString()}
                    </p>
                    <Button size="sm" variant="outline">
                      Manage Plan
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-red-400">
                      No active subscription
                    </p>
                    <Button size="sm" asChild>
                      <Link href="/pricing">Choose Plan</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Account Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-400">Email:</span> {userData.email}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Member since:</span>{' '}
                  {new Date(userData.createdAt).toLocaleDateString()}
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Интеграция с IDE */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              IDE Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400">
                Use your Edlide account to login to the desktop IDE
              </p>
              
              <div className="bg-black rounded-lg p-4">
                <h4 className="font-semibold mb-2">How to connect:</h4>
                <ol className="text-sm text-gray-300 space-y-1">
                  <li>1. Download and open Edlide IDE</li>
                  <li>2. Go to Settings → Account</li>
                  <li>3. Enter your email and password</li>
                  <li>4. Start using AI features!</li>
                </ol>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" size="sm">
                  Download IDE
                </Button>
                <Button variant="outline" size="sm">
                  View Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Недавняя активность */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Recent Activity
              <Button size="sm" variant="ghost">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usage?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-300">{activity.model}</span>
                    <span className="text-gray-500 ml-2">{activity.device}</span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🤖 **Chat API Implementation**

### **Основной прокси эндпоинт (с JWT middleware)**
```typescript
// supabase/functions/chat/proxy.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticateJWT } from '../middleware/auth.ts';
import { checkRateLimit } from '../middleware/rate-limit.ts';
import { incrementUsage } from '../middleware/logging.ts';

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Аутентификация через JWT
    const auth = await authenticateJWT(req);
    if (!auth) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Please login to use AI features'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { user, subscription } = auth;

    // Проверяем подписку
    if (!subscription || subscription.status !== 'active') {
      return new Response(
        JSON.stringify({
          error: 'subscription_required',
          message: 'Active subscription required. Please purchase a plan.',
          redirectUrl: 'https://edlide.com/pricing'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Проверяем дневной лимит
    const rateLimitCheck = await checkRateLimit(subscription);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'daily_limit_exceeded',
          message: `Daily limit exceeded (${rateLimitCheck.used}/${rateLimitCheck.limit})`,
          resetTime: 'tomorrow at 00:00 UTC'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages, model, stream = false, chat_id } = await req.json();

    // Форвардим запрос к Chutes AI
    const chutesResponse = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${subscription.chutes_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model,
        stream,
        max_tokens: 4096
      })
    });

    if (!chutesResponse.ok) {
      throw new Error(`Chutes API error: ${chutesResponse.status}`);
    }

    let responseText = '';
    let tokensUsed = 0;

    if (stream) {
      // Streaming response
      const reader = chutesResponse.body?.getReader();
      const encoder = new TextEncoder();
      
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              responseText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          } finally {
            // Логируем использование после завершения stream
            await incrementUsage(user.id, subscription.id, model, tokensUsed, req.headers.get('User-Agent') || 'Unknown');
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });

    } else {
      // Non-streaming response
      const chutesData = await chutesResponse.json();
      responseText = chutesData.choices[0].message.content;
      tokensUsed = chutesData.usage?.total_tokens || 0;

      // Логируем использование
      await incrementUsage(user.id, subscription.id, model, tokensUsed, req.headers.get('User-Agent') || 'Unknown');

      return new Response(
        JSON.stringify(chutesData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Chat proxy error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'Failed to process request'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### **Middleware для проверки лимитов**
```typescript
// supabase/functions/middleware/rate-limit.ts
export const checkRateLimit = async (subscription: any): Promise<{allowed: boolean, used: number, limit: number}> => {
  // Проверяем, нужно ли сбросить счетчик (новый день)
  const today = new Date().toISOString().split('T')[0];
  const lastReset = subscription.last_reset_date;
  
  if (lastReset !== today) {
    // Сбрасываем счетчик
    await supabase
      .from('chutes_accounts')
      .update({
        requests_used_today: 0,
        last_reset_date: today
      })
      .eq('id', subscription.id);
    
    return {
      allowed: true,
      used: 0,
      limit: subscription.requests_per_day
    };
  }
  
  const isAllowed = subscription.requests_used_today < subscription.requests_per_day;
  
  return {
    allowed: isAllowed,
    used: subscription.requests_used_today,
    limit: subscription.requests_per_day
  };
};

export const incrementUsage = async (
  userId: string, 
  chutesAccountId: string, 
  model: string, 
  tokens: number,
  deviceInfo: string
) => {
  // Атомарно увеличиваем счетчик использования
  await supabase.rpc('increment_daily_usage', {
    p_chutes_account_id: chutesAccountId
  });
  
  // Логируем запрос
  await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      chutes_account_id: chutesAccountId,
      model,
      tokens_used: tokens,
      device_info: deviceInfo,
      created_at: new Date().toISOString()
    });
};
```

### **Database функция для инкремента usage**
```sql
-- Database function для атомарного обновления дневного лимита
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_chutes_account_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE chutes_accounts 
  SET requests_used_today = requests_used_today + 1,
      updated_at = NOW()
  WHERE id = p_chutes_account_id 
    AND status = 'active'
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 💳 **Dodo Payments Integration**

### **Тарифы и лимиты**
```typescript
// lib/payments.ts
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    price: 300, // в копейках ($3.00)
    duration_days: 30,
    requests_per_day: 100,
    chutes_plan: 'month' // соответствует $3 плану Chutes
  },
  pro: {
    name: "Pro", 
    price: 1000, // в копейках ($10.00)
    duration_days: 30,
    requests_per_day: 2000,
    chutes_plan: 'pro' // соответствует $10 плану Chutes
  },
  enterprise: {
    name: "Enterprise",
    price: 2000, // в копейках ($20.00)
    duration_days: 30,
    requests_per_day: 5000,
    chutes_plan: 'enterprise' // соответствует $20 плану Chutes
  }
};
```

### **Webhook обработчик**
```typescript
// supabase/functions/payments/dodo-webhook.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createChutesAccount } from '../payments/chutes-account-creator.ts';
import { sendTelegramNotification } from '../notifications/telegram.ts';

serve(async (req) => {
  const signature = req.headers.get('Dodo-Signature');
  const body = await req.text();
  
  // Проверяем подпись
  const isValidSignature = await verifyWebhookSignature(body, signature);
  if (!isValidSignature) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  if (event.event === 'payment.completed') {
    const { user_id, plan, amount, payment_id } = event.data;
    
    try {
      // Обновляем статус подписки
      const { data: subscription } = await supabase
        .from('subscriptions')
        .update({ status: 'completed' })
        .eq('dodo_payment_id', payment_id)
        .select()
        .single();
      
      // Создаем аккаунт в Chutes
      const chutesAccount = await createChutesAccount(user_id, plan);
      
      // Привязываем Chutes аккаунт к подписке
      await supabase
        .from('subscriptions')
        .update({ chutes_account_id: chutesAccount.id })
        .eq('id', subscription.id);
      
      // Отправляем уведомление в Telegram
      await sendTelegramNotification({
        type: 'new_subscription',
        userEmail: event.data.user_email,
        plan,
        amount,
        chutesEmail: chutesAccount.email
      });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Processing failed', { status: 500 });
    }
  }
  
  return new Response('OK', { status: 200 });
});
```

### **Создание Chutes аккаунта**
```typescript
// supabase/functions/payments/chutes-account-creator.ts
export const createChutesAccount = async (userId: string, plan: string) => {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  
  // Генерируем email для Chutes аккаунта
  const chutesEmail = `user-${userId.slice(0, 8)}@edlide-user.com`;
  
  // Создаем аккаунт в Chutes (пока вручную через их API или интерфейс)
  // TODO: Интегрировать с Chutes API когда будет доступно
  const chutesApiKey = await createChutesAccountManual(chutesEmail, planConfig.chutes_plan);
  
  // Сохраняем в БД
  const { data: chutesAccount } = await supabase
    .from('chutes_accounts')
    .insert({
      user_id: userId,
      chutes_api_key: chutesApiKey,
      chutes_email: chutesEmail,
      subscription_plan: plan,
      status: 'active',
      requests_per_day: planConfig.requests_per_day,
      expires_at: new Date(Date.now() + planConfig.duration_days * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  
  return chutesAccount;
};

// Временная функция для ручного создания аккаунтов
const createChutesAccountManual = async (email: string, plan: string): Promise<string> => {
  // Здесь логика для создания аккаунта через Chutes панель
  // или API если будет доступно
  
  // Возвращаем тестовый ключ для разработки
  if (plan === 'month') {
    return 'cpk_starter_test_key';
  } else if (plan === 'pro') {
    return 'cpk_pro_test_key';
  } else {
    return 'cpk_enterprise_test_key';
  }
};
```

---

## 📱 **IDE Integration**

### **Сервис авторизации в IDE**
```typescript
// ide-integration/src/edlideAuth.ts
import { IStorageService } from 'vscode/platform/storage/common/storage.ts';

export class EdlideAuthService {
  private readonly EDLIDE_API_URL = 'https://api.edlide.com';
  private readonly storageKey = 'edlide.auth.token';
  
  constructor(
    @IStorageService private readonly storageService: IStorageService
  ) {}
  
  async login(email: string, password: string): Promise<{success: boolean, user?: any, error?: string}> {
    try {
      const response = await fetch(`${this.EDLIDE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Edlide IDE'
        },
        body: JSON.stringify({
          email,
          password,
          deviceInfo: 'Edlide IDE'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Сохраняем токен
        await this.storageService.store(this.storageKey, data.token);
        
        return {
          success: true,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }
  
  async logout(): Promise<void> {
    await this.storageService.remove(this.storageKey);
  }
  
  async getCurrentUser(): Promise<{user?: any, subscription?: any} | null> {
    const token = await this.storageService.get(this.storageKey);
    if (!token) return null;
    
    try {
      const response = await fetch(`${this.EDLIDE_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Edlide IDE'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          user: data.user,
          subscription: data.subscription
        };
      } else {
        // Токен невалидный, удаляем его
        await this.logout();
        return null;
      }
      
    } catch {
      return null;
    }
  }
  
  async getAuthToken(): Promise<string | null> {
    return await this.storageService.get(this.storageKey);
  }
}
```

### **UI для входа в IDE**
```typescript
// ide-integration/src/settingsUI.tsx
import * as vscode from 'vscode';
import { EdlideAuthService } from './edlideAuth.ts';

export class EdlideSettingsUI {
  private authService: EdlideAuthService;
  
  constructor(authService: EdlideAuthService) {
    this.authService = authService;
  }
  
  async showLoginDialog(): Promise<void> {
    const email = await vscode.window.showInputBox({
      prompt: 'Enter your Edlide email',
      placeHolder: 'user@example.com',
      validateInput: (value) => {
        if (!value.includes('@')) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    });
    
    if (!email) return;
    
    const password = await vscode.window.showInputBox({
      prompt: 'Enter your Edlide password',
      password: true,
      validateInput: (value) => {
        if (value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return null;
      }
    });
    
    if (!password) return;
    
    // Показываем прогресс
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Logging in to Edlide...',
      cancellable: false
    }, async (progress) => {
      const result = await this.authService.login(email, password);
      
      if (result.success) {
        vscode.window.showInformationMessage(
          `✅ Successfully logged in as ${result.user.email}`
        );
        
        // Обновляем UI
        this.updateAccountUI(result.user, result.subscription);
        
      } else {
        vscode.window.showErrorMessage(
          `❌ Login failed: ${result.error}`
        );
      }
    });
  }
  
  async showAccountPanel(): Promise<void> {
    const currentUser = await this.authService.getCurrentUser();
    
    if (!currentUser) {
      vscode.window.showInformationMessage(
        'Not logged in. Please login to your Edlide account.',
        'Login'
      ).then(selection => {
        if (selection === 'Login') {
          this.showLoginDialog();
        }
      });
      return;
    }
    
    this.updateAccountUI(currentUser.user, currentUser.subscription);
  }
  
  private updateAccountUI(user: any, subscription: any): void {
    // Создаем или обновляем Webview панель
    const panel = vscode.window.createWebviewPanel(
      'edlideAccount',
      'Edlide Account',
      vscode.ViewGroup.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    panel.webview.html = this.getAccountWebviewContent(user, subscription);
  }
  
  private getAccountWebviewContent(user: any, subscription: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edlide Account</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
          }
          .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
          }
          .status-active {
            color: var(--vscode-testing-iconPassed);
          }
          .status-inactive {
            color: var(--vscode-testing-iconFailed);
          }
          .usage-bar {
            background: var(--vscode-progressBar-background);
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
          }
          .usage-fill {
            background: var(--vscode-progressBar-foreground);
            height: 100%;
            transition: width 0.3s ease;
          }
          button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background: var(--vscode-button-hoverBackground);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Edlide Account</h1>
          <p>Email: <strong>${user.email}</strong></p>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <h3>Subscription Status</h3>
            <p class="${subscription?.active ? 'status-active' : 'status-inactive'}">
              ${subscription?.active ? '✅ Active' : '❌ Inactive'}
            </p>
            ${subscription?.active ? `
              <p>Plan: <strong>${subscription.plan}</strong></p>
              <p>Expires: ${new Date(subscription.expiresAt).toLocaleDateString()}</p>
            ` : `
              <p>No active subscription</p>
              <button onclick="window.open('https://edlide.com/pricing')">Choose Plan</button>
            `}
          </div>
          
          <div class="info-card">
            <h3>Daily Usage</h3>
            ${subscription?.active ? `
              <p>${subscription.requestsUsedToday} / ${subscription.requestsPerDay} requests</p>
              <div class="usage-bar">
                <div class="usage-fill" style="width: ${(subscription.requestsUsedToday / subscription.requestsPerDay) * 100}%"></div>
              </div>
              <p style="font-size: 12px; opacity: 0.7;">Resets at midnight UTC</p>
            ` : `
              <p>Subscribe to start using AI features</p>
            `}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.open('https://edlide.com/dashboard')">Open Dashboard</button>
          <button onclick="window.open('https://edlide.com/profile')">Manage Account</button>
        </div>
      </body>
      </html>
    `;
  }
}
```

---

## 👨‍💼 **Admin API**

### **Получение пользователей с полной статистикой**
```typescript
// supabase/functions/admin/users.ts
export const adminUsersHandler = async (req: Request) => {
  // Basic auth проверка
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const [username, password] = atob(authHeader.slice(6)).split(':');
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  
  // Получаем пользователей с полной информацией
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      chutes_accounts!left(
        id,
        subscription_plan,
        status,
        requests_per_day,
        requests_used_today,
        expires_at
      ),
      subscriptions!left(
        id,
        plan,
        status as payment_status,
        amount,
        created_at,
        expires_at
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
  
  // Получаем общую статистику
  const { data: stats } = await supabase
    .from('users')
    .select('id, chutes_accounts!left(status)')
    .order('created_at', { ascending: false });
  
  const totalUsers = stats?.length || 0;
  const activeSubscriptions = stats?.filter(u => 
    u.chutes_accounts?.some(ca => ca.status === 'active')
  ).length || 0;
  
  return Response.json({
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      subscription: user.chutes_accounts?.[0] ? {
        id: user.chutes_accounts[0].id,
        plan: user.chutes_accounts[0].subscription_plan,
        status: user.chutes_accounts[0].status,
        requestsPerDay: user.chutes_accounts[0].requests_per_day,
        requestsUsedToday: user.chutes_accounts[0].requests_used_today,
        expiresAt: user.chutes_accounts[0].expires_at,
        usagePercentage: Math.round((user.chutes_accounts[0].requests_used_today / user.chutes_accounts[0].requests_per_day) * 100)
      } : null,
      latestPayment: user.subscriptions?.[0] ? {
        plan: user.subscriptions[0].plan,
        amount: user.subscriptions[0].amount,
        status: user.subscriptions[0].payment_status,
        createdAt: user.subscriptions[0].created_at
      } : null
    })),
    pagination: {
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit)
    },
    summary: {
      totalUsers,
      activeSubscriptions,
      conversionRate: totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0
    }
  });
};
```

### **Управление Chutes API ключами**
```typescript
// supabase/functions/admin/chutes-keys.ts
export const chutesKeysHandler = async (req: Request) => {
  // Basic auth проверка...
  
  if (req.method === 'GET') {
    // Получаем все Chutes аккаунты
    const { data: accounts } = await supabase
      .from('chutes_accounts')
      .select(`
        *,
        users(email, first_name, last_name),
        subscriptions(plan, amount, created_at)
      `)
      .order('created_at', { ascending: false });
    
    return Response.json({
      accounts: accounts.map(account => ({
        id: account.id,
        userEmail: account.users.email,
        userName: `${account.users.first_name} ${account.users.last_name}`,
        chutesEmail: account.chutes_email,
        apiKey: account.chutes_api_key.slice(0, 10) + '...', // Скрываем полный ключ
        plan: account.subscription_plan,
        status: account.status,
        requestsPerDay: account.requests_per_day,
        requestsUsedToday: account.requests_used_today,
        usagePercentage: Math.round((account.requests_used_today / account.requests_per_day) * 100),
        createdAt: account.created_at,
        expiresAt: account.expires_at,
        lastPayment: account.subscriptions?.[0]
      }))
    });
  }
  
  if (req.method === 'POST') {
    // Добавляем новый API ключ для пользователя
    const { userId, chutesApiKey, plan } = await req.json();
    
    const { data: newAccount } = await supabase
      .from('chutes_accounts')
      .insert({
        user_id: userId,
        chutes_api_key: chutesApiKey,
        chutes_email: `user-${userId.slice(0, 8)}@edlide-user.com`,
        subscription_plan: plan,
        status: 'active',
        requests_per_day: SUBSCRIPTION_PLANS[plan].requests_per_day,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    return Response.json({
      success: true,
      account: newAccount
    });
  }
  
  if (req.method === 'PUT') {
    // Обновляем существующий аккаунт
    const { accountId, updates } = await req.json();
    
    const { data: updatedAccount } = await supabase
      .from('chutes_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();
    
    return Response.json({
      success: true,
      account: updatedAccount
    });
  }
};
```

---

## 📱 **Telegram Notifications**

```typescript
// supabase/functions/notifications/telegram.ts
interface TelegramNotification {
  type: 'new_subscription' | 'payment_failed' | 'account_created' | 'limit_warning';
  userEmail: string;
  plan?: string;
  amount?: number;
  chutesEmail?: string;
  error?: string;
}

export const sendTelegramNotification = async (notification: TelegramNotification) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured');
    return;
  }
  
  let message = '';
  
  switch (notification.type) {
    case 'new_subscription':
      message = `🎉 *New Subscription!*\n\n` +
        `👤 *User:* ${notification.userEmail}\n` +
        `💳 *Plan:* ${notification.plan}\n` +
        `💰 *Amount:* $${(notification.amount! / 100).toFixed(2)}\n` +
        `🔑 *Chutes Email:* ${notification.chutesEmail}\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}`;
      break;
      
    case 'payment_failed':
      message = `❌ *Payment Failed*\n\n` +
        `👤 *User:* ${notification.userEmail}\n` +
        `💳 *Plan:* ${notification.plan}\n` +
        `💰 *Amount:* $${(notification.amount! / 100).toFixed(2)}\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}`;
      break;
      
    case 'account_created':
      message = `👋 *New User Registered*\n\n` +
        `👤 *Email:* ${notification.userEmail}\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}`;
      break;
      
    case 'limit_warning':
      message = `⚠️ *User Near Daily Limit*\n\n` +
        `👤 *User:* ${notification.userEmail}\n` +
        `📊 *Usage:* ${notification.plan} plan\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}`;
      break;
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
```

---

## 🔧 **Environment Variables**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# Chutes AI
CHUTES_BASE_URL=https://llm.chutes.ai/v1

# Dodo Payments  
DODO_API_KEY=your-dodo-api-key
DODO_SECRET_KEY=your-dodo-secret-key
DODO_WEBHOOK_SECRET=your-webhook-secret

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=very-secure-password-here

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Security
CORS_ORIGIN=https://edlide.com,https://www.edlide.com
RATE_LIMIT_SECRET=rate-limit-secret

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 🧪 **Testing Strategy**

### **API Tests**
```typescript
// tests/api/auth.test.ts
describe('Authentication API', () => {
  test('POST /api/auth/register - successful registration', async () => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@example.com');
    expect(data.token).toBeDefined();
  });
  
  test('POST /api/auth/login - IDE login', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Edlide IDE'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        deviceInfo: 'Edlide IDE Windows'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.subscription).toBeDefined();
  });
  
  test('POST /api/auth/verify - token validation', async () => {
    // Сначала логинимся
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const { token } = await loginResponse.json();
    
    // Проверяем токен
    const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    expect(verifyResponse.status).toBe(200);
    const data = await verifyResponse.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@example.com');
  });
});

// tests/api/chat.test.ts
describe('Chat API', () => {
  let authToken: string;
  
  beforeEach(async () => {
    // Получаем токен для тестов
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const { token } = await loginResponse.json();
    authToken = token;
  });
  
  test('POST /api/chat - successful request with active subscription', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello!' }],
        model: 'zai-org/GLM-4.6-turbo'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices[0].message.content).toBeDefined();
  });
  
  test('POST /api/chat - rejected without subscription', async () => {
    // Создаем пользователя без подписки
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nosub@example.com',
        password: 'password123',
        firstName: 'No',
        lastName: 'Subscription'
      })
    });
    
    const { token } = await registerResponse.json();
    
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello!' }],
        model: 'zai-org/GLM-4.6-turbo'
      })
    });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('subscription_required');
  });
  
  test('POST /api/chat - daily limit exceeded', async () => {
    // Имитируем превышение лимита
    // TODO: Реализовать в зависимости от тестовой среды
  });
});
```

### **Load Testing**
```typescript
// tests/load/chat-load.test.ts
describe('Chat API Load Testing', () => {
  test('should handle 50 concurrent requests', async () => {
    const authToken = await getTestAuthToken();
    
    const promises = Array(50).fill(null).map((_, index) => 
      fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Test message ${index}` }],
          model: 'zai-org/GLM-4.6-turbo'
        })
      })
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    // Все запросы должны быть успешными
    expect(responses.every(r => r.status === 200)).toBe(true);
    
    // Время ответа должно быть приемлемым (< 10 секунд для 50 запросов)
    expect(endTime - startTime).toBeLessThan(10000);
    
    console.log(`Processed 50 requests in ${endTime - startTime}ms`);
  });
  
  test('should handle streaming responses under load', async () => {
    const authToken = await getTestAuthToken();
    
    const promises = Array(10).fill(null).map(() => 
      fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a long response' }],
          model: 'zai-org/GLM-4.6-turbo',
          stream: true
        })
      })
    );
    
    const responses = await Promise.all(promises);
    
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/event-stream');
      
      // Читаем stream
      const reader = response.body?.getReader();
      let chunks = 0;
      
      while (true) {
        const { done } = await reader!.read();
        if (done) break;
        chunks++;
      }
      
      expect(chunks).toBeGreaterThan(0);
    }
  });
});
```

---

## 🚀 **Deployment Plan**

### **Website Deployment (Vercel)**
```bash
# 1. Setup Next.js project
npx create-next-app@latest edlide-website --typescript --tailwind --app
cd edlide-website

# 2. Install dependencies
npm install @supabase/supabase-js lucide-react
npm install -D @types/node

# 3. Environment variables
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=https://api.edlide.com
EOF

# 4. Deploy to Vercel
npm install -g vercel
vercel link
vercel --prod
```

### **Supabase Functions Deployment**
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login and link project
supabase login
supabase link --project-ref your-project-ref

# 3. Deploy functions
supabase functions deploy auth/register --no-verify-jwt
supabase functions deploy auth/login --no-verify-jwt
supabase functions deploy auth/verify --no-verify-jwt
supabase functions deploy chat/proxy --no-verify-jwt
supabase functions deploy user/status --no-verify-jwt
supabase functions deploy payments/dodo-webhook --no-verify-jwt
supabase functions deploy admin/users --no-verify-jwt

# 4. Set environment variables
supabase secrets set JWT_SECRET=your-jwt-secret
supabase secrets set DODO_API_KEY=your-dodo-key
supabase secrets set TELEGRAM_BOT_TOKEN=your-telegram-token
supabase secrets set ADMIN_USERNAME=admin
supabase secrets set ADMIN_PASSWORD=secure-password
```

### **Domain Configuration**
```bash
# DNS Settings for edlide.com
A Record: @ -> Vercel IP (website)
A Record: api -> Supabase Edge Functions IP
CNAME Record: www -> edline.com
```

---

## 📊 **Frontend Integration Guide**

### **Website API Integration**
```typescript
// website/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.edlide.com';

export class EdlideAPI {
  private static getAuthHeaders() {
    const token = localStorage.getItem('edlide_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  // Auth endpoints
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  static async login(data: {
    email: string;
    password: string;
    deviceInfo?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('edlide_token', result.token);
    }
    
    return result;
  }
  
  static async logout() {
    localStorage.removeItem('edlide_token');
  }
  
  static async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    return response.json();
  }
  
  // User endpoints
  static async getUserStatus() {
    const response = await fetch(`${API_BASE_URL}/api/user/status`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    return response.json();
  }
  
  static async getUserUsage() {
    const response = await fetch(`${API_BASE_URL}/api/user/usage`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return response.json();
  }
  
  // Chat endpoint (для тестирования)
  static async chatRequest(messages: any[], model: string) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ messages, model })
    });
    
    return response.json();
  }
}
```

### **IDE Integration**
```typescript
// ide-integration/docs/integration-guide.md
# Edlide IDE Integration Guide

## Overview
Edlide IDE uses the same authentication system as the website. Users can login with their email/password and access AI features through your backend.

## Setup

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Configure EdlideAuthService
```typescript
import { EdlideAuthService } from './edlideAuth.ts';

// In your extension activation
const authService = new EdlideAuthService(storageService);
```

### 3. Add Login UI
```typescript
import { EdlideSettingsUI } from './settingsUI.tsx';

const settingsUI = new EdlideSettingsUI(authService);

// Add command for login
vscode.commands.registerCommand('edlide.login', () => {
  settingsUI.showLoginDialog();
});

// Add command for account panel
vscode.commands.registerCommand('edlide.account', () => {
  settingsUI.showAccountPanel();
});
```

### 4. Integrate Chat Service
```typescript
import { EdlideChatService } from './chatService.ts';

const chatService = new EdlideChatService(authService);

// Send message
const response = await chatService.sendMessage(messages, model);
```

## User Flow

1. User opens Edlide IDE
2. Goes to Settings → Account
3. Clicks "Login" 
4. Enters email/password (same as website)
5. Backend validates credentials
6. IDE receives JWT token
7. User can now use AI features
8. All requests go through your backend with proper rate limiting

## Error Handling

- Invalid credentials: Show error message
- No subscription: Redirect to pricing page
- Daily limit exceeded: Show usage info and reset time
- Network errors: Show retry option

## Security

- JWT tokens stored securely in VSCode storage
- Tokens expire after 7 days
- All requests use HTTPS
- No API keys exposed to users
```

---

## 🎯 **Complete User Flow - Как всё будет работать**

### **Phase 1: Регистрация на сайте**
```
1. User заходит на edlide.com
2. Click "Sign Up" → вводит email/password/firstName/lastName
3. POST /api/auth/register → создаётся users запись
4. User логинится → POST /api/auth/login → получает JWT token
5. User выбирает тариф на pricing странице → redirect на Dodo Payments
6. Dodo обрабатывает платеж → webhook POST /api/payments/dodo-webhook
7. Создаётся subscriptions запись + chutes_accounts запись
8. User видит dashboard со статистикой использования
9. Telegram уведомление: "🎉 New Subscription! User: email@domain.com Plan: pro"
```

### **Phase 2: Авторизация в IDE**
```
1. User открывает Edlide IDE
2. Settings → Account → Login
3. IDE показывает диалог: email/password
4. IDE → POST /api/auth/login с deviceInfo: "Edlide IDE"
5. Backend проверяет users таблицу → находит user_id
6. Backend проверяет chutes_accounts → статус 'active'?
7. Response: {success: true, user: {...}, subscription: {...}, token: "jwt"}
8. IDE сохраняет JWT token в settings
9. IDE показывает: "✅ Logged in as email@domain.com (45/2000 requests left)"
```

### **Phase 3: Использование AI в IDE**
```
1. User пишет сообщение в чате IDE
2. IDE → POST /api/chat с Authorization: Bearer jwt
3. Backend middleware проверяет JWT → находит user_id
4. Backend проверяет chutes_accounts → requests_used_today < requests_per_day?
5. Если да → forward к Chutes AI с их API ключом
6. Chutes AI → response
7. Backend → UPDATE chutes_accounts SET requests_used_today = requests_used_today + 1
8. Backend → INSERT INTO usage_logs (user_id, model, tokens, device_info)
9. Response к IDE
10. IDE обновляет UI: "46/2000 requests left"
```

### **Phase 4: Real-time обновления**
```
Website Dashboard (каждые 30 секунд):
GET /api/user/usage → {
  requestsUsedToday: 46,
  requestsPerDay: 2000,
  usagePercentage: 2.3,
  subscriptionExpires: "2024-12-01",
  daysRemaining: 15
}

IDE Account Panel (по кнопке "Refresh"):
POST /api/user/status → {
  user: {email, firstName, lastName},
  subscription: {
    active: true,
    plan: "pro",
    requestsUsedToday: 46,
    requestsPerDay: 2000,
    expiresAt: "2024-12-01"
  }
}
```

### **Phase 5: Admin мониторинг**
```
Admin заходит на api.edlide.com/admin/users
Basic Auth: admin/secure-password

GET /api/admin/users → таблица всех пользователей:
- email, firstName, lastName
- subscription: plan, status, usage, expires
- latestPayment: amount, date
- dailyUsageBar: визуализация использования

GET /api/admin/chutes-keys → управление API ключами:
- userEmail, chutesEmail, apiKey (masked)
- plan, status, daily usage
- кнопки: "Regenerate Key", "Suspend", "Extend"

POST /api/admin/chutes-keys → добавить новый ключ:
{
  "userId": "uuid",
  "chutesApiKey": "cpk_new_key_here",
  "plan": "pro"
}

→ Telegram уведомление: "🔑 New API key created for user@email.com"
```

### **Phase 6: Lifecycle Management**
```
Daily Reset (каждую ночь в 00:00 UTC):
- UPDATE chutes_accounts SET requests_used_today = 0
- UPDATE chutes_accounts SET last_reset_date = CURRENT_DATE

Expiration Check (каждый час):
- UPDATE chutes_accounts SET status = 'expired' WHERE expires_at < NOW()
- Отправка email уведомлений об истечении подписки

Usage Monitoring (каждые 5 минут):
- Проверка пользователей с 80%+ использованием
- Telegram уведомление: "⚠️ User near limit: email@domain.com (90% used)"
```

---

## 📋 **Final Implementation Checklist**

### **Pre-launch Checklist**
- [ ] Supabase проект настроен и migrations применены
- [ ] Environment variables сконфигурированы
- [ ] Все API эндпоинты реализованы и протестированы
- [ ] Dodo Payments webhook настроен и работает
- [ ] Telegram бот создан и токен получен
- [ ] Website на Next.js разработан и задеплоен
- [ ] IDE интеграция реализована
- [ ] Admin API работает с basic auth
- [ ] CORS настроен для edlide.com
- [ ] SSL сертификаты настроены
- [ ] Rate limiting протестирован
- [ ] Error handling реализован
- [ ] Logging и мониторинг настроены

### **Post-launch Monitoring**
- [ ] API response times < 2s для всех эндпоинтов
- [ ] Error rate < 1% для auth и chat эндпоинтов
- [ ] Database query performance оптимизирована
- [ ] Supabase usage limits в пределах нормы
- [ ] Dodo Payments success rate > 95%
- [ ] Telegram уведомления доставляются
- [ ] Daily reset работает корректно
- [ ] User feedback collection настроена

---

## 🚀 **Готов к реализации!**

Этот план даёт нам полную дорожную карту для создания:

✅ **Единой экосистемы** - сайт + IDE + бэкенд  
✅ **Единой авторизации** - email/password для всего  
✅ **Гибких тарифов** - 100/2000/5000 запросов в день  
✅ **Полного контроля** - управление Chutes ключами  
✅ **Мониторинга** - админ панель + Telegram  
✅ **Масштабируемости** - готовность к росту  

**Следующий шаг: начинаем с Phase 1 - настройка Supabase проекта?** 🎯