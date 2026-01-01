# Windows GitHub Actions Build

## What We Built

### macOS Builds (Local)
- **Edlide-arm64.dmg** - 167 MB (Apple Silicon M1/M2/M3)
- **Edlide-x64.dmg** - 173 MB (Intel Mac)

Both DMGs are drag-and-drop installers with:
- Edlide.app
- Applications folder alias (/Applications)

### Windows Builds (GitHub Actions)
- **EdlideSetup.exe** - x64 installer (Windows Intel/AMD)
- **EdlideSetup.exe** - ARM64 installer (Windows on ARM)

## GitHub Actions Workflow

**File:** `.github/workflows/build-windows.yml`

**Jobs:**
1. `build-react` - Ubuntu
   - Builds React components for void UI
   - Uploads as artifact for next jobs

2. `build-windows-x64` - Windows 2022
   - Downloads React build
   - Installs dependencies
   - Runs `npm run gulp vscode-win32-x64`
   - Runs `npm run gulp vscode-win32-x64-inno-updater` (copies tools)
   - Runs `npm run gulp vscode-win32-x64-system-setup` (creates installer)
   - Uploads artifact from `.build\win32-x64\system-setup`

3. `build-windows-arm64` - Windows 2022
   - Same steps as x64 but for ARM64
   - Artifact from `.build\win32-arm64\system-setup`

## Issues Encountered

1. **kerberos native module error** - Missing `libkrb5-dev`
   - Solution: Added `sudo apt-get install -y libkrb5-dev`

2. **x11 native module error** - Missing X11 development libraries
   - Solution: Added `libx11-dev libxkbfile-dev libxkbcommon-dev pkg-config`

3. **Inno Setup missing tools** - `VSCode-win32-arm64\tools\*` not found
   - Solution: Added `gulp vscode-win32-*-inno-updater` step before setup

## System Dependencies (Ubuntu)
```
libkrb5-dev libx11-dev libxkbfile-dev libxkbcommon-dev pkg-config
```

## Build Commands
```bash
# Local macOS builds
npm run gulp vscode-darwin-arm64
npm run gulp vscode-darwin-x64

# Windows builds (require wine - only works on GitHub Actions Windows runners)
npm run gulp vscode-win32-x64
npm run gulp vscode-win32-x64-inno-updater
npm run gulp vscode-win32-x64-system-setup
```

## Notes

- macOS builds created locally on Apple Silicon
- Windows builds require GitHub Actions (Windows runners have wine pre-installed)
- On macOS Apple Silicon, Windows .exe creation is NOT possible without wine
- Wine does NOT work on Apple Silicon Macs
- GitHub Actions Windows 2022 runners have wine pre-installed

## Artifacts

After workflow completes, download from GitHub Actions:
- `edlide-win32-x64` - contains EdlideSetup.exe
- `edlide-win32-arm64` - contains EdlideSetup.exe