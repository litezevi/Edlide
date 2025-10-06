# Tasks Documentation

This file documents repetitive tasks and workflows for future reference. Tasks are organized by category and include step-by-step instructions.

---

## Add New AI Model Support

**Last performed:** 2025-10-04
**Files to modify:**
- `src/vs/workbench/contrib/void/common/modelCapabilities.ts` - Add model configuration
- `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts` - Update type definitions if needed
- `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/ModelDropdown.tsx` - Ensure UI supports new model

**Steps:**
1. Open `modelCapabilities.ts` and add model to provider's model list
2. Configure model capabilities:
   ```typescript
   'new-model-name': {
     maxTokens: 128000,
     supportsAutocomplete: true,
     supportsChat: true,
     supportsTools: true,
     // ... other capabilities
   }
   ```
3. Test with actual API calls before committing
4. Update any provider-specific configuration if needed
5. Build React components: `npm run buildreact`

**Important notes:**
- Always check provider's official documentation for exact capabilities
- Ensure proper token limits to avoid API errors
- Test both chat and autocomplete if both supported
- Verify backward compatibility with existing configurations

---

## Add New AI Provider

**Last performed:** 2025-10-06 (Edlide Native Provider)
**Files to modify:**
- `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts` - Add provider types
- `src/vs/workbench/contrib/void/common/modelCapabilities.ts` - Add provider models
- `src/vs/workbench/contrib/void/browser/voidSettingsService.ts` - Add provider logic
- `src/vs/workbench/contrib/void/electron-main/sendLLMMessageService.ts` - Add API integration
- `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx` - Add provider UI

**Steps:**
1. Add provider name to type definitions:
   ```typescript
   export type ProviderName = 'openai' | 'anthropic' | 'newprovider' | ...;
   ```
2. Add provider to modelCapabilities with at least one model
3. Implement API key settings and validation
4. Add API call logic in sendLLMMessageService
5. Create provider configuration UI
6. Test authentication and message flow
7. Add provider to any relevant autodetection logic

**Important notes:**
- Check if provider-specific SDK is needed, add to package.json if yes
- Implement proper error handling for API failures
- Test rate limiting and quota handling
- Ensure retry logic works with provider's error codes
- Always use HTTPS connections for security

**Edlide Native Provider Implementation (2025-10-06):**
- **Hardcoded Configuration**: API key and base URL defined in backend
- **OpenAI Compatible**: Uses OpenAI client with custom endpoint
- **No UI Settings**: Excluded from Main Providers and Add Model dropdown
- **Built-in Models**: 4 pre-configured models available immediately
- **Positioning**: First in Models list above Anthropic
- **URL**: `https://llm.chutes.ai/v1/` (note trailing slash)
- **Headers**: Proper Authorization Bearer token and Content-Type headers

---

## Update UI Branding (Void → Edlide)

**Last performed:** 2025-10-05 (FinalQA-Enhanced)
**Level**: Critical - Major Rebranding Task
**Scope**: Complete user interface transformation
**Status**: **FULLY COMPLETED + QA VALIDATED**

**✅ Final QA Session Results (2025-10-05):**
- **Initial Completion**: 96% successful, 4% critical gaps
- **Independent QA Discovery**: Found extension path inconsistency
- **Critical Fixes Applied**: `.void-editor` → `.edlide` paths (9 occurrences)
- **Major Fixes Applied**: Internal debug errors branded properly
- **Final Status**: 100% QA Compliance achieved
- **Production Ready**: All user-visible branding confirmed

**Files to modify:**
- `src/vs/workbench/contrib/void/browser/sidebarActions.ts` - Actions localize2 strings
- `src/vs/workbench/contrib/void/browser/voidSettingsPane.ts` - Settings title and labels
- `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx` - UI text
- `src/vs/workbench/contrib/void/browser/react/src/void-onboarding/VoidOnboarding.tsx` - Onboarding text
- `src/vs/workbench/contrib/void/browser/terminalToolService.ts` - Agent names
- `src/vs/workbench/contrib/void/browser/voidUpdateActions.ts` - Update messages
- `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts` - API headers and errors
- `src/vs/workbench/contrib/void/browser/editCodeService.ts` - Error messages and labels
- ALL localize2/nls.localize strings with "Void" text

