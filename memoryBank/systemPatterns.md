# System Patterns

## System Architecture

### Core Architectural Principles

1. **VSCode Fork Architecture**: Maintains VSCode's browser/main/common separation
2. **Service-First Design**: All functionality implemented as services before UI
3. **React Component Integration**: Modern React UI with Tailwind CSS
4. **Privacy-First Data Flow**: Direct provider communication without intermediaries
5. **Centralized Hub Architecture**: Supabase as central coordination point
6. **Droplet Proxy Infrastructure**: Scalable proxy server layer with flexible routing

### Process Separation

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser UI    │    │   Common Code   │    │  Main Process   │
│                 │    │                 │    │                 │
│ • React App     │◄──►│ • TypeScript    │◄──►│ • Node.js       │
│ • DOM/Window    │    │ • Shared Types  │    │ • File System   │
│ • CSS/Styling   │    │ • Utilities     │    │ • Network       │
│ • User Events   │    │ • Interfaces    │    │ • AI Providers  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     ▲                                               ▲
     │                                               │
     │                                               │
     │              Service Communication             │
     └───────────────────Channel─────────────────────┘
```

## Backend Architecture (Droplet Infrastructure)

### New Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE EDLIDE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │         IDE Layer            │  │        Backend Services                  │  │
│  │                             │  │                                     │  │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────────────────────┐ │  │
│  │  │    UI Components   │  │  │  │            Supabase Hub           │ │  │
│  │  │                   │  │  │  │                               │ │  │
│  │  │  • Chat Interface │◄─┼──►  │  │  • User Management                │  │
│  │  │  • Settings      │  │  │  │  • Droplet Routing              │  │
│  │  │  • Auth Forms     │  │  │  │  • Analytics & Logs              │  │
│  │  │  │             │  │  │  │ • Payment Processing            │ │  │
│  │  └─────────────────────┘  │  │  │  • Edge Functions              │ │  │
│  │                             │  │  └─────────────────────────────────────┘ │  │
│  └─────────────────────┬───────┘  │                                     │  │
│                    │          │  ┌─────────────────────────────────────┐ │  │
│                    │          │  │      Droplet Proxy Layer          │ │  │
│                    │          │  │  │                               │  │
│                    │          │  │ │  ┌────┐ ┌────┐ ┌─────┐       │ │  │
│                    │          │  │  │  │D1  │ D2  │ D3  │       │  │  │
│                    │          │  │  │  │     │     │     │       │  │  │
│                    │          │  │  │  │droplet droplet droplet│       │ │  │
│                    │          │  │  │  │proxy      proxy       │       │ │  │
│ │                  │          │  │  │ │     │     │     │       │ │  │
│ │                  │          │  │  │  │     ↓     ↓     │       │ │  │
│ │                  │          │  │  │  │ │Chutes Chutes Chutes│       │ │  │
│ │                  │          │  │  │  │ │AI     AI     AI│       │ │  │
│ │                  │          │  │  │  │           └─────┘       │ │  │
│ │                  │          │  │  │  └─────────────────────────────────────┘ │  │
│ │                  │          │  │  │                 │                     │  │ │
│ │                  │          │  │  │                 │      Response        │ │  │
│ │                  │          │  │  │                 └─────────────────────┘  │  │
│ │                  │          │  │  │                           │              │  │
│ │                  │          │  │  │                 └─────┬────────┘  │  │
│ │                  │          │  │  │                           │                │  │
│ │                  │          │  │  │                   ┌──────────┘ │  │
│ │                  │          │  │  │                   │ Droplet │  │  │
│ │                  │          │  │  │           ──────► Routing │  │  │
│ │                  │          │  │  │                   │ └───────┬┘  │  │
│                  │          │  │  │                   │        │ │  │
│  │                  │          │  │  │                   │   ┌──────▼─┐ │  │ │
│  │                  │          │  │  │                   │   │Response │ │ │ │
│  │                  │          │ └─◄┘ └─────────────────────────────────────┘ │ │ │
│  │                  │                 │                                 │ │ │
│  └─────────────────────┴───────────────────────────────────────────────────┘
```

