# Localization System — Edlide IDE (EN / RU)

## Goal

Add EN/RU language switch to Edlide IDE. On Russian:
1. VSCode native UI restarts via `ILocaleService.setLocale()` (requires Russian Language Pack extension)
2. All Edlide-specific React UI strings are translated via `t(key, lang)`
3. Tool call labels in SidebarChat translated too
4. Sidebar action button tooltips ("New Chat", "View Past Chats", "Edlide's Settings") translated

## Russian Language Pack — Built-in (No Install Required)

**`extensions/ms-ceintl.vscode-language-pack-ru/`** — Russian Language Pack is bundled as a built-in extension.

- Source: `ms-ceintl.vscode-language-pack-ru-1.99.2025041609` (copied from `tmp-ext/`)
- Users do **not** need to install it manually from the marketplace
- No signature verification errors — it's treated as a system extension

**How it works automatically:**
1. `builtinExtensionsPath` points to `extensions/` folder (see `environmentService.ts:120`)
2. `LocalizationsUpdater` runs `update()` on every shared process start → scans all extensions including built-ins → finds `contributes.localizations[0].languageId = "ru"` → writes `languagepacks.json` with correct runtime paths
3. `getInstalledLanguages()` reads that file → returns the Russian pack
4. `LanguageDropdown` finds it → calls `localeService.setLocale()` → window restarts in Russian

**Build:** `build/lib/extensions.js` line ~402 uses `glob.sync('extensions/*/package.json')` — picks up all folders in `extensions/` automatically, no extra config needed.

## Architecture — Two Layers

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| VSCode native UI | `ILocaleService.setLocale()` → restart | Language pack bundled in `extensions/` |
| Edlide React UI | `t(key, lang)` from `translations.ts` | Custom dictionary, ~100 keys |

## Key Files

```
src/vs/workbench/contrib/void/
├── common/
│   ├── voidSettingsTypes.ts        — AppLanguage type, language field in GlobalSettings,
│   │                                 subTextMdOfProviderName(providerName, lang)
│   ├── translations.ts             — Full dictionary + t(key, lang) function
│   └── storageKeys.ts              — VOID_LANGUAGE_KEY = 'void.app.language'
│
├── browser/
│   ├── react/src/
│   │   ├── util/
│   │   │   └── services.tsx        — ILocaleService, ILanguagePackService added to reactAccessor
│   │   ├── void-settings-tsx/
│   │   │   ├── Settings.tsx        — LanguageDropdown component, all strings via t()
│   │   │   │                         ProjectRulesSection, ModelDump, OneClickSwitchButton,
│   │   │   │                         MCPServersList, SettingsForProvider — all use lang
│   │   │   ├── AccountSettingsSection.tsx — Connected as, Disconnect, Account Settings
│   │   │   └── ModelDropdown.tsx   — "Add a model" translated
│   │   └── sidebar-tsx/
│   │       └── SidebarChat.tsx     — getTitleOfBuiltinToolName(lang), _currentLang module var,
│   │                                 chat placeholder, "Previous Threads"
│   └── sidebarActions.ts           — _sidebarT(en, ru) reads localStorage at startup,
│                                     Action2 titles translated: New Chat, View Past Chats,
│                                     Edlide's Settings
```

## How Language is Stored

- **Encrypted settings** (`void.settingsServiceStorageII`): `globalSettings.language` — used by React components via `useSettingsState()`
- **Plain localStorage** (`void.app.language` = `VOID_LANGUAGE_KEY`): written in `LanguageDropdown.onChangeOption()` — readable by `sidebarActions.ts` before service init

## Language Change Flow

```
User selects language in Settings → LanguageDropdown.onChangeOption(newLang)
  1. voidSettingsService.setGlobalSetting('language', newLang)  ← encrypted storage
  2. localStorage.setItem(VOID_LANGUAGE_KEY, newLang)           ← plain storage for sidebarActions
  3. localeService.setLocale(ruPack) or clearLocalePreference() ← VSCode restart
  → Window restarts → sidebarActions reads localStorage → correct titles shown
```

