/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { AppLanguage } from './voidSettingsTypes.js';

const translations = {
	// ── Settings navigation ──────────────────────────────────────────
	'nav.account': { en: 'Account', ru: 'Аккаунт' },
	'nav.general': { en: 'General', ru: 'Общие' },
	'nav.actions': { en: 'Actions', ru: 'Действия' },
	'nav.models': { en: 'Models', ru: 'Модели' },
	'nav.mcp': { en: 'MCP', ru: 'MCP' },
	'nav.rules': { en: 'Rules', ru: 'Правила' },

	// ── General section ──────────────────────────────────────────────
	'general.oneClickSwitch': { en: 'One-Click Switch', ru: 'Быстрый перенос' },
	'general.transferDesc': { en: 'Transfer your editor settings into Edlide.', ru: 'Перенесите настройки редактора в Edlide.' },
	'general.transferFromVSCode': { en: 'Transfer from VS Code', ru: 'Перенести из VS Code' },
	'general.transferFromCursor': { en: 'Transfer from Cursor', ru: 'Перенести из Cursor' },
	'general.transferFromWindsurf': { en: 'Transfer from Windsurf', ru: 'Перенести из Windsurf' },
	'general.builtinSettings': { en: 'Built-in Settings', ru: 'Встроенные настройки' },
	'general.builtinSettingsDesc': { en: 'IDE settings, keyboard settings, and theme customization.', ru: 'Настройки IDE, клавиатуры и оформления.' },
	'general.generalSettings': { en: 'General Settings', ru: 'Основные настройки' },
	'general.keyboardSettings': { en: 'Keyboard Settings', ru: 'Настройки клавиатуры' },
	'general.themeSettings': { en: 'Theme Settings', ru: 'Настройки темы' },
	'general.openLogs': { en: 'Open Logs', ru: 'Открыть логи' },
	'general.language': { en: 'Language', ru: 'Язык' },
	'general.languageDesc': { en: 'Interface language. Requires restart.', ru: 'Язык интерфейса. Требует перезапуска.' },
	'general.english': { en: 'English', ru: 'English' },
	'general.russian': { en: 'Русский', ru: 'Русский' },

	// ── Account section ──────────────────────────────────────────────
	'account.privacySettings': { en: 'Privacy Settings', ru: 'Настройки конфиденциальности' },
	'account.privacyMode': { en: 'Privacy Mode', ru: 'Режим приватности' },
	'account.privacyModeDesc': { en: 'Always on. No code or IDE activity collected. ', ru: 'Всегда включён. Код и активность в IDE не собираются. ' },
	'account.alwaysEnabled': { en: 'Always enabled', ru: 'Всегда включён' },
	'account.disconnect': { en: 'Disconnect', ru: 'Отключиться' },
	'account.connectedAs': { en: 'Connected as', ru: 'Подключён как' },
	'account.accountSettings': { en: 'Account Settings', ru: 'Настройки аккаунта' },

	// ── Actions section ──────────────────────────────────────────────
	'actions.title': { en: 'Actions', ru: 'Действия' },
	'actions.apply': { en: 'Apply', ru: 'Применение' },
	'actions.applyDesc': { en: 'Settings that control the behavior of the Apply button.', ru: 'Настройки кнопки «Применить».' },
	'actions.sameAsChatModel': { en: 'Same as Chat model', ru: 'Как модель чата' },
	'actions.differentModel': { en: 'Different model', ru: 'Другая модель' },
	'actions.tools': { en: 'Tools', ru: 'Инструменты' },
	'actions.toolsDesc': { en: 'Tools are functions that LLMs can call. Some tools require user approval.', ru: 'Инструменты — функции, которые могут вызывать LLM. Некоторые требуют подтверждения.' },
	'actions.autoApproveEdits': { en: 'Auto-approve edits', ru: 'Авто-одобрение правок' },
	'actions.autoApproveTerminal': { en: 'Auto-approve terminal', ru: 'Авто-одобрение терминала' },
	'actions.autoApproveMCP': { en: 'Auto-approve MCP tools', ru: 'Авто-одобрение MCP инструментов' },
	'actions.fixLintErrors': { en: 'Fix lint errors', ru: 'Исправлять lint-ошибки' },
	'actions.autoAcceptLLMChanges': { en: 'Auto-accept LLM changes', ru: 'Авто-принятие изменений LLM' },
	'actions.editor': { en: 'Editor', ru: 'Редактор' },
	'actions.editorDesc': { en: 'Settings that control the visibility of Edlide suggestions in the code editor.', ru: 'Настройки отображения подсказок Edlide в редакторе.' },
	'actions.showSuggestionsOnSelect': { en: 'Show suggestions on select', ru: 'Показывать подсказки при выделении' },

	// ── Models section ───────────────────────────────────────────────
	'models.title': { en: 'Models', ru: 'Модели' },
	'models.mainProviders': { en: 'Main Providers', ru: 'Основные провайдеры' },
	'models.mainProvidersDesc': { en: 'Edlide can access models from Anthropic, OpenAI, Gemini, Groq', ru: 'Edlide поддерживает модели от Anthropic, OpenAI, Gemini, Groq' },

	// ── MCP section ──────────────────────────────────────────────────
	'mcp.title': { en: 'MCP', ru: 'MCP' },
	'mcp.desc': { en: 'Use Model Context Protocol to provide Agent mode with more tools.', ru: 'Используйте Model Context Protocol для расширения инструментов агента.' },
	'mcp.addServer': { en: 'Add MCP Server', ru: 'Добавить MCP сервер' },

	// ── Rules section ────────────────────────────────────────────────
	'rules.title': { en: 'Rules', ru: 'Правила' },
	'rules.desc': { en: 'System instructions to include with all AI requests.', ru: 'Системные инструкции для всех запросов к AI.' },
	'rules.systemPrompt': { en: 'System Prompt', ru: 'Системный промпт' },
	'rules.systemPromptDesc': { en: 'Does not change when opening other projects. Ideal for communication style, explanation depth, etc.', ru: 'Не меняется при открытии других проектов. Подходит для стиля общения, глубины объяснений и т.д.' },
	'rules.projectRules': { en: 'Project Rules', ru: 'Правила проекта' },

	// ── Tool call titles ─────────────────────────────────────────────
	'tool.readFile.done': { en: 'Read file', ru: 'Прочитал файл' },
	'tool.readFile.proposed': { en: 'Read file', ru: 'Прочитать файл' },
	'tool.readFile.running': { en: 'Reading file', ru: 'Читает файл' },

	'tool.lsDir.done': { en: 'Inspected folder', ru: 'Проверил папку' },
	'tool.lsDir.proposed': { en: 'Inspect folder', ru: 'Проверить папку' },
	'tool.lsDir.running': { en: 'Inspecting folder', ru: 'Проверяет папку' },

	'tool.getDirTree.done': { en: 'Inspected folder tree', ru: 'Проверил дерево папок' },
	'tool.getDirTree.proposed': { en: 'Inspect folder tree', ru: 'Проверить дерево папок' },
	'tool.getDirTree.running': { en: 'Inspecting folder tree', ru: 'Проверяет дерево папок' },

	'tool.searchPathnames.done': { en: 'Searched by file name', ru: 'Поиск по имени файла' },
	'tool.searchPathnames.proposed': { en: 'Search by file name', ru: 'Искать по имени файла' },
	'tool.searchPathnames.running': { en: 'Searching by file name', ru: 'Ищет по имени файла' },

	'tool.searchFiles.done': { en: 'Searched', ru: 'Поиск выполнен' },
	'tool.searchFiles.proposed': { en: 'Search', ru: 'Поиск' },
	'tool.searchFiles.running': { en: 'Searching', ru: 'Ищет' },

	'tool.createFile.done': { en: 'Created', ru: 'Создал' },
	'tool.createFile.proposed': { en: 'Create', ru: 'Создать' },
	'tool.createFile.running': { en: 'Creating', ru: 'Создаёт' },

	'tool.deleteFile.done': { en: 'Deleted', ru: 'Удалил' },
	'tool.deleteFile.proposed': { en: 'Delete', ru: 'Удалить' },
	'tool.deleteFile.running': { en: 'Deleting', ru: 'Удаляет' },

	'tool.editFile.done': { en: 'Edited file', ru: 'Отредактировал файл' },
	'tool.editFile.proposed': { en: 'Edit file', ru: 'Редактировать файл' },
	'tool.editFile.running': { en: 'Editing file', ru: 'Редактирует файл' },

	'tool.rewriteFile.done': { en: 'Wrote file', ru: 'Записал файл' },
	'tool.rewriteFile.proposed': { en: 'Write file', ru: 'Записать файл' },
	'tool.rewriteFile.running': { en: 'Writing file', ru: 'Записывает файл' },

	'tool.runCommand.done': { en: 'Ran terminal', ru: 'Выполнил команду' },
	'tool.runCommand.proposed': { en: 'Run terminal', ru: 'Выполнить команду' },
	'tool.runCommand.running': { en: 'Running terminal', ru: 'Выполняет команду' },

	'tool.openTerminal.done': { en: 'Opened terminal', ru: 'Открыл терминал' },
	'tool.openTerminal.proposed': { en: 'Open terminal', ru: 'Открыть терминал' },
	'tool.openTerminal.running': { en: 'Opening terminal', ru: 'Открывает терминал' },

	'tool.killTerminal.done': { en: 'Killed terminal', ru: 'Закрыл терминал' },
	'tool.killTerminal.proposed': { en: 'Kill terminal', ru: 'Закрыть терминал' },
	'tool.killTerminal.running': { en: 'Killing terminal', ru: 'Закрывает терминал' },

	'tool.readLintErrors.done': { en: 'Read lint errors', ru: 'Прочитал lint-ошибки' },
	'tool.readLintErrors.proposed': { en: 'Read lint errors', ru: 'Прочитать lint-ошибки' },
	'tool.readLintErrors.running': { en: 'Reading lint errors', ru: 'Читает lint-ошибки' },

	'tool.searchInFile.done': { en: 'Searched in file', ru: 'Поиск в файле' },
	'tool.searchInFile.proposed': { en: 'Search in file', ru: 'Искать в файле' },
	'tool.searchInFile.running': { en: 'Searching in file', ru: 'Ищет в файле' },

	'tool.analyzeImage.done': { en: 'Analyzed image', ru: 'Проанализировал изображение' },
	'tool.analyzeImage.proposed': { en: 'Analyze image', ru: 'Анализировать изображение' },
	'tool.analyzeImage.running': { en: 'Analyzing image', ru: 'Анализирует изображение' },

	'tool.searchWeb.done': { en: 'Web Search Completed', ru: 'Веб-поиск завершён' },
	'tool.searchWeb.proposed': { en: 'Search the web', ru: 'Поиск в интернете' },
	'tool.searchWeb.running': { en: 'Searching the web...', ru: 'Ищет в интернете...' },

	// MCP tool descriptors
	'tool.mcp.called': { en: 'Called', ru: 'Вызвал' },
	'tool.mcp.calling': { en: 'Calling', ru: 'Вызывает' },
	'tool.mcp.call': { en: 'Call', ru: 'Вызвать' },

	// ── Chat UI ──────────────────────────────────────────────────────
	'chat.placeholder': { en: '@ to mention, {0} Enter instructions...', ru: '@ для упоминания, {0} Введите инструкции...' },
	'chat.placeholderNoKeybind': { en: '@ to mention. Enter instructions...', ru: '@ для упоминания. Введите инструкции...' },
	'chat.previousThreads': { en: 'Previous Threads', ru: 'Предыдущие чаты' },
	'chat.toAddSelection': { en: 'to add a selection. ', ru: 'добавить выделение. ' },
	'chat.attachImage': { en: 'Attach image', ru: 'Прикрепить изображение' },
	'chat.tokensUsed': { en: '{0} / {1} tokens used', ru: '{0} / {1} токенов использовано' },
	'chat.apiVerified': { en: ' (API verified)', ru: ' (API подтверждён)' },

	// ── Chat mode names ──────────────────────────────────────────────
	'chatMode.ask': { en: 'Ask', ru: 'Ask' },
	'chatMode.plan': { en: 'Plan', ru: 'Plan' },
	'chatMode.agent': { en: 'Agent', ru: 'Agent' },
	'chatMode.askDetail': { en: 'Answers only', ru: 'Только ответы' },
	'chatMode.planDetail': { en: 'Plans with tools, no editing', ru: 'Планирование с инструментами, без правок' },
	'chatMode.agentDetail': { en: 'Edits files and uses tools', ru: 'Редактирует файлы и использует инструменты' },

	// ── Sidebar actions ──────────────────────────────────────────────
	'sidebar.newChat': { en: 'New Chat', ru: 'Новый чат' },
	'sidebar.viewPastChats': { en: 'View Past Chats', ru: 'История чатов' },
	'sidebar.settings': { en: "Edlide's Settings", ru: 'Настройки Edlide' },
	'sidebar.hideSideBar': { en: 'Hide Edlide Side Bar', ru: 'Скрыть панель Edlide' },

	// ── Rules section – project rules ───────────────────────────────
	'rules.noFilesFound': {
		en: 'No .edliderules files were found. To create a project rule manually, make a .edliderules folder and add a example.edliderules file inside.',
		ru: 'Файлы .edliderules не найдены. Чтобы создать правило проекта вручную, создайте папку .edliderules и добавьте в неё файл example.edliderules.',
	},

	// ── Models section ───────────────────────────────────────────────
	'models.addModel': { en: 'Add a model', ru: 'Добавить модель' },
	'models.addModelDropdown': { en: 'Add a model', ru: 'Добавить модель' },

	// ── Transfer button ──────────────────────────────────────────────
	'general.transferFrom': { en: 'Transfer from {0}', ru: 'Перенести из {0}' },
	'general.transferring': { en: 'Transferring', ru: 'Переносим...' },
	'general.settingsTransferred': { en: 'Settings Transferred', ru: 'Настройки перенесены' },

	// ── MCP section ──────────────────────────────────────────────────
	'mcp.noServers': { en: 'No servers found', ru: 'Серверы не найдены' },

	// ── Account section ──────────────────────────────────────────────
	'account.connectedAsFull': { en: 'Connected as {0}', ru: 'Подключён как {0}' },

	// ── Provider API key hints ───────────────────────────────────────
	'provider.getApiKey': { en: 'Get your [API Key here]({0}).', ru: 'Получите ваш [API-ключ здесь]({0}).' },
	'provider.rateLimits': { en: 'Read about [rate limits here]({0})', ru: 'Подробнее об [ограничениях скорости]({0})' },
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, language: AppLanguage): string => {
	const entry = translations[key];
	if (!entry) return key;
	return entry[language] ?? entry['en'] ?? key;
};
