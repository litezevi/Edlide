# Active Context

## Current Work Focus

**Session Date**: 2025-10-04
**Branch**: `002-void-settings-local`
**Primary Feature**: Enhanced .voidrules support - multiple files in .voidrules/ folder

### Recent Completed Work
- **Enhanced .voidrules Support**: Implemented support for multiple .voidrules files in .voidrules/ folder
- **Multi-file Rule System**: Void now reads all .voidrules files from .voidrules/ directory with alphabetical sorting
- **Backward Compatibility**: Preserved support for single .voidrules file in workspace root
- **File Reading Infrastructure**: Added IFileService integration for directory scanning
- **Asynchronous Architecture**: Converted rule reading methods to async for file system operations
- **UI Documentation Updated**: Rules section description now explains both single file and multi-file approaches
- **Header Organization**: Each .voidrules file gets automatic "# filename" header in combined output
- **Service Interface Updates**: Updated IConvertToLLMMessageService and all calling methods
- **TypeScript Compatibility**: Fixed all async/await compatibility issues across services
- **UI Naming Changes**: Renamed section to "Rules" and simplified placeholder to "System Prompt"
- **Settings Tab Renaming**: Changed "Feature Options" tab to "Actions" for better clarity
- **Chat Mode Updates**: Updated chat mode names - "Chat" → "Minimal", "Gather" → "Ask", "Agent" unchanged
- **Chat Mode Descriptions**: Updated descriptions - Minimal mode shows "Can only chat", Ask mode shows file reading capabilities
- **Rules Section restructure**: Reorganized Rules section into two symmetrical subsections - System Prompt and Project Rules
- **System Prompt Section**: Added standalone "System Prompt" subsection with AIInstructionsBox and proper formatting
- **UI Text Improvements**: Added "Your System Prompt" label under input field and improved spacing
- **Toggle Description Relocation**: Moved "When disabled, Void will not include..." text below toggle button for better UX
- **Edit Button Enhancement**: Modified Project Rules Edit button to open files in new tabs like Create button
- **VSCode Integration Update**: Switched from `vscode.open` to `_workbench.open` with pinned tab options for new tabs
- **UI Filename Simplification**: Removed `.voidrules` suffix from UI display - shows clean filenames without extension
- **Rename Experience Update**: Updated rename placeholder to display filenames without extension for consistency
- **File Operations Consistency**: All file operations maintain full `.voidrules` extensions internally while showing clean UI names
- **Previous Settings Work**: All previous UI refinements remain intact including Rules section creation

## Current Project State

### Branch Information
- **Feature Branch**: `002-void-settings-local` for Local Providers section removal
- **Main Branch**: `002-void-settings-local`
- **Git Status**: Clean on current branch, recent changes consolidated provider settings
- **Previous Branch**: `001-void-settings-all` completed earlier

### Codebase Health
- **Compilation**: Successful - TypeScript no errors for recent changes
- **Build**: Functional - React build system working (`npm run buildreact`)
- **Tests**: Available - Browser and Node test suites in place

### Active Development Areas

1. **Rules System Enhancement**
   - Location: `src/vs/workbench/contrib/void/browser/convertToLLMMessageService.ts` and related services
   - Status: Complete - Multi-file .voidrules support with backward compatibility
   - Changes: Added IFileService, async file reading, folder scanning, header generation, interface updates
   - File Structure: Supports `.voidrules/` folder with multiple files plus single file fallback
   - Integration: Full async/await architecture across all Void services (editCodeService, autocompleteService, voidSCMService)

2. **Settings UI Infrastructure**
   - Location: `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx`
   - Status: Complete - Rules section with updated documentation
   - Changes: Added Rules tab, moved AI Instructions, updated help text for multi-file support
   - Final Settings Structure: General, Actions, Models, MCP, Rules
   - Documentation: Clear instructions for both single file and multi-file .voidrules approaches
   - **Latest Update**: Renamed "Feature Options" tab to "Actions" for better user understanding

3. **Project Rules File Management**
   - Location: `Settings.tsx` lines 312-327, 238, 206
   - Status: Enhanced - New tab opening and improved UI filename display
   - Changes: Updated handleEditFile command, simplified UI filename display
   - Edit Functionality: Opens files in new pinned tabs like Create button
   - UI Display: Shows clean filenames without `.voidrules` extension
   - File Operations: Maintains full file paths internally for system operations
   - **Latest Update**: Enhanced user experience with better tab management and cleaner interface

