# Windows MCP PATH Fix Script for Edlide
# This script helps configure the system PATH for MCP tools to work in GUI applications

$ErrorActionPreference = "Continue"
$script:ProgressPreference = "SilentlyContinue"

# Colors for console output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"
$NC = "ResetColor"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor $BLUE -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor $GREEN -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor $YELLOW -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor $RED -NoNewline
    Write-Host $Message
}

Write-Status "Windows MCP PATH Configuration for Edlide"

# Check if we're on Windows
if ($IsMacOS -or $IsLinux) {
    Write-Error "This script is for Windows only"
    exit 1
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction SilentlyContinue | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to add path to system PATH permanently
function Add-ToSystemPath {
    param([string]$Path)

    # Get current machine-level PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")

    if ($currentPath -split ';' -contains $Path) {
        Write-Warning "Path $Path already exists in system PATH"
        return $false
    }

    $newPath = "$Path;$currentPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
    Write-Success "Added $Path to system PATH (requires admin privileges)"
    return $true
}

# Function to add path to user PATH
function Add-ToUserPath {
    param([string]$Path)

    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

    if ($currentPath) {
        $pathList = $currentPath -split ';'
        if ($pathList -contains $Path) {
            Write-Warning "Path $Path already exists in user PATH"
            return $false
        }
        $newPath = "$Path;$currentPath"
    } else {
        $newPath = $Path
    }

    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Success "Added $Path to user PATH"
    return $true
}

# Function to get Node.js installation paths
function Get-NodePaths {
    $paths = @()

    # Check common Node.js installation locations
    $programFiles = $env:PROGRAMFILES
    $programFiles86 = ${env:PROGRAMFILES(X86)}
    $appData = $env:APPDATA
    $localAppData = $env:LOCALAPPDATA
    $userProfile = $env:USERPROFILE

    # Node.js global npm location
    $npmPath = "$appData\npm"
    if (Test-Path $npmPath) { $paths += $npmPath }

    # npm cache location
    $npmCache = "$localAppData\npm-cache"
    if (Test-Path $npmCache) { $paths += $npmCache }

    # Common Node.js installations
    $nodePath = "$programFiles\nodejs"
    if (Test-Path $nodePath) { $paths += $nodePath }

    $nodePath86 = "$programFiles86\nodejs"
    if (Test-Path $nodePath86) { $paths += $nodePath86 }

    # nvm-windows
    $nvsNode = "$localAppData\nvs\node"
    if (Test-Path $nvsNode) { $paths += $nvsNode }

    # Volta
    $voltaBin = "$localAppData\volta\bin"
    if (Test-Path $voltaBin) { $paths += $voltaBin }

    # Check using where command
    try {
        $whereResult = where.exe npx 2>$null
        if ($whereResult) {
            $whereResult.Trim() -split "`n" | ForEach-Object {
                $foundPath = Split-Path -Parent $_
                if ($paths -notcontains $foundPath) {
                    $paths += $foundPath
                }
            }
        }
    } catch {
        Write-Warning "Could not find npx using 'where' command"
    }

    return $paths
}

# Method 1: Create a wrapper batch file
function New-WrapperScript {
    Write-Status "Creating wrapper script..."

    $wrapperPath = "$env:LOCALAPPDATA\Edlide\mcp-wrapper.cmd"

    $npmGlobalPath = "$env:APPDATA\npm"
    if (-not (Test-Path $npmGlobalPath)) {
        $npmGlobalPath = "$env:PROGRAMFILES\nodejs"
    }

    $wrapperContent = "@echo off
setlocal EnableDelayedExpansion
set PATH=$npmGlobalPath;%PATH%
npx %*
"
    try {
        # Ensure directory exists
        $dir = Split-Path -Parent $wrapperPath
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }

        Set-Content -Path $wrapperPath -Value $wrapperContent -Encoding ASCII
        Write-Success "Wrapper script created: $wrapperPath"
        return $wrapperPath
    } catch {
        Write-Error "Failed to create wrapper script: $_"
        return $null
    }
}

