# 🚀 Edlide Backend - Полная техническая документация и план

## 📋 **TO-DO LIST - План реализации**

### ✅ **Phase 1: Foundation (3-4 дня)**
- [ ] Настроить Supabase проект
- [ ] Создать таблицы БД
- [ ] Настроить Environment Variables
- [ ] Создать базовую структуру проекта
- [ ] Настроить локальную разработку

### ✅ **Phase 2: Authentication (3-4 дня)**  
- [ ] Реализовать `/api/auth/register`
- [ ] Реализовать `/api/ide/auth` (ключевой!)
- [ ] Добавить Google OAuth поддержку
- [ ] Создать middleware для проверки user_id
- [ ] Тестирование авторизации

### ✅ **Phase 3: Core API (4-5 дней)**
- [ ] Реализовать `/api/chat` прокси
- [ ] Добавить систему лимитов
- [ ] Реализовать `/api/user/usage`
- [ ] Реализовать `/api/chat/context`
- [ ] Добавить логирование usage

### ✅ **Phase 4: Payments (2-3 дня)**
- [ ] Интегрировать Dodo Payments
- [ ] Создать webhook обработчик
- [ ] Реализовать управление подписками
- [ ] Тестирование платежей

### ✅ **Phase 5: Admin & Monitoring (2-3 дня)**
- [ ] Создать `/api/admin/users`
- [ ] Создать `/api/admin/logs`
- [ ] Добавить basic auth для админки
- [ ] Создать простые админские страницы

### ✅ **Phase 6: Testing & Deploy (2-3 дня)**
- [ ] Написать тесты для всех эндпоинтов
- [ ] Load testing
- [ ] Деплой на Vercel/Render
- [ ] Мониторинг и логирование

**Итого: 16-22 дня (~3-4 недели)**

---

## 🏗️ **Архитектура проекта**

```
edlide-backend/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_subscriptions.sql
│   │   └── 003_create_usage_logs.sql
│   ├── functions/
│   │   ├── auth/
│   │   │   ├── register.ts
│   │   │   └── ide-auth.ts
│   │   ├── chat/
│   │   │   ├── proxy.ts
│   │   │   └── context.ts
│   │   ├── user/
│   │   │   ├── usage.ts
│   │   │   └── dashboard.ts
│   │   ├── payments/
│   │   │   ├── dodo-webhook.ts
│   │   │   └── subscription-manager.ts
│   │   └── admin/
│   │       ├── users.ts
│   │       └── logs.ts
│   └── types/
│       └── database.ts
├── frontend/ (простой сайт)
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   └── admin.tsx
│   └── components/
├── docs/
│   └── api-documentation.md
└── README.md
```

---

## 🗄️ **Supabase Database Schema**

### **Migration 1: Users table**
```sql
-- supabase/migrations/001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_google_id_idx ON users(google_id);
```

### **Migration 2: Subscriptions table**
```sql
-- supabase/migrations/002_create_subscriptions.sql
CREATE TYPE subscription_plan AS ENUM ('month', '3months', 'year');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'canceled');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  requests_limit INTEGER NOT NULL,
  requests_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_expires_at_idx ON subscriptions(expires_at);
```

### **Migration 3: Usage logs table**
```sql
-- supabase/migrations/003_create_usage_logs.sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_id TEXT,
  model TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX usage_logs_user_id_idx ON usage_logs(user_id);
CREATE INDEX usage_logs_created_at_idx ON usage_logs(created_at);
CREATE INDEX usage_logs_chat_id_idx ON usage_logs(chat_id);
```

---

## 🔐 **Authentication Flow**

### **1. Регистрация на сайте**
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user_id": "uuid-here",
  "message": "User registered successfully"
}
```

### **2. Авторизация в IDE (КЛЮЧЕВОЙ ЭНДПОИНТ!)**
```
POST /api/ide/auth
{
  "email": "user@example.com",
  "password": "password123"
}