2. **Chat Interface Updates**
   - Location: `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
   - Status: Complete - Chat mode naming and descriptions updated
   - Changes: Updated nameOfChatMode and detailOfChatMode objects
   - Chat Modes Available: Minimal, Ask, Agent
   - Mode Descriptions:
     - Minimal: "Can only chat" (basic chat functionality, fixed capitalization)
     - Ask: "Reads files, but can't edit" (file reading without editing)
     - Agent: "Edits files and uses tools" (full functionality)
   - **Latest Update**: Fixed capitalization for professional appearance in chat descriptions

3. **Constitution & Templates**
   - Location: `.specify/` directory
   - Status: Recently updated with AI integration principles
   - Templates: Updated for new feature workflow

4. **Memory Bank System**
   - Location: `memoryBank/` directory
   - Status: Actively maintained with current project state
   - Coverage: All core files regularly updated

## Immediate Technical Debt

### TypeScript Warnings (Priority: Low)
Most TypeScript warnings in Settings.tsx have been resolved:
- ✅ Removed `nonlocalProviderNames`, `localProviderNames`, `featureNames`, `FeatureName`
- ✅ Removed `hasDownloadButtonsOnModelsProviderNames`, `URI`, `TransferFilesInfo`
- ✅ Removed unused `TabName` type
- Remaining warnings are minimal and non-critical

### Code Quality Areas
- ✅ Settings component imports cleaned up successfully
- Legacy code patterns in older components (future consideration)
- Testing coverage for UI refinements could be improved

## Next Steps

### Immediate (Current Session)
- ✅ Added 'rules' to Tab type definition
- ✅ Created new Rules tab in navigation array
- ✅ Implemented Rules section with AI Instructions component
- ✅ Moved AI Instructions from General to Rules section
- ✅ Removed AI Instructions block from General section
- ✅ Enhanced .voidrules system with multi-file folder support
- ✅ Added IFileService integration for async file operations
- ✅ Implemented async/await architecture across all services
- ✅ Fixed TypeScript compatibility issues
- ✅ Updated UI documentation for multi-file .voidrules support
- ✅ Preserved backward compatibility with single .voidrules files
- ✅ Added automatic file headers for better organization
- ✅ Renamed section title from "AI Instructions" to "Rules"
- ✅ Simplified section description by removing file examples
- ✅ Changed AIInstructionsBox placeholder to simple "System Prompt"
- ✅ **NEW: Project Rules UI Section**: Added complete Project Rules management interface
- ✅ **NEW: File Management**: Edit/delete/create .voidrules files directly from Settings UI
- ✅ **NEW: File Watcher**: Auto-updating file list with polling every 2 seconds
- ✅ **NEW: Inline Rename**: Create new files with immediate renaming interface
- ✅ **NEW: VSCode Integration**: Edit files via commandService.executeCommand('vscode.open', uri)
- ✅ **NEW: Fixed Tab Opening**: New .voidrules files now open in new pinned tabs instead of replacing Void Settings
- ✅ **Settings Tab Renaming**: Successfully renamed "Feature Options" to "Actions" in Settings.tsx
- ✅ **Chat Mode Updates**: Successfully updated chat modes - "Chat" → "Minimal", "Gather" → "Ask", "Agent" unchanged
- ✅ **Chat Description Updates**: Updated Minimal mode description to "Can only chat" with proper capitalization
- ✅ **Type Definitions Updated**: Changed Tab type from 'featureOptions' to 'actions' across Settings.tsx
- ✅ **Rules Section Restructure**: Successfully split Rules into two symmetric subsections
- ✅ **System Prompt Subsection**: Added standalone System Prompt section with AIInstructionsBox
- ✅ **UI Label Addition**: Added "Your System Prompt" label under input field for clarity
- ✅ **Toggle Description Repositioning**: Moved system message description below toggle button for better UX
- ✅ **Enhanced Visual Spacing**: Improved spacing between sections with proper CSS classes
- ✅ **Description Text Update**: Updated .voidrules not found text with clearer instructions
- ✅ **Edit Button Tab Management**: Successfully changed Edit button to open files in new tabs like Create button
- ✅ **VSCode Command Enhancement**: Switched handleEditFile to use `_workbench.open` with pinned tab configuration
- ✅ **UI Filename Cleanup**: Removed `.voidrules` extensions from UI display for cleaner user experience
- ✅ **Rename Placeholder Update**: Updated rename mode placeholder to show clean filenames without extensions
- ✅ **File Operations Integrity**: Maintained full file paths for all system operations while improving UI appearance

### Short Term (Next Session)
- Test Project Rules functionality with actual .voidrules folder
- Verify file system operations work correctly across different platforms
- Test React components build and apply changes
- Validate watcher performance with multiple .voidrules files

### Medium Term
- Evaluate additional UI simplification opportunities
- Consider user workflow improvements with consolidated settings
- Plan next feature implementation based on user feedback

## System Dependencies

### Critical Services
- `voidSettingsService`: Settings management and persistence
- `chatThreadService`: Chat functionality and history
- `editCodeService`: Code application and diff visualization
- `mcpService`: Model Context Protocol for AI agents

### Build Dependencies
- React build system: `tsup` with custom configuration
- Tailwind CSS for styling
- TypeScript with strict mode enabled

### External Dependencies
- Multiple AI provider SDKs (Anthropic, OpenAI, Google, Mistral, Ollama)
- Electron for desktop application framework
- VSCode base codebase architecture

## Development Environment Notes

### Build Commands
```bash
npm run buildreact    # Build React components (fastest for UI changes)
npm run watchreact    # Watch mode for React development
npm run compile       # Compile TypeScript (full project compilation)
npm run watch         # Watch mode for full project
# Important: Clear out/ directory if UI changes don't appear: rm -rf out/
```

### Project Structure
- **Core Void Code**: `src/vs/workbench/contrib/void/`
- **React Components**: `src/vs/workbench/contrib/void/browser/react/`
- **Services**: Browser and main process separation maintained
- **Build Output**: React builds to `out/` directory

---

**Technical Details - Tab Opening Fix (Session 2025-10-04):**

**Problem**: When creating new .voidrules files via "Create" button in Void Settings > Rules section, files were opening in the same tab and replacing Void Settings UI instead of opening in new tabs.

**Root Cause Analysis**: After investigating VSCode's internal command handling, discovered that `vscode.open` command expects arguments in format `[column, options]`. The original implementation passed `{preview: false}` directly as second argument, which VSCode interpreted as column specification rather than editor options.

**Solution Implemented**: Modified `handleCreateFile` function in `Settings.tsx:369`:

**Before:**
```typescript
await commandService.executeCommand('vscode.open', fileUri, {
    preview: false
});
```

**After:**
```typescript
await commandService.executeCommand('_workbench.open', fileUri, [
    undefined,       // No column specified (use current column)
    { pinned: true } // Makes tab pinned (non-preview)
]);
```

**Technical Details:**
- Changed command from `vscode.open` to `_workbench.open` for direct API access
- Used proper array format `[column, options]` for arguments
- `undefined` column = use current editor group
- `{pinned: true}` = non-preview tab stays open permanently
- This ensures new .voidrules files open in the same column as new tabs without replacing Void Settings

**Result**: Users can now create new .voidrules files that open in new pinned tabs alongside Void Settings, maintaining the settings UI accessible while editing rules.

---

**Note**: Current work involved implementing comprehensive multi-file .voidrules support while maintaining full backward compatibility and UI improvements. Successfully added IFileService integration, converted entire rules reading system to async/await architecture, and updated all dependent services (editCodeService, autocompleteService, voidSCMService). The system now supports both single `.voidrules` files in workspace root and multiple `.voidrules` files in `.voidrules/` folder with automatic alphabetical sorting and file headers. All TypeScript compatibility issues have been resolved. UI enhancements include renaming the section to "Rules", simplifying descriptions, changing placeholder to clean "System Prompt", and updating tab names from "Feature Options" to "Actions" for better clarity. Chat interface improvements include renaming modes from "Chat" to "Minimal" and "Gather" to "Ask" with proper capitalization in descriptions. Most recent UI restructuring split Rules section into two symmetric subsections - "System Prompt" and "Project Rules" with proper spacing and visual hierarchy. Added "Your System Prompt" label and repositioned toggle description for better UX. Latest file management improvements enhanced Edit button functionality to open files in new tabs with pinned configuration, and simplified UI filename display by removing `.voidrules` extensions while maintaining full file paths for system operations. Previous UI refinements including Rules section creation and provider consolidation remain intact. The async architecture ensures robust file system operations while preserving all existing functionality. Recently fixed tab opening behavior for both newly created and existing .voidrules files.