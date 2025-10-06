<!--
Sync Impact Report:
Version change: 1.0.0 → 2.0.0 (major update - current state reflection)
Modified principles: All 5 core principles updated for Edlide branding and current architecture
Added sections: Brand Integrity, Memory Bank Driven Development, Enhanced Governance
Removed sections: N/A
Templates requiring updates: ✅ plan-template.md (Brand Integrity checks added), ✅ tasks-template.md (Edlide paths updated), ✅ spec-template.md (branding requirements added)
Follow-up TODOs: N/A
-->

# Edlide IDE Constitution
<!-- Constitution for the Edlide IDE fork of Void/VSCode -->

## Core Principles

### I. AI Agent Integration
All features must preserve AI agent functionality when being modified or removed. AI integration is non-negotiable and includes: chat interface (Minimal, Ask, Agent modes), autocomplete with FIM models, Fast/Slow Apply functionality, and LLM message pipeline through `sendLLMMessageService`. Any UI modifications must maintain agent communication channels, MCP protocol support, and service integrity. Edlide's AI capabilities must remain the primary differentiator.

### II. Backend Service Separation with Dual Brand Architecture
Browser and main process separation must be maintained. Browser code cannot directly import node_modules; all node dependencies must flow through electron-main services with proper channel communication. This architecture prevents CSP issues and enables proper local provider support. **Critical**: All user-facing elements MUST display "Edlide" branding while all internal service architecture preserves "Void" naming (VoidSettingsService, IVoidModelService, etc.) for backend compatibility.

### III. Service-First Architecture with Memory Bank Integration
New functionality must be implemented as services before UI components. Services follow singleton pattern with dependency injection via `registerSingleton`. All data flow goes through services - no direct component-to-component data access. Settings, models, and providers must be managed through `voidSettingsService`. **Memory Bank Mandate**: All architectural decisions, workflows, and project context must be documented in `memoryBank/` directory. Read ALL memory bank files at the start of EVERY task.

### IV. React Component Integrity and Modern Build System
React components in `src/vs/workbench/contrib/void/browser/react/` maintain their own build system using `tsup` with esbuild. Any UI modifications must respect the build pipeline, Tailwind CSS styling, and component architecture. Components must remain self-contained with clear service boundaries and proper TypeScript integration. **Build Requirement**: Always run `npm run buildreact` after UI changes and clear `out/` directory if changes don't appear.

### V. DiffZone Management and Apply System
All code modifications must use the established DiffZone/DiffArea system for visual feedback. Fast Apply uses Search/Replace blocks for instant large-file changes, Slow Apply rewrites whole files for complex modifications. The `editCodeService` is the single source of truth for all code changes regardless of trigger source. Apply performance must remain sub-second for 1000+ line files.

### VI. Brand Integrity and User Experience
Complete separation between internal architecture and user-facing branding is mandatory. All visible UI elements, error messages, command names, and user communications MUST use "Edlide" branding exclusively. No "Void" references may appear in user interactions. This includes: settings titles ("Edlide's Settings"), error messages ("Edlide Error"), command palette entries ("Edlide: ActionName"), onboarding text ("Welcome to Edlide"), and all localize2 strings. Internal architecture preserves Void naming for compatibility.

### VII. Privacy-First Development and Local AI Support
Edlide must maintain direct provider communication without data retention intermediaries. Messages flow directly to AI providers (Anthropic, OpenAI, Google, Mistral, Ollama, etc.). Local AI providers (Ollama, LM Studio) must receive first-class support with auto-detection capabilities. No data collection or retention beyond local settings storage. All external communications must use HTTPS and proper authentication.

## Technology Constraints

### VSCode Base Compatibility (Version 1.99.3+)
Maintain VSCode extension ecosystem compatibility where possible. Browser/main/common organization must be respected. Actions/Commands registration follows VSCode patterns for keybind compatibility and user customization. Electron version locked at 34.3.2 for stability. TypeScript 5.8.0-dev with strict mode enabled throughout codebase.

### Model Integration and Provider Management
Provider and model management goes through `voidSettingsService`. `modelCapabilities.ts` must be updated for new models with proper token limits and capability flags. RefreshProvider pattern for dynamic model list updates. Support for 6+ major providers (Anthropic, OpenAI, Google, Mistral, Groq, Ollama) with local provider auto-detection. Model-specific SDKs managed through package.json dependencies.

### Communication Protocols and MCP Integration
LLM messages flow through `sendLLMMessageService` with proper main process handling. No direct browser-to-provider communication. All async operations must use proper cancellation tokens. **MCP Protocol**: Model Context Protocol for AI agent extensibility must be supported for third-party tool integration. Channel communication pattern preserved for browser/main process separation.

## Development Workflow

### Code Integrity and Service Contracts
All changes must preserve existing service contracts. Breaking changes require migration of dependent services and UI components. Service interfaces must be versioned and backward compatible where possible. **Memory Bank Integration**: All architectural decisions must be documented in `memoryBank/systemPatterns.md` and `memoryBank/activeContext.md`. Service contract changes must update `memoryBank/techContext.md`.

### Testing Requirements and QA Validation
Unit tests for services, integration tests for main/browser communication. UI components tested with their service dependencies. Model capability updates must include provider testing. **Comprehensive QA**: Major changes (especially branding or UI) must undergo independent QA validation using systematic file scanning and cross-validation. Document QA process in `memoryBank/tasks.md`.

### Performance Standards and Build Requirements
Fast Apply must remain fast for large files (sub-second for 1000+ lines). Diff computation should not block UI. Service initialization must not delay IDE startup. Memory usage monitored through `metricsService`. **React Build System**: UI changes require `npm run buildreact` and `out/` directory clearing for cache invalidation. Use `npm run watchreactd` for development iterations.

### .edliderules Integration and File System Management
Project rules must support both single `.edliderules` files and `.edliderules/` folder with multiple files. File system operations must use async patterns with proper error handling. VSCode integration via `_workbench.open` commands for new tab creation. Real-time file watching with 2-second polling for Settings UI updates.

## Governance

### Constitution Hierarchy and Amendment Process
This constitution supersedes all other practices. Amendments require impact analysis on AI functionality, service contracts, and UI integrity. All modifications must validate against existing test suites and AI integration points. **Memory Bank Mandate**: Constitution amendments must update `memoryBank/progress.md` and relevant memory bank files to maintain project context continuity.

### Feature Development Workflow (/specify System Integration)
New features must follow the `/specify` command system:
1. `/specify` - Create feature specification in `specs/` directory
2. `/plan` - Generate implementation plan with constitution validation
3. `/tasks` - Create actionable tasks from design documents
4. `/implement` - Execute all tasks following constitutional principles

All constitutional principles must be validated during `/plan` phase before implementation proceeds.

### Brand Integrity Compliance
Brand integrity (Principle VI) is non-negotiable. Any user-facing "Void" references constitute constitutional violations. Independent QA validation must be performed after all branding changes. Document QA processes in `memoryBank/tasks.md` for future reference.

### Version and Change Management
Constitution version follows semantic versioning:
- **MAJOR**: Fundamental principle changes or governance restructuring
- **MINOR**: New principles or significant constraint additions
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

All constitutional changes require:
1. Impact analysis on existing features
2. Memory bank documentation updates
3. Template synchronization validation
4. Test suite updates where applicable
5. Version bump justification documentation

**Version**: 2.0.0 | **Ratified**: 2025-01-04 | **Last Amended**: 2025-10-06
