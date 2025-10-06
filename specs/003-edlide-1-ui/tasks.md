# Tasks: Edlide Native Provider

**Input**: Design documents from `/specs/003-edlide-1-ui/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/edlide-provider.yaml

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Found: Implementation plan with tech stack decisions
   → Extract: TypeScript, React, VSCode extension architecture
2. Load design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/edlide-provider.yaml: API contract → contract test task
   → research.md: Architecture decisions → setup tasks
3. Generate tasks by category:
   → Setup: TypeScript configuration, build verification
   → Tests: contract test for Edlide API
   → Core: provider types, model definitions, API integration
   → Integration: UI updates, service connections
   → Polish: build validation, testing, QA
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ Contract has test
   → ✅ Entities have model tasks
   → ✅ All endpoints implemented
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Verification
- [ ] T001 Verify current build state and TypeScript compilation
- [ ] T002 Build React components and clear out/ directory if needed

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Contract test for Edlide API /chat/completions endpoint in tests/contract/test_edlide_api.py

## Phase 3.3: Core Implementation (ONLY after tests are failing)
### Provider Type System
- [ ] T004 Add 'edlide' to defaultProviderSettings in src/vs/workbench/contrib/void/common/modelCapabilities.ts
- [ ] T005 Add Edlide models to defaultModelsOfProvider in src/vs/workbench/contrib/void/common/modelCapabilities.ts
- [ ] T006 Add display info for Edlide provider in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts
- [ ] T007 Add empty subtext for Edlide provider settings in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts

### API Integration
- [ ] T008 Add Edlide case to newOpenAICompatibleSDK in src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts
- [ ] T009 Add Edlide default settings with _didFillInProviderSettings in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts

### UI Integration
- [ ] T010 Add Edlide to "Add Model" exclude array in src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx (line 647)
- [ ] T011 Verify Edlide NOT in Main Providers exclude array in src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx (line 1007)

## Phase 3.4: Model Capabilities
- [ ] T012 Define model capabilities for Edlide models in src/vs/workbench/contrib/void/common/modelCapabilities.ts
- [ ] T013 Ensure proper context windows and token limits for Edlide models

## Phase 3.5: Integration & Testing
- [ ] T014 Build and verify TypeScript compilation after all changes
- [ ] T015 Build React components with npm run buildreact
- [ ] T016 Test Edlide provider visibility in UI (above Anthropic)
- [ ] T017 Test Edlide models appear and are enabled by default
- [ ] T018 Test Edlide NOT in "Add Model" dropdown
- [ ] T019 Test chat functionality with default Edlide model

## Phase 3.6: Polish & Validation
- [ ] T020 [P] Update Memory Bank documentation with Edlide provider integration
- [ ] T021 [P] Test error handling shows response body details
- [ ] T022 Verify all 4 Edlide models work correctly
- [ ] T023 Comprehensive QA validation for Edlide branding compliance
- [ ] T024 Performance validation (<2s response time)
- [ ] T25 Final build verification and cleanup

## Dependencies
- Setup (T001-T002) before all other tasks
- Tests (T003) before implementation (T004-T013)
- Core implementation (T004-T013) before integration (T014-T019)
- Integration before polish (T020-T025)

## Parallel Execution Groups

### Group 1: Setup (Can run in parallel)
```bash
# Launch T001-T002 together:
Task: "Verify current build state and TypeScript compilation"
Task: "Build React components and clear out/ directory if needed"
```

### Group 2: Contract Tests (Can run in parallel)
```bash
# Launch T003:
Task: "Contract test for Edlide API /chat/completions endpoint in tests/contract/test_edlide_api.py"
```

### Group 3: Core Implementation (Can run in parallel)
```bash
# Launch T004-T011 together:
Task: "Add 'edlide' to defaultProviderSettings in src/vs/workbench/contrib/void/common/modelCapabilities.ts"
Task: "Add Edlide models to defaultModelsOfProvider in src/vs/workbench/contrib/void/common/modelCapabilities.ts"
Task: "Add display info for Edlide provider in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts"
Task: "Add empty subtext for Edlide provider settings in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts"
Task: "Add Edlide case to newOpenAICompatibleSDK in src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts"
Task: "Add Edlide default settings with _didFillInProviderSettings in src/vs/workbench/contrib/void/common/voidSettingsTypes.ts"
Task: "Add Edlide to 'Add Model' exclude array in src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx"
Task: "Verify Edlide NOT in Main Providers exclude array in src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx"
```

### Group 4: Model Capabilities (Can run in parallel)
```bash
# Launch T012-T013 together:
Task: "Define model capabilities for Edlide models in src/vs/workbench/contrib/void/common/modelCapabilities.ts"
Task: "Ensure proper context windows and token limits for Edlide models"
```

### Group 5: Documentation (Can run in parallel)
```bash
# Launch T020-T021 together:
Task: "Update Memory Bank documentation with Edlide provider integration"
Task: "Test error handling shows response body details"
```

## Expected Final State

### Provider Configuration
- Edlide provider appears first in UI (above Anthropic)
- No API configuration fields visible to users
- All 4 models enabled by default: zai-org/GLM-4.6-turbo, deepseek-ai/DeepSeek-V3.2-Exp, deepseek-ai/DeepSeek-V3.1-Terminus, moonshotai/Kimi-K2-Instruct-0905
- zai-org/GLM-4.6-turbo selected as default model

### API Integration
- Hardcoded endpoint: https://llm.chutes.ai/v1/
- Hardcoded API key embedded in backend
- OpenAI-compatible SDK integration
- Proper error handling with response body display

### UI Restrictions
- Edlide excluded from "Add Model" dropdown
- Edlide visible in "Main Providers" section
- Models can be toggled on/off by users
- No credential modification possible

## Validation Checklist
- [x] Contract has corresponding test
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

## Success Criteria
### ✅ Complete When:
1. Edlide provider appears above Anthropic in UI
2. All 4 models are visible and enabled by default
3. Models work correctly in chat and other AI features
4. No API configuration fields shown to user
5. Edlide excluded from "Add Model" dropdown
6. Error handling shows response body details
7. Build compiles without errors
8. React UI updates correctly

---
**Generated**: 2025-10-06
**Feature**: Edlide Native Provider Implementation
**Total Tasks**: 25
**Parallel Tasks**: 17
**Estimated Effort**: 2-3 hours