**Steps:**
1. **Action Commands**: Change all `localize2('voidAction', 'Void: Action')` to 'Edlide: Action'
2. **Settings UI**: Change all `"Void's Settings"` to `"Edlide's Settings"`
3. **Onboarding**: Change `"Welcome to Void"` to `"Welcome to Edlide"`
4. **Agents**: Change `"Void Agent"` to `"Edlide Agent"`
5. **Errors**: Change all `"Void Error"` to `"Edlide Error"`
6. **Updates**: Change `"Restart Void to update"` to `"Restart Edlide to update"`
7. **API Headers**: Change `'X-Title': 'Void'` to `'X-Title': 'Edlide'`
8. **Endpoint Errors**: Change `"in Void if"` to `"in Edlide if"`
9. **Metrics**: Change `"Void Update"` to `"Edlide Update"`
10. **System Messages**: Change all system error messages to "Edlide"

**Search patterns to execute:**
```bash
# Mass UI changes (safe - only affects user-visible strings)
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/Void:/Edlide:/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/Void[''']*s(Settings|Error)/Edlide'\''\1/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/Void Agent/Edlide Agent/g'
```

**Critical - DO NOT CHANGE (preserves backend logic):**
- All class names: `VoidSettingsService`, `IVoidModelService`
- All service IDs: `VOID_...` constants
- All interfaces: `IVoidSettingsService`, `IVoidModelService`
- All function/variable names
- All file directory names: `./void/` folder structure
- Import/export statements

**Important notes:**
- This is a branding change only - ZERO functional changes
- Backend architecture must remain exactly unchanged
- Only user-visible strings should change
- Test thoroughly - any missed "Void" in UI is incomplete
- Build React components: `npm run buildreact`
- Verify all user interactions show "Edlide" branding

---

## Comprehensive QA Validation Process

**Last performed:** 2025-10-05
**Level**: Advanced Quality Assurance
**Purpose**: Independent validation of major changes and branding consistency

**When to use:**
- After completing major feature implementations
- Before releasing significant UI or UX changes
- When user-reported inconsistencies indicate possible brand gaps
- After branding or naming changes

**QA Process Steps:**

1. **Independent Agent Assignment:**
   - Use specialized agent for comprehensive file scanning
   - Task: "Conduct comprehensive QA validation of branding changes"
   - Provide specific focus areas: UI strings, file paths, API communications

2. **Systematic File Analysis:**
   - Search all `.ts`, `.tsx` files for brand inconsistencies
   - Check localize2 strings against UI branding standards
   - Validate file system operations for consistency
   - Examine API headers and external communications

3. **Critical Issue Identification:**
   - **Critical**: User-visible strings with incorrect branding
   - **Major**: Internal errors that could leak to users
   - **Minor**: Comments or documentation inconsistencies

4. **Cross-Validation:**
   - Separate searches for different categories (UI vs internal)
   - Verify backend architecture preservation
   - Confirm CSS classes and internal names preserved correctly

5. **Fix Prioritization and Resolution:**
   - Critical: Immediate fix required for user experience
   - Major: Fix to prevent potential user exposure
   - Minor: Fix for completeness and consistency

6. **Final Validation:**
   - Re-run independent QA after fixes
   - Confirm 100% compliance with standards
   - Document final results and production readiness

**Results Template:**
```
QA Results:
- Initial Assessment: X% completion
- Critical Issues: Y found, Y resolved
- Major Issues: Z found, Z resolved
- Final Success Rate: 100%
- Production Ready: Yes/No
```

**Important notes:**
- Always use independent agent for objectivity
- Focus on user-visible elements first
- Preserve internal architecture during fixes
- Document all findings and resolutions
- Use systematic approach to avoid missing areas

---

## Remove Provider from UI Interface

**Last performed:** 2025-10-05
**Purpose:** Clean up provider interface by removing specific providers from user-facing elements while maintaining backend compatibility

