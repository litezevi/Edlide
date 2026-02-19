# Active Context: Edlide Website

## Current Focus
Dodo Payments переведён в production mode (live_mode) — **COMPLETE!**

### Dodo Payments Production Mode (Feb 19, 2026) ✅

**Что сделано:**

1. `.env.local`: `DODO_PAYMENTS_ENVIRONMENT` изменён с `"test_mode"` на `"live_mode"`
2. Все захардкоженные product IDs (`pdt_0NX7...`) вынесены в env переменные:
   - `EDLIDE_STARTER_PLAN_PRODUCT_ID`
   - `EDLIDE_PRO_PLAN_PRODUCT_ID`
   - `EDLIDE_ULTRA_PLAN_PRODUCT_ID`
3. `create-checkout/route.ts` переписан с raw `fetch` на DodoPayments SDK (`dodoClient.checkoutSessions.create()`) — raw fetch давал `Method Not Allowed` потому что URL `https://dodopayments.com/checkouts` — это frontend, а не API endpoint. SDK сам подставляет правильный URL.
4. Клиентские компоненты (`pricing/page.tsx`, `account/page.tsx`) больше не знают реальных `pdt_*` ID — передают только строковые алиасы (`prod_starter_monthly`, `prod_pro_monthly`, `prod_ultra_monthly`), серверные routes резолвят через `PRODUCT_ALIAS_MAP`.

**Файлы изменены:**
- `.env.local` — `live_mode` + env product IDs
- `src/app/api/payments/create-checkout/route.ts` — переписан на SDK
- `src/app/api/payments/change-plan/route.ts` — product IDs из env + alias resolve
- `src/app/api/payments/preview-change-plan/route.ts` — product IDs из env + alias resolve
- `src/app/api/webhooks/dodo/route.ts` — product IDs из env
- `src/app/pricing/page.tsx` — убран `PRODUCT_IDS` маппинг, передаёт только алиас
- `src/app/account/page.tsx` — `dodoProductId` теперь алиасы вместо `pdt_*`

**Для Vercel production deploy нужно добавить:**
- `DODO_PAYMENTS_ENVIRONMENT=live_mode`
- `DODO_PAYMENTS_API_KEY` = production ключ
- `DODO_PAYMENTS_WEBHOOK_SECRET` = production webhook secret
- `EDLIDE_STARTER_PLAN_PRODUCT_ID=pdt_0NX7tjKSxW7Dn1oGBdMbE`
- `EDLIDE_PRO_PLAN_PRODUCT_ID=pdt_0NX7uDmO6LQ1tZPva4I5A`
- `EDLIDE_ULTRA_PLAN_PRODUCT_ID=pdt_0NX7uQKJc1elOk1df38G7`

---

## Previous Work

### Scheduled Downgrade System (Feb 19, 2026) ✅
- Downgrade не вызывает Dodo сразу — записывает intent в DB
- При renewal webhook делает `changePlan` + Chutes redeem нового тира
- Cancel downgrade — очистка DB полей без Dodo вызова
- См. `memorybank/ChangePlan.md`

### Chutes Partner API Integration (Feb 18-19, 2026) ✅
- Автоматическое создание Chutes аккаунта при оплате
- Redeem кода подписки ВСЕГДА (и в test, и в live)
- Redeem при upgrade/downgrade/renewal
- См. `memorybank/chutesIntegration.md`

### Dodo Payments Integration (Feb 18, 2026) ✅
- Pricing page с 3 планами
- Checkout через Dodo SDK
- Webhook handler для всех событий
- Change plan (upgrade/downgrade)

## Project Status
**Phase**: Production payment system — **READY**
**Supabase Project**: `https://kvftejfolyrfdxppbcqk.supabase.co`