# Method 2: Configure registry for GUI apps
function Set-RegistryPath {
    Write-Status "Configuring registry for GUI applications..."

    $regPath = "HKCU:\Environment"
    $valueName = "PATH"

    $nodePaths = Get-NodePaths
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

    foreach ($path in $nodePaths) {
        if (-not ($currentPath -split ';' -contains $path)) {
            $currentPath = "$path;$currentPath"
        }
    }

    try {
        Set-ItemProperty -Path $regPath -Name $valueName -Value $currentPath -ErrorAction SilentlyContinue
        Write-Success "Registry PATH updated for GUI applications"
        return $true
    } catch {
        Write-Warning "Could not update registry: $_"
        return $false
    }
}

# Method 3: Create scheduled task for PATH sync (advanced)
function New-ScheduledTask {
    Write-Status "Creating scheduled task for PATH synchronization..."

    $taskName = "Edlide-MCP-Path"
    $taskPath = "$env:LOCALAPPDATA\Edlide\sync-path.ps1"

    # Create sync script
    $syncScript = @'
$ErrorActionPreference = "Continue"
$env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine")
'@

    try {
        Set-Content -Path $taskPath -Value $syncScript -Encoding UTF8

        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -File `"$taskPath`""
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $settings = New-ScheduledTaskSettingsSet -Hidden

        Register-ScheduledTask -TaskName $taskName -TaskPath "Edlide" -Action $action -Trigger $trigger -Settings $settings -User $env:USERNAME -RunLevel Limited | Out-Null

        Write-Success "Scheduled task created: $taskName"
        return $true
    } catch {
        Write-Warning "Could not create scheduled task: $_"
        return $false
    }
}

# Method 4: Test current configuration
function Test-Configuration {
    Write-Status "Testing current MCP configuration..."

    $nodePaths = Get-NodePaths
    if ($nodePaths.Count -eq 0) {
        Write-Error "No Node.js paths found!"
        Write-Status "Please install Node.js from https://nodejs.org"
        return $false
    }

    Write-Success "Found Node.js paths:"
    $nodePaths | ForEach-Object { Write-Host "  - $_" }

    $testPath = $nodePaths[0]
    $testEnv = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $testEnv = "$testPath;$testEnv"

    try {
        $proc = Start-Process -FilePath "$testPath\npx.cmd" -ArgumentList "--version" -NoNewWindow -PassThru -Wait
        if ($proc.ExitCode -eq 0) {
            Write-Success "npx is accessible with enhanced PATH"
            return $true
        }
    } catch {
        Write-Warning "Could not execute npx from $testPath"
    }

    Write-Status "Testing with PowerShell..."
    $env:PATH = "$testPath;$env:PATH"
    try {
        $version = npx --version
        Write-Success "npx version: $version"
        return $true
    } catch {
        Write-Error "npx still not available"
        return $false
    }
}

# Menu for user choice
Write-Host ""
Write-Host "Choose a method to fix MCP PATH on Windows:"
Write-Host "1) Create wrapper script (recommended)"
Write-Host "2) Add Node.js paths to system PATH"
Write-Host "3) Configure registry for GUI apps"
Write-Host "4) Create scheduled task for PATH sync"
Write-Host "5) Test current configuration"
Write-Host "6) Apply all methods"
Write-Host "7) Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    1 { $wrapper = New-WrapperScript }
    2 {
        $nodePaths = Get-NodePaths
        $nodePaths | ForEach-Object { Add-ToUserPath $_ }
    }
    3 { Set-RegistryPath }
    4 { New-ScheduledTask }
    5 { Test-Configuration }
    6 {
        New-WrapperScript
        Get-NodePaths | ForEach-Object { Add-ToUserPath $_ }
        Set-RegistryPath
        New-ScheduledTask
    }
    7 {
        Write-Status "Exiting"
        exit 0
    }
    default {
        Write-Error "Invalid choice"
        exit 1
    }
}

Write-Success "Configuration completed!"
Write-Status "Please restart Edlide for changes to take effect"
Write-Status "If MCP tools still don't work, try running Edlide from Windows Terminal"