Response (SUCCESS):
{
  "success": true,
  "user_id": "uuid-here",
  "subscription": {
    "active": true,
    "plan": "month",
    "requests_used": 45,
    "requests_limit": 1000,
    "expires_at": "2024-12-01T23:59:59Z"
  }
}

Response (NO SUBSCRIPTION):
{
  "success": false,
  "error": "no_active_subscription",
  "message": "User has no active subscription"
}

Response (INVALID CREDENTIALS):
{
  "success": false,
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

### **3. Google OAuth (опционально)**
```
GET /api/auth/google
→ Redirect to Google OAuth

GET /api/auth/google/callback?code=xxx
→ Create/find user, return user_id
```

---

## 🤖 **Chat API Implementation**

### **Основной прокси эндпоинт**
```
POST /api/chat
Headers: {
  "Authorization": "Bearer user_id",
  "Content-Type": "application/json"
}
Body: {
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "model": "zai-org/GLM-4.6-turbo",
  "stream": true,
  "chat_id": "optional-chat-uuid"
}

Response (SUCCESS):
{
  "choices": [
    {
      "message": {"role": "assistant", "content": "Hello! How can I help you?"}
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}

Response (NO SUBSCRIPTION):
{
  "error": "subscription_required",
  "message": "Active subscription required"
}

Response (LIMIT EXCEEDED):
{
  "error": "limit_exceeded", 
  "message": "Monthly request limit exceeded",
  "current_usage": 1000,
  "limit": 1000,
  "reset_date": "2024-12-01"
}
```

### **Usage tracking эндпоинт**
```
GET /api/user/usage
Headers: {
  "Authorization": "Bearer user_id"
}

Response:
{
  "requests_used": 45,
  "requests_limit": 1000,
  "requests_remaining": 955,
  "percentage_used": 4.5,
  "subscription_expires": "2024-12-01T23:59:59Z",
  "days_remaining": 15
}
```

### **Chat context эндпоинт**
```
GET /api/chat/context?chat_id=uuid-here
Headers: {
  "Authorization": "Bearer user_id"
}

Response:
{
  "chat_id": "uuid-here",
  "context_used": 2048,
  "context_limit": 8192,
  "percentage_used": 25,
  "message_count": 15
}
```

---

## 💳 **Dodo Payments Integration**

### **План подписок и лимиты**
```typescript
const SUBSCRIPTION_PLANS = {
  month: {
    name: "Monthly",
    price: 999, // в копейках/центах
    duration_days: 30,
    requests_limit: 1000
  },
  '3months': {
    name: "Quarterly", 
    price: 2499,
    duration_days: 90,
    requests_limit: 3000
  },
  year: {
    name: "Yearly",
    price: 8999,
    duration_days: 365,
    requests_limit: 12000
  }
};
```

### **Webhook обработчик**
```
POST /api/payments/dodo-webhook
Headers: {
  "Dodo-Signature": "signature"
}
Body: {
  "event": "payment.completed",
  "data": {
    "payment_id": "pay_uuid",
    "user_id": "user_uuid", 
    "plan": "month",
    "amount": 999,
    "status": "completed"
  }
}

Response: 200 OK
```

---

## 👨‍💼 **Admin API**

### **Получение пользователей**
```
GET /api/admin/users
Headers: {
  "Authorization": "Basic base64(admin:password)"
}

Response:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "subscription": {
        "plan": "month",
        "status": "active",
        "requests_used": 45,
        "requests_limit": 1000,
        "expires_at": "2024-12-01"
      },
      "created_at": "2024-11-01",
      "last_active": "2024-11-15"
    }
  ],
  "total": 150,
  "active_subscriptions": 120
}
```

### **Получение логов**
```
GET /api/admin/logs?limit=100&offset=0&user_id=uuid
Headers: {
  "Authorization": "Basic base64(admin:password)"
}

Response:
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "model": "zai-org/GLM-4.6-turbo",
      "tokens_used": 25,
      "created_at": "2024-11-15T10:30:00Z",
      "chat_id": "chat-uuid"
    }
  ],
  "total": 15000,
  "limit": 100,
  "offset": 0
}
```

---

## 🔧 **Environment Variables**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider
CHUTES_API_KEY=your-chutes-api-key
CHUTES_BASE_URL=https://llm.chutes.ai/v1

# Dodo Payments  
DODO_API_KEY=your-dodo-api-key
DODO_SECRET_KEY=your-dodo-secret-key
DODO_WEBHOOK_SECRET=your-webhook-secret

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password-here

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com
```

---

## 📝 **Core Implementation Details**

### **Middleware для проверки user_id**
```typescript
// supabase/functions/middleware/auth.ts
export const authenticateUser = async (req: Request): Promise<{user_id: string, subscription: any} | null> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const user_id = authHeader.replace('Bearer ', '');
  
  // Проверяем подписку
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .single();
    
  if (!subscription || error) {
    return null;
  }
  
  return { user_id, subscription };
};
```

### **Rate Limiting Logic**
```typescript
const checkRateLimit = async (user_id: string, subscription: any): Promise<boolean> => {
  if (subscription.requests_used >= subscription.requests_limit) {
    return false;
  }
  return true;
};

