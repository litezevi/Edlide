#!/bin/bash

# macOS MCP PATH Fix Script for Edlide
# This script helps configure the system PATH for MCP tools to work in GUI applications

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "macOS MCP PATH Configuration for Edlide"

# Check if we're on macOS
if [[ $(uname) != "Darwin" ]]; then
    print_error "This script is for macOS only"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to add path to zprofile
add_to_zprofile() {
    local new_path="$1"
    local zprofile="$HOME/.zprofile"
    
    if grep -q "export PATH.*$new_path" "$zprofile" 2>/dev/null; then
        print_warning "Path $new_path already exists in ~/.zprofile"
        return
    fi
    
    echo "export PATH=\"$new_path:\$PATH\"" >> "$zprofile"
    print_success "Added $new_path to ~/.zprofile"
}

# Method 1: LaunchAgent wrapper (recommended)
create_launch_agent() {
    print_status "Creating LaunchAgent wrapper..."
    
    cat > "$HOME/Library/LaunchAgents/com.edlide.wrapper.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.edlide.wrapper</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>-a</string>
        <string>Edlide</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF
    
    print_success "LaunchAgent created: ~/Library/LaunchAgents/com.edlide.wrapper.plist"
}

# Detect installation paths
detect_paths() {
    local paths=()
    
    # Homebrew paths
    if command_exists brew; then
        local brew_prefix=$(brew --prefix)
        paths+=("$brew_prefix/bin")
    fi
    
    # Default Homebrew locations
    paths+=("/opt/homebrew/bin")  # Apple Silicon
    paths+=("/usr/local/bin")    # Intel
    
    # NVM paths (latest version)
    if [[ -d "$HOME/.nvm/versions/node" ]]; then
        local latest_node=$(ls -1t "$HOME/.nvm/versions/node" 2>/dev/null | head -1)
        if [[ -n "$latest_node" ]]; then
            paths+=("$HOME/.nvm/versions/node/$latest_node/bin")
        fi
    fi
    
    # NPM global path
    if command_exists npm; then
        local npm_prefix=$(npm config get prefix 2>/dev/null)
        if [[ -n "$npm_prefix" && -d "$npm_prefix/bin" ]]; then
            paths+=("$npm_prefix/bin")
        fi
    fi
    
    # System paths
    paths+=("/usr/bin" "/bin" "/usr/sbin" "/sbin")
    
    # Remove duplicates and filter existing paths
    printf '%s\n' "${paths[@]}" | sort -u | while read -r path; do
        if [[ -d "$path" ]] && command_exists "$path/npx" 2>/dev/null || [[ -f "$path/npx" ]]; then
            echo "$path"
        fi
    done
}

print_status "Detecting Node.js/npx paths..."

# Get detected paths
detected_paths=($(detect_paths))
echo "${detected_paths[@]}"

if [[ ${#detected_paths[@]} -eq 0 ]]; then
    print_error "No valid npx installations found!"
    print_status "Please install Node.js/npm or ensure npx is available"
fi

# Create comprehensive PATH
comprehensive_path=$(IFS=:; echo "${detected_paths[*]}")
print_status "Detected PATH: $comprehensive_path"

# Method 2: System-wide PATH configuration
system_path_config() {
    print_status "Configuring system-wide PATH..."
    
    # Use launchctl to set system PATH
    sudo launchctl config user path "$(launchctl getenv PATH 2>/dev/null || echo $PATH):$comprehensive_path"
    print_success "System PATH configured (requires logout/restart to take full effect)"
}

# Method 3: Shell configuration
shell_config() {
    print_status "Configuring shell environment..."
    
    # Add to .zprofile (for zsh)
    if [[ -f "$HOME/.zshrc" || -f "$HOME/.zprofile" ]]; then
        for path in "${detected_paths[@]}"; do
            add_to_zprofile "$path"
        done
        print_success "Shell configuration updated"
    fi
    
    # Add to .bash_profile (for bash)
    if [[ -f "$HOME/.bash_profile" || -f "$HOME/.bashrc" ]]; then
        for path in "${detected_paths[@]}"; do
            if [[ -f "$HOME/.bash_profile" ]]; then
                echo "export PATH=\"$path:\$PATH\"" >> "$HOME/.bash_profile"
            else
                echo "export PATH=\"$path:\$PATH\"" >> "$HOME/.bashrc"
            fi
        done
        print_success "Bash configuration updated"
    fi
}

# Method 4: Test current configuration
test_configuration() {
    print_status "Testing current MCP configuration..."
    
    if command_exists npx; then
        npx --version
        print_success "npx is available in current shell"
    else
        print_warning "npx not available in current shell"
    fi
    
    # Test if Edlide would find npx
    echo "PATH=$comprehensive_PATH" node -e "
        const { spawnSync } = require('child_process');
        const result = spawnSync('npx', ['--version'], { stdio: 'pipe', env: process.env });
        if (result.status === 0) {
            console.log('✅ Edlide should find npx with enhanced PATH');
            console.log('npx version:', result.stdout.toString().trim());
        } else {
            console.log('❌ Edlide would not find npx');
        }
    "
}

# Menu for user choice
echo ""
echo "Choose a method to fix MCP PATH:"
echo "1) Create LaunchAgent wrapper (recommended)"
echo "2) Configure system-wide PATH"
echo "3) Configure shell environment"
echo "4) Test current configuration"
echo "5) Apply all methods"
echo "6) Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        create_launch_agent
        ;;
    2)
        system_path_config
        ;;
    3)
        shell_config
        ;;
    4)
        test_configuration
        ;;
    5)
        create_launch_agent
        system_path_config
        shell_config
        ;;
    6)
        print_status "Exiting"
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "Configuration completed!"
print_status "Please restart Edlide for changes to take effect"
print_status "If问题 persists, try launching Edlide from terminal: open -a Edlide"