### Backend Service Dependencies (New)
```
Supabase Hub (central coordination)
├── Droplet Management Service
│   ├── DigitalOcean API integration
│   ├── Droplet provisioning and configuration
│   └── IP address and health monitoring
├── User Management Service
│   ├── User-Droplet association
│   ├── Load balancing logic
│   └── Session maintenance
├── Routing Service
│   ├── Request routing to proper Droplet
│   │
│
│   ├── Fallback handling
│   └── Health check integration
├── Chutes API Management
│   ├── API key rotation per Droplet
│   ├── Load distribution across Droplets
│   └── Health monitoring
├── Analytics Service
│   ├── Usage statistics collection
│   ├── Performance metrics
│   └── Error logging
└── Notification Service
    ├── Email alerts for Droplet failures
    ├── Health status updates
    └── System monitoring

Edge Functions (serverless API)
├── Authentication endpoints
├── Chat routing middleware
├── User droplet assignment
├── Payment processing
└── Health check endpoints
```

## Source Code Paths

### Core Edlide Implementation (with Void backend infrastructure)
```
src/vs/workbench/contrib/void/
├── browser/                    # Browser process code
│   ├── react/                 # React UI components
│   │   ├── src/               # React source files
│   │   │   ├── sidebar-tsx/   # Chat interface
│   │   │   ├── void-settings-tsx/  # Settings UI (shows "Edlide's Settings")
│   │   │   └── util/          # React utilities
│   │   ├── build.js           # React build script
│   │   └── tailwind.config.js # Tailwind configuration
│   ├── editCodeService.ts     # Core Apply functionality (errors: "Edlide Error")
│   ├── chatThreadService.ts   # Chat management
│   ├── voidSettingsService.ts # Settings persistence (backend: Void, UI: Edlide)
│   └── [30+ other services]   # Core void services
├── common/                     # Shared code
│   ├── voidSettingsTypes.ts   # Type definitions
│   ├── modelCapabilities.ts   # AI model configurations
│   └── mcpServiceTypes.ts      # MCP protocol types
└── electron-main/             # Main process code
    ├── sendLLMMessageService.ts # AI message handling
    └── toolsService.ts        # AI tool execution
```

### Key Implementation Files
- **Settings UI**: `browser/react/src/void-settings-tsx/Settings.tsx`
- **Chat Interface**: `browser/react/src/sidebar-tsx/SidebarChat.tsx`
- **Code Application**: `browser/editCodeService.ts`
- **AI Communication**: `electron-main/sendLLMMessageService.ts`
- **Model Management**: `common/modelCapabilities.ts`

## Key Technical Decisions

### 1. React Build System
- **Bundler**: `tsup` (esbuild-based) for fast builds
- **Styling**: Tailwind CSS with custom Void theme
- **Components**: TypeScript with strict typing
- **Build Output**: Compiled to `out/` directory for VSCode integration

### 2. Service Architecture
- **Pattern**: Singleton services with dependency injection
- **Registration**: `registerSingleton()` for DI container
- **Separation**: Browser services handle UI, Main services handle system
- **Communication**: IPC channels for process communication

### 3. AI Provider Integration
- **Direct Communication**: No intermediate servers
- **Privacy**: Messages sent directly to providers
- **Local Support**: Ollama and other local providers natively supported
- **SDK Integration**: Official provider SDKs where available

### 4. Apply System
- **Fast Apply**: Search/Replace blocks for large files
- **Slow Apply**: Full file rewrites for complex changes
- **Diff Visualization**: Real-time diff zones with streaming
- **User Control**: Review before applying any changes

## Design Patterns in Use

### Service Pattern
```typescript
// Registration
registerSingleton(IVoidSettingsService, VoidSettingsService);

// Usage
class MyClass {
  constructor(@IVoidSettingsService private settingsService: IVoidSettingsService) {}
}
```

### React Component Pattern
```typescript
export const Settings = () => {
  const settingsState = useSettingsState();
  const accessor = useAccessor();

  return <div className="void-settings">{/* JSX */}</div>;
};
```

### Channel Communication Pattern
```typescript
// Browser -> Main
this.channel.call('sendLLMMessage', requestData);

// Main -> Browser
this.channel.send('llmResponse', responseData);
```

## Component Relationships

### Core Service Dependencies
```
voidSettingsService (central)
├── Model Management
├── Provider Configuration
├── Global Settings
└── Model Capabilities (common/modelCapabilities.ts)

editCodeService
├── DiffZone Management
├── Apply Operations
├── Tool Integration
└── File Operations

chatThreadService
├── Message History
├── Thread Management
├── Context Gathering
└── Agent Mode Integration
```