## Getting `lang` in Components

Pattern used in every component that needs translation:
```tsx
const settingsState = useSettingsState()
const lang: AppLanguage = settingsState?.globalSettings?.language ?? 'en'
```

## translations.ts Keys — Full List

### Nav tabs
- `nav.account`, `nav.general`, `nav.actions`, `nav.models`, `nav.mcp`, `nav.rules`

### General section
- `general.oneClickSwitch`, `general.transferDesc`
- `general.transferFromVSCode`, `general.transferFromCursor`, `general.transferFromWindsurf`
- `general.transferFrom` — "Transfer from {0}" (use `.replace('{0}', fromEditor)`)
- `general.transferring`, `general.settingsTransferred`
- `general.builtinSettings`, `general.builtinSettingsDesc`
- `general.generalSettings`, `general.keyboardSettings`, `general.themeSettings`, `general.openLogs`
- `general.language`, `general.languageDesc`, `general.english`, `general.russian`

### Account section
- `account.privacySettings`, `account.privacyMode`, `account.privacyModeDesc`, `account.alwaysEnabled`
- `account.disconnect` — "Disconnect" / "Отключиться"
- `account.connectedAs` — "Connected as" / "Подключён как" (email appended manually)
- `account.accountSettings` — "Account Settings" / "Настройки аккаунта"

### Actions section
- `actions.title`, `actions.apply`, `actions.applyDesc`
- `actions.sameAsChatModel`, `actions.differentModel`
- `actions.tools`, `actions.toolsDesc`
- `actions.autoApproveEdits`, `actions.autoApproveTerminal`, `actions.autoApproveMCP`
- `actions.fixLintErrors`, `actions.autoAcceptLLMChanges`
- `actions.editor`, `actions.editorDesc`, `actions.showSuggestionsOnSelect`

### Models section
- `models.title`, `models.mainProviders`, `models.mainProvidersDesc`
- `models.addModel` — in Settings.tsx (+ icon)
- `models.addModelDropdown` — in ModelDropdown.tsx warning box

### MCP section
- `mcp.title`, `mcp.desc`, `mcp.addServer`
- `mcp.noServers` — "No servers found" / "Серверы не найдены"

### Rules section
- `rules.title`, `rules.desc`, `rules.systemPrompt`, `rules.systemPromptDesc`, `rules.projectRules`
- `rules.noFilesFound` — full .edliderules not found message

### Tool call titles (SidebarChat.tsx)
All tools: `.done`, `.proposed`, `.running` variants:
- `tool.readFile`, `tool.lsDir`, `tool.getDirTree`, `tool.searchPathnames`, `tool.searchFiles`
- `tool.createFile`, `tool.deleteFile`, `tool.editFile`, `tool.rewriteFile`
- `tool.runCommand`, `tool.openTerminal`, `tool.killTerminal`
- `tool.readLintErrors`, `tool.searchInFile`, `tool.analyzeImage`, `tool.searchWeb`
- `tool.mcp.called`, `tool.mcp.calling`, `tool.mcp.call`

### Chat UI
- `chat.placeholder` — "@ to mention, {0} Enter instructions..." (use `.replace('{0}', keybindStr)`)
- `chat.placeholderNoKeybind`
- `chat.previousThreads` — "Previous Threads" / "Предыдущие чаты"
- `chat.reasoning` — "Reasoning" / "Размышление" ( ReasoningWrapper in SidebarChat.tsx)

### Sidebar actions
- `sidebar.newChat`, `sidebar.viewPastChats`, `sidebar.settings`, `sidebar.hideSideBar`

### Provider API key hints
- `provider.getApiKey` — "Get your [API Key here]({0})." (use `.replace('{0}', url)`)
- `provider.rateLimits` — "Read about [rate limits here]({0})"

## SidebarChat.tsx — getTitleOfBuiltinToolName

