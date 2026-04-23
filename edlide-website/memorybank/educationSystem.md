# Education System

## Overview
Education portal with activation code system. Users must activate a code on the account page to gain permanent access to the education portal. The education link in navbar and the education page itself are only visible/accessible to users with activated access.

## Activation System

### How It Works
1. Admin inserts activation codes into `education_codes` table in Supabase
2. User enters code on `/account` page in the "Education" section
3. API validates code → marks as used → creates `education_access` record
4. Access is permanent (forever) — no expiration
5. One code = one activation = one account

### Activation Flow
```
User enters code on /account
  → POST /api/education/activate { code, userId }
  → Check education_codes: code exists? not used?
  → Mark code as used (used_by, used_at)
  → Insert education_access record
  → Navbar shows "Education" link
  → /education page becomes accessible
```

## Database Schema (Supabase)

### Table: `public.education_codes`
```sql
CREATE TABLE public.education_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ
);
```
- `code` — unique activation code (e.g. "EDLIDE-EDU-2026-TEST")
- `used_by` — user who used the code (NULL = not used)
- `used_at` — when the code was used

### Table: `public.education_access`
```sql
CREATE TABLE public.education_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_by_code TEXT NOT NULL
);
```
- `user_id` — unique, one education access per user
- `activated_by_code` — which code was used for activation

### RLS Policies
- `education_codes`: service_role — full access, authenticated — SELECT
- `education_access`: service_role — full access, authenticated — SELECT own row (user_id = auth.uid())

### Indexes
- `idx_education_codes_code` on `code`
- `idx_education_access_user_id` on `user_id`

## API Endpoints

### POST `/api/education/activate`
- **Input**: `{ code: string, userId: string }`
- **Logic**: validates code exists & not used, checks user doesn't already have access, marks code as used, creates education_access record, rollback on failure
- **Errors**:
  - `Invalid activation code` — code not found
  - `This activation code has already been used` — code already claimed
  - `Education portal is already activated for this account` — user already has access

## UI Implementation

### Account Page — Education Card
Located at the bottom of `/account` page:
- **Not activated**: input field for activation code + "Activate" button, error messages for invalid/used codes
- **Activated**: green checkmark + "Education portal activated" + "Go to Education Portal" button (navigates to `/{locale}/education` using `useLocale()`)

### Navbar — Education Link
- Only shown when user has `education_access` record
- Both desktop (`Navbar.tsx`) and mobile (`MobileMenu.tsx`) menus
- Last position in navigation

### Education Page — Access Guard
- Checks `education_access` for current user
- No access → redirect to `/{locale}/account`
- Loading state while checking

### Important: Locale-Prefixed Navigation
All internal links from account page to education must use `/{locale}/education` (not `/education`) to avoid 404. The `useLocale()` hook provides the current locale.

## Page Location
- URL: `/education` (redirects to `/{locale}/education`)
- File: `src/app/[locale]/education/page.tsx`

## Current UI Architecture (Apr 23, 2026)

### Education Hub
- Route: `/{locale}/education`
- Shows 2 learning modules (Module 1 Website, Module 2 Mobile)
- Access guarded by `education_access` check
- Uses course data from `src/lib/course-data.ts`

### Module Page
- Route: `/{locale}/education/[moduleId]`
- Shows lessons for selected module
- Access guarded by `education_access` check

### Lesson Page
- Route: `/{locale}/education/[moduleId]/[lessonId]`
- Main video player + lesson topics sidebar
- Topic-to-topic navigation (previous/next)
- Video download protection UI controls enabled (`nodownload`, disable PiP/context menu)
- Access guarded by `education_access` check

## Course Structure (Current)

### Module 1
- Next.js, MCP, Memory Bank, Git
- 5 lessons

### Module 2
- Mobile development, React Native Expo, Store release flow
- 5 lessons

Course content is currently stored in `src/lib/course-data.ts`.

## Progress Tracking Status
- Supabase progress table is **not implemented/used** right now by request.
- UI currently shows static/manual progress note only.

## Components
- `src/components/education/VideoPlayer.tsx` — custom player UI + anti-download controls
- `src/components/education/CourseCard.tsx` — module card
- `src/components/education/LessonCard.tsx` — lesson card
- `src/components/education/TopicSidebar.tsx` — topic list sidebar

## Translations
Added to `messages/ru.json` and `messages/en.json`:
- `nav.education`: "Обучение" / "Education"
- `mobileMenu.education`: "Обучение" / "Education"
- `education.*`: Page content with titles and descriptions
- `education.module1Title`, `education.module1Desc`
- `education.module2Title`, `education.module2Desc`
- lesson/topic keys for module lessons (`education.lesson*`, `education.topic*`)
- UI labels: `education.lessonsLabel`, `education.topicsLabel`, `education.completedLabel`, `education.manualProgressNote`
- `account.educationTitle`: "Обучение" / "Education"
- `account.educationDesc`: "Активируйте доступ к порталу обучения" / "Activate your access to the education portal"
- `account.educationActivated`: "Портал обучения активирован" / "Education portal activated"
- `account.educationActivatedDesc`: "У вас есть полный доступ к порталу обучения" / "You have full access to the learning portal"
- `account.educationGoToPortal`: "Перейти к порталу обучения" / "Go to Education Portal"
- `account.educationCodePlaceholder`: "Введите код активации" / "Enter activation code"
- `account.educationActivate`: "Активировать" / "Activate"
- `account.educationActivating`: "Активация..." / "Activating..."
- `account.educationInvalidCode`: "Неверный код активации" / "Invalid activation code"
- `account.educationCodeUsed`: "Этот код активации уже использован" / "This activation code has already been used"
- `account.educationAlreadyActivated`: "Портал обучения уже активирован" / "Education portal is already activated"
- `account.educationActivationFailed`: "Ошибка активации. Попробуйте снова." / "Failed to activate. Please try again."

## Files Created / Modified

### Created
- `src/app/api/education/activate/route.ts` — Activation API endpoint

### Modified
- `src/app/account/_AccountContent.tsx` — Added Education card with activation form
- `src/app/[locale]/education/page.tsx` — Education hub with modules + access guard
- `src/app/[locale]/education/[moduleId]/page.tsx` — Module lessons page + access guard
- `src/app/[locale]/education/[moduleId]/[lessonId]/page.tsx` — Lesson player page + access guard
- `src/components/Navbar.tsx` — Conditional Education link (only with access)
- `src/components/MobileMenu.tsx` — Conditional Education link in mobile menu
- `src/lib/course-data.ts` — Education course data model and module/lesson/topic content
- `src/components/education/CourseCard.tsx`
- `src/components/education/LessonCard.tsx`
- `src/components/education/TopicSidebar.tsx`
- `src/components/education/VideoPlayer.tsx`
- `messages/ru.json` — Added account.education* translation keys
- `messages/en.json` — Added account.education* translation keys

### Supabase Migration
- `create_education_tables` — Creates education_codes + education_access tables with RLS and indexes
- No new migration for progress tracking (intentionally skipped for now)

### Bug Fix (Apr 23, 2026)
- "Go to Education Portal" button used `/education` without locale prefix → 404
- Fixed: `window.location.href = \`/${locale}/education\`` using `useLocale()` in `_AccountContent.tsx`

## Test Data
- Test activation code: `EDLIDE-EDU-2026-TEST` (inserted in database)
