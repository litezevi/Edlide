# Quickstart: Edlide Native Provider Implementation

## Prerequisites

- Node.js 20.x
- TypeScript 5.8+
- Existing Edlide codebase structure

## Installation & Setup

### 1. Verify Current Codebase
```bash
# Check you're in the correct directory
pwd # Should be /Users/litezevin/Desktop/Projects/Edlide

# Verify existing provider structure
ls src/vs/workbench/contrib/void/common/voidSettingsTypes.ts
ls src/vs/workbench/contrib/void/common/modelCapabilities.ts
ls src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts
```

### 2. Build Current State
```bash
# Build TypeScript to ensure no existing errors
npm run compile

# Build React components
npm run buildreact
```

## Implementation Steps

### Step 1: Add Edlide Provider Type
**File**: `src/vs/workbench/contrib/void/common/modelCapabilities.ts`

Add to `defaultProviderSettings`:
```typescript
edlide: {
  apiKey: '',  // Will be overridden in backend
},
```

Add to `defaultModelsOfProvider`:
```typescript
edlide: [
  'zai-org/GLM-4.6:THINKING-turbo',
  'deepseek-ai/DeepSeek-V3.1-Terminus',
  'deepseek-ai/DeepSeek-V3.1-Terminus',
  'moonshotai/Kimi-K2-Thinking'
],
```

### Step 2: Update Provider Type Definitions
**File**: `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`

Add display logic for Edlide:
```typescript
else if (providerName === 'edlide') {
  return { title: 'Edlide', }
}
```

Add empty subtext (no configuration needed):
```typescript
if (providerName === 'edlide') return ''
```

### Step 3: Add API Integration
**File**: `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts`

Add Edlide case to `newOpenAICompatibleSDK()`:
```typescript
else if (providerName === 'edlide') {
  // Hardcoded configuration - no user settings
  return new OpenAI({
    baseURL: 'https://llm.chutes.ai/v1/',
    apiKey: "API_KEY"
    ...commonPayloadOpts
  })
}
```

### Step 4: Update UI Configuration
**File**: `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx`

Add Edlide to exclude arrays for "Add Model" dropdown:
```typescript
const providersToExclude: ProviderName[] = ['deepseek', 'ollama', 'vLLM', 'openRouter', 'mistral', 'lmStudio', 'liteLLM', 'googleVertex', 'microsoftAzure', 'awsBedrock', 'edlide']
```

Ensure Edlide appears in Main Providers (don't add to main exclude array).

### Step 5: Set Default Provider State
**File**: `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`

Add Edlide default settings:
```typescript
edlide: {
  ...defaultCustomSettings,
  ...defaultProviderSettings.edlide,
  ...modelInfoOfDefaultModelNames(defaultModelsOfProvider.edlide),
  _didFillInProviderSettings: true,  // Always configured
},
```

## Testing & Validation

### 1. Build Verification
```bash
# Build TypeScript
npm run compile

# Build React components
npm run buildreact

# Clear and rebuild if UI changes don't appear
rm -rf out/
npm run buildreact
```

### 2. Functional Testing

**Test Case 1: Provider Visibility**
```bash
# Start Edlide
npm run watchd &

# Verify Edlide appears:
# 1. Above Anthropic in provider list
# 2. Models are shown and enabled by default
# 3. No API configuration fields visible
```

**Test Case 2: Model Usage**
```bash
# Test each model:
- Select zai-org/GLM-4.6:THINKING-turbo (default)
- Send chat message
- Verify response received
- Repeat for other 3 models
```

**Test Case 3: UI Restrictions**
```bash
# Verify:
- Edlide not in "Add Model" dropdown
- No API key/endpoint fields
- Models can be toggled on/off
```

## Expected Behavior

### On First Launch
- Edlide provider appears at top of list (above Anthropic)
- All 4 models are enabled by default
- zai-org/GLM-4.6:THINKING-turbo is selected as default
- No configuration required

### User Interaction
- Can enable/disable individual Edlide models
- Can select Edlide models for any AI feature (chat, autocomplete, etc.)
- Cannot modify API credentials or endpoint
- Normal error handling and retry logic applies

### Error Scenarios
- API failures show response body to user
- Network errors handled gracefully
- Models remain enabled even on temporary failures

## Troubleshooting

### Build Issues
```bash
# Clear build cache
rm -rf out/
npm run compile
npm run buildreact
```

### Provider Not Visible
- Check `defaultSettingsOfProvider` includes Edlide
- Verify `displayInfoOfProviderName` handles 'edlide'
- Ensure not in UI exclude arrays

### API Connection Issues
- Verify hardcoded credentials in `newOpenAICompatibleSDK`
- Check network connectivity to `https://llm.chutes.ai/v1/`
- Test API endpoint manually with curl

### Model Issues
- Verify model names match exactly in `defaultModelsOfProvider`
- Check model capabilities are defined
- Ensure models are enabled by default

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

### 🎯 Expected Outcome:
Users can immediately use Edlide's 4 AI models without any configuration, providing a seamless "out of the box" experience.
