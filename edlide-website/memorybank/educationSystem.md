# Education System

## Overview
Education page added to provide quick access to all main sections of the website.

## Page Location
- URL: `/education` (redirects to `/ru/education`)
- File: `src/app/[locale]/education/page.tsx`

## Structure
The education page is a hub page with cards linking to:
1. **Документация (Docs)** → `/docs` - Complete guide to Edlide IDE and CLI
2. **Скачать (Download)** → `/download` - Download Edlide for Windows or macOS  
3. **Цены (Pricing)** → `/pricing` - Choose plan: Starter, Pro, or Ultra
4. **Команда (Team)** → `/team` - Meet the Edlide team

## Navigation Order
Position in navbar (left to right):
1. Docs (Документация)
2. Download (Скачать)
3. Pricing (Цены)
4. Team (Команда)
5. **Education (Обучение)** ← last position

## Translations
Added to `messages/ru.json` and `messages/en.json`:
- `nav.education`: "Обучение" / "Education"
- `mobileMenu.education`: "Обучение" / "Education"  
- `education.*`: Page content with titles and descriptions for each section

## Files Modified
- `src/app/[locale]/education/page.tsx` - New education page
- `src/components/Navbar.tsx` - Added education link after Team
- `src/components/MobileMenu.tsx` - Added education link in mobile menu
- `messages/ru.json` - Added Russian translations
- `messages/en.json` - Added English translations
