# MCP Fix Documentation

Model Context Protocol (MCP) support for Edlide IDE across platforms.

---

## Overview

Edlide provides zero-configuration MCP support on all platforms. This document describes how MCP works and how platform-specific issues are resolved.

---

## macOS Support

### Problem

GUI applications on macOS (including Electron apps like Edlide) don't inherit the full PATH from shell startup scripts (`.zshrc`, `.bash_profile`). This causes "spawn npx ENOENT" errors when MCP servers try to execute `npx`.

### Solution

**File**: `src/vs/workbench/contrib/void/electron-main/mcpChannel.ts`

The solution uses systematic PATH detection for GUI apps:

```typescript
const findNpxPath = (): string => {
  const systemPaths = [
    '/opt/homebrew/bin',      // Apple Silicon Homebrew
    '/usr/local/bin',        // Intel Homebrew
    '/usr/bin',
    '/bin',
    `${process.env.HOME}/.nvm/versions/node/*/bin`, // NVM
    `${process.env.HOME}/.npm-global/bin`,         // NPM global
  ].filter(Boolean);

  const comprehensivePATH = [...systemPaths, ...process.env.PATH.split(':')].join(':');

  try {
    const result = childProcess.spawnSync('which', ['npx'], {
      stdio: 'pipe',
      env: { ...process.env, PATH: comprehensivePATH }
    });
    if (result.status === 0 && result.stdout.toString().trim()) {
      return result.stdout.toString().trim();
    }
  } catch (e) {}

  // Fallback: manual search through systemPaths
  for (const basePath of systemPaths) {
    const npxPath = `${basePath}/npx`;
    if (fs.existsSync(npxPath)) return npxPath;
  }

  return 'npx';
};
```

**PATH Enhancement at Startup**:

```typescript
private initializeEnhancedPath(): void {
  const enhancedEnv = getEnhancedEnv();
  process.env.PATH = enhancedEnv.PATH;
  console.log(`MCP: ${process.platform} PATH initialized for GUI app`);
}
```

### User Experience

- **Before Fix**: `"spawn npx ENOENT"` error when launching from Finder/Dock
- **After Fix**: `"MCP: Found npx at: /opt/homebrew/bin/npx"`
- **Normal Launch**: Works with standard application launch (no terminal required)

### Optional Manual Configuration

For complex Node.js setups, a helper script is available:

**File**: `scripts/fix-macos-mcp-path.sh`

This script provides:
- Detection of Node.js installation paths
- Optional LaunchAgent wrapper creation
- System-wide PATH configuration
- Shell environment updates

---

## Windows Support

### Problem

Windows GUI applications have limited PATH access. Common issues include:
1. Node.js PATH not inherited from system environment
2. Paths with spaces (e.g., `C:\Program Files\nodejs`) cause command parsing issues
3. `.cmd` files may not execute correctly through StdioClientTransport

### Solution

**File**: `src/vs/workbench/contrib/void/electron-main/mcpChannel.ts`

#### 1. Enhanced PATH for Windows GUI Apps

```typescript
const getEnhancedEnv = (serverEnv?: Record<string, string>): Record<string, string> => {
  const env = { ...serverEnv, ...process.env } as Record<string, string>;

  if (process.platform === 'win32') {
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFiles86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const appData = process.env.APPDATA || `${process.env.USERPROFILE}\\AppData\\Roaming`;
    const localAppData = process.env.LOCALAPPDATA || `${process.env.USERPROFILE}\\AppData\\Local`;

    // Critical: npm global bin path first
    const npmGlobal = `${appData}\\npm`;
    const systemPaths = [
      npmGlobal,
      `${localAppData}\\npm-cache`,
      `${programFiles}\\nodejs`,
      `${programFiles86}\\nodejs`,
      `${localAppData}\\nvs\\node`,
      `${localAppData}\\volta\\bin`,
    ];

    const currentPath = env.PATH || '';
    const pathSeparator = ';';
    const currentPaths = currentPath.split(pathSeparator);
    const additionalPaths = systemPaths.filter(p => p && !currentPaths.includes(p));

    if (additionalPaths.length > 0) {
      env.PATH = additionalPaths.join(pathSeparator) + pathSeparator + currentPath;
    }
  }

  return env;
};
```

#### 2. Simple npx Command Usage

Instead of resolving to full path (which breaks with spaces), Windows uses plain `npx` command with enhanced PATH:

```typescript
if (process.platform === 'win32' && server.command === 'npx') {
  command = 'npx'; // Use plain npx, let enhanced PATH handle resolution
  console.log(`MCP: Using 'npx' command with enhanced PATH for Windows`);
}
```

#### 3. Simplified Availability Check

```typescript
const isMCPAvailable = (): boolean => {
  try {
    if (process.platform === 'win32') {
      const enhancedEnv = getEnhancedEnv();
      const result = childProcess.spawnSync('npx', ['--version'], {
        stdio: 'pipe',
        env: enhancedEnv,
        timeout: 5000
      });
      return result.status === 0;
    }
    // macOS/Linux uses resolved path
  } catch (e) {
    return false;
  }
};
```

#### 4. Skipped Availability Check

On Windows, the pre-connection availability check is skipped to avoid false negatives:

```typescript
if (process.platform !== 'win32' && !isMCPAvailable()) {
  throw new Error(`MCP tools not available for command: ${command}`);
}
// On Windows: proceed directly to transport creation
```

### Key Paths Added for Windows

| Path | Purpose |
|------|---------|
| `%APPDATA%\npm` | npm global packages bin |
| `%LOCALAPPDATA%\npm-cache` | npm cache |
| `C:\Program Files\nodejs` | Standard Node.js installation |
| `C:\Program Files (x86)\nodejs` | 32-bit Node.js |
| `%LOCALAPPDATA%\nvs\node` | NVS Node.js |
| `%LOCALAPPDATA%\volta\bin` | Volta package manager |

### User Experience

- **Standard Install**: Works out of the box with Node.js from nodejs.org
- **NVM/Volta**: Enhanced PATH includes these locations
- **No Wrappers**: No need for `.cmd` wrapping or `cmd.exe` invocation

---

## Optional Windows Helper Script

**File**: `scripts/fix-windows-mcp-path.ps1`

PowerShell script for manual PATH configuration on Windows:

Features:
- Creates wrapper script for GUI applications
- Adds Node.js paths to system PATH
- Configures registry for GUI app compatibility
- Creates scheduled task for PATH synchronization

Usage (Run as Administrator):
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
cd "C:\Path\To\Edlide\scripts"
.\fix-windows-mcp-path.ps1
```

---

## MCP Server Connection Pattern

```
Launch Edlide → MCP: PATH initialized for GUI app
Enable MCP Server → MCP: Found npx at: /opt/homebrew/bin/npx (macOS)
                 → MCP: Using 'npx' command with enhanced PATH (Windows)
Connect → Server connects successfully with npx tools available
```

---

## Troubleshooting

### macOS

**Issue**: MCP still shows "npx ENOENT"

**Solutions**:
1. Restart Edlide (PATH initialization happens at startup)
2. Run `./scripts/fix-macos-mcp-path.sh` for advanced configuration
3. Launch from terminal: `open -a Edlide`

### Windows

**Issue**: MCP tools not available

**Solutions**:
1. Restart Edlide
2. Run `.\scripts\fix-windows-mcp-path.ps1` as Administrator
3. Verify Node.js is installed and in system PATH

---

## Files Modified

| File | Platform | Purpose |
|------|----------|---------|
| `src/vs/workbench/contrib/void/electron-main/mcpChannel.ts` | All | Core MCP transport with cross-platform PATH handling |
| `scripts/fix-macos-mcp-path.sh` | macOS | Optional PATH configuration script |
| `scripts/fix-windows-mcp-path.ps1` | Windows | Optional PATH configuration script |

---

## Related Documentation

- `activeContext.md` - Current development context (MCP macOS fix section)
- `productContext.md` - Product features (MCP Compatibility section)
- `techContext.md` - Technical dependencies (MCP SDK)