**When to use:**
- When simplifying provider options for better user experience
- When removing deprecated or unsupported providers
- When consolidating similar provider options

**Files to modify:**
- `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx` - Provider filtering arrays

**Steps:**
1. **Identify target providers:**
   - Determine which providers to remove from UI
   - Verify backend code should remain intact

2. **Update Add Model dropdown filtering (line ~647):**
   ```typescript
   const providersToExclude: ProviderName[] = [
     'existingExclusions', 'newProvider1', 'newProvider2'
   ];
   ```

3. **Update Main Providers section filtering (line ~1007):**
   ```typescript
   const providersToExclude: ProviderName[] = [
     'existingExclusions', 'newProvider1', 'newProvider2'
   ];
   ```

4. **Test changes:**
   - Verify providers no longer appear in "Add Model" dropdown
   - Confirm providers are hidden from "Main Providers" section
   - Ensure existing configurations remain functional

5. **Build React components:**
   ```bash
   npm run buildreact
   ```

**Important notes:**
- Only affects UI display - backend functionality preserved
- Existing user configurations with these providers continue to work
- This is a UX improvement, not a functional removal
- Always use consistent ProviderName values from type definitions
- Test thoroughly to ensure no broken references

**Example exclusion pattern:**
```typescript
// Remove Microsoft Azure OpenAI and AWS Bedrock from UI
const providersToExclude: ProviderName[] = [
  'deepseek', 'ollama', 'vLLM', 'openRouter', 'mistral',
  'lmStudio', 'liteLLM', 'googleVertex', 'microsoftAzure', 'awsBedrock'
];
```

---

## Create New Edlide Feature

**Last performed:** 2025-10-05
**Workflow: Use `/specify` command system**

**Steps:**
1. **Specification Phase:**
   - Run `/specify` with feature description
   - Review generated specification in `specs/` directory
   - Approve or refine specification as needed

2. **Planning Phase:**
   - Run `/plan` to create implementation plan
   - Review plan for completeness and feasibility
   - Adjust if requirements have changed

3. **Implementation Phase:**
   - Run `/tasks` to generate actionable tasks
   - Run `/implement` to execute all tasks
   - Test implementation thoroughly

4. **Documentation Phase:**
   - Update memory bank if significant changes
   - Commit changes with descriptive messages
   - Update any relevant documentation

**Important notes:**
- Always start with `/specify` for new features
- Review specification before proceeding to implementation
- Test in both development and production builds
- Update memory bank for architectural changes

---

## Performance Optimization

**Last performed:** 2025-10-04
**Common areas to optimize:**
- Large file Apply operations (>1000 lines)
- Memory usage in long-running sessions
- React component rendering performance
- AI response streaming performance

**Steps:**
1. **Profile memory usage:**
   - Open DevTools in Void (`F12`)
   - Monitor memory tab during usage
   - Identify memory leaks or excessive allocation

2. **Optimize large file operations:**
   - Check streaming Apply for large files
   - Verify DiffZone computation efficiency
   - Test with progressively larger files

3. **React performance:**
   - Use React DevTools Profiler
   - Check for unnecessary re-renders
   - Optimize component memoization

4. **AI streaming:**
   - Monitor response parsing performance
   - Check UI update frequency
   - Optimize chunk processing

**Important notes:**
- Always benchmark before and after optimization
- Test with realistic data sizes
- Don't optimize prematurely
- Document performance improvements

---

## Debug Common Issues

### Chat Issues
**Problem:** Chat not responding or showing errors
**Files to check:**
- `src/vs/workbench/contrib/void/browser/sidebar-tsx/SidebarChat.tsx`
- `src/vs/workbench/contrib/void/electron-main/sendLLMMessageService.ts`

**Debug Steps:**
1. Check browser console for errors
2. Verify API key configuration in settings
3. Test API connectivity manually
4. Check network tab for failed requests