`titleOfBuiltinToolName` was a static object. Replaced with:
```ts
let _currentLang: AppLanguage = 'en'

const getTitleOfBuiltinToolName = (lang: AppLanguage) => ({
  read_file: { done: t('tool.readFile.done', lang), proposed: t('tool.readFile.proposed', lang), running: t('tool.readFile.running', lang) },
  // ... all tools
})
```

`_currentLang` is updated at render time in the main `SidebarChat` component. All callers use `getTitleOfBuiltinToolName(_currentLang)`.

**Important**: one call at line ~3705 used the old name `titleOfBuiltinToolName` — fixed to `getTitleOfBuiltinToolName(_currentLang)`.

## sidebarActions.ts — Startup Language

```ts
import { VOID_LANGUAGE_KEY } from '../common/storageKeys.js'

const _sidebarLang = (): 'ru' | 'en' => {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(VOID_LANGUAGE_KEY) : null
    return v === 'ru' ? 'ru' : 'en'
  } catch { return 'en' }
}

const _sidebarT = (en: string, ru: string): string => _sidebarLang() === 'ru' ? ru : en
```

Used in Action2 constructors:
- `title: _sidebarT('New Chat', 'Новый чат')`
- `title: _sidebarT('View Past Chats', 'История чатов')`
- `title: _sidebarT("Edlide's Settings", 'Настройки Edlide')`

Works because window restarts on language change → `localStorage` already has new value.

## voidSettingsTypes.ts — subTextMdOfProviderName

Signature changed from `(providerName)` to `(providerName, lang: AppLanguage = 'en')`.

Uses `t('provider.getApiKey', lang).replace('{0}', url)` for anthropic, openAI, groq, xAI, gemini.

Caller in Settings.tsx passes `lang`: `subTextMdOfProviderName(providerName, lang)`.

## Settings.tsx — LanguageDropdown

Located in General tab at top. Reads current language from `globalSettings.language`.

On change:
1. Calls `voidSettingsService.setGlobalSetting('language', newLang)` — encrypted
2. Calls `localStorage.setItem(VOID_LANGUAGE_KEY, newLang)` — plain, for sidebarActions
3. For `ru`: finds Russian pack in `languagePackService.getInstalledLanguages()` → `localeService.setLocale(pack, true)`
4. For `en`: `localeService.clearLocalePreference()`

TypeScript fix: `installedLanguages.find((l: { id?: string }) => l.id === 'ru')` — `id` is `string | undefined` in `ILanguagePackItem`.

## AccountSettingsSection.tsx

Added imports: `useSettingsState`, `t`, `AppLanguage`.

Translated:
- `<h4>` title: `t('account.accountSettings', lang)`
- "Connected as {email}": `{t('account.connectedAs', lang)} {userEmail || 'Unknown'}`
- "Disconnect" button: `{t('account.disconnect', lang)}`

## VSCode Native Strings — _tr() pattern

For strings in VSCode native files (outside React, using `localize()`/`localize2()`), a lightweight helper is added at the top of each file:

```ts
const _isRu = (): boolean => {
    try { return typeof localStorage !== 'undefined' && localStorage.getItem('void.app.language') === 'ru'; } catch { return false; }
};
const _tr = (en: string, ru: string): string => _isRu() ? ru : en;
```

Works because window restarts on language change → localStorage already set → helper reads correct value at module init time.

### Files using _tr() pattern:

**`sidebarActions.ts`** (void/browser):
- Uses `VOID_LANGUAGE_KEY` import + `_sidebarT()` wrapper
- Translates: "New Chat", "View Past Chats", "Edlide's Settings"

**`voidSettingsPane.ts`** (void/browser):
- `title: { value: _tr("Edlide: Toggle Settings", "Edlide: Настройки"), original: "..." }`