### React Component Hierarchy
```
Sidebar.tsx (main container)
├── SidebarThreadSelector.tsx
├── SidebarChat.tsx (chat interface)
│   ├── ErrorBoundary.tsx
│   └── ChatMarkdownRender.tsx
└── Settings.tsx (settings interface)
    ├── ModelDropdown.tsx
    ├── WarningBox.tsx
    ├── ProjectRuleItem.tsx (NEW - individual .edliderules file management)
    ├── ProjectRulesSection.tsx (NEW - complete .edliderules folder management)
    └── Current Settings Structure:
        ├── Models (model management and auto-detection, with filtered provider dropdown)
        ├── Main Providers (filtered provider management - excludes microsoftAzure, awsBedrock)
        ├── Feature Options (autocomplete, apply, tools, editor, SCM)
        ├── General (import/export, built-in IDE settings, metrics, AI instructions)
        ├── Rules (AI instructions + Project Rules management for .edliderules files)
        └── MCP (Model Context Protocol servers)
```

## Critical Implementation Paths

### 1. Chat Message Flow (Enhanced with .edliderules)
```
User Input → SidebarChat → convertToLLMMessageService → 
_getVoidRulesFileContents() → System Message Integration → Channel →
sendLLMMessageService → AI Provider → Channel → SidebarChat Display
```

### 1.1 .edliderules Integration Flow
```
Workspace Load → convertToLLMMessageWorkbenchContrib → 
Initialize .edliderules Folder → Discover All .edliderules Files →
voidModelService.initializeModel() → File Content Available →
_getVoidRulesFileContents() → System Message Integration → AI Response
```

### 2. Apply Code Flow
```
AI Suggestion → editCodeService → DiffZone Creation →
User Review → Apply Operation → File Update → UI Refresh
```

### 3. Settings Persistence Flow
```
UI Change → React State → voidSettingsService →
IPC Storage → Restart → Service Restoration
```

### 4. .edliderules File Management Flow
```
User Creates .edliderules File → File System Watcher Detection →
convertToLLMMessageWorkbenchContrib Initialization → voidModelService Integration →
AI System Prompt Integration → Automatic Rule Following
```

## Development Patterns

### File Naming Conventions
- **Services**: PascalCase with descriptive names (e.g., `voidSettingsService.ts`)
- **Components**: PascalCase with type suffix (e.g., `Settings.tsx`)
- **Types**: camelCase with Type suffix (e.g., `voidSettingsTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MODEL_CAPABILITIES.ts`)

### Import Patterns
```typescript
// VSCode services
import { IInstantiationService } from '../../../../../../../platform/instantiation/common/instantiation.js';

// Void services
import { IVoidSettingsService } from '../../../common/voidSettingsService.js';

// React components
import { Settings } from '../react/src/void-settings-tsx/Settings.js';
```

### Error Handling Patterns
```typescript
// Service errors
try {
  await this.provider.sendMessage(message);
} catch (error) {
  this.notificationService.error('Provider communication failed', error);
}

// React errors
<ErrorBoundary fallback={<ErrorDisplay />}>
  <Suspense fallback={<Loading />}>
    <YourComponent />
  </Suspense>
</ErrorBoundary>
```

