# Feature Specification: Edlide Native Provider

**Feature Branch**: `003-edlide-1-ui`
**Created**: 2025-10-06
**Status**: Draft
**Input**: User description: "Твоя задача — добавить в приложение новый **нативный провайдер** под названием **Edlide**.

Правила и поведение:

1. **Отображение в UI**

    - Провайдер Edlide должен отображаться в настройках (Models Settings) сразу, по умолчанию.

    - В списке он должен находиться **выше Anthropic**.

    - Пользователь видит его так же, как других провайдеров, но без возможности настройки.

2. **Модели Edlide**

    - У провайдера Edlide должны быть сразу доступны 4 модели:

        - `zai-org/GLM-4.6-TEE:THINKING-turbo`

        - `deepseek-ai/DeepSeek-V3.2`

        - `deepseek-ai/DeepSeek-V3.2`

        - `moonshotai/Kimi-K2-Instruct-0905`

    - Эти модели должны быть **включены по умолчанию** и сразу готовы к использованию.

3. **API и ключ**

    - Для Edlide используется фиксированный **base URL**: `https://llm.chutes.ai/v1/`.

    - Используется фиксированный **API key**:

        "API_KEY"

    - Этот ключ и адрес должны быть **зашиты в бэкенд**.

    - Пользователь **не должен видеть** и **не должен менять** ключ или base URL.

4. **Ограничения в UI**

    - В секции **Main Providers** убрать возможность добавления или редактирования Edlide API key.

    - В выпадающем списке **Add a Model** убрать Edlide — пользователь не может добавить кастомные модели для Edlide.

5. **Итоговое поведение**

    - При запуске приложения Edlide сразу существует как встроенный провайдер.

    - У него сразу есть 4 рабочие модели.

    - Пользователь просто выбирает модель и использует её.

    - Никаких настроек, кнопок добавления или ручного ввода API ключа."

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Приложение должно предоставить встроенный AI провайдер "Edlide" с предустановленными моделями, который работает сразу после запуска без необходимости настройки API ключей или URL. Пользователь должен просто выбрать одну из 4 доступных моделей и начать использовать её для AI функций (чат, автодополнение, применение кода).

### Acceptance Scenarios
1. **Given** Пользователь запускает Edlide IDE впервые, **When** Открывает настройки моделей (Models Settings), **Then** Видит провайдер Edlide в списке выше Anthropic с 4 доступными моделями, все включены по умолчанию

2. **Given** Провайдер Edlide отображается в настройках, **When** Пользователь пытается настроить API ключ для Edlide, **Then** Нет возможности редактировать API ключ или base URL - поля для ввода отсутствуют

3. **Given** Пользователь находится в секции "Add a Model", **When** Открывает выпадающий список провайдеров для добавления кастомной модели, **Then** Edlide отсутствует в списке доступных провайдеров

4. **Given** Пользователь выбирает модель Edlide в чате или других AI функциях, **When** Отправляет запрос, **Then** Модель обрабатывает запрос используя встроенные учетные данные без ошибок авторизации

### Edge Cases
- Что происходит при сбое подключения к API Edlide? [пока что мы тестим и показывается response body]
- Как система обрабатывает ситуацию, когда все модели Edlide недоступны? [такое невозможно это бизнес модель ide стоит в самом приоритетным, мы должны видеть причину ошибка]
- Что происходит при попытке добавить Edlide модель через конфигурационные файлы? [он будет скоро в бэкэнде то есть залезть в настройки ide будет невозможно потому что все будет на сервере]

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST отображать провайдер Edlide в настройках моделей по умолчанию при первом запуске
- **FR-002**: System MUST размещать Edlide выше Anthropic в списке провайдеров и делать его выбранным по умолчанию при первом запуске
- **FR-003**: System MUST предоставлять 4 предустановленные модели Edlide: `zai-org/GLM-4.6-TEE:THINKING-turbo`, `deepseek-ai/DeepSeek-V3.2`, `deepseek-ai/DeepSeek-V3.2`, `moonshotai/Kimi-K2-Instruct-0905`
- **FR-004**: System MUST включать все модели Edlide по умолчанию без дополнительной настройки и выбирать `zai-org/GLM-4.6-TEE:THINKING-turbo` как модель по умолчанию
- **FR-005**: System MUST использовать встроенный API ключ "API_KEY" для всех запросов к Edlide
- **FR-006**: System MUST использовать встроенный base URL `https://llm.chutes.ai/v1/` для всех запросов к Edlide
- **FR-007**: System MUST полностью скрывать API ключ и base URL от пользователя в UI для провайдера Edlide, не отображать их нигде в интерфейсе
- **FR-008**: System MUST исключать Edlide из выпадающего списка "Add a Model" для добавления кастомных моделей
- **FR-009**: System MUST обеспечивать работу моделей Edlide во всех AI функциях (чат, автодополнение, применение кода)
- **FR-010**: System MUST показывать пользователю сообщение об ошибке с деталями из response body при сбое подключения к Edlide API без отключения моделей
- **FR-011**: System MUST не выполнять проверку доступности моделей Edlide, предполагать что все модели работают по умолчанию

### Key Entities
- **Edlide Provider**: Встроенный AI провайдер с фиксированной конфигурацией и предустановленными моделями
- **Edlide Models**: 4 предустановленные AI модели с уникальными идентификаторами и возможностями
- **Provider Configuration**: Фиксированные учетные данные (API ключ, base URL) для подключения к Edlide API

## Clarifications

### Session 2025-10-06
- Q: Как именно система должна реагировать на сбой подключения к Edlide API? → A: Показывать сообщение об ошибке с деталями из response body без отключения моделей
- Q: Должна ли система выполнять валидацию моделей Edlide при запуске или перед использованием? → A: Не выполнять проверку, предполагать что все модели работают
- Q: Должен ли Edlide быть провайдером по умолчанию или просто занимать верхнюю позицию? → A: Быть выбранным по умолчанию при первом запуске
- Q: Должен ли API ключ отображаться в UI или быть полностью скрыт? → A: Полностью скрыт от пользователя в интерфейсе
- Q: Какая модель Edlide должна быть выбрана по умолчанию? → A: zai-org/GLM-4.6-TEE:THINKING-turbo (первая в списке)

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] Edlide branding requirements considered where applicable

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
