# Technology Context

## Technologies Used

### Core Framework
- **Electron**: 34.3.2 - Desktop application framework
- **VSCode Base**: Microsoft VSCode codebase fork
- **TypeScript**: 5.8.0-dev.20250207 - Primary development language
- **Node.js**: Platform for main process and build tools

### Frontend Technologies
- **React**: 19.1.0 - UI component library
- **React DOM**: 19.1.0 - React browser renderer
- **Tailwind CSS**: 3.4.17 - Utility-first CSS framework
- **Lucide React**: 0.503.0 - Icon library
- **React Tooltip**: 5.28.1 - Tooltip components
- **Marked**: 15.0.11 - Markdown parsing
- **Custom Theme System**: Edlide Dark theme based on Absolute Black color scheme

### AI Provider SDKs
- **Anthropic AI SDK**: @anthropic-ai/sdk ^0.40.0
- **OpenAI**: openai ^4.96.0
- **Google GenAI**: @google/genai ^0.13.0
- **Mistral AI**: @mistralai/mistralai ^1.6.0
- **Groq**: groq-sdk ^0.20.1
- **Ollama**: ollama ^0.5.15
- **MCP SDK**: @modelcontextprotocol/sdk ^1.11.2

### Build & Development Tools
- **Webpack**: 5.94.0 - Module bundler
- **esbuild**: via tsup - Fast TypeScript compiler
- **TSup**: 8.4.0 - esbuild-based bundler for React components
- **Gulp**: 4.0.0 - Build task runner
- **ESLint**: 9.11.1 - JavaScript/TypeScript linting
- **Mocha**: 10.8.2 - Testing framework
- **Playwright**: 1.50.0 - Browser testing

### VSCode Technologies
- **Monaco Editor**: Integrated code editor
- **VSCode Extension API**: Extension integration
- **VSCode Telemetry**: Usage analytics
- **Electron Builder**: Application packaging

## Development Setup

### Prerequisites
```bash
node --version  # Should be 20.x
npm --version   # Latest npm
```

### Build Commands
```bash
# Core development
npm run compile           # Compile TypeScript
npm run watch             # Watch mode for development
npm run watchd            # Daemon watch mode

# React development
npm run buildreact        # Build React components
npm run watchreact        # Watch React components
npm run watchreactd       # Daemon watch React

# Testing
npm run test-browser      # Browser tests
npm run test-node         # Node tests
npm run smoketest         # Integration tests

# Production builds
npm run compile-build     # Production compilation
npm run minify-vscode     # Minify build artifacts
```

### Development Workflow
1. **Setup**: Clone repository, run `npm install`
2. **Development**: Run `npm run watchd` in background
3. **React Changes**: Run `npm run watchreactd` in separate terminal
4. **Testing**: Use `npm run test-browser` or `npm run test-node`
5. **Build**: `npm run compile` before committing

## Technical Constraints

### Browser/Main Process Separation
- **Browser Process**: Cannot import `node_modules` directly
- **Main Process**: Has full Node.js access and file system
- **Communication**: IPC channels for inter-process communication
- **Security**: CSP compliance enforced for browser environment

### VSCode Architecture Constraints
- **Service Registration**: Must use `registerSingleton()` pattern
- **Dependency Injection**: Constructor injection with `@` decorators
- **Extension Compatibility**: Must maintain VSCode extension API
- **Platform Support**: Windows, macOS, Linux support required

### Performance Requirements
- **Fast Apply**: Must handle 1000+ line files instantly
- **Memory Usage**: Monitor for leaks with large codebases
- **Startup Time**: Cannot significantly delay VSCode startup
- **Streaming**: Real-time response streaming from AI providers

### Security & Privacy Constraints
- **No Data Retention**: Messages sent directly to providers
- **CSP Compliance**: No inline scripts or eval() usage
- **Local Storage**: Settings stored locally using VSCode storage
- **Network Security**: HTTPS required for all provider communications

## Dependencies

### Critical Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.40.0",
  "openai": "^4.96.0",
  "@google/genai": "^0.13.0",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.8.0-dev.20250207"
}
```

### Dev Dependencies
```json
{
  "@types/react": "^19.1.2",
  "@types/react-dom": "^19.1.2",
  "tsup": "^8.4.0",
  "esbuild": "via tsup",
  "webpack": "^5.94.0",
  "playwright": "^1.50.0"
}
```

### Optional Dependencies
```json
{
  "windows-foreground-love": "0.5.0"  // Windows-specific
}
```

## Tool Usage Patterns

### React Development
- **Build Tool**: `tsup` with esbuild for fast compilation
- **Styling**: Tailwind CSS with scoped class names
- **Components**: Functional components with hooks
- **State Management**: Custom hooks and service integration

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **Target**: ES2022 for modern JavaScript features
- **Modules**: ESNext module system
- **Resolution**: Node module resolution with JS extensions

### Testing Strategy
- **Unit Tests**: Mocha for pure logic testing
- **Browser Tests**: Playwright for UI component testing
- **Integration Tests**: Smoke tests for full application
- **Coverage**: Aim for core service coverage

### Build Process
```javascript
// tsup.config.js (React build)
export default {
  entry: ['src/index.tsx'],
  format: ['esm'],
  external: ['react', 'react-dom'],
  splitting: false,
  sourcemap: true,
  clean: true
}
```

## Environment Configuration

### Development Environment
- **Node Version**: 20.x (required)
- **Package Manager**: npm (package-lock.json used)
- **IDE**: VSCode recommended (with TypeScript plugin)
- **OS**: macOS, Windows, Linux support

### Build Environment
- **Electron Version**: 34.3.2 (locked)
- **VSCode Version**: Based on VSCode 1.99.3
- **Target Platforms**: All desktop platforms supported
- **Output**: Application bundles for each platform

### AI Provider Environment
- **Authentication**: API keys stored locally
- **Network**: HTTPS connections required
- **Local Providers**: Ollama, LM Studio via HTTP
- **Fallback**: Multiple provider support for redundancy

## Performance Considerations

### Memory Management
- **Service Lifecycle**: Singleton pattern prevents memory leaks
- **React Components**: Proper cleanup in useEffect hooks
- **Large Files**: Streaming for large AI responses
- **Diff Computation**: Efficient diff algorithms for code changes

### Build Optimization
- **Bundle Size**: Tree-shaking and dead code elimination
- **Code Splitting**: Lazy loading for optional features
- **Cache Strategy**: Build caching for faster rebuilds
- **Source Maps**: Generated for debugging but excluded from builds

### Runtime Performance
- **AI Response Time**: Direct provider connections minimize latency
- **UI Responsiveness**: Non-blocking AI operations
- **File Operations**: Async file I/O throughout with .edliderules folder management and real-time polling
- **Network**: Request timeout and retry mechanisms

---

**Note**: The technology stack prioritizes modern tooling while maintaining VSCode compatibility. The React build system is specifically designed to integrate seamlessly with VSCode's architecture.