const incrementUsage = async (user_id: string, model: string, tokens: number) => {
  await supabase.rpc('increment_usage', {
    p_user_id: user_id,
    p_tokens_used: tokens
  });
};
```

### **Database Function для инкремента usage**
```sql
-- Database function для атомарного обновления
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_tokens_used INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions 
  SET requests_used = requests_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';
    
  INSERT INTO usage_logs (user_id, tokens_used)
  VALUES (p_user_id, p_tokens_used);
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// tests/auth.test.ts
describe('IDE Authentication', () => {
  test('should authenticate user with active subscription', async () => {
    const response = await fetch('/api/ide/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user_id).toBeDefined();
  });
  
  test('should reject user without subscription', async () => {
    // Test implementation
  });
});
```

### **Load Testing**
```typescript
// tests/load.test.ts
describe('Chat API Load Testing', () => {
  test('should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() => 
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user_id}` },
        body: JSON.stringify({ messages: [{role: 'user', content: 'test'}] })
      })
    );
    
    const responses = await Promise.all(promises);
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
});
```

---

## 🚀 **Deployment Plan**

### **Vercel Deployment**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add SUPABASE_URL
vercel env add CHUTES_API_KEY

# 4. Deploy
vercel --prod
```

### **Monitoring Setup**
```typescript
// supabase/functions/middleware/logging.ts
export const logRequest = async (user_id: string, endpoint: string, status: number) => {
  await supabase
    .from('request_logs')
    .insert({
      user_id,
      endpoint,
      status,
      created_at: new Date().toISOString()
    });
};
```

---

## 📊 **Frontend Integration Guide**

### **IDE Integration**
```typescript
// Edlide IDE - auth flow
const loginToEdlide = async (email: string, password: string) => {
  const response = await fetch('https://api.edlide.com/api/ide/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    // Сохраняем user_id в IDE settings
    await vscode.workspace.getConfiguration('edlide').update('userId', data.user_id);
    return data;
  } else {
    throw new Error(data.message);
  }
};

// Edlide IDE - chat request
const sendChatMessage = async (messages: any[], model: string) => {
  const userId = vscode.workspace.getConfiguration('edlide').get('userId');
  
  const response = await fetch('https://api.edlide.com/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userId}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, model })
  });
  
  if (response.status === 429) {
    const error = await response.json();
    // Показать пользователю сообщение о превышении лимита
    vscode.window.showErrorMessage(`Limit exceeded: ${error.message}`);
    return null;
  }
  
  return response.json();
};
```

### **Website Dashboard**
```typescript
// Website - dashboard component
const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUserData(await response.json());
    };
    
    fetchUserData();
    const interval = setInterval(fetchUserData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h1>Welcome, {userData?.user.email}</h1>
      <div className="usage-chart">
        <CircularProgress 
          value={userData?.subscription.percentage_used} 
          label={`${userData?.subscription.requests_remaining} requests left`}
        />
      </div>
      <p>Subscription expires: {new Date(userData?.subscription.expires_at).toLocaleDateString()}</p>
    </div>
  );
};
```

---

## 🎯 **Success Metrics & Monitoring**

### **Key Metrics to Track**
- Daily active users
- Subscription conversion rate  
- API request volume
- Error rates by endpoint
- Response times
- Revenue per user

### **Alerting Setup**
```typescript
// Alert if error rate > 5%
const checkErrorRate = async () => {
  const errorRate = await getErrorRate();
  if (errorRate > 0.05) {
    await sendAlert('High error rate detected');
  }
};
```

---

## 📋 **Final Implementation Checklist**

### **Pre-launch Checklist**
- [ ] All database migrations applied
- [ ] Environment variables configured
- [ ] All API endpoints tested
- [ ] Dodo Payments webhook configured
- [ ] Admin credentials set
- [ ] CORS configured for edlide.com
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] SSL certificate configured
- [ ] Monitoring setup

### **Post-launch Monitoring**
- [ ] API response times < 2s
- [ ] Error rate < 1%
- [ ] Database query performance
- [ ] Supabase usage limits
- [ ] Dodo Payments success rate
- [ ] User feedback collection

---

## 🔄 **Complete User Flow - Как всё будет работать**

### **Phase 1: Регистрация на сайте**
```
1. User заходит на edlide.com
2. Click "Sign Up" → вводит email/password
3. POST /api/auth/register → создаётся users запись
4. User логинится → POST /api/auth/login → получает JWT token
5. User выбирает план → redirect на Dodo Payments
6. Dodo обрабатывает платеж → webhook POST /api/payments/dodo-webhook
7. Создаётся subscriptions запись со статусом 'active'
8. User видит dashboard: "45/1000 requests used, expires Dec 1"
```

### **Phase 2: Авторизация в IDE**
```
1. User открывает Edlide IDE
2. Settings → Edlide Account → Login
3. IDE показывает диалог: email/password
4. IDE → POST /api/ide/auth с email/password
5. Backend проверяет users таблицу → находит user_id
6. Backend проверяет subscriptions таблицу → статус 'active'?
7. Response: {success: true, user_id: "uuid", subscription: {...}}
8. IDE сохраняет user_id в settings
9. IDE показывает: "✅ Logged in as user@example.com (45/1000 requests left)"
```

### **Phase 3: Использование AI в IDE**
```
1. User пишет сообщение в чате IDE
2. IDE → POST /api/chat с Authorization: Bearer user_id
3. Backend middleware проверяет user_id → находит subscription
4. Backend проверяет requests_used < requests_limit?
5. Если да → forward к Chutes AI
6. Chutes AI → response
7. Backend → UPDATE subscriptions SET requests_used = requests_used + 1
8. Backend → INSERT INTO usage_logs (user_id, model, tokens)
9. Response к IDE
10. IDE обновляет UI: "46/1000 requests left"
```

### **Phase 4: Real-time обновления**
```
IDE Dashboard (каждые 30 секунд):
GET /api/user/usage → {
  requests_used: 46,
  requests_limit: 1000,
  percentage_used: 4.6,
  days_remaining: 14
}

Chat Context (каждое сообщение):
GET /api/chat/context?chat_id=xxx → {
  context_used: 2048,
  context_limit: 8192,
  percentage_used: 25
}
```

### **Phase 5: Admin мониторинг**
```
Admin заходит на edlide.com/admin
Basic Auth: admin/secure-password

GET /api/admin/users → таблица всех пользователей
- email, plan, requests_used/limit, expires_at, status

GET /api/admin/logs → таблица всех запросов
- user_email, model, tokens_used, created_at, chat_id
```

---

**Готов к реализации! Этот план даёт нам полную дорожную карту от нуля до работающего бэкенда.**

**Следующий шаг: начинаем с Phase 1 - настройка Supabase проекта?** 🚀