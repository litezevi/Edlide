# Phase 0: Research - Edlide Native Provider

## Current Provider Architecture Analysis

### 1. Provider Type System (`voidSettingsTypes.ts`)

**Key Findings:**
- `ProviderName` type is auto-generated from `defaultProviderSettings` keys
- Provider display information is handled by `displayInfoOfProviderName()` function
- Settings visibility controlled by `displayInfoOfSettingName()` and `subTextMdOfProviderName()`
- Provider categorization: `localProviderNames` vs `nonlocalProviderNames`

**Integration Points for Edlide:**
1. Add `edlide` key to `defaultProviderSettings` in `modelCapabilities.ts`
2. Add display logic in `displayInfoOfProviderName()`
3. Configure settings visibility (likely hidden for API key/endpoint)

### 2. Model Configuration (`modelCapabilities.ts`)

**Key Findings:**
- `defaultProviderSettings`: Object with provider configurations (apiKey, endpoint, etc.)
- `defaultModelsOfProvider`: Array of default models per provider
- `modelSettingsOfProvider`: Model capabilities and fallback logic
- Provider capabilities defined in `VoidStaticProviderInfo`

**Required Models for Edlide:**
- `zai-org/GLM-4.6-turbo`
- `deepseek-ai/DeepSeek-V3.2-Exp`
- `deepseek-ai/DeepSeek-V3.1-Terminus`
- `moonshotai/Kimi-K2-Instruct-0905`

### 3. API Integration (`sendLLMMessage.impl.ts`)

**Key Findings:**
- `newOpenAICompatibleSDK()` function handles provider SDK creation
- OpenAI-compatible providers use OpenAI SDK with custom baseURL
- API keys and endpoints pulled from `settingsOfProvider[providerName]`
- Headers and custom configurations supported

**Edlide Integration Requirements:**
- Add `edlide` case to `newOpenAICompatibleSDK()`
- Use hardcoded API endpoint: `https://llm.chutes.ai/v1/`
- Use hardcoded API key: `"API_KEY"

### 4. UI Integration (`Settings.tsx`)

**Key Findings:**
- `providersToExclude` arrays control provider visibility in UI
- Separate arrays for "Add Model" dropdown and "Main Providers" section
- Provider configuration UI auto-generated from available settings
- Need to exclude Edlide from "Add Model" but show in "Main Providers"

**Edlide UI Requirements:**
- Add Edlide to visible providers list (NOT in exclude array)
- Add Edlide to "Add Model" exclude array
- Hide API key/endpoint configuration fields
- Show provider above Anthropic (ordering requirement)

## Technical Decisions

### 1. Provider Classification
**Decision**: Edlide should be a non-local provider (like OpenAI, Anthropic)
**Rationale**: Uses remote API, not local models
**Implementation**: Don't add to `localProviderNames` array

### 2. Settings Visibility
**Decision**: Hide API configuration from users
**Rationale**: Fixed embedded provider with hardcoded credentials
**Implementation**: Empty string in `subTextMdOfProviderName()`, no config fields in `displayInfoOfSettingName()`

### 3. Model Capabilities
**Decision**: Use OpenAI-compatible capabilities with appropriate context windows
**Rationale**: Models appear to be OpenAI-compatible based on naming patterns
**Implementation**: Add to `extensiveModelOptionsFallback` or define specific capabilities

### 4. Provider Ordering
**Decision**: Edlide should appear first in provider list
**Rationale**: Specification requires "above Anthropic"
**Implementation**: May need to modify provider ordering logic or ensure Edlide is added first to arrays

## Integration Strategy

### Phase 1 Approach:
1. **Type System**: Add `edlide` to provider types with minimal configuration
2. **Model Definition**: Define 4 required models with appropriate capabilities
3. **API Integration**: Add Edlide case to SDK creation with hardcoded credentials
4. **UI Updates**: Modify exclude arrays and add display information
5. **Testing**: Verify models appear and function correctly

### Complexity Considerations:
- **Low Complexity**: Follows existing OpenAI-compatible provider pattern
- **No Constitutional Violations**: Maintains existing architecture
- **Minimal Risk**: Embedded credentials approach already established for some providers

## Research Complete

**Status**: ✅ All technical unknowns resolved
**Next**: Proceed to Phase 1 - Design & Contracts