### .edliderules Integration Patterns
```typescript
// File discovery and content reading (convertToLLMMessageService.ts)
private async _getVoidRulesFileContents(): Promise<string> {
  try {
    const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
    let voidRules = '';
    
    for (const folder of workspaceFolders) {
      const edlideRulesFolderUri = URI.joinPath(folder.uri, '.edliderules');
      
      // Check if .edliderules folder exists and is directory
      const folderExists = await this.fileService.exists(edlideRulesFolderUri);
      if (folderExists) {
        const folderStat = await this.fileService.resolve(edlideRulesFolderUri);
        if (folderStat.isDirectory) {
          // Find ALL .edliderules files in the folder
          const edliderulesFiles = (folderStat.children || [])
            .filter(child => child.name.endsWith('.edliderules') && child.isFile)
            .sort((a, b) => a.name.localeCompare(b.name));
          
          // Read content from each file using voidModelService
          for (const file of edliderulesFiles) {
            const { model } = this.voidModelService.getModel(file.resource);
            if (model) {
              const content = model.getValue(EndOfLinePreference.LF);
              voidRules += content + '\n\n';
            }
          }
        }
      }
    }
    return voidRules.trim();
  } catch (e) {
    return ''; // Graceful error handling
  }
}

// System message integration with .edliderules content
const edlideRulesContent = await this._getVoidRulesFileContents();

let systemMessage = chat_systemMessage({ workspaceFolders, openedURIs, directoryStr, activeURI, persistentTerminalIDs, chatMode, mcpTools, includeXMLToolDefinitions })

// Add .edliderules content directly to system message if it exists
if (edlideRulesContent) {
  systemMessage += `\n\n=== PROJECT-SPECIFIC RULES (from .edliderules files) ===\n${edlideRulesContent}\n=== END PROJECT-SPECIFIC RULES ===`
}

// Workspace initialization (convertToLLMMessageWorkbenchContrib.ts)
const initializeURI = async (uri: URI) => {
  const edlideRulesFolderUri = URI.joinPath(uri, '.edliderules')
  
  // Initialize the folder
  await this.voidModelService.initializeModel(edlideRulesFolderUri)
  
  // Initialize ALL .edliderules files in the folder
  try {
    const folderExists = await this.fileService.exists(edlideRulesFolderUri);
    if (folderExists) {
      const folderStat = await this.fileService.resolve(edlideRulesFolderUri);
      if (folderStat.isDirectory) {
        const edliderulesFiles = (folderStat.children || [])
          .filter(child => child.name.endsWith('.edliderules') && child.isFile);
        
        for (const file of edliderulesFiles) {
          await this.voidModelService.initializeModel(file.resource);
        }
      }
    }
  } catch (e) {
    console.log('Failed to initialize .edliderules files:', e);
  }
}

// Async service interface updates
export interface IConvertToLLMMessageService {
  prepareLLMSimpleMessages: (opts: { ... }) => Promise<{ ... }>
  prepareLLMChatMessages: (opts: { ... }) => Promise<{ ... }>
  prepareFIMMessage(opts: { ... }): Promise<{ ... }>
}

// Usage with await for async operations
const aiInstructions = await this._getCombinedAIInstructions();
```

### File System Management Patterns (Legacy)

### QA and Validation Patterns
```bash
# Independent QA validation (use specialized agent)
<Agent task="Comprehensive QA validation">

# Systematic brand consistency checks
find src/vs/workbench/contrib/void -name "*.ts" -o -name "*.tsx" | \
  xargs grep -n "\"[Vv]oid" | grep -v "void-" | grep -v "VoidSettings" | \
  grep -v "IVoid" | grep -v "\.void/" | grep -v "void-editor"

# File system operations consistency validation
grep -r "\.void-editor\|\.edlide" src/vs/workbench/contrib/void/browser/extensionTransferService.ts

# Cross-validation of localize2 strings
find src/vs/workbench/contrib/void -name "*.ts" | xargs grep -n "localize2.*[Vv]oid"
```

### Critical/Issue Resolution Pattern
```typescript
// Critical: User-visible inconsistencies
extensionTransferService.ts:  '.void-editor' → '.edlide' (all paths)

// Major: Internal errors that could leak
editCodeService.ts: 'Void 1' → 'Edlide Internal Error 1' (error messages)

// Minor: Comment/documentation inconsistencies
sidebarPane.ts: "used to say Void" → "used to say Edlide"
terminalToolService.ts: "Void team" → "Edlide team"

### Provider Filtering Pattern
```typescript
// Settings.tsx ModelDump component (line 647) - Add Model dropdown
const providersToExclude: ProviderName[] = [
  'deepseek', 'ollama', 'vLLM', 'openRouter', 'mistral',
  'lmStudio', 'liteLLM', 'googleVertex', 'microsoftAzure', 'awsBedrock'
];

// Settings.tsx VoidProviderSettings component (line 1007) - Main Providers section
const providersToExclude: ProviderName[] = [
  'deepseek', 'ollama', 'vLLM', 'openRouter', 'mistral',
  'lmStudio', 'liteLLM', 'googleVertex', 'microsoftAzure', 'awsBedrock'
];
```

---

**Note**: This architecture maintains VSCode's robust foundation while adding modern React UI and AI integration capabilities. The service-first approach ensures maintainability and extensibility. Successfully demonstrated comprehensive QA validation process for major branding changes.