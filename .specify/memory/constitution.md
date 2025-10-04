<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (initial creation)
Modified principles: N/A (new constitution)
Added sections: All sections
Removed sections: N/A
Templates requiring updates: ✅ plan-template.md, ✅ tasks-template.md, ✅ spec-template.md (validated)
Follow-up TODOs: N/A
-->

# Edlide IDE Constitution
<!-- Constitution for the Edlide IDE fork of Void/VSCode -->

## Core Principles

### I. AI Agent Integration
All features must preserve AI agent functionality when being modified or removed. AI integration is non-negotiable and includes: chat interface, autocomplete, apply functionality, and LLM message pipeline. Any UI modifications must maintain agent communication channels and service integrity.

### II. Backend Service Separation
Browser and main process separation must be maintained. Browser code cannot directly import node_modules; all node dependencies must flow through electron-main services with proper channel communication. This architecture prevents CSP issues and enables proper local provider support.

### III. Service-First Architecture
New functionality must be implemented as services before UI components. Services follow singleton pattern with dependency injection via `registerSingleton`. All data flow goes through services - no direct component-to-component data access. Settings, models, and providers must be managed through `voidSettingsService`.

### IV. React Component Integrity
React components in `src/vs/workbench/contrib/void/browser/react/` maintain their own build system. Any UI modifications must respect the build pipeline and component architecture. Components must remain self-contained with clear service boundaries.

### V. DiffZone Management
All code modifications must use the established DiffZone/DiffArea system for visual feedback. Fast Apply uses Search/Replace blocks, Slow Apply rewrites whole files. The `editCodeService` is the single source of truth for all code changes regardless of trigger source.

## Technology Constraints

### VSCode Base Compatibility
Maintain VSCode extension where possible. Browser/main/common organization must be respected. Actions/Commands registration follows VSCode patterns for keybind compatibility and user customization.

### Model Integration
Provider and model management goes through `voidSettingsService`. `modelCapabilities` must be updated for new models. RefreshProvider pattern for dynamic model list updates.

### Communication Protocols
LLM messages flow through `sendLLMMessageService` with proper main process handling. No direct browser-to-provider communication. All async operations must use proper cancellation tokens.

## Development Workflow

### Code Integrity
All changes must preserve existing service contracts. Breaking changes require migration of dependent services and UI components. Service interfaces must be versioned and backward compatible where possible.

### Testing Requirements
Unit tests for services, integration tests for main/browser communication. UI components tested with their service dependencies. Model capability updates must include provider testing.

### Performance Standards
Fast Apply must remain fast for large files. Diff computation should not block UI. Service initialization must not delay IDE startup. Memory usage monitored through `metricsService`.

## Governance

This constitution supersedes all other practices. Amendments require impact analysis on AI functionality, service contracts, and UI integrity. All modifications must validate against existing test suites and AI integration points.

**Version**: 1.0.0 | **Ratified**: 2025-01-04 | **Last Amended**: 2025-01-04