**`auxiliaryBarActions.ts`** (workbench/browser/parts/auxiliarybar):
- `ToggleAuxiliaryBarAction.LABEL` → `{ value: _tr(...), original: ... }`
- `toggled.title` → `_tr('Hide Edlide Side Bar', 'Скрыть панель Edlide')`
- `title` in closeAuxiliaryBar action → `{ value: _tr(...), original: ... }`
- `title` in ViewContainerTitleContext menu item → `{ value: _tr(...), original: ... }`

**`auxiliaryBarPart.ts`** (workbench/browser/parts/auxiliarybar):
- `toAction label` → `_tr("Hide Edlide Side Bar", "Скрыть панель Edlide")`

Note: These files use plain `'void.app.language'` string literal (not `VOID_LANGUAGE_KEY` import) to avoid cross-module dependency.

## SidebarChat.tsx — Additional Translations

**Chat mode names** — `nameOfChatMode` and `detailOfChatMode` static objects replaced with functions:
```ts
const getNameOfChatMode = (lang: AppLanguage) => ({ 'ask': t('chatMode.ask', lang), ... })
const getDetailOfChatMode = (lang: AppLanguage) => ({ 'ask': t('chatMode.askDetail', lang), ... })
```
`ChatModeDropdown` reads `lang` from `useSettingsState()` and passes it.

**"Attach image"** tooltip — `VoidChatArea` component added `useSettingsState()` → `lang`, then `title={t('chat.attachImage', lang)}`.

**"to add a selection."** — placeholder text:
```ts
t('chat.placeholder', currentLang).replace('{0}', `${keybindingString} ${t('chat.toAddSelection', currentLang)}`)
```

**"tokens used"** — context bar tooltip:
```ts
t('chat.tokensUsed', currentLang).replace('{0}', currentTokens).replace('{1}', maxTokens) + (isApiVerified ? t('chat.apiVerified', currentLang) : '')
```

### New translation keys added:
- `chat.toAddSelection` — "to add a selection. " / "добавить выделение. "
- `chat.attachImage` — "Attach image" / "Прикрепить изображение"
- `chat.tokensUsed` — "{0} / {1} tokens used" / "{0} / {1} токенов использовано"
- `chat.apiVerified` — " (API verified)" / " (API подтверждён)"
- `chat.reasoning` — "Reasoning" / "Размышление"
- `chatMode.ask` / `chatMode.plan` / `chatMode.agent` — mode labels (same in both languages)
- `chatMode.askDetail` — "Answers only" / "Только ответы"
- `chatMode.planDetail` — "Plans with tools, no editing" / "Планирование с инструментами, без правок"
- `chatMode.agentDetail` — "Edits files and uses tools" / "Редактирует файлы и использует инструменты"

### ReasoningWrapper Translation

**SidebarChat.tsx** — The reasoning block header ("Reasoning") is now translated:

1. `AssistantMessageComponent` gets `lang` from `useSettingsState()`:
   ```ts
   const settingsState = useSettingsState()
   const lang: AppLanguage = settingsState?.globalSettings?.language ?? 'en'
   ```

2. Passes `lang` to `ReasoningWrapper`:
   ```tsx
   <ReasoningWrapper isDoneReasoning={isDoneReasoning} isStreaming={!isCommitted} lang={lang}>
   ```

3. `ReasoningWrapper` receives `lang` prop and uses `t()`:
   ```tsx
   const ReasoningWrapper = ({ isDoneReasoning, isStreaming, children, lang }: { ... lang: AppLanguage }) => {
     // ...
     return <ToolHeaderWrapper title={t('chat.reasoning', lang)} ...>
   ```

## Known Limitations

- `openAICompatible`, `googleVertex`, `microsoftAzure`, `awsBedrock` provider descriptions remain in English (complex markdown, low priority)
- "Connecting..." in AccountSettingsSection not translated (edge case state)
- `CHAT` label in sidebar panel header: `sidebarPane.ts:133` → `nls.localize2('voidChat', '')` — empty string, VSCode auto-generates "CHAT" from view name — not translatable this way
