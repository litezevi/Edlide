# Project Brief: Edlide IDE

**Project Type**: AI-powered IDE (Fork of Void/VSCode)
**Version**: 1.4.9 (Void: 0044)
**Primary Language**: TypeScript/JavaScript with React components
**Architecture**: Electron-based multi-process application

## Core Purpose

Edlide (Void fork) is an open-source AI-powered development environment that provides intelligent code editing capabilities through direct integration with multiple AI providers. The project aims to offer a privacy-focused alternative to Cursor and other AI IDEs by sending messages directly to providers without data retention.

## Key Requirements & Goals

### 🔧 **Primary Features**
- **AI Chat Interface**: Sidebar-based chat with multiple AI models (Anthropic, OpenAI, Ollama, etc.)
- **Autocomplete**: AI-powered code completion using FIM (Fill-In-Middle) models
- **Apply System**: Fast Apply (Search/Replace blocks) and Slow Apply (file rewrite) for code changes
- **Agent Mode**: AI agents with access to development tools via MCP (Model Context Protocol)
- **Local Provider Support**: Run AI models locally (Ollama, LM Studio) with auto-detection

### 🛡️ **Privacy & Architecture**
- **No Data Retention**: Messages sent directly to providers, not stored by Void
- **Local-First**: Support for running everything locally without cloud dependencies
- **Security Conscious**: CSP-compliant architecture with proper browser/main process separation

### 🎯 **User Experience Goals**
- **VSCode Compatibility**: Leverage existing VSCode ecosystem and user knowledge
- **Performance**: Fast Apply system for quick code changes even on large files
- **Extensibility**: Support for custom models, providers, and tools
- **Accessibility**: Maintain VSCode's accessibility features

## Target Users

1. **Privacy-Conscious Developers**: Users who want AI assistance without cloud data collection
2. **Local AI Enthusiasts**: Developers running local models who want IDE integration
3. **VSCode Users Seeking AI**: Familiar with VSCode but want integrated AI features
4. **Enterprise Users**: Organizations with strict data privacy requirements

## Technical Constraints

- **VSCode Fork**: Must maintain compatibility with VSCode's architecture and extension system
- **Multi-Process**: Browser/main process separation for security and CSP compliance
- **TypeScript**: Entire codebase in TypeScript with strict typing
- **Service Architecture**: Service-first design with proper dependency injection
- **React Components**: Modern React UI components with Tailwind CSS styling

## Success Criteria

- **Feature Parity**: Competitive with Cursor and other AI IDEs in core features
- **Performance**: Apply system works quickly on large files (>1000 lines)
- **Stability**: Reliable AI connections and error handling
- **Privacy**: Verifiable no-data-retention architecture
- **Extensibility**: Easy addition of new providers and models

---

**Scope Note**: This project is a fork of VSCode with significant Void-specific modifications. Focus on the `src/vs/workbench/contrib/void/` directory for Void-specific code. Core VSCode functionality should remain unchanged.

**Architecture Priority**: Service-first approach with React components, proper browser/main process separation, and TypeScript throughout.