### Apply Issues
**Problem:** Code not applying or diff errors
**Files to check:**
- `src/vs/workbench/contrib/void/browser/editCodeService.ts`
- `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

**Debug Steps:**
1. Check DiffZone creation and management
2. Verify streaming response parsing
3. Test with simpler examples
4. Check file permissions and locks

### Settings Issues
**Problem:** Settings not saving or loading
**Files to check:**
- `src/vs/workbench/contrib/void/browser/voidSettingsService.ts`
- `src/vs/workbench/contrib/void/common/storageKeys.ts`

**Debug Steps:**
1. Check storage service integration
2. Verify settings state management
3. Test with different configuration values
4. Check for service registration errors

---

## Reorder Settings UI Sections

**Last performed:** 2025-10-04
**Files to modify:**
- `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx` - Main settings component

**Steps:**
1. **Update the Tab type definition** (line ~26-31):
   ```typescript
   type Tab = 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5';  // Order matters for consistency
   ```

2. **Update the navigation items array** (line ~1034-1040):
   ```typescript
   const navItems: { tab: Tab; label: string }[] = [
     { tab: 'tab1', label: 'Section 1' },
     { tab: 'tab2', label: 'Section 2' },
     // ... continue in desired order
   ];
   ```

3. **Update the default selected section** (line ~1032):
   ```typescript
   useState<Tab>('tab1');  // Should match first nav item
   ```

4. **Reorder JSX section blocks** (line ~1165-1505):
   Move the `<div className={shouldShowTab('tab') ? `` : 'hidden'}>` blocks to match navItems order

5. **Clean rebuild:**
   ```bash
   rm -rf out/
   npm run buildreact
   ```

**Important notes:**
- Always clear `out/` directory - cached builds prevent UI changes from appearing
- The order in all three places must match: Tab type, navItems array, and JSX blocks
- Only UI order changes - no functionality affected
- Use `npm run buildreact` for faster iteration vs full compilation

**Example reordering from:**
Old: Models → Main Providers → Feature Options → General → MCP
New: General → Feature Options → Main Providers → Models → MCP

---

## Build and Deployment Tasks

### React Component Build Issues
**Problem:** React components not updating or build fails

**Solutions:**
1. Clean build: `rm -rf out/ && npm run buildreact`
2. Check tsup configuration
3. Verify TypeScript compilation
4. Check for circular dependencies
5. **CRITICAL**: Always clear `out/` directory for UI changes - compiled versions cache and prevent updates

### Full Application Build
**Commands:**
```bash
# Development
npm run compile
npm run watchd

# Production
npm run compile-build
npm run minify-vscode

# Testing
npm run test-browser
npm run smoketest
```

**Common Issues:**
- Memory不足: Increase Node.js memory limit
- TypeScript errors: Check strict mode violations
- VSCode conflicts: Ensure clean VSCode build first

---

## Memory Bank Management

### Update Memory Bank
**When to update:**
- After implementing significant features
- When adding new providers or capabilities
- When architectural decisions change
- After major bug fixes or optimizations

**Process:**
1. Update `activeContext.md` with current state
2. Update relevant sections in other files
3. Update `progress.md` with new completed features
4. Add new tasks to `tasks.md` if workflows discovered

### Review Memory Bank
**Frequency:** Monthly or after major changes
**Checklist:**
- [ ] `activeContext.md` reflects current work
- [ ] `progress.md` shows realistic status
- [ ] `systemPatterns.md` matches current architecture
- [ ] `techContext.md` includes all dependencies
- [ ] `tasks.md` covers current workflows

---

## Security and Privacy Tasks

### Security Checklist
**Review security before releases:**
1. Verify HTTPS for all external communications
2. Check for hardcoded credentials or keys
3. Review CSP compliance for browser process
4. Validate input sanitization and XSS prevention
5. Test with security scanning tools

### Privacy Verification
**Ensure privacy protection:**
1. Confirm no data retention in message flow
2. Verify local storage only for settings
3. Check analytics are anonymous and opt-outable
4. Test with network monitoring for data leakage
5. Review provider API integrations for privacy

---

**Last Updated:** 2025-10-05 (Provider Interface Cleanup + Major Edlide Rebranding Complete)
**Maintenance**: Review and update tasks monthly or as workflows evolve