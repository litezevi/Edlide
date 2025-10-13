# Data Model: Edlide Native Provider

## Core Entities

### Edlide Provider
```typescript
type EdlideProvider = {
  // Inherits from ProviderName = 'edlide'
  // Configuration is hardcoded (no user settings)
  apiKey: string;      // Hidden from user
  endpoint: string;    // Hidden from user
  models: EdlideModel[];
}
```

### Edlide Models
```typescript
type EdlideModel = {
  modelName: string;
  type: 'default';
  isHidden: boolean;   // false (all enabled by default)
}

// Required models
const EDLIDE_MODELS = [
  'zai-org/GLM-4.6-turbo',           // Default model
  'deepseek-ai/DeepSeek-V3.2-Exp',
  'deepseek-ai/DeepSeek-V3.1-Terminus',
  'moonshotai/Kimi-K2-Instruct-0905'
] as const;
```

### Model Capabilities
```typescript
type EdlideModelCapabilities = {
  contextWindow: number;
  reservedOutputTokenSpace: number;
  supportsSystemMessage: 'system-role' | 'developer-role';
  supportsFIM: boolean;
  supportsTools: boolean;
  cost: {
    input: number;
    output: number;
  };
}
```

## State Management

### Provider Settings (Hidden)
```typescript
// Internal state - not exposed to user
type EdlideInternalSettings = {
  apiKey: string;    // Hardcoded value
  endpoint: string;  // Fixed: 'https://llm.chutes.ai/v1/'
  _didFillInProviderSettings: boolean;  // Always true
}
```

### User-Facing State
```typescript
type EdlideUserState = {
  models: {
    modelName: string;
    isHidden: boolean;  // User can toggle models on/off
    type: 'default';
  }[];
  // No API key or endpoint settings
}
```

## Configuration Constants

### Hardcoded Credentials
```typescript
const EDLIDE_CONFIG = {
  endpoint: 'https://llm.chutes.ai/v1/',
  apiKey: "API_KEY"
} as const;
```

### Default Model Selection
```typescript
const DEFAULT_EDLIDE_MODEL = 'zai-org/GLM-4.6-turbo' as const;
```

## Integration Points

### 1. Type System Integration
- Extends existing `ProviderName` union type
- Integrates with `SettingsAtProvider<'edlide'>`
- Compatible with `ModelSelection` type

### 2. Service Integration
- Works with existing `voidSettingsService`
- Compatible with `sendLLMMessageService`
- Integrates with model capability system

### 3. UI Integration
- Appears in provider list (above Anthropic)
- Hidden from "Add Model" dropdown
- No configuration fields shown to user
- Models can be toggled on/off by user

## Validation Rules

### Provider Validation
- ✅ Always valid (credentials hardcoded)
- ✅ Auto-enabled on first launch
- ✅ No user configuration required

### Model Validation
- ✅ All 4 models available by default
- ✅ Users can enable/disable individual models
- ✅ Default model selected automatically

### API Validation
- ✅ Fixed endpoint validation
- ✅ Hardcoded API key validation
- ✅ OpenAI-compatible format validation

## State Transitions

### Initial State (First Launch)
```
Provider: edlide (enabled, configured)
Models:
  - zai-org/GLM-4.6-turbo (enabled, selected)
  - deepseek-ai/DeepSeek-V3.2-Exp (enabled)
  - deepseek-ai/DeepSeek-V3.1-Terminus (enabled)
  - moonshotai/Kimi-K2-Instruct-0905 (enabled)
```

### User Actions
- Toggle individual models on/off
- Select different Edlide model for features
- No API configuration possible

## Error Handling

### API Errors
- Display error message from response body
- Don't disable models on API failure
- Allow retry without reconfiguration

### Configuration Errors
- Should never occur (hardcoded)
- Fallback to provider error state if somehow invalid

## Relationships to Existing System

### Extends:
- `ProviderName` type
- `SettingsAtProvider` interface
- `ModelSelection` system
- `VoidStaticModelInfo` capabilities

### Implements:
- OpenAI-compatible provider interface
- Standard model management
- Service-first architecture pattern
- React component integration

### Maintains:
- All existing service contracts
- UI/UX patterns
- Performance characteristics
- Privacy and security standards
