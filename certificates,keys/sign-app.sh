#!/bin/bash

# Edlide macOS Code Signing Script
# Solves app crashes after code signing

set -e

IDENTITY="Developer ID Application: Aitegin Bek (V6TP7FU6AF)"
ENTITLEMENTS="/Users/litezevin/Desktop/Projects/Edlide/scripts/sign-app-entitlements.plist"

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-Edlide.app>"
    exit 1
fi

APP_PATH="$1"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at $APP_PATH"
    exit 1
fi

echo "========================================="
echo "Signing Edlide.app at: $APP_PATH"
echo "Identity: $IDENTITY"
echo "========================================="

# Step 1: Remove any existing signature
echo -e "\n[1/5] Removing existing signatures..."
codesign --remove-signature "$APP_PATH" 2>/dev/null || true
find "$APP_PATH" -name "*.node" -o -name "*.dylib" | xargs codesign --remove-signature 2>/dev/null || true

# Step 2: Sign all .node binaries (native modules)
echo -e "\n[2/5] Signing .node binaries..."
NODE_COUNT=$(find "$APP_PATH" -name "*.node" | wc -l)
echo "Found $NODE_COUNT .node files"
find "$APP_PATH" -name "*.node" -type f -exec codesign --force --sign "$IDENTITY" {} \;

# Step 3: Sign all .dylib files
echo -e "\n[3/5] Signing .dylib files..."
DYLIB_COUNT=$(find "$APP_PATH" -name "*.dylib" | wc -l)
echo "Found $DYLIB_COUNT .dylib files"
find "$APP_PATH" -name "*.dylib" -type f -exec codesign --force --sign "$IDENTITY" {} \;

# Step 4: Sign all helper executables and frameworks
echo -e "\n[4/5] Signing helpers and frameworks..."

# Sign all helper executables
find "$APP_PATH" -name "*_helper" -type f -exec codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime {} \;

# Sign Squirrel ShipIt binary
SHIP_IT=$(find "$APP_PATH" -name "ShipIt" -type f 2>/dev/null | head -1)
if [ -n "$SHIP_IT" ]; then
    echo "Signing ShipIt: $SHIP_IT"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$SHIP_IT"
fi

# Sign spawn-helper
SPAWN_HELPER=$(find "$APP_PATH" -path "*/node-pty/build/Release/spawn-helper" -type f 2>/dev/null | head -1)
if [ -n "$SPAWN_HELPER" ]; then
    echo "Signing spawn-helper: $SPAWN_HELPER"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$SPAWN_HELPER"
fi

# Sign ripgrep binary
RG_BINARY=$(find "$APP_PATH" -path "*/@vscode/ripgrep/bin/rg" -type f 2>/dev/null | head -1)
if [ -n "$RG_BINARY" ]; then
    echo "Signing ripgrep: $RG_BINARY"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$RG_BINARY"
fi

# Sign all helper apps
find "$APP_PATH" -name "*.app" -type d -exec codesign --force --sign "$IDENTITY" --deep --entitlements "$ENTITLEMENTS" --options runtime --timestamp {} \;

# Sign all frameworks
find "$APP_PATH" -name "*.framework" -type d -exec codesign --force --sign "$IDENTITY" --deep --entitlements "$ENTITLEMENTS" --options runtime --timestamp {} \;

# Step 5: Deep sign all executables with hardened runtime
echo -e "\n[5/5] Signing all binaries with hardened runtime..."

# Find and sign all executable files that are not already covered
EXECS=$(find "$APP_PATH" -type f -perm +111 2>/dev/null | grep -v ".app/" | grep -v ".node$" | grep -v ".dylib$" | grep -v ".framework/")
for exe in $EXECS; do
    # Check if already signed
    if ! codesign -d "$exe" 2>/dev/null | grep -q "identifier"; then
        codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$exe" 2>/dev/null || true
    fi
done

# Deep sign the main app bundle (last)
echo "Deep signing main app bundle..."
codesign --force --sign "$IDENTITY" \
    --deep \
    --entitlements "$ENTITLEMENTS" \
    --options runtime \
    --timestamp \
    "$APP_PATH"

# Step 6: Verify signature
echo -e "\n========================================="
echo "Verifying signature..."
codesign --verify --verbose "$APP_PATH"
echo -e "\n========================================="
echo "✅ Code signing completed successfully!"
echo "App: $APP_PATH"
echo